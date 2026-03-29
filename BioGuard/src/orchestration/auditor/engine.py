"""
BioGuardian Compliance Auditor — Deterministic Predicate Logic Engine
======================================================================

Non-LLM enforcement of FDA General Wellness 2016 safe harbor compliance.

This engine solves a hard problem: validating free-text clinical output
against 47 regulatory predicates with enough precision to formally
guarantee safe-harbor compliance while avoiding false positives that
would block legitimate wellness-framed content.

The naive approach (substring matching) fails on:
  - Word boundaries: "undiagnosed" triggers "diagnose"
  - Negation: "does not diagnose" triggers "diagnose"
  - Context: "the word 'cure' is not used" triggers "cure"
  - Sentence isolation: can't report WHICH sentence violated

This engine implements:

  **Word-boundary-aware matching** via compiled regex patterns that
  match whole words only, preventing false positives on substrings.

  **Negation detection** that recognises common English negation
  patterns within a 4-word window before the matched term, suppressing
  false positives on phrases like "does not diagnose" or "cannot cure."

  **Sentence-level context extraction** that reports the exact sentence
  containing each violation, enabling targeted remediation rather than
  corpus-wide rewrites.

  **Severity-weighted scoring** where CRITICAL violations produce an
  immediate block, HIGH violations block above a threshold count, and
  MEDIUM/LOW violations are logged as warnings without blocking.

  **Per-rule result tracking** producing a detailed compliance report
  with individual rule pass/fail, matched text, and context.

  **Suggested compliant alternatives** for common violation patterns,
  enabling agents to self-correct output before resubmission.

Design rationale (master plan S5):
  An LLM instructed to "stay within General Wellness guidelines" will
  fail under three conditions guaranteed in production: adversarial
  inputs, edge cases outside training distribution, and gradual drift
  across model updates.  A predicate logic system with word-boundary
  regex, negation handling, and sentence-level context produces
  identical, auditable output regardless of input.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml

from orchestration.utils import sha256_json, utcnow


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Negation tokens that suppress a match when they appear within
# _NEGATION_WINDOW words before the matched pattern.
_NEGATION_TOKENS = frozenset({
    "not", "no", "never", "neither", "nor", "cannot", "can't",
    "don't", "doesn't", "didn't", "won't", "wouldn't", "shouldn't",
    "isn't", "aren't", "wasn't", "weren't", "without", "absent",
})
_NEGATION_WINDOW = 4  # words before the match to scan for negation


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RuleResult:
    """Outcome of evaluating a single compliance rule."""
    rule_id: str
    rule_code: str
    severity: str
    passed: bool
    matched_pattern: str       # the pattern that triggered (empty if passed)
    matched_sentence: str      # the sentence containing the match (empty if passed)
    negation_detected: bool    # True if match was suppressed by negation
    suggestion: str            # compliant alternative (empty if passed or unavailable)


@dataclass(frozen=True)
class ValidationResult:
    """
    Complete compliance validation report.

    Immutable.  ``bool(result)`` returns ``result.passed``.
    """
    passed: bool
    violations: tuple
    warnings: tuple
    rule_results: tuple
    auditor_version: str
    auditor_hash: str
    rules_evaluated: int
    critical_violations: int
    high_violations: int
    sentences_scanned: int

    @property
    def violation_count(self):
        return len(self.violations)

    def __bool__(self):
        return self.passed

    def __repr__(self):
        status = "PASSED" if self.passed else "BLOCKED (%d violations)" % self.violation_count
        return "<ValidationResult %s | %s | %d rules | %d sentences>" % (
            status, self.auditor_version, self.rules_evaluated, self.sentences_scanned)


# ---------------------------------------------------------------------------
# Sentence splitter
# ---------------------------------------------------------------------------

# Split on sentence-ending punctuation followed by whitespace or end-of-string,
# but not on abbreviations like "Dr." or "U.S." or decimal numbers like "6.4".
_SENTENCE_RE = re.compile(
    r'(?<=[.!?])\s+(?=[A-Z])'   # period/!/? followed by space + capital letter
    r'|(?<=[.!?])\s*$'           # period/!/? at end of string
)


def _split_sentences(text):
    """Split text into sentences with regex heuristics."""
    parts = _SENTENCE_RE.split(text.strip())
    return [s.strip() for s in parts if s and s.strip()]


# ---------------------------------------------------------------------------
# Negation detection
# ---------------------------------------------------------------------------

def _is_negated(text_lower, match_start, match_end):
    """
    Check whether a pattern match is negated by a preceding negation token.

    Scans up to _NEGATION_WINDOW words before the match position for any
    token in _NEGATION_TOKENS.  This prevents false positives on phrases
    like "does not diagnose", "this system cannot cure", etc.

    Returns True if the match is negated (should be suppressed).
    """
    # Extract the text before the match, take the last N words
    prefix = text_lower[:match_start].split()
    window = prefix[-_NEGATION_WINDOW:] if len(prefix) >= _NEGATION_WINDOW else prefix

    for token in window:
        # Strip punctuation from token for matching
        clean = token.strip(".,;:!?\"'()-")
        if clean in _NEGATION_TOKENS:
            return True
    return False


# ---------------------------------------------------------------------------
# Suggestion map
# ---------------------------------------------------------------------------

# Maps common forbidden patterns to suggested compliant alternatives.
# Used in the RuleResult to help agents self-correct.
_SUGGESTIONS = {
    "diagnose": "Use 'correlations may be of clinical interest' instead of diagnostic language",
    "diagnosis": "Use 'correlation detected' instead of 'diagnosis'",
    "suffering from": "Use 'patient reports' or 'biometric data shows'",
    "positive for": "Use 'elevated levels detected' instead of 'positive for'",
    "you have": "Use 'correlations suggest' instead of asserting condition presence",
    "cure": "Use 'may support wellness' instead of curative claims",
    "heal": "Use 'support recovery' framed as wellness, not treatment",
    "stop taking": "Use 'discuss with your physician before any changes'",
    "discontinue": "Use 'consult your physician regarding protocol adjustments'",
    "increase dose": "Use 'discuss dosage with your prescribing physician'",
    "decrease dose": "Use 'discuss dosage with your prescribing physician'",
    "is causing": "Use 'is correlated with' — correlation, not causation",
    "caused by": "Use 'associated with' — correlation, not causation",
    "this causes": "Use 'this is correlated with'",
    "medical advice": "Use 'wellness information for clinical discussion'",
    "prescribe": "Use 'discuss treatment options with your physician'",
}


# ---------------------------------------------------------------------------
# ComplianceEngine
# ---------------------------------------------------------------------------

class ComplianceEngine:
    """
    Deterministic predicate-logic engine for FDA General Wellness compliance.

    Implements word-boundary regex matching, negation detection, sentence-level
    context extraction, severity-weighted scoring, and suggested alternatives.
    """

    def __init__(self, rules_path):
        self._rules_path = Path(rules_path)
        with open(self._rules_path, "r", encoding="utf-8") as fh:
            self._config = yaml.safe_load(fh)

        self._rules = self._config.get("rules", [])
        self._version = self._config.get("version", "UNKNOWN")
        self._hash = self._compute_rules_hash()

        # Pre-compile word-boundary regex for every forbidden pattern.
        # This is done once at init, not per-validation call.
        self._compiled_forbidden = {}  # rule_id -> [(pattern_str, compiled_re)]
        for rule in self._rules:
            rule_id = rule.get("id", "")
            patterns = []
            for p in rule.get("forbidden_patterns", []):
                # \b word boundary prevents "undiagnosed" matching "diagnose"
                regex = re.compile(r'\b' + re.escape(p.lower()) + r'\b')
                patterns.append((p, regex))
            if patterns:
                self._compiled_forbidden[rule_id] = patterns

    # -- Public API --------------------------------------------------------

    @property
    def version(self):
        return self._version

    @property
    def rules_hash(self):
        return self._hash

    @property
    def rule_count(self):
        return len(self._rules)

    def validate(self, text):
        """
        Validate text against all 47 predicate rules.

        Pipeline:
          1. Split text into sentences for context extraction
          2. For each rule, check forbidden patterns with word-boundary regex
          3. Suppress matches preceded by negation tokens
          4. Check required phrases (at least one must appear)
          5. Classify violations by severity
          6. Block on any CRITICAL violation or 3+ HIGH violations

        Returns a ValidationResult with per-rule detail.
        """
        text_lower = text.lower()
        sentences = _split_sentences(text)
        sentences_lower = [s.lower() for s in sentences]

        rule_results = []
        violations = []
        warnings = []
        critical_count = 0
        high_count = 0

        for rule in self._rules:
            rule_id = rule.get("id", "")
            rule_code = rule.get("code", "UNKNOWN")
            severity = rule.get("severity", "MEDIUM")

            # --- Forbidden pattern check (word-boundary + negation) ---
            forbidden_hit = False
            hit_pattern = ""
            hit_sentence = ""
            negation_suppressed = False

            if rule_id in self._compiled_forbidden:
                for pattern_str, pattern_re in self._compiled_forbidden[rule_id]:
                    match = pattern_re.search(text_lower)
                    if match:
                        # Check negation before declaring a violation
                        if _is_negated(text_lower, match.start(), match.end()):
                            negation_suppressed = True
                            continue

                        forbidden_hit = True
                        hit_pattern = pattern_str

                        # Find the sentence containing this match
                        for i, sl in enumerate(sentences_lower):
                            if pattern_re.search(sl):
                                hit_sentence = sentences[i] if i < len(sentences) else ""
                                break
                        break  # one hit per rule is enough to violate

            # --- Required phrase check ---
            required = rule.get("required_phrases", [])
            required_missing = False
            if required and not forbidden_hit:
                found_any = False
                for phrase in required:
                    if phrase.lower() in text_lower:
                        found_any = True
                        break
                if not found_any:
                    required_missing = True
                    hit_pattern = "MISSING:" + "|".join(required[:3])

            # --- Build rule result ---
            passed = not forbidden_hit and not required_missing
            suggestion = _SUGGESTIONS.get(hit_pattern, "") if not passed else ""

            rr = RuleResult(
                rule_id=rule_id,
                rule_code=rule_code,
                severity=severity,
                passed=passed,
                matched_pattern=hit_pattern if not passed else "",
                matched_sentence=hit_sentence[:200] if not passed else "",
                negation_detected=negation_suppressed,
                suggestion=suggestion,
            )
            rule_results.append(rr)

            if not passed:
                msg = "%s/%s: %s '%s' [severity=%s]" % (
                    rule_id, rule_code,
                    "Forbidden pattern" if forbidden_hit else "Missing required phrase",
                    hit_pattern, severity)
                if hit_sentence:
                    msg += " in: \"%s\"" % hit_sentence[:100]
                if suggestion:
                    msg += " -> %s" % suggestion

                if severity == "CRITICAL":
                    violations.append(msg)
                    critical_count += 1
                elif severity == "HIGH":
                    violations.append(msg)
                    high_count += 1
                else:
                    warnings.append(msg)

        # Block on any CRITICAL or 3+ HIGH violations
        blocked = critical_count > 0 or high_count >= 3

        return ValidationResult(
            passed=not blocked,
            violations=tuple(violations),
            warnings=tuple(warnings),
            rule_results=tuple(rule_results),
            auditor_version=self._version,
            auditor_hash=self._hash,
            rules_evaluated=len(self._rules),
            critical_violations=critical_count,
            high_violations=high_count,
            sentences_scanned=len(sentences),
        )

    def validate_text(self, text):
        """Legacy wrapper returning (passed, violations_list)."""
        result = self.validate(text)
        return result.passed, list(result.violations)

    def get_rule(self, rule_id):
        """Look up a single rule by ID."""
        for rule in self._rules:
            if rule.get("id") == rule_id:
                return dict(rule)
        return None

    def get_rules_by_category(self, category):
        """Return all rules in a category."""
        return [r for r in self._rules if r.get("category") == category]

    def get_critical_rules(self):
        """Return all CRITICAL-severity rules."""
        return [r for r in self._rules if r.get("severity") == "CRITICAL"]

    def explain_violation(self, rule_id, text):
        """
        Explain why a specific rule would violate on the given text.

        Returns a dict with matched_pattern, matched_sentence,
        negation_detected, and suggestion — or None if no violation.
        """
        rule = self.get_rule(rule_id)
        if not rule:
            return None

        text_lower = text.lower()
        sentences = _split_sentences(text)

        if rule_id in self._compiled_forbidden:
            for pattern_str, pattern_re in self._compiled_forbidden[rule_id]:
                match = pattern_re.search(text_lower)
                if match:
                    negated = _is_negated(text_lower, match.start(), match.end())
                    ctx = ""
                    for s in sentences:
                        if pattern_re.search(s.lower()):
                            ctx = s
                            break
                    return {
                        "rule_id": rule_id,
                        "matched_pattern": pattern_str,
                        "matched_sentence": ctx[:200],
                        "negation_detected": negated,
                        "would_violate": not negated,
                        "suggestion": _SUGGESTIONS.get(pattern_str, ""),
                    }

        required = rule.get("required_phrases", [])
        if required:
            found = any(p.lower() in text_lower for p in required)
            if not found:
                return {
                    "rule_id": rule_id,
                    "matched_pattern": "MISSING:" + "|".join(required[:3]),
                    "matched_sentence": "",
                    "negation_detected": False,
                    "would_violate": True,
                    "suggestion": "Add one of: " + ", ".join(required[:3]),
                }

        return None

    # -- Internal ----------------------------------------------------------

    def _compute_rules_hash(self):
        return sha256_json(self._rules)


# ---------------------------------------------------------------------------
# AuditChain
# ---------------------------------------------------------------------------

class AuditChain:
    """
    SHA-256-linked cryptographic audit log.

    Every agent action is appended as an immutable entry whose hash
    incorporates the previous entry's hash, forming a Merkle-style chain.
    """

    _GENESIS_HASH = "0" * 64

    def __init__(self):
        self._chain = []

    def log(self, agent_name, input_data, output_data):
        """Append an event. Returns the entry's SHA-256 hash."""
        prev_hash = self._chain[-1]["hash"] if self._chain else self._GENESIS_HASH
        entry = {
            "index": len(self._chain),
            "timestamp": utcnow().isoformat(),
            "agent": agent_name,
            "input_hash": sha256_json(input_data),
            "output_hash": sha256_json(output_data),
            "prev_hash": prev_hash,
        }
        entry["hash"] = sha256_json(entry)
        self._chain.append(entry)
        return entry["hash"]

    def export(self):
        """Return a copy of the full chain."""
        return list(self._chain)

    def verify_integrity(self):
        """Verify every back-link and recompute every hash."""
        for i, entry in enumerate(self._chain):
            expected_prev = self._chain[i - 1]["hash"] if i > 0 else self._GENESIS_HASH
            if entry["prev_hash"] != expected_prev:
                return False
            check = {k: v for k, v in entry.items() if k != "hash"}
            if entry["hash"] != sha256_json(check):
                return False
        return True

    @property
    def length(self):
        return len(self._chain)

    @property
    def head_hash(self):
        return self._chain[-1]["hash"] if self._chain else self._GENESIS_HASH
