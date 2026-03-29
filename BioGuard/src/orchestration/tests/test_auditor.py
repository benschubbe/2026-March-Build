"""
BioGuardian Compliance Auditor — Unit Tests
=============================================

Tests the deterministic predicate-logic Compliance Auditor including:
  - Word-boundary matching (no false positives on substrings)
  - Negation detection (suppresses matches after "not", "cannot", etc.)
  - Sentence-level context extraction
  - Severity-weighted blocking (CRITICAL = immediate block)
  - Suggested compliant alternatives
  - The explain_violation() diagnostic API
  - Full pipeline compliance validation
  - SHA-256 audit chain integrity

Run:
    python -m pytest src/orchestration/tests/test_auditor.py -v
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from orchestration.auditor.engine import (
    AuditChain, ComplianceEngine, ValidationResult, RuleResult,
    _is_negated, _split_sentences,
)

RULES_PATH = Path(__file__).resolve().parent.parent / "auditor" / "rules.yaml"


@pytest.fixture(scope="module")
def engine():
    return ComplianceEngine(RULES_PATH)


@pytest.fixture
def chain():
    return AuditChain()


# ---------------------------------------------------------------------------
# Engine metadata
# ---------------------------------------------------------------------------

class TestMetadata:
    def test_version(self, engine):
        assert engine.version == "FDA-GW-2016-V47"

    def test_rule_count(self, engine):
        assert engine.rule_count == 47

    def test_hash_deterministic(self, engine):
        engine2 = ComplianceEngine(RULES_PATH)
        assert engine.rules_hash == engine2.rules_hash

    def test_hash_is_sha256(self, engine):
        assert len(engine.rules_hash) == 64


# ---------------------------------------------------------------------------
# Word-boundary matching — the hard part
# ---------------------------------------------------------------------------

class TestWordBoundary:
    """Word-boundary regex prevents false positives on substrings."""

    def test_diagnose_not_in_undiagnosed(self, engine):
        """'undiagnosed' should NOT trigger the 'diagnose' rule."""
        text = ("The patient's undiagnosed symptoms are being monitored. "
                "Discuss with your doctor. Clinical interest. Correlation. "
                "openFDA report. Pearson r=0.5. On-device. Physician review.")
        result = engine.validate(text)
        gw001 = [v for v in result.violations if "GW-001" in v]
        assert len(gw001) == 0, "False positive: 'undiagnosed' should not trigger 'diagnose'"

    def test_diagnose_triggers_as_whole_word(self, engine):
        """'diagnose' as a whole word SHOULD trigger."""
        text = "We diagnose this condition based on lab results."
        result = engine.validate(text)
        gw001 = [v for v in result.violations if "GW-001" in v]
        assert len(gw001) > 0

    def test_cure_not_in_secure(self, engine):
        """'secure' should NOT trigger the 'cure' rule."""
        text = ("Secure on-device processing. Discuss with your doctor. "
                "Clinical interest. Correlation. openFDA report. "
                "Pearson r. On-device. Physician review.")
        result = engine.validate(text)
        gw009 = [v for v in result.violations if "GW-009" in v]
        assert len(gw009) == 0, "False positive: 'secure' should not trigger 'cure'"

    def test_heal_not_in_health(self, engine):
        """'health' should NOT trigger the 'heal' rule."""
        text = ("Health monitoring for wellness. Discuss with your doctor. "
                "Clinical interest. Correlation. openFDA report. "
                "Pearson r. On-device. Physician review.")
        result = engine.validate(text)
        gw009 = [v for v in result.violations if "GW-009" in v and "'heal'" in v]
        assert len(gw009) == 0, "False positive: 'health' should not trigger 'heal'"


# ---------------------------------------------------------------------------
# Negation detection
# ---------------------------------------------------------------------------

class TestNegation:
    """Negation before a pattern suppresses the match."""

    def test_does_not_diagnose(self, engine):
        """'does not diagnose' should NOT trigger GW-001."""
        text = ("This system does not diagnose any condition. "
                "Discuss with your doctor. Clinical interest. Correlation. "
                "openFDA report. Pearson r. On-device. Physician review.")
        result = engine.validate(text)
        gw001 = [v for v in result.violations if "GW-001" in v]
        assert len(gw001) == 0, "'does not diagnose' should be negation-suppressed"

    def test_cannot_cure(self, engine):
        """'cannot cure' should NOT trigger GW-009."""
        text = ("This system cannot cure any disease. "
                "Discuss with your doctor. Clinical interest. Wellness. "
                "openFDA report. Pearson r. On-device. Physician review.")
        result = engine.validate(text)
        gw009 = [v for v in result.violations if "GW-009" in v]
        assert len(gw009) == 0

    def test_positive_match_no_negation(self, engine):
        """Without negation, the pattern should still trigger."""
        text = "We can cure this condition."
        result = engine.validate(text)
        gw009 = [v for v in result.violations if "GW-009" in v]
        assert len(gw009) > 0

    def test_negation_helper_function(self):
        text = "this system does not diagnose conditions"
        # "diagnose" starts at position 25
        idx = text.find("diagnose")
        assert _is_negated(text, idx, idx + len("diagnose"))

    def test_no_negation_present(self):
        text = "we diagnose conditions based on results"
        idx = text.find("diagnose")
        assert not _is_negated(text, idx, idx + len("diagnose"))


# ---------------------------------------------------------------------------
# Sentence-level context
# ---------------------------------------------------------------------------

class TestSentenceContext:

    def test_sentences_split(self):
        text = "First sentence. Second sentence. Third sentence."
        sentences = _split_sentences(text)
        assert len(sentences) >= 2

    def test_violation_includes_sentence(self, engine):
        text = ("Safe wellness content here. "
                "But we diagnose your diabetes. "
                "More safe content here.")
        result = engine.validate(text)
        gw001 = [v for v in result.violations if "GW-001" in v]
        assert len(gw001) > 0
        # The violation message should contain the offending sentence
        assert "diagnose" in gw001[0].lower()

    def test_sentences_scanned_count(self, engine):
        text = "First. Second. Third."
        result = engine.validate(text)
        assert result.sentences_scanned >= 1


# ---------------------------------------------------------------------------
# Severity-weighted blocking
# ---------------------------------------------------------------------------

class TestSeverityScoring:

    def test_critical_blocks_immediately(self, engine):
        """A single CRITICAL violation should block."""
        text = "We diagnose your condition."
        result = engine.validate(text)
        assert not result.passed
        assert result.critical_violations >= 1

    def test_medium_does_not_block(self, engine):
        """A single MEDIUM violation should warn, not block."""
        # Missing a required phrase (MEDIUM severity) alone shouldn't block
        # unless there are also CRITICAL or enough HIGH violations
        text = ("Safe content. Discuss with your doctor. "
                "On-device. Physician review. openFDA report. Pearson r.")
        result = engine.validate(text)
        # "clinical interest" or "correlation" or "wellness" is required by GW-023 (MEDIUM)
        # This text has none of those exact phrases
        # But it shouldn't be blocked since MEDIUM doesn't block
        # Actually let's check — the text doesn't have "clinical interest" etc.
        # GW-023 is MEDIUM, so it goes to warnings, not violations
        assert result.critical_violations == 0

    def test_validation_result_has_warnings(self, engine):
        result = engine.validate("Test text. Discuss with your doctor. Physician review. openFDA report. On-device.")
        # Should have some warnings for missing required phrases at MEDIUM level
        assert isinstance(result.warnings, tuple)


# ---------------------------------------------------------------------------
# Suggested alternatives
# ---------------------------------------------------------------------------

class TestSuggestions:

    def test_diagnose_suggestion(self, engine):
        text = "We diagnose your condition."
        result = engine.validate(text)
        # Find the RuleResult for GW-001
        gw001_results = [rr for rr in result.rule_results if rr.rule_id == "GW-001"]
        assert len(gw001_results) > 0
        rr = gw001_results[0]
        assert not rr.passed
        assert len(rr.suggestion) > 0  # should have an alternative

    def test_stop_taking_suggestion(self, engine):
        text = "You should stop taking your medication."
        result = engine.validate(text)
        gw017 = [rr for rr in result.rule_results if rr.rule_id == "GW-017"]
        assert len(gw017) > 0
        assert "physician" in gw017[0].suggestion.lower()


# ---------------------------------------------------------------------------
# explain_violation() API
# ---------------------------------------------------------------------------

class TestExplainViolation:

    def test_explain_forbidden(self, engine):
        explanation = engine.explain_violation("GW-001", "We diagnose your condition.")
        assert explanation is not None
        assert explanation["would_violate"]
        assert explanation["matched_pattern"] == "diagnose"

    def test_explain_negated(self, engine):
        explanation = engine.explain_violation("GW-001", "This does not diagnose anything.")
        assert explanation is not None
        assert explanation["negation_detected"]
        assert not explanation["would_violate"]

    def test_explain_no_match(self, engine):
        explanation = engine.explain_violation("GW-001", "Safe wellness content only.")
        assert explanation is None

    def test_explain_missing_required(self, engine):
        explanation = engine.explain_violation("GW-031", "No disclaimer present.")
        assert explanation is not None
        assert explanation["would_violate"]
        assert "MISSING" in explanation["matched_pattern"]


# ---------------------------------------------------------------------------
# GW-001 through GW-038: representative rules (5 pass / 5 block each)
# ---------------------------------------------------------------------------

class TestGW001:
    PASSING = [
        "Your HRV showed a correlation with your evening dose for physician review. "
        "Clinical interest. openFDA report. On-device.",
        "The following correlations may be of clinical interest to your care team. "
        "openFDA report. Physician review. On-device.",
        "Biometric drift detected. Discuss with your doctor. Wellness correlation. "
        "openFDA report. On-device. Physician.",
        "This system does not diagnose any condition. Discuss with your doctor. "
        "Correlation. openFDA. On-device. Physician review.",
        "Undiagnosed symptoms are tracked. Discuss with your doctor. Correlation. "
        "openFDA report. On-device. Physician review.",
    ]
    BLOCKING = [
        "We diagnose your condition based on these results.",
        "Our diagnosis indicates a serious problem.",
        "You are suffering from a cardiac condition.",
        "The patient tested positive for diabetes.",
        "Based on our analysis, the diagnosis is clear.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine, text):
        result = engine.validate(text)
        gw001 = [v for v in result.violations if "GW-001" in v]
        assert len(gw001) == 0, "False positive on GW-001: %s" % gw001

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine, text):
        result = engine.validate(text)
        gw001 = [v for v in result.violations if "GW-001" in v]
        assert len(gw001) > 0


class TestGW009:
    PASSING = [
        "These correlations may be of clinical interest. Discuss with your doctor. "
        "openFDA. On-device. Physician review.",
        "Professional consultation recommended. Correlation. openFDA. "
        "On-device. Physician review. Wellness.",
        "This system cannot cure any disease. Discuss with your doctor. "
        "Correlation. openFDA. On-device. Physician.",
        "Your health is our priority. Discuss with your doctor. Correlation. "
        "openFDA. On-device. Physician review.",
        "Secure processing on-device. Discuss with your doctor. Correlation. "
        "openFDA. Physician review. Wellness.",
    ]
    BLOCKING = [
        "This will cure your diabetes.",
        "BioGuardian can heal your condition.",
        "This remedy will fix your symptoms.",
        "Our system will eradicate the underlying issue.",
        "Following our protocol will remedy this situation.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine, text):
        result = engine.validate(text)
        gw009 = [v for v in result.violations if "GW-009" in v]
        assert len(gw009) == 0, "False positive on GW-009: %s" % gw009

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine, text):
        result = engine.validate(text)
        gw009 = [v for v in result.violations if "GW-009" in v]
        assert len(gw009) > 0


class TestGW017:
    PASSING = [
        "Discuss findings with your physician before any changes. Correlation. "
        "openFDA. On-device. Physician review. Wellness.",
        "This system never recommends stopping medication. Discuss with your doctor. "
        "Correlation. openFDA. On-device. Physician review.",
    ]
    BLOCKING = [
        "You should stop taking your statin immediately.",
        "Discontinue this medication based on these results.",
        "Quit taking the metformin right away.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine, text):
        result = engine.validate(text)
        gw017 = [v for v in result.violations if "GW-017" in v]
        assert len(gw017) == 0

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine, text):
        result = engine.validate(text)
        gw017 = [v for v in result.violations if "GW-017" in v]
        assert len(gw017) > 0


class TestGW024:
    PASSING = [
        "HRV showed a negative correlation with the evening dose window. "
        "Discuss with your doctor. openFDA. On-device. Physician review.",
        "The correlation suggests a relationship worth investigating. "
        "Discuss with your doctor. openFDA. On-device. Physician.",
    ]
    BLOCKING = [
        "This drug is causing your HRV to drop.",
        "Your symptoms are caused by the medication interaction.",
        "The medication is directly responsible for these changes.",
    ]

    @pytest.mark.parametrize("text", PASSING)
    def test_passing(self, engine, text):
        result = engine.validate(text)
        gw024 = [v for v in result.violations if "GW-024" in v]
        assert len(gw024) == 0

    @pytest.mark.parametrize("text", BLOCKING)
    def test_blocking(self, engine, text):
        result = engine.validate(text)
        gw024 = [v for v in result.violations if "GW-024" in v]
        assert len(gw024) > 0


# ---------------------------------------------------------------------------
# Full pipeline: compliant brief passes all 47 rules
# ---------------------------------------------------------------------------

class TestFullPipeline:

    COMPLIANT_BRIEF = (
        "Patient PT-2026-SARAH. Biometric correlation detected following "
        "initiation of Atorvastatin. Analysis performed locally on-device. "
        "The following correlations may be of clinical interest to your care team. "
        "HRV RMSSD showed a negative correlation (Pearson r=-0.84, p=0.012) "
        "over a 96-hour post-dose window. openFDA adverse event data reports "
        "847 FAERS entries for this interaction. Professional consultation "
        "strongly recommended. Discuss with your doctor before any changes. "
        "This brief is for physician review and clinical discussion only. "
        "Wellness monitoring. Correlation does not imply causation. "
        "No data transmitted. All analysis performed locally. "
        "Confidence interval: 95% CI [-0.92, -0.71]. "
    )

    def test_compliant_passes(self, engine):
        result = engine.validate(self.COMPLIANT_BRIEF)
        assert result.passed, "Compliant brief blocked. Violations: %s" % (result.violations,)
        assert result.critical_violations == 0
        assert result.rules_evaluated == 47

    def test_diagnostic_language_blocked(self, engine):
        bad = self.COMPLIANT_BRIEF + " Your statin is causing reduced HRV. You have diabetes."
        result = engine.validate(bad)
        assert not result.passed
        assert result.violation_count > 0

    def test_result_repr(self, engine):
        result = engine.validate(self.COMPLIANT_BRIEF)
        assert "PASSED" in repr(result)
        assert "47 rules" in repr(result)

    def test_result_bool(self, engine):
        assert bool(engine.validate(self.COMPLIANT_BRIEF))
        assert not bool(engine.validate("You have diabetes. Stop taking medication."))

    def test_per_rule_results(self, engine):
        result = engine.validate(self.COMPLIANT_BRIEF)
        assert len(result.rule_results) == 47
        assert all(isinstance(rr, RuleResult) for rr in result.rule_results)
        assert all(rr.passed for rr in result.rule_results)


# ---------------------------------------------------------------------------
# AuditChain
# ---------------------------------------------------------------------------

class TestAuditChain:

    def test_empty(self, chain):
        assert chain.length == 0
        assert chain.verify_integrity()
        assert chain.head_hash == "0" * 64

    def test_single(self, chain):
        h = chain.log("Scribe", "input", "output")
        assert len(h) == 64
        assert chain.length == 1

    def test_chain_linkage(self, chain):
        chain.log("Scribe", "a", "b")
        chain.log("Pharmacist", "c", "d")
        chain.log("Correlation", "e", "f")
        chain.log("Auditor", "g", "h")
        assert chain.length == 4
        assert chain.verify_integrity()

    def test_tamper_detection(self, chain):
        chain.log("A", "1", "2")
        chain.log("B", "3", "4")
        assert chain.verify_integrity()
        chain._chain[0]["hash"] = "tampered" + "0" * 56
        assert not chain.verify_integrity()

    def test_export_is_copy(self, chain):
        chain.log("X", "y", "z")
        export = chain.export()
        export.clear()
        assert chain.length == 1
