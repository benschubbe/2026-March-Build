"""
BioGuardian Domain Models — Unit Tests
========================================

Validates the Pydantic v2 schema contracts that enforce type safety
across the LangGraph agent swarm.

Run:
    python -m pytest src/orchestration/tests/test_models.py -v
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from orchestration.models import (
    AgentState,
    AnomalySignal,
    ConfidenceInterval,
    ContraindicationFlag,
    DrugPair,
    LabPanel,
    PhysicianBrief,
    ReferenceRange,
)


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class TestReferenceRange:

    def test_valid_range(self) -> None:
        rr = ReferenceRange(low=4.0, high=5.6)
        assert rr.contains(5.0)
        assert not rr.contains(6.0)

    def test_flag_method(self) -> None:
        rr = ReferenceRange(low=70.0, high=100.0)
        assert rr.flag(85.0) == "normal"
        assert rr.flag(60.0) == "low"
        assert rr.flag(110.0) == "high"

    def test_invalid_range_rejected(self) -> None:
        with pytest.raises(ValueError):
            ReferenceRange(low=10.0, high=5.0)

    def test_equal_bounds_rejected(self) -> None:
        with pytest.raises(ValueError):
            ReferenceRange(low=5.0, high=5.0)


class TestLabPanel:

    def test_abnormal_detection(self) -> None:
        lab = LabPanel(
            loinc_code="4544-3",
            display_name="HbA1c",
            value=6.4,
            unit="%",
            reference_range=ReferenceRange(low=4.0, high=5.6),
            collected_at=_utcnow(),
            source_pdf_hash="a" * 64,
        )
        assert lab.is_abnormal
        assert lab.flag == "high"

    def test_normal_detection(self) -> None:
        lab = LabPanel(
            loinc_code="2339-0",
            display_name="Glucose",
            value=95.0,
            unit="mg/dL",
            reference_range=ReferenceRange(low=70.0, high=100.0),
            collected_at=_utcnow(),
            source_pdf_hash="b" * 64,
        )
        assert not lab.is_abnormal
        assert lab.flag == "normal"

    def test_naive_datetime_rejected(self) -> None:
        with pytest.raises(ValueError):
            LabPanel(
                loinc_code="4544-3",
                display_name="HbA1c",
                value=5.0,
                unit="%",
                reference_range=ReferenceRange(low=4.0, high=5.6),
                collected_at=datetime(2026, 1, 1),  # naive — no tzinfo
                source_pdf_hash="a" * 64,
            )


class TestDrugPair:

    def test_valid_pair(self) -> None:
        dp = DrugPair(primary="Atorvastatin", interactant="Metformin")
        assert dp.primary == "Atorvastatin"

    def test_same_drug_rejected(self) -> None:
        with pytest.raises(ValueError):
            DrugPair(primary="Metformin", interactant="metformin")


class TestContraindicationFlag:

    def test_actionable_high_severity(self) -> None:
        flag = ContraindicationFlag(
            drug_pair=DrugPair(primary="A", interactant="B"),
            severity="HIGH",
            fda_report_count=100,
            personalized_risk_score=0.5,
        )
        assert flag.is_actionable

    def test_actionable_high_risk(self) -> None:
        flag = ContraindicationFlag(
            drug_pair=DrugPair(primary="A", interactant="B"),
            severity="LOW",
            fda_report_count=10,
            personalized_risk_score=0.75,
        )
        assert flag.is_actionable

    def test_not_actionable(self) -> None:
        flag = ContraindicationFlag(
            drug_pair=DrugPair(primary="A", interactant="B"),
            severity="LOW",
            fda_report_count=5,
            personalized_risk_score=0.3,
        )
        assert not flag.is_actionable


class TestAnomalySignal:

    def test_p_value_threshold(self) -> None:
        # p >= 0.05 should be rejected
        with pytest.raises(ValueError):
            AnomalySignal(
                biometric="HRV",
                protocol_event="dose",
                pearson_r=-0.5,
                p_value=0.06,
                confidence_interval=ConfidenceInterval(lower=-0.7, upper=-0.3),
                window_hours=96,
            )

    def test_minimum_window(self) -> None:
        # window < 72 should be rejected
        with pytest.raises(ValueError):
            AnomalySignal(
                biometric="HRV",
                protocol_event="dose",
                pearson_r=-0.5,
                p_value=0.01,
                confidence_interval=ConfidenceInterval(lower=-0.7, upper=-0.3),
                window_hours=48,
            )

    def test_valid_signal(self) -> None:
        sig = AnomalySignal(
            biometric="HRV_RMSSD",
            protocol_event="evening_dose",
            pearson_r=-0.84,
            p_value=0.012,
            confidence_interval=ConfidenceInterval(lower=-0.92, upper=-0.71),
            window_hours=96,
        )
        assert not sig.is_positive_correlation
        assert sig.severity == "MEDIUM"  # default


class TestPhysicianBrief:

    def test_brief_id_format(self) -> None:
        brief = PhysicianBrief(
            patient_summary="Test patient.",
            soap_note="S: Test. O: Test. A: Test. P: Test.",
            audit_hash="a" * 64,
        )
        assert brief.brief_id.startswith("BG-")
        assert len(brief.brief_id) == 11  # "BG-" + 8 hex chars

    def test_compliance_version_default(self) -> None:
        brief = PhysicianBrief(
            patient_summary="Test.",
            soap_note="Test.",
            audit_hash="b" * 64,
        )
        assert brief.compliance_version == "FDA-GW-2016-V47"


class TestAgentState:

    def test_append_log(self) -> None:
        state = AgentState(patient_id="PT-TEST")
        state.append_log("TestAgent", "Hello world")
        assert len(state.agent_logs) == 1
        assert state.agent_logs[0]["agent"] == "TestAgent"

    def test_abnormal_labs_property(self) -> None:
        state = AgentState(
            patient_id="PT-TEST",
            lab_panels=[
                LabPanel(
                    loinc_code="4544-3",
                    display_name="HbA1c",
                    value=6.4,
                    unit="%",
                    reference_range=ReferenceRange(low=4.0, high=5.6),
                    collected_at=_utcnow(),
                    source_pdf_hash="a" * 64,
                ),
            ],
        )
        assert len(state.abnormal_labs) == 1
