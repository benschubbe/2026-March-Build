"""
BioGuardian End-to-End Pipeline Test
======================================

Proves the full four-agent pipeline produces a valid PhysicianBrief
with real computed values from a single function call.

Run:
    python -m pytest src/orchestration/tests/test_pipeline.py -v
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from orchestration.pipeline import run_pipeline


class TestFullPipeline:

    def test_pipeline_returns_success(self):
        result = run_pipeline("PT-TEST", "Atorvastatin", "20mg")
        assert result["status"] == "success"

    def test_pipeline_produces_brief(self):
        result = run_pipeline()
        brief = result["brief"]
        assert brief is not None
        assert brief["brief_id"].startswith("BG-")
        assert len(brief["audit_hash"]) == 64
        assert brief["compliance_version"] == "FDA-GW-2016-V47"

    def test_brief_has_lab_panels(self):
        result = run_pipeline()
        labs = result["brief"]["lab_flags"]
        assert len(labs) >= 3
        loinc_codes = [p["loinc_code"] for p in labs]
        assert "4544-3" in loinc_codes  # HbA1c
        assert "2093-3" in loinc_codes  # Cholesterol
        assert "2157-6" in loinc_codes  # CK

    def test_brief_has_drug_flags(self):
        result = run_pipeline()
        flags = result["brief"]["drug_flags"]
        assert len(flags) >= 1
        assert flags[0]["drug_pair"]["primary"] == "Atorvastatin"
        assert flags[0]["fda_report_count"] > 0

    def test_brief_has_anomaly_signals(self):
        result = run_pipeline()
        signals = result["brief"]["anomaly_signals"]
        assert len(signals) >= 1
        sig = signals[0]
        assert sig["biometric"] == "HRV_RMSSD"
        assert sig["p_value"] < 0.05
        assert sig["window_hours"] >= 72

    def test_brief_has_soap_note(self):
        result = run_pipeline()
        soap = result["brief"]["soap_note"]
        assert "S:" in soap
        assert "O:" in soap
        assert "A:" in soap
        assert "P:" in soap

    def test_compliance_passes(self):
        result = run_pipeline()
        assert result["compliance"]["passed"] is True
        assert result["compliance"]["rules_evaluated"] == 47
        assert result["compliance"]["violations"] == 0

    def test_audit_chain_has_entries(self):
        result = run_pipeline()
        assert len(result["audit_trail"]) == 4  # one per agent
        assert all(len(h) == 64 for h in result["audit_trail"])

    def test_recommendations_generated(self):
        result = run_pipeline()
        assert len(result["recommendations"]) >= 1

    def test_custom_lab_text_input(self):
        text = "Hemoglobin A1c: 7.2 %\nTotal Cholesterol: 250 mg/dL\nCreatine Kinase: 220 U/L"
        result = run_pipeline("PT-CUSTOM", "Atorvastatin", "40mg", raw_lab_text=text)
        assert result["status"] == "success"
        labs = result["brief"]["lab_flags"]
        assert len(labs) >= 2
