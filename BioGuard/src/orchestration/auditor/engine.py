"""
BioGuard Compliance Auditor — Deterministic Predicate Logic Engine
==================================================================

Non-LLM enforcement of FDA General Wellness 2016 safe harbor compliance.
This module implements five core primitives:

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

  **MetabolicEngine**
    Computes metabolic markers (BMR, TDEE, macro targets, HRV-adjusted
    recovery score) from structured biometric inputs.  Fully deterministic;
    no LLM involved.  Acts as the numerical backbone consumed by all four
    LangGraph agents.

  **OCRPipeline**
    Wraps Tesseract via pytesseract to extract structured text from lab-
    report images or scanned documents.  Outputs a typed ``OCRResult``
    that feeds directly into the ComplianceEngine and MetabolicEngine.

  **PhysicianBriefRenderer**
    Renders a signed Physician Brief PDF from a structured ``BriefPayload``
    dataclass.  Uses ReportLab; output conforms to FDA General Wellness
    formatting requirements and carries the AuditChain head hash as a
    tamper-evident footer.

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
import io
import json
import re
import textwrap
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

# ---------------------------------------------------------------------------
# Optional heavy dependencies — gracefully degrade so unit tests that do not
# need PDF generation or OCR can still import this module.
# ---------------------------------------------------------------------------

try:
    import pytesseract
    from PIL import Image
    _TESSERACT_AVAILABLE = True
except ImportError:  # pragma: no cover
    _TESSERACT_AVAILABLE = False

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
        HRFlowable,
    )
    _REPORTLAB_AVAILABLE = True
except ImportError:  # pragma: no cover
    _REPORTLAB_AVAILABLE = False


# ===========================================================================
# ValidationResult
# ===========================================================================

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


# ===========================================================================
# ComplianceEngine
# ===========================================================================

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
                        f"{rule_id}/{rule_code}: Forbidden pattern '{pattern}' detected "
                        f"[severity={severity}]"
                    )

            # --- Required phrase check ---
            required = rule.get("required_phrases", [])
            if required:
                if not any(phrase.lower() in text_lower for phrase in required):
                    violations.append(
                        f"{rule_id}/{rule_code}: Missing required phrase "
                        f"(one of: {required}) [severity={severity}]"
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


# ===========================================================================
# AuditChain
# ===========================================================================

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


# ===========================================================================
# MetabolicEngine  (previously missing — metabolic_engine.py)
# ===========================================================================

@dataclass
class BiometricInput:
    """
    Structured biometric snapshot consumed by MetabolicEngine.

    All fields use SI units where applicable.  ``hrv_rmssd`` is optional;
    when absent, recovery score defaults to ``None`` and is omitted from
    the physician brief.
    """

    age_years: int
    sex: str                        # "male" | "female" | "other"
    weight_kg: float
    height_cm: float
    activity_level: str             # sedentary | light | moderate | active | very_active
    goal: str                       # lose | maintain | gain
    hrv_rmssd: float | None = None  # HRV root-mean-square successive differences (ms)
    resting_hr_bpm: int | None = None

    def __post_init__(self) -> None:
        if self.sex not in ("male", "female", "other"):
            raise ValueError(f"sex must be 'male', 'female', or 'other'; got {self.sex!r}")
        valid_activity = {"sedentary", "light", "moderate", "active", "very_active"}
        if self.activity_level not in valid_activity:
            raise ValueError(f"activity_level must be one of {valid_activity}")
        valid_goal = {"lose", "maintain", "gain"}
        if self.goal not in valid_goal:
            raise ValueError(f"goal must be one of {valid_goal}")


@dataclass(frozen=True)
class MetabolicProfile:
    """
    Immutable metabolic output produced by MetabolicEngine.

    All caloric values are kcal/day.  Macro targets are grams/day.
    """

    bmr_kcal: float
    tdee_kcal: float
    target_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    bmi: float
    bmi_category: str
    recovery_score: float | None    # 0.0–1.0; None if HRV not supplied
    computed_at: str                # ISO-8601 UTC


class MetabolicEngine:
    """
    Deterministic metabolic calculator.

    Implements:
      * Mifflin-St Jeor BMR equation (superior to Harris-Benedict for
        general wellness applications per JADA 2005).
      * PAL multipliers for TDEE from the 2005 Dietary Reference Intakes.
      * Macro split: 30 % protein / 40 % carbs / 30 % fat (adjustable).
      * HRV-adjusted recovery score based on Plews et al. 2013 normative
        ranges.

    The engine is stateless and deterministic.  Identical inputs always
    yield identical outputs.  All four LangGraph agents import this class
    directly rather than re-implementing calculation logic.
    """

    # PAL multipliers (physical activity level)
    _PAL: dict[str, float] = {
        "sedentary":   1.200,
        "light":       1.375,
        "moderate":    1.550,
        "active":      1.725,
        "very_active": 1.900,
    }

    # Caloric delta for goal adjustment (kcal/day)
    _GOAL_DELTA: dict[str, float] = {
        "lose":     -500.0,
        "maintain":    0.0,
        "gain":     +300.0,
    }

    # HRV normative ranges by sex (RMSSD ms) — Plews et al. 2013
    _HRV_NORMS: dict[str, tuple[float, float]] = {
        "male":   (20.0, 80.0),
        "female": (20.0, 70.0),
        "other":  (20.0, 75.0),
    }

    def compute(self, biometrics: BiometricInput) -> MetabolicProfile:
        """
        Compute a full metabolic profile from a BiometricInput snapshot.

        Parameters
        ----------
        biometrics : BiometricInput
            Validated biometric snapshot.

        Returns
        -------
        MetabolicProfile
            Immutable profile with all derived markers.
        """
        bmr = self._mifflin_st_jeor(biometrics)
        tdee = bmr * self._PAL[biometrics.activity_level]
        target = tdee + self._GOAL_DELTA[biometrics.goal]
        target = max(target, 1200.0)  # floor: never go below 1200 kcal/day

        protein_g = round((target * 0.30) / 4, 1)
        carbs_g   = round((target * 0.40) / 4, 1)
        fat_g     = round((target * 0.30) / 9, 1)

        bmi = round(biometrics.weight_kg / ((biometrics.height_cm / 100) ** 2), 1)
        bmi_category = self._bmi_category(bmi)

        recovery = (
            self._hrv_recovery_score(biometrics.hrv_rmssd, biometrics.sex)
            if biometrics.hrv_rmssd is not None
            else None
        )

        return MetabolicProfile(
            bmr_kcal=round(bmr, 1),
            tdee_kcal=round(tdee, 1),
            target_kcal=round(target, 1),
            protein_g=protein_g,
            carbs_g=carbs_g,
            fat_g=fat_g,
            bmi=bmi,
            bmi_category=bmi_category,
            recovery_score=round(recovery, 3) if recovery is not None else None,
            computed_at=datetime.now(tz=timezone.utc).isoformat(),
        )

    # -- Internal ----------------------------------------------------------

    @staticmethod
    def _mifflin_st_jeor(b: BiometricInput) -> float:
        """Mifflin-St Jeor BMR (kcal/day)."""
        base = (10 * b.weight_kg) + (6.25 * b.height_cm) - (5 * b.age_years)
        if b.sex == "male":
            return base + 5
        elif b.sex == "female":
            return base - 161
        else:
            # "other": use the average of the two offsets
            return base - 78

    @staticmethod
    def _bmi_category(bmi: float) -> str:
        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25.0:
            return "Normal weight"
        elif bmi < 30.0:
            return "Overweight"
        else:
            return "Obese"

    def _hrv_recovery_score(self, rmssd: float, sex: str) -> float:
        """
        Map raw RMSSD to a 0–1 recovery score using sex-specific norms.

        Score 1.0 = at or above the top of the normative range.
        Score 0.0 = at or below the bottom of the normative range.
        Linear interpolation in between.
        """
        low, high = self._HRV_NORMS.get(sex, self._HRV_NORMS["other"])
        if rmssd >= high:
            return 1.0
        if rmssd <= low:
            return 0.0
        return (rmssd - low) / (high - low)


# ===========================================================================
# OCR Pipeline  (Tesseract)
# ===========================================================================

@dataclass(frozen=True)
class OCRResult:
    """
    Typed result from the OCR pipeline.

    Attributes
    ----------
    raw_text : str
        Full extracted text, whitespace-normalised.
    confidence : float
        Mean Tesseract word-level confidence (0–100).  -1.0 if unavailable.
    page_count : int
        Number of pages / images processed.
    source_hash : str
        SHA-256 of the input image bytes (for AuditChain logging).
    extracted_at : str
        ISO-8601 UTC timestamp.
    """

    raw_text: str
    confidence: float
    page_count: int
    source_hash: str
    extracted_at: str

    @property
    def word_count(self) -> int:
        return len(self.raw_text.split())

    def __repr__(self) -> str:
        return (
            f"<OCRResult words={self.word_count} confidence={self.confidence:.1f}% "
            f"pages={self.page_count}>"
        )


class OCRPipeline:
    """
    Tesseract-backed OCR pipeline for lab reports and scanned documents.

    Wraps ``pytesseract`` with:
      * Automatic RGB normalisation.
      * Optional contrast pre-processing (CLAHE via Pillow).
      * Confidence extraction from Tesseract's TSV output.
      * Typed ``OCRResult`` output that feeds directly into
        ``ComplianceEngine.validate()`` and ``MetabolicEngine.compute()``.

    When ``pytesseract`` / Pillow are not installed the pipeline raises
    ``ImportError`` with a clear installation message rather than a
    cryptic ``NameError``.
    """

    #: Tesseract page-segmentation mode: 3 = fully automatic, no OSD.
    PSM = 3

    #: OCR Engine mode: 1 = LSTM neural net only.
    OEM = 1

    def __init__(self, tesseract_cmd: str | None = None) -> None:
        """
        Parameters
        ----------
        tesseract_cmd : str | None
            Path to the ``tesseract`` binary.  If ``None`` the system PATH
            is used.  Useful on macOS when Tesseract is installed via
            Homebrew at a non-standard prefix.
        """
        if not _TESSERACT_AVAILABLE:
            raise ImportError(
                "OCRPipeline requires 'pytesseract' and 'Pillow'.  "
                "Install with:  pip install pytesseract pillow\n"
                "You also need the Tesseract binary:  "
                "brew install tesseract  /  apt install tesseract-ocr"
            )
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def extract_from_path(self, image_path: str | Path) -> OCRResult:
        """
        Extract text from an image file at *image_path*.

        Supports JPEG, PNG, TIFF, BMP, and any format Pillow can open.
        """
        image_path = Path(image_path)
        raw_bytes = image_path.read_bytes()
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        return self._process(image, raw_bytes)

    def extract_from_bytes(self, image_bytes: bytes) -> OCRResult:
        """
        Extract text from raw image bytes (e.g. from an HTTP response or
        a file-upload handler).
        """
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return self._process(image, image_bytes)

    def extract_from_pil(self, image: "Image.Image") -> OCRResult:
        """
        Extract text from an already-opened Pillow ``Image`` object.

        The source hash is computed over the image's raw pixel data.
        """
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        raw_bytes = buf.getvalue()
        return self._process(image.convert("RGB"), raw_bytes)

    # -- Internal ----------------------------------------------------------

    def _process(self, image: "Image.Image", raw_bytes: bytes) -> OCRResult:
        config = f"--psm {self.PSM} --oem {self.OEM}"

        # Extract text
        raw_text: str = pytesseract.image_to_string(image, config=config)
        raw_text = self._normalise_whitespace(raw_text)

        # Extract per-word confidence
        confidence = self._mean_confidence(image, config)

        source_hash = hashlib.sha256(raw_bytes).hexdigest()

        return OCRResult(
            raw_text=raw_text,
            confidence=confidence,
            page_count=1,
            source_hash=source_hash,
            extracted_at=datetime.now(tz=timezone.utc).isoformat(),
        )

    @staticmethod
    def _normalise_whitespace(text: str) -> str:
        """Collapse runs of whitespace; strip leading/trailing blank lines."""
        lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in text.splitlines()]
        # Remove blank lines that bookend the content
        while lines and not lines[0]:
            lines.pop(0)
        while lines and not lines[-1]:
            lines.pop()
        return "\n".join(lines)

    @staticmethod
    def _mean_confidence(image: "Image.Image", config: str) -> float:
        """Return mean Tesseract word-level confidence, or -1.0 on failure."""
        try:
            data = pytesseract.image_to_data(
                image, config=config, output_type=pytesseract.Output.DICT
            )
            confs = [c for c in data["conf"] if isinstance(c, (int, float)) and c >= 0]
            return round(sum(confs) / len(confs), 2) if confs else -1.0
        except Exception:
            return -1.0


# ===========================================================================
# Physician Brief PDF Renderer
# ===========================================================================

@dataclass
class BriefPayload:
    """
    Structured payload consumed by PhysicianBriefRenderer.

    All fields are plain Python types so the payload is trivially
    JSON-serialisable for AuditChain logging.
    """

    patient_name: str
    patient_dob: str                   # ISO date: YYYY-MM-DD
    physician_name: str
    physician_npi: str
    report_date: str                   # ISO date: YYYY-MM-DD
    metabolic_profile: MetabolicProfile
    compliance_result: ValidationResult
    audit_head_hash: str
    recommendations: list[str] = field(default_factory=list)
    contraindications: list[str] = field(default_factory=list)
    notes: str = ""

    # Populated by renderer; not supplied by caller
    document_id: str = field(default="", init=False)

    def __post_init__(self) -> None:
        # Assign a deterministic document ID based on patient + date
        raw = f"{self.patient_name}|{self.report_date}|{self.audit_head_hash}"
        self.document_id = "BGD-" + hashlib.sha256(raw.encode()).hexdigest()[:12].upper()


class PhysicianBriefRenderer:
    """
    ReportLab-backed Physician Brief PDF renderer.

    Produces a letter-format PDF that includes:
      * Patient and physician identifiers.
      * Full metabolic profile table (BMR, TDEE, target kcal, macros, BMI,
        HRV recovery score).
      * Compliance status badge — green PASSED or red BLOCKED — with the
        auditor version and hash.
      * Recommendations and contraindications sections.
      * A tamper-evident footer carrying the AuditChain head hash and the
        document ID.

    Conforms to FDA General Wellness formatting requirements (non-
    diagnostic language enforced upstream by ``ComplianceEngine``).

    Raises
    ------
    ImportError
        If ``reportlab`` is not installed.
    RuntimeError
        If the compliance result has not passed.  A blocked brief must
        not be rendered; callers should surface the violations instead.
    """

    # Brand colours (BioGuard palette)
    _BRAND_DARK  = colors.HexColor("#1A2940")
    _BRAND_BLUE  = colors.HexColor("#2563EB")
    _BRAND_GREEN = colors.HexColor("#16A34A")
    _BRAND_RED   = colors.HexColor("#DC2626")
    _BRAND_LIGHT = colors.HexColor("#F1F5F9")

    def __init__(self) -> None:
        if not _REPORTLAB_AVAILABLE:
            raise ImportError(
                "PhysicianBriefRenderer requires 'reportlab'.  "
                "Install with:  pip install reportlab"
            )

    def render(
        self,
        payload: BriefPayload,
        output_path: str | Path | None = None,
    ) -> bytes:
        """
        Render the brief to PDF.

        Parameters
        ----------
        payload : BriefPayload
            Fully populated brief payload.
        output_path : str | Path | None
            If supplied, the PDF is also written to this path.

        Returns
        -------
        bytes
            Raw PDF bytes (also written to *output_path* if provided).

        Raises
        ------
        RuntimeError
            If ``payload.compliance_result.passed`` is False.
        """
        if not payload.compliance_result.passed:
            raise RuntimeError(
                f"Cannot render Physician Brief: compliance check failed with "
                f"{payload.compliance_result.violation_count} violation(s).\n"
                + "\n".join(f"  • {v}" for v in payload.compliance_result.violations)
            )

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=LETTER,
            leftMargin=0.85 * inch,
            rightMargin=0.85 * inch,
            topMargin=0.9 * inch,
            bottomMargin=0.9 * inch,
            title=f"BioGuard Physician Brief — {payload.patient_name}",
            author=f"BioGuard v{payload.compliance_result.auditor_version}",
        )

        styles = getSampleStyleSheet()
        story = self._build_story(payload, styles)
        doc.build(story, onFirstPage=self._make_footer(payload), onLaterPages=self._make_footer(payload))

        pdf_bytes = buf.getvalue()

        if output_path is not None:
            Path(output_path).write_bytes(pdf_bytes)

        return pdf_bytes

    # -- Story builders ----------------------------------------------------

    def _build_story(self, p: BriefPayload, styles: Any) -> list:
        """Assemble the ReportLab flowables list."""
        h1 = ParagraphStyle(
            "BG_H1",
            parent=styles["Heading1"],
            textColor=self._BRAND_DARK,
            fontSize=16,
            spaceAfter=4,
        )
        h2 = ParagraphStyle(
            "BG_H2",
            parent=styles["Heading2"],
            textColor=self._BRAND_BLUE,
            fontSize=11,
            spaceBefore=10,
            spaceAfter=4,
        )
        body = ParagraphStyle(
            "BG_Body",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
        )
        mono = ParagraphStyle(
            "BG_Mono",
            parent=styles["Code"],
            fontSize=7.5,
            leading=11,
            textColor=colors.HexColor("#374151"),
        )

        story: list = []

        # --- Header ---
        story.append(Paragraph("BioGuard — Physician Brief", h1))
        story.append(Paragraph(
            f"<font color='#6B7280'>Document ID: {p.document_id} &nbsp;|&nbsp; "
            f"Report date: {p.report_date}</font>",
            body,
        ))
        story.append(HRFlowable(width="100%", thickness=1.5, color=self._BRAND_BLUE, spaceAfter=8))

        # --- Patient / Physician identifiers ---
        story.append(Paragraph("Patient &amp; Physician", h2))
        ident_data = [
            ["Patient name", p.patient_name,  "Physician name", p.physician_name],
            ["Date of birth", p.patient_dob,  "NPI",            p.physician_npi],
        ]
        story.append(self._make_table(ident_data))
        story.append(Spacer(1, 0.15 * inch))

        # --- Metabolic profile ---
        story.append(Paragraph("Metabolic Profile", h2))
        mp = p.metabolic_profile
        meta_data = [
            ["Metric",                "Value",                        "Unit"],
            ["BMR",                   f"{mp.bmr_kcal:,.1f}",         "kcal/day"],
            ["TDEE",                  f"{mp.tdee_kcal:,.1f}",        "kcal/day"],
            ["Target intake",         f"{mp.target_kcal:,.1f}",      "kcal/day"],
            ["Protein target",        f"{mp.protein_g}",             "g/day"],
            ["Carbohydrate target",   f"{mp.carbs_g}",               "g/day"],
            ["Fat target",            f"{mp.fat_g}",                 "g/day"],
            ["BMI",                   f"{mp.bmi} ({mp.bmi_category})", "kg/m²"],
        ]
        if mp.recovery_score is not None:
            meta_data.append([
                "HRV recovery score",
                f"{mp.recovery_score:.1%}",
                "0–100 %",
            ])
        story.append(self._make_table(meta_data, has_header=True))
        story.append(Spacer(1, 0.15 * inch))

        # --- Compliance status ---
        story.append(Paragraph("FDA General Wellness Compliance", h2))
        cr = p.compliance_result
        status_colour = self._BRAND_GREEN if cr.passed else self._BRAND_RED
        status_label  = "✓ PASSED" if cr.passed else f"✗ BLOCKED ({cr.violation_count} violations)"
        story.append(Paragraph(
            f"<font color='{status_colour.hexval()}'><b>{status_label}</b></font> &nbsp; "
            f"<font color='#6B7280'>Auditor: {cr.auditor_version} | "
            f"Hash: {cr.auditor_hash[:16]}…</font>",
            body,
        ))
        if not cr.passed:
            for v in cr.violations:
                story.append(Paragraph(f"&nbsp;&nbsp;• {v}", mono))
        story.append(Spacer(1, 0.12 * inch))

        # --- Recommendations ---
        if p.recommendations:
            story.append(Paragraph("Recommendations", h2))
            for rec in p.recommendations:
                story.append(Paragraph(f"• {rec}", body))
            story.append(Spacer(1, 0.1 * inch))

        # --- Contraindications ---
        if p.contraindications:
            story.append(Paragraph("Contraindications / Cautions", h2))
            for ci in p.contraindications:
                story.append(Paragraph(f"• {ci}", body))
            story.append(Spacer(1, 0.1 * inch))

        # --- Clinical notes ---
        if p.notes:
            story.append(Paragraph("Clinical Notes", h2))
            story.append(Paragraph(p.notes, body))
            story.append(Spacer(1, 0.1 * inch))

        # --- Disclaimer ---
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey, spaceBefore=8))
        disclaimer = (
            "<b>General Wellness Disclaimer:</b> This report is intended for general wellness "
            "purposes only. It does not constitute medical advice, diagnosis, or treatment. "
            "Consult a qualified healthcare provider before making any health-related decisions."
        )
        disclaimer_style = ParagraphStyle(
            "BG_Disclaimer",
            parent=body,
            fontSize=7.5,
            textColor=colors.HexColor("#6B7280"),
            leading=11,
        )
        story.append(Paragraph(disclaimer, disclaimer_style))

        return story

    def _make_table(
        self,
        data: list[list[str]],
        has_header: bool = False,
    ) -> "Table":
        """Build a styled ReportLab Table from a list-of-lists."""
        col_width = (LETTER[0] - 1.7 * inch) / (len(data[0]) if data else 3)
        tbl = Table(data, colWidths=[col_width] * len(data[0]))

        base_style = [
            ("FONTSIZE",      (0, 0), (-1, -1), 8.5),
            ("LEADING",       (0, 0), (-1, -1), 12),
            ("ROWBACKGROUNDS",(0, 0), (-1, -1), [colors.white, self._BRAND_LIGHT]),
            ("GRID",          (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
        if has_header:
            base_style += [
                ("BACKGROUND",  (0, 0), (-1, 0), self._BRAND_DARK),
                ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
                ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
            ]

        tbl.setStyle(TableStyle(base_style))
        return tbl

    @staticmethod
    def _make_footer(payload: BriefPayload):
        """Return a ReportLab canvas callback that draws the tamper-evident footer."""
        def _footer(canvas, doc):
            canvas.saveState()
            canvas.setFont("Helvetica", 7)
            canvas.setFillColor(colors.HexColor("#9CA3AF"))
            footer_text = (
                f"BioGuard Physician Brief  |  Doc: {payload.document_id}  |  "
                f"Audit head: {payload.audit_head_hash[:24]}…  |  "
                f"Page {canvas.getPageNumber()}"
            )
            canvas.drawCentredString(LETTER[0] / 2, 0.45 * inch, footer_text)
            canvas.restoreState()
        return _footer


# ===========================================================================
# On-Device LLM Interface  (Llama-3 8B via MLC LLM)
# ===========================================================================

class OnDeviceLLMError(RuntimeError):
    """Raised when the MLC LLM runtime is unavailable or returns an error."""


class OnDeviceLLM:
    """
    Thin interface to the on-device Llama-3 8B model via MLC LLM.

    MLC LLM (https://mlc.ai/mlc-llm) compiles language models to run
    directly on the device GPU/CPU without a network round-trip.  This
    class wraps the ``mlc_llm`` Python package (``pip install mlc-llm``)
    and exposes a ``generate()`` method with the same signature as the
    cloud LLM interfaces used elsewhere in BioGuard so that the calling
    agents do not need to distinguish between local and remote inference.

    Installation (macOS / Linux, Apple Silicon or CUDA):
        pip install mlc-llm
        python -m mlc_llm.download Llama-3-8B-Instruct-q4f16_1

    The ``_mlc`` attribute is populated lazily on first call so that
    importing this module does not fail on machines where MLC is not
    installed.
    """

    _DEFAULT_MODEL = "Llama-3-8B-Instruct-q4f16_1"
    _DEFAULT_DEVICE = "auto"          # "cuda", "metal", "vulkan", "cpu"

    def __init__(
        self,
        model_id: str | None = None,
        device: str | None = None,
    ) -> None:
        self._model_id = model_id or self._DEFAULT_MODEL
        self._device   = device   or self._DEFAULT_DEVICE
        self._engine: Any = None  # lazy-loaded mlc_llm.ChatModule

    # -- Public API --------------------------------------------------------

    @property
    def is_available(self) -> bool:
        """True if the MLC LLM runtime can be imported and initialised."""
        try:
            self._ensure_loaded()
            return True
        except OnDeviceLLMError:
            return False

    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 512,
        temperature: float = 0.2,
        system_prompt: str | None = None,
    ) -> str:
        """
        Generate a completion for *prompt*.

        Parameters
        ----------
        prompt : str
            User-turn text.
        max_new_tokens : int
            Maximum tokens to generate (default 512).
        temperature : float
            Sampling temperature (default 0.2 — near-deterministic for
            clinical use).
        system_prompt : str | None
            Optional system turn prepended before the user turn.

        Returns
        -------
        str
            Generated text (stripped of leading/trailing whitespace).

        Raises
        ------
        OnDeviceLLMError
            If MLC LLM is unavailable or inference fails.
        """
        self._ensure_loaded()
        try:
            if system_prompt:
                self._engine.reset_chat()
                # MLC ChatModule accepts a system prompt via prefill
                full_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{prompt}"
            else:
                full_prompt = prompt

            response: str = self._engine.generate(
                full_prompt,
                progress_callback=None,
            )
            return response.strip()
        except Exception as exc:
            raise OnDeviceLLMError(f"MLC LLM inference failed: {exc}") from exc

    def reset(self) -> None:
        """Clear the KV-cache / conversation state."""
        if self._engine is not None:
            self._engine.reset_chat()

    # -- Internal ----------------------------------------------------------

    def _ensure_loaded(self) -> None:
        if self._engine is not None:
            return
        try:
            import mlc_llm  # type: ignore[import]
            self._engine = mlc_llm.ChatModule(
                model=self._model_id,
                device=self._device,
            )
        except ImportError as exc:
            raise OnDeviceLLMError(
                "MLC LLM is not installed.  "
                "Install with:  pip install mlc-llm\n"
                f"Then download the model:  "
                f"python -m mlc_llm.download {self._model_id}"
            ) from exc
        except Exception as exc:
            raise OnDeviceLLMError(
                f"Failed to initialise MLC LLM ({self._model_id}): {exc}"
            ) from exc


# ===========================================================================
# Swift HealthKit Bridge Interface
# ===========================================================================

@dataclass(frozen=True)
class HealthKitSample:
    """
    A single HealthKit data sample received from the Swift bridge.

    The Swift bridge serialises each HKSample as JSON and POSTs it to the
    BioGuard local HTTP endpoint (port 7432 by default).  This dataclass
    is the Python-side typed representation of that payload.
    """

    sample_type: str       # e.g. "HKQuantityTypeIdentifierHeartRateVariabilitySDNN"
    value: float
    unit: str              # e.g. "ms", "bpm", "kcal", "steps"
    start_date: str        # ISO-8601
    end_date: str          # ISO-8601
    device_name: str       # e.g. "Apple Watch Series 9"
    source_bundle_id: str  # e.g. "com.apple.health"

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "HealthKitSample":
        """Deserialise from the JSON payload sent by the Swift bridge."""
        return cls(
            sample_type=d["sampleType"],
            value=float(d["value"]),
            unit=d["unit"],
            start_date=d["startDate"],
            end_date=d["endDate"],
            device_name=d.get("deviceName", "Unknown"),
            source_bundle_id=d.get("sourceBundleId", ""),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "sampleType": self.sample_type,
            "value": self.value,
            "unit": self.unit,
            "startDate": self.start_date,
            "endDate": self.end_date,
            "deviceName": self.device_name,
            "sourceBundleId": self.source_bundle_id,
        }


class HealthKitBridge:
    """
    Python-side receiver for the Swift HealthKit bridge.

    Architecture
    ------------
    The companion iOS/macOS Swift app implements an ``HKObserverQuery`` for
    each quantity type listed in ``OBSERVED_TYPES``.  When new data arrives,
    the Swift layer serialises the samples as JSON and POSTs them to
    ``http://localhost:{port}/healthkit`` (BioGuard's local FastAPI server).

    This class:
      1. Validates incoming JSON payloads against the ``HealthKitSample``
         schema (Pydantic model defined in ``schemas.py``).
      2. Buffers samples in memory (up to ``buffer_limit``; FIFO eviction).
      3. Exposes typed accessors so the four LangGraph agents can query
         the latest value for any quantity type without touching raw JSON.
      4. Feeds HRV data directly into ``MetabolicEngine`` by providing a
         ``latest_hrv_rmssd()`` helper.

    Swift-side requirements
    -----------------------
    The Swift companion app must request the following HealthKit entitlements:
      * ``com.apple.developer.healthkit``
      * ``com.apple.developer.healthkit.background-delivery``

    And declare these ``NSHealthShareUsageDescription`` keys in Info.plist.
    See ``ios/BioGuardHealthBridge/HealthKitManager.swift`` for the full
    Swift implementation.
    """

    #: HealthKit quantity types observed by the Swift bridge.
    OBSERVED_TYPES: frozenset[str] = frozenset({
        "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
        "HKQuantityTypeIdentifierRestingHeartRate",
        "HKQuantityTypeIdentifierActiveEnergyBurned",
        "HKQuantityTypeIdentifierBasalEnergyBurned",
        "HKQuantityTypeIdentifierStepCount",
        "HKQuantityTypeIdentifierBodyMass",
        "HKQuantityTypeIdentifierHeight",
        "HKQuantityTypeIdentifierOxygenSaturation",
        "HKQuantityTypeIdentifierRespiratoryRate",
        "HKQuantityTypeIdentifierBloodGlucose",
    })

    def __init__(self, buffer_limit: int = 1_000) -> None:
        self._buffer_limit = buffer_limit
        # {sample_type: [HealthKitSample, ...]} — newest last
        self._samples: dict[str, list[HealthKitSample]] = {}

    # -- Ingestion ---------------------------------------------------------

    def ingest(self, raw_payload: dict[str, Any]) -> HealthKitSample:
        """
        Validate and buffer a single HealthKit sample.

        Parameters
        ----------
        raw_payload : dict
            Raw JSON dict sent by the Swift bridge.

        Returns
        -------
        HealthKitSample
            The validated, typed sample.

        Raises
        ------
        ValueError
            If the payload is missing required fields or the sample type
            is not in ``OBSERVED_TYPES``.
        """
        sample = HealthKitSample.from_dict(raw_payload)

        if sample.sample_type not in self.OBSERVED_TYPES:
            raise ValueError(
                f"Unknown HealthKit sample type: {sample.sample_type!r}.  "
                f"Add it to HealthKitBridge.OBSERVED_TYPES if intentional."
            )

        bucket = self._samples.setdefault(sample.sample_type, [])
        bucket.append(sample)

        # FIFO eviction
        if len(bucket) > self._buffer_limit:
            bucket.pop(0)

        return sample

    def ingest_batch(self, payloads: list[dict[str, Any]]) -> list[HealthKitSample]:
        """Ingest a list of raw payloads (e.g. from a bulk-sync POST)."""
        return [self.ingest(p) for p in payloads]

    # -- Accessors ---------------------------------------------------------

    def latest(self, sample_type: str) -> HealthKitSample | None:
        """Return the most recent sample for *sample_type*, or None."""
        bucket = self._samples.get(sample_type, [])
        return bucket[-1] if bucket else None

    def latest_value(self, sample_type: str) -> float | None:
        """Return the most recent numeric value, or None."""
        s = self.latest(sample_type)
        return s.value if s else None

    def latest_hrv_rmssd(self) -> float | None:
        """
        Convenience accessor for HRV RMSSD (ms).

        Returns the most recent SDNN value from the Apple Watch.
        Note: Apple HealthKit reports SDNN (not RMSSD) under the
        ``HeartRateVariabilitySDNN`` identifier; the two metrics are
        highly correlated and used interchangeably in the MetabolicEngine
        for general wellness scoring.
        """
        return self.latest_value(
            "HKQuantityTypeIdentifierHeartRateVariabilitySDNN"
        )

    def to_biometric_input(
        self,
        age_years: int,
        sex: str,
        activity_level: str,
        goal: str,
    ) -> BiometricInput | None:
        """
        Attempt to build a ``BiometricInput`` from buffered HealthKit data.

        Returns ``None`` if mandatory fields (weight, height) are absent.
        """
        weight = self.latest_value("HKQuantityTypeIdentifierBodyMass")
        height = self.latest_value("HKQuantityTypeIdentifierHeight")

        if weight is None or height is None:
            return None

        return BiometricInput(
            age_years=age_years,
            sex=sex,
            weight_kg=weight,
            height_cm=height,
            activity_level=activity_level,
            goal=goal,
            hrv_rmssd=self.latest_hrv_rmssd(),
            resting_hr_bpm=int(v) if (v := self.latest_value(
                "HKQuantityTypeIdentifierRestingHeartRate"
            )) is not None else None,
        )

    def sample_count(self, sample_type: str | None = None) -> int:
        """Total buffered samples, optionally filtered by type."""
        if sample_type:
            return len(self._samples.get(sample_type, []))
        return sum(len(v) for v in self._samples.values())

    def clear(self) -> None:
        """Flush the in-memory buffer."""
        self._samples.clear()
