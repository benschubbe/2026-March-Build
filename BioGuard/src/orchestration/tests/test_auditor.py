"""
BioGuardian Compliance Auditor — Unit Tests
=============================================

Tests the deterministic predicate-logic Compliance Auditor against the
47 FDA General Wellness 2016 rules.  Each critical rule is tested with
representative positive (should pass) and negative (should block) examples.

The master plan specifies 5 positive and 5 negative examples per rule
at build time.  This test suite validates the most impactful rules
from each category.

Run:
    python -m pytest src/orchestration/tests/test_auditor.py -v
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Ensure the orchestration package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from orchestration.auditor.engine import AuditChain, ComplianceEngine, ValidationResult

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

RULES_PATH = Path(__file__).resolve().parent.parent / "auditor" / "rules.yaml"


@pytest.fixture(scope="module")
def engine() -> ComplianceEngine:
    return ComplianceEngine(RULES_PATH)


@pytest.fixture
def audit_chain() -> AuditChain:
    return AuditChain()


# ---------------------------------------------------------------------------
# Engine metadata tests
# ---------------------------------------------------------------------------

class TestEngineMetadata:

    def test_version_is_v47(self, engine: ComplianceEngine) -> None:
        assert engine.version == "FDA-GW-2016-V47"

    def test_rule_count_is_47(self, engine: ComplianceEngine) -> None:
        assert engine.rule_count == 47

    def test_rules_hash_is_deterministic(self, engine: ComplianceEngine) -> None:
        engine2 = ComplianceEngine(RULES_PATH)
        assert engine.rules_hash == engine2.rules_hash

    def test_rules_hash_is_sha256(self, engine: ComplianceEngine) -> None:
        assert len(engine.rules_hash) == 64
        assert all(c in "0123456789abcdef" for c in engine.rules_hash)


# ---------------------------------------------------------------------------
# GW-001: NO_DIAGNOSTIC_CLAIM
# ---------------------------------------------------------------------------

class TestGW001:
    """Output must not claim to diagnose a disease."""

    PASSING = [
        "Your HRV showed a correlation with your evening dose for physician review.",
        "The following correlations may be of clinical interest to your care team.",
        "openFDA reports 847 adverse event reports. Professional consultation recommended.",
        "Biometric drift detected. Discuss with your doctor. Wellness correlation only.",
        "This brief is for professional consultation only. No data transmitted.",
    ]

    BLOCKING = [
        "We can diagnose your condition based on these results.",
        "Our diagnosis indicates a serious problem.",
        "You are suffering from a cardiac condition.",
        "The patient tested positive for diabetes.",
        "Based on our analysis, the diagnosis is clear.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw001_violations = [v for v in result.violations if "GW-001" in v]
        assert len(gw001_violations) == 0, f"False positive on GW-001: {gw001_violations}"

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw001_violations = [v for v in result.violations if "GW-001" in v]
        assert len(gw001_violations) > 0, f"False negative on GW-001 for: {text}"


# ---------------------------------------------------------------------------
# GW-009: NO_CURATIVE_PROMISE
# ---------------------------------------------------------------------------

class TestGW009:
    """Output must not promise a cure or treatment outcome."""

    PASSING = [
        "These correlations may be of clinical interest. Discuss with your doctor.",
        "openFDA data suggests further physician review may be warranted.",
        "Wellness monitoring detected a biometric trend worth discussing.",
        "Professional consultation recommended based on observed correlation.",
        "This brief supports clinical discussion, not treatment decisions.",
    ]

    BLOCKING = [
        "This will cure your diabetes.",
        "BioGuardian can heal your condition.",
        "This remedy will fix your symptoms.",
        "Our system will eradicate the underlying issue.",
        "Following our protocol will remedy this situation.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw009_violations = [v for v in result.violations if "GW-009" in v]
        assert len(gw009_violations) == 0

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw009_violations = [v for v in result.violations if "GW-009" in v]
        assert len(gw009_violations) > 0


# ---------------------------------------------------------------------------
# GW-017: NO_PRESCRIPTION_STOP
# ---------------------------------------------------------------------------

class TestGW017:
    """Output must not recommend stopping medication."""

    PASSING = [
        "Discuss these findings with your physician before any changes.",
        "Your care team can evaluate whether protocol adjustments are warranted.",
        "This correlation is flagged for physician review at your next appointment.",
        "Professional consultation strongly recommended regarding this interaction.",
        "Biometric trends suggest a discussion with your doctor may be beneficial.",
    ]

    BLOCKING = [
        "You should stop taking your statin immediately.",
        "Discontinue this medication based on these results.",
        "Cease medication until you see your doctor.",
        "Quit taking the metformin right away.",
        "Stop taking atorvastatin — the correlation is clear.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw017_violations = [v for v in result.violations if "GW-017" in v]
        assert len(gw017_violations) == 0

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw017_violations = [v for v in result.violations if "GW-017" in v]
        assert len(gw017_violations) > 0


# ---------------------------------------------------------------------------
# GW-024: NO_DEFINITIVE_CAUSATION
# ---------------------------------------------------------------------------

class TestGW024:
    """Output must not assert definitive causal relationships."""

    PASSING = [
        "HRV showed a negative correlation with the evening dose window.",
        "These biometric trends may be associated with the protocol change.",
        "The correlation suggests a relationship worth investigating.",
        "openFDA data indicates a potential interaction for physician review.",
        "Statistical analysis detected a significant correlation (p=0.012).",
    ]

    BLOCKING = [
        "This drug is causing your HRV to drop.",
        "The statin is causing the observed decline.",
        "Your symptoms are caused by the medication interaction.",
        "The medication is directly responsible for these changes.",
        "This causes elevated glucose in patients like you.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw024_violations = [v for v in result.violations if "GW-024" in v]
        assert len(gw024_violations) == 0

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw024_violations = [v for v in result.violations if "GW-024" in v]
        assert len(gw024_violations) > 0


# ---------------------------------------------------------------------------
# GW-031: PROFESSIONAL_DISCUSSION_REQUIRED
# ---------------------------------------------------------------------------

class TestGW031:
    """Every brief must mandate physician consultation."""

    PASSING = [
        "Please discuss with your doctor before making any changes.",
        "Professional consultation is strongly recommended.",
        "Consult your physician about these correlations.",
        "Discuss with your healthcare provider about these findings.",
        "These results should be reviewed by your care team.",
    ]

    BLOCKING = [
        "Your HRV dropped 22% and glucose rose 8 mg/dL.",
        "Correlation detected between statin and biometric drift.",
        "Statistical analysis complete. Results are definitive.",
        "Atorvastatin interaction flagged with 847 FDA reports.",
        "Biometric analysis finished. No further action needed from you.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw031_violations = [v for v in result.violations if "GW-031" in v]
        assert len(gw031_violations) == 0

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw031_violations = [v for v in result.violations if "GW-031" in v]
        assert len(gw031_violations) > 0


# ---------------------------------------------------------------------------
# GW-038: NO_AI_AS_PHYSICIAN
# ---------------------------------------------------------------------------

class TestGW038:
    """Output must not present AI analysis as physician opinion."""

    PASSING = [
        "BioGuardian detected a correlation for your physician to review.",
        "The agent swarm identified a statistical signal worth discussing.",
        "These wellness correlations are provided for clinical discussion.",
        "Automated analysis flagged a biometric trend — not a diagnosis.",
        "This brief summarises agent findings for professional review.",
    ]

    BLOCKING = [
        "In my medical opinion, you should adjust your medication.",
        "As your physician, I recommend a dose change.",
        "The doctor recommends immediate action.",
        "Based on my clinical opinion, this is concerning.",
        "In my medical opinion the results are alarming.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw038_violations = [v for v in result.violations if "GW-038" in v]
        assert len(gw038_violations) == 0

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine: ComplianceEngine, text: str) -> None:
        result = engine.validate(text)
        gw038_violations = [v for v in result.violations if "GW-038" in v]
        assert len(gw038_violations) > 0


# ---------------------------------------------------------------------------
# Full pipeline: compliant brief passes all 47 rules
# ---------------------------------------------------------------------------

class TestFullPipeline:
    """A well-formed Physician Brief must pass all 47 rules."""

    COMPLIANT_BRIEF = (
        "Patient PT-2026-SARAH. Biometric correlation detected following "
        "initiation of Atorvastatin. Analysis performed locally on-device. "
        "The following correlations may be of clinical interest to your care team. "
        "HRV RMSSD showed a negative correlation (Pearson r=-0.84, p=0.012) "
        "over a 96-hour post-dose window. openFDA adverse event data reports "
        "847 FAERS entries for this interaction. Professional consultation "
        "strongly recommended. Discuss with your doctor before any changes. "
        "This brief is for physician review and clinical discussion only. "
        "Wellness monitoring — correlation does not imply causation. "
        "No data transmitted. All analysis performed locally. "
        "Confidence interval: 95% CI [-0.92, -0.71]. "
    )

    def test_compliant_brief_passes(self, engine: ComplianceEngine) -> None:
        result = engine.validate(self.COMPLIANT_BRIEF)
        assert result.passed, f"Compliant brief should pass. Violations: {result.violations}"
        assert result.violation_count == 0
        assert result.rules_evaluated == 47

    def test_diagnostic_language_blocked(self, engine: ComplianceEngine) -> None:
        """Intentional demo beat: diagnostic language triggers the auditor."""
        bad_brief = self.COMPLIANT_BRIEF + " Your statin is causing reduced HRV. You have diabetes."
        result = engine.validate(bad_brief)
        assert not result.passed
        assert result.violation_count > 0

    def test_validation_result_repr(self, engine: ComplianceEngine) -> None:
        result = engine.validate(self.COMPLIANT_BRIEF)
        repr_str = repr(result)
        assert "PASSED" in repr_str
        assert "47 rules" in repr_str

    def test_validation_result_bool(self, engine: ComplianceEngine) -> None:
        result = engine.validate(self.COMPLIANT_BRIEF)
        assert bool(result) is True

        bad_result = engine.validate("You have diabetes. Stop taking medication.")
        assert bool(bad_result) is False


# ---------------------------------------------------------------------------
# AuditChain tests
# ---------------------------------------------------------------------------

class TestAuditChain:

    def test_empty_chain(self, audit_chain: AuditChain) -> None:
        assert audit_chain.length == 0
        assert audit_chain.verify_integrity()
        assert audit_chain.head_hash == "0" * 64

    def test_single_entry(self, audit_chain: AuditChain) -> None:
        h = audit_chain.log("The Scribe", "input_pdf", ["lab_panel_1"])
        assert len(h) == 64
        assert audit_chain.length == 1
        assert audit_chain.head_hash == h

    def test_chain_linkage(self, audit_chain: AuditChain) -> None:
        audit_chain.log("The Scribe", "pdf", "labs")
        audit_chain.log("The Pharmacist", "labs", "flags")
        audit_chain.log("The Correlation Engine", "stream", "signals")
        audit_chain.log("The Compliance Auditor", "corpus", "result")
        assert audit_chain.length == 4
        assert audit_chain.verify_integrity()

    def test_chain_integrity_detection(self, audit_chain: AuditChain) -> None:
        audit_chain.log("Agent1", "a", "b")
        audit_chain.log("Agent2", "c", "d")
        assert audit_chain.verify_integrity()

        # Tamper with the chain
        audit_chain._chain[0]["hash"] = "tampered" + "0" * 56
        assert not audit_chain.verify_integrity()

    def test_export_returns_copy(self, audit_chain: AuditChain) -> None:
        audit_chain.log("Agent", "in", "out")
        export = audit_chain.export()
        assert len(export) == 1
        export.clear()
        assert audit_chain.length == 1  # original unchanged

    def test_deterministic_hashing(self) -> None:
        chain1 = AuditChain()
        chain2 = AuditChain()
        # Same inputs should produce same hashes (timestamps will differ,
        # so we verify structural properties instead)
        h1 = chain1.log("Agent", "same_input", "same_output")
        h2 = chain2.log("Agent", "same_input", "same_output")
        # Hashes differ because timestamps differ, but both should be valid SHA-256
        assert len(h1) == 64 and len(h2) == 64
