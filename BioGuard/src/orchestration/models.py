"""
BioGuardian Domain Models
==========================
Pydantic v2 schema definitions for the BioGuardian LangGraph agent swarm.

All models are immutable by default (``model_config frozen=True``) except
``AgentState``, which is intentionally mutable so agents can accumulate
state across graph steps.

Conventions
-----------
- UTC everywhere: ``datetime`` fields are validated to be timezone-aware.
- Explicit validators replace silent coercions.
- Field descriptions act as inline documentation and power JSON Schema / OpenAPI output.
- Sentinel defaults (empty lists, etc.) are declared via ``default_factory`` to
  avoid the classic mutable-default footgun.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Shared types / aliases
# ---------------------------------------------------------------------------

LoincCode = Annotated[str, Field(pattern=r"^\d{1,5}-\d$", description="LOINC code in NNNNN-N format")]
Sha256Hex = Annotated[str, Field(min_length=64, max_length=64, pattern=r"^[0-9a-f]{64}$")]
UnitInterval = Annotated[float, Field(ge=0.0, le=1.0)]
PearsonR = Annotated[float, Field(ge=-1.0, le=1.0)]

Severity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
LabStatus = Literal["registered", "partial", "preliminary", "final", "amended", "corrected", "cancelled"]


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _brief_id() -> str:
    return f"BG-{uuid.uuid4().hex[:8].upper()}"


# ---------------------------------------------------------------------------
# LabPanel
# ---------------------------------------------------------------------------

class ReferenceRange(BaseModel):
    """Typed bounds for a lab reference range."""

    model_config = {"frozen": True}

    low: float = Field(description="Lower bound of the reference range (inclusive).")
    high: float = Field(description="Upper bound of the reference range (inclusive).")

    @model_validator(mode="after")
    def _low_before_high(self) -> "ReferenceRange":
        if self.low >= self.high:
            raise ValueError(f"low ({self.low}) must be strictly less than high ({self.high})")
        return self

    def contains(self, value: float) -> bool:
        return self.low <= value <= self.high

    def flag(self, value: float) -> Literal["normal", "low", "high"]:
        if value < self.low:
            return "low"
        if value > self.high:
            return "high"
        return "normal"


class LabPanel(BaseModel):
    """A single laboratory result, linked to a source document via its PDF hash."""

    model_config = {"frozen": True}

    loinc_code: LoincCode = Field(description="LOINC code identifying the observation type.")
    display_name: str = Field(min_length=1, description="Human-readable test name.")
    value: float = Field(description="Numeric result.")
    unit: str = Field(min_length=1, description="UCUM unit string (e.g. 'mg/dL').")
    reference_range: ReferenceRange = Field(description="Normal range for this marker.")
    collected_at: datetime = Field(description="UTC datetime the specimen was collected.")
    source_pdf_hash: Sha256Hex = Field(description="SHA-256 hex digest of the originating PDF.")
    status: LabStatus = Field(default="final", description="FHIR observation status.")

    @field_validator("collected_at", mode="before")
    @classmethod
    def _ensure_utc(cls, v: datetime) -> datetime:
        if isinstance(v, datetime) and v.tzinfo is None:
            raise ValueError("collected_at must be timezone-aware (UTC expected).")
        return v

    @property
    def is_abnormal(self) -> bool:
        return not self.reference_range.contains(self.value)

    @property
    def flag(self) -> Literal["normal", "low", "high"]:
        return self.reference_range.flag(self.value)


# ---------------------------------------------------------------------------
# ContraindicationFlag
# ---------------------------------------------------------------------------

class DrugPair(BaseModel):
    """Ordered pair of drug names involved in a potential interaction."""

    model_config = {"frozen": True}

    primary: str = Field(min_length=1, description="The primary / precipitant drug.")
    interactant: str = Field(min_length=1, description="The interacting / object drug.")

    @model_validator(mode="after")
    def _different_drugs(self) -> "DrugPair":
        if self.primary.lower() == self.interactant.lower():
            raise ValueError("primary and interactant must be different drugs.")
        return self


class ContraindicationFlag(BaseModel):
    """
    A detected drug–drug interaction cross-referenced against the patient's
    current LOINC markers.
    """

    model_config = {"frozen": True}

    drug_pair: DrugPair = Field(description="The two drugs involved.")
    severity: Severity = Field(description="Interaction severity tier.")
    fda_report_count: int = Field(ge=0, description="Number of FDA FAERS adverse-event reports.")
    personalized_risk_score: UnitInterval = Field(
        description="Patient-specific risk score in [0, 1], derived from LOINC markers."
    )

    @property
    def is_actionable(self) -> bool:
        """True when severity is HIGH/CRITICAL or the personalised risk exceeds 0.7."""
        return self.severity in {"HIGH", "CRITICAL"} or self.personalized_risk_score >= 0.7


# ---------------------------------------------------------------------------
# AnomalySignal
# ---------------------------------------------------------------------------

class ConfidenceInterval(BaseModel):
    """95 % confidence interval for a statistical estimate."""

    model_config = {"frozen": True}

    lower: float
    upper: float

    @model_validator(mode="after")
    def _lower_before_upper(self) -> "ConfidenceInterval":
        if self.lower >= self.upper:
            raise ValueError(f"lower ({self.lower}) must be less than upper ({self.upper}).")
        return self


class AnomalySignal(BaseModel):
    """
    A statistically significant correlation between a biometric and a
    protocol event (e.g. an evening dose).

    Only signals with p < 0.05 and a minimum 72-hour observation window
    are accepted.
    """

    model_config = {"frozen": True}

    biometric: str = Field(min_length=1, description="Name of the biometric being analysed.")
    protocol_event: str = Field(
        min_length=1,
        description="Protocol event correlated with the biometric (e.g. 'evening_dose').",
    )
    pearson_r: PearsonR = Field(description="Pearson correlation coefficient in [-1, 1].")
    p_value: float = Field(gt=0.0, lt=0.05, description="Must be < 0.05; non-significant signals are discarded.")
    confidence_interval: ConfidenceInterval
    window_hours: int = Field(ge=72, description="Observation window in hours (minimum 72).")
    severity: Severity = Field(default="MEDIUM")

    @property
    def is_positive_correlation(self) -> bool:
        return self.pearson_r > 0


# ---------------------------------------------------------------------------
# PhysicianBrief
# ---------------------------------------------------------------------------

class PhysicianBrief(BaseModel):
    """
    A structured, auditable summary generated for physician review.
    Includes lab flags, drug interaction flags, anomaly signals, and a
    free-text SOAP note.
    """

    model_config = {"frozen": True}

    brief_id: str = Field(
        default_factory=_brief_id,
        description="Unique brief identifier in 'BG-XXXXXXXX' format.",
    )
    generated_at: datetime = Field(
        default_factory=_utcnow,
        description="UTC timestamp of brief generation.",
    )
    patient_summary: str = Field(min_length=1, description="One-paragraph patient context.")
    lab_flags: list[LabPanel] = Field(default_factory=list, description="Abnormal lab panels.")
    drug_flags: list[ContraindicationFlag] = Field(default_factory=list)
    anomaly_signals: list[AnomalySignal] = Field(default_factory=list)
    soap_note: str = Field(min_length=1, description="Free-text SOAP note for the physician.")
    audit_hash: Sha256Hex = Field(description="SHA-256 digest of the full agent audit trail.")
    compliance_version: str = Field(
        default="FDA-GW-2016-V47",
        description="Regulatory compliance ruleset version applied.",
    )

    @property
    def has_critical_flags(self) -> bool:
        """True if any drug interaction is CRITICAL or any lab is abnormal."""
        return (
            any(f.severity == "CRITICAL" for f in self.drug_flags)
            or any(p.is_abnormal for p in self.lab_flags)
        )


# ---------------------------------------------------------------------------
# AgentState  (mutable — intentionally not frozen)
# ---------------------------------------------------------------------------

class AgentState(BaseModel):
    """
    Shared mutable state propagated between BioGuardian LangGraph agents.

    Follows the MCP tool schema: each agent receives the full state, appends
    its results, and passes the updated object downstream.

    Fields are ordered by pipeline stage:
      raw input → parsed labs → protocol → analysis → output → audit
    """

    # -- Identity --
    patient_id: str = Field(description="Stable, pseudonymised patient identifier.")

    # -- Stage 1: ingestion --
    raw_lab_input: str | None = Field(
        default=None,
        description="Raw text extracted from the source PDF before parsing.",
    )

    # -- Stage 2: parsed labs --
    lab_panels: list[LabPanel] = Field(default_factory=list)

    # -- Stage 3: protocol --
    protocol: dict[str, Any] = Field(
        default_factory=dict,
        description="Active supplement / medication protocol keyed by product name.",
    )

    # -- Stage 4: analysis --
    contraindications: list[ContraindicationFlag] = Field(default_factory=list)
    signals: list[AnomalySignal] = Field(default_factory=list)

    # -- Stage 5: output --
    brief: PhysicianBrief | None = Field(default=None)

    # -- Audit / meta --
    agent_logs: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Structured log entries appended by each agent.",
    )
    compliance_status: bool = Field(
        default=False,
        description="Set to True only after the compliance agent validates the brief.",
    )
    audit_trail: list[str] = Field(
        default_factory=list,
        description="Ordered list of SHA-256 hashes from the AuditChain.",
    )

    # -- Convenience helpers --

    @property
    def has_critical_issues(self) -> bool:
        """Shortcut for triage: True if the brief (if present) reports critical flags."""
        return self.brief is not None and self.brief.has_critical_flags

    @property
    def abnormal_labs(self) -> list[LabPanel]:
        return [p for p in self.lab_panels if p.is_abnormal]

    def append_log(self, agent: str, message: str, **extra: Any) -> None:
        """Append a structured log entry with a UTC timestamp."""
        self.agent_logs.append(
            {"agent": agent, "message": message, "timestamp": _utcnow().isoformat(), **extra}
        )
