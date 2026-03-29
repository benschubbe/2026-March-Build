#!/usr/bin/env python
"""
BioGuardian Demo — Full Pipeline Execution
============================================

Runs the complete four-agent pipeline for Sarah's statin ADE scenario
and prints the Physician Brief output.

Usage:
    python demo.py
    python demo.py --patient PT-2026-SARAH --drug Atorvastatin --dose 20mg
"""

from __future__ import annotations

import json
import sys
import os

# Ensure src/ is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from orchestration.pipeline import run_pipeline


def main():
    patient = "PT-2026-SARAH"
    drug = "Atorvastatin"
    dose = "20mg"

    # Parse simple CLI args
    args = sys.argv[1:]
    for i, arg in enumerate(args):
        if arg == "--patient" and i + 1 < len(args):
            patient = args[i + 1]
        elif arg == "--drug" and i + 1 < len(args):
            drug = args[i + 1]
        elif arg == "--dose" and i + 1 < len(args):
            dose = args[i + 1]

    print("=" * 70)
    print("BIOGUARDIAN — Autonomous Biological Firewall")
    print("Full Pipeline Demo: Sarah's Statin ADE Scenario")
    print("=" * 70)
    print()
    print("Patient:    %s" % patient)
    print("Substance:  %s %s" % (drug, dose))
    print()

    result = run_pipeline(patient, drug, dose)

    # Agent trace
    print("-" * 70)
    print("AGENT SWARM TRACE")
    print("-" * 70)
    for entry in result["report"]:
        print("[%s] %s" % (entry["agent"], entry["message"]))
    print()

    # Physician Brief
    brief = result["brief"]
    print("=" * 70)
    print("PHYSICIAN BRIEF")
    print("  ID:         %s" % brief["brief_id"])
    print("  Generated:  %s" % brief["generated_at"])
    print("  Compliance: %s" % brief["compliance_version"])
    print("  Audit Hash: %s" % brief["audit_hash"][:32] + "...")
    print("=" * 70)
    print()
    print("PATIENT SUMMARY")
    print("  %s" % brief["patient_summary"])
    print()

    print("LAB FLAGS (%d panels)" % len(brief["lab_flags"]))
    for lab in brief["lab_flags"]:
        flag = ""
        if lab["value"] < lab["reference_range"]["low"]:
            flag = " [LOW]"
        elif lab["value"] > lab["reference_range"]["high"]:
            flag = " [HIGH]"
        print("  %s (%s): %s %s  ref: %s-%s%s" % (
            lab["display_name"], lab["loinc_code"],
            lab["value"], lab["unit"],
            lab["reference_range"]["low"], lab["reference_range"]["high"],
            flag))
    print()

    print("DRUG FLAGS (%d interactions)" % len(brief["drug_flags"]))
    for flag in brief["drug_flags"]:
        print("  %s x %s — %s (%d FAERS reports, risk: %.0f%%)" % (
            flag["drug_pair"]["primary"], flag["drug_pair"]["interactant"],
            flag["severity"], flag["fda_report_count"],
            flag["personalized_risk_score"] * 100))
    print()

    print("ANOMALY SIGNALS (%d significant)" % len(brief["anomaly_signals"]))
    for sig in brief["anomaly_signals"]:
        print("  %s x %s: r=%.4f, p=%.6f, 95%% CI [%.2f, %.2f], %dh window — %s" % (
            sig["biometric"], sig["protocol_event"],
            sig["pearson_r"], sig["p_value"],
            sig["confidence_interval"]["lower"],
            sig["confidence_interval"]["upper"],
            sig["window_hours"], sig["severity"]))
    print()

    print("SOAP NOTE")
    for line in brief["soap_note"].split("\n"):
        print("  %s" % line)
    print()

    # Compliance
    c = result["compliance"]
    print("-" * 70)
    print("COMPLIANCE: %s | %s | %d rules | %d violations" % (
        "PASSED" if c["passed"] else "BLOCKED",
        c["auditor_version"], c["rules_evaluated"], c["violations"]))
    print("RESILIENCE: %.1f%%" % (result["resilience"] * 100))
    print("AUDIT CHAIN: %d entries" % len(result["audit_trail"]))
    print("-" * 70)

    # Also write the full JSON output
    output_path = os.path.join(os.path.dirname(__file__), "demo_output.json")
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, default=str)
    print()
    print("Full JSON output written to: %s" % output_path)


if __name__ == "__main__":
    main()
