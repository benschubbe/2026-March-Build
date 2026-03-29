"""
BioGuardian Compliance Auditor — Deterministic Predicate Logic Engine
======================================================================

Non-LLM enforcement of FDA General Wellness 2016 safe harbor compliance.
This module implements two core primitives:

  **ComplianceEngine**
    Loads 47 predicate rules from a versioned YAML configuration and
    validates arbitrary text against forbidden-pattern and required-phrase
    predicates.  Every validation produces a typed ``ValidationResult``
    carrying the pass/fail verdict, the list of violated rule codes, and
    the auditor version hash.  The engine is deterministic — identical
    input always produces identical output regardless of model state,
    prompt context, or update cadence.

  **AuditChain**
    A SHA-256-linked append-only log of every agent action.  Each entry
    records the agent name, input/output content hashes, a UTC timestamp,
    and a back-link to the previous entry's hash.  The chain can be
    exported in full and verified for integrity at any time.

Design rationale (master plan §5):
  An LLM instructed to "stay within General Wellness guidelines" will
  fail under three conditions all guaranteed to occur in production:
  adversarial user inputs, edge cases outside training distribution,
  and gradual drift of model behaviour across updates.  A predicate
  logic system encoding explicit forbidden patterns produces identical,
  auditable output regardless of input.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml


# ---------------------------------------------------------------------------
# ValidationResult
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ValidationResult:
    """
    Immutable result of a compliance validation pass.

    Attributes
    ----------
    passed : bool
        True only if zero violations were found.
    violations : tuple[str, ...]
        Each entry is ``"<RULE_CODE>: <description>"``.
    auditor_version : str
        The version string from the loaded rules file (e.g. "FDA-GW-2016-V47").
    auditor_hash : str
        SHA-256 hex digest of the canonical rules file content.
    rules_evaluated : int
        Total number of predicate rules evaluated.
    """

    passed: bool
    violations: tuple[str, ...]
    auditor_version: str
    auditor_hash: str
    rules_evaluated: int

    @property
    def violation_count(self) -> int:
        return len(self.violations)

    def __bool__(self) -> bool:
        return self.passed

    def __repr__(self) -> str:
        status = "PASSED" if self.passed else f"BLOCKED ({self.violation_count} violations)"
        return f"<ValidationResult {status} | {self.auditor_version} | {self.rules_evaluated} rules>"


# ---------------------------------------------------------------------------
# ComplianceEngine
# ---------------------------------------------------------------------------

class ComplianceEngine:
    """
    Deterministic predicate-logic engine for FDA General Wellness compliance.

    Loads rules from a versioned YAML file.  Each rule is one of:
      - **forbidden_patterns**: if any pattern appears in the text (case-
        insensitive), the rule is violated.
      - **required_phrases**: if *none* of the listed phrases appear in
        the text (case-insensitive), the rule is violated.

    The engine is non-LLM.  It cannot be prompted, jailbroken, or
    bypassed.  Every output that passes carries the auditor version hash;
    every output that is blocked carries the specific rule codes that
    triggered the block.
    """

    def __init__(self, rules_path: str | Path) -> None:
        self._rules_path = Path(rules_path)
        with open(self._rules_path, "r", encoding="utf-8") as fh:
            self._config: dict[str, Any] = yaml.safe_load(fh)

        self._rules: list[dict[str, Any]] = self._config.get("rules", [])
        self._version: str = self._config.get("version", "UNKNOWN")
        self._hash: str = self._compute_rules_hash()

    # -- Public API --------------------------------------------------------

    @property
    def version(self) -> str:
        """Auditor version string (e.g. 'FDA-GW-2016-V47')."""
        return self._version

    @property
    def rules_hash(self) -> str:
        """SHA-256 hex digest of the canonical YAML rules content."""
        return self._hash

    @property
    def rule_count(self) -> int:
        return len(self._rules)

    def validate(self, text: str) -> ValidationResult:
        """
        Validate *text* against every loaded predicate rule.

        Parameters
        ----------
        text : str
            The full text corpus to validate (typically the concatenation
            of all agent log messages plus the wellness disclaimer).

        Returns
        -------
        ValidationResult
            Immutable result with pass/fail, violation list, and metadata.
        """
        violations: list[str] = []
        text_lower = text.lower()

        for rule in self._rules:
            rule_code = rule.get("code", rule.get("id", "UNKNOWN"))
            rule_id = rule.get("id", "")
            severity = rule.get("severity", "MEDIUM")

            # --- Forbidden pattern check ---
            for pattern in rule.get("forbidden_patterns", []):
                if pattern.lower() in text_lower:
                    violations.append(
                        f"{rule_id}/{rule_code}: Forbidden pattern '{pattern}' detected [severity={severity}]"
                    )

            # --- Required phrase check ---
            required = rule.get("required_phrases", [])
            if required:
                if not any(phrase.lower() in text_lower for phrase in required):
                    violations.append(
                        f"{rule_id}/{rule_code}: Missing required phrase (one of: {required}) [severity={severity}]"
                    )

        return ValidationResult(
            passed=len(violations) == 0,
            violations=tuple(violations),
            auditor_version=self._version,
            auditor_hash=self._hash,
            rules_evaluated=len(self._rules),
        )

    def validate_text(self, text: str) -> tuple[bool, list[str]]:
        """
        Legacy convenience wrapper.  Returns ``(passed, violations_list)``.

        Prefer :meth:`validate` for new code — it returns a richer
        ``ValidationResult`` with metadata.
        """
        result = self.validate(text)
        return result.passed, list(result.violations)

    def get_rule(self, rule_id: str) -> dict[str, Any] | None:
        """Look up a single rule by its ``id`` field (e.g. 'GW-001')."""
        for rule in self._rules:
            if rule.get("id") == rule_id:
                return dict(rule)
        return None

    def get_rules_by_category(self, category: str) -> list[dict[str, Any]]:
        """Return all rules matching the given category."""
        return [r for r in self._rules if r.get("category") == category]

    def get_critical_rules(self) -> list[dict[str, Any]]:
        """Return all rules with severity CRITICAL."""
        return [r for r in self._rules if r.get("severity") == "CRITICAL"]

    # -- Internal ----------------------------------------------------------

    def _compute_rules_hash(self) -> str:
        """Compute a deterministic hash of the rules YAML content."""
        canonical = json.dumps(self._rules, sort_keys=True, default=str)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# AuditChain
# ---------------------------------------------------------------------------

class AuditChain:
    """
    SHA-256-linked cryptographic audit log.

    Every agent action — input, output, and metadata — is appended as an
    immutable entry.  Each entry's hash incorporates the previous entry's
    hash, forming a Merkle-style chain.  Users can export the full chain
    and verify its integrity at any time.
    """

    _GENESIS_HASH = "0" * 64

    def __init__(self) -> None:
        self._chain: list[dict[str, Any]] = []

    # -- Public API --------------------------------------------------------

    def log(self, agent_name: str, input_data: Any, output_data: Any) -> str:
        """
        Append an event to the audit chain.

        Parameters
        ----------
        agent_name : str
            The agent producing this event (e.g. "The Scribe").
        input_data : Any
            JSON-serialisable input to the agent step.
        output_data : Any
            JSON-serialisable output from the agent step.

        Returns
        -------
        str
            The SHA-256 hex digest of the newly appended entry.
        """
        prev_hash = self._chain[-1]["hash"] if self._chain else self._GENESIS_HASH

        entry: dict[str, Any] = {
            "index": len(self._chain),
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "agent": agent_name,
            "input_hash": self._hash(input_data),
            "output_hash": self._hash(output_data),
            "prev_hash": prev_hash,
        }

        entry["hash"] = self._hash(entry)
        self._chain.append(entry)
        return entry["hash"]

    # Legacy alias used by main.py
    log_event = log

    def export(self) -> list[dict[str, Any]]:
        """Return a copy of the full chain for external inspection."""
        return list(self._chain)

    # Legacy alias
    get_full_chain = export

    def verify_integrity(self) -> bool:
        """
        Walk the chain and verify every back-link.

        Returns True if the chain is intact, False if any link is broken.
        """
        for i, entry in enumerate(self._chain):
            expected_prev = self._chain[i - 1]["hash"] if i > 0 else self._GENESIS_HASH
            if entry["prev_hash"] != expected_prev:
                return False

            # Recompute the entry hash to detect tampering
            check_entry = {k: v for k, v in entry.items() if k != "hash"}
            if entry["hash"] != self._hash(check_entry):
                return False

        return True

    @property
    def length(self) -> int:
        return len(self._chain)

    @property
    def head_hash(self) -> str:
        """Return the hash of the most recent entry, or the genesis hash."""
        return self._chain[-1]["hash"] if self._chain else self._GENESIS_HASH

    # -- Internal ----------------------------------------------------------

    @staticmethod
    def _hash(data: Any) -> str:
        canonical = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
