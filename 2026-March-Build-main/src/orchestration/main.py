import sys
import os
import json
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from langgraph.graph import StateGraph, END
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Module Path Configuration ---
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from orchestration.models import (
    AgentState, LabPanel, BiometricStream, ProtocolEvent, 
    AnomalySignal, PhysicianBrief
)
from orchestration.database import BioGuardianDB

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(name)s] %(message)s')
logger = logging.getLogger("Cerebellum")

db = BioGuardianDB()

# --- Agent 1: The Scribe (OCR + RAG Simulation) ---
def scribe_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    pid = state['patient_id']
    logger.info(f"[{pid}] Scribe: Normalizing lab data to LOINC standards...")
    
    # Simulate PDF OCR -> LOINC JSON
    mock_lab = LabPanel(
        loinc_code="4544-3",
        value=115.0,
        unit="mg/dL",
        reference_range="70-99",
        date=datetime.now().isoformat(),
        source_pdf_hash="sha256_8f2e1a..."
    )
    
    state['lab_panels'] = [mock_lab]
    state['agent_logs'].append({
        "agent": "The Scribe",
        "insight": "Normalized 1 Blood Panel (HbA1c/Glucose) to LOINC:4544-3",
        "confidence": 0.99
    })
    return state

# --- Agent 2: The Pharmacist (openFDA + Contraindications) ---
def pharmacist_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    pid = state['patient_id']
    protocol = state.get('protocol')
    drug_name = protocol['substance'] if protocol else "Unknown"
    
    logger.info(f"[{pid}] Pharmacist: Checking openFDA for {drug_name} contraindications...")
    
    # Simulate openFDA logic
    warnings = []
    if "lisinopril" in drug_name.lower():
        warnings.append("Genomic sensitivity detected: ACE-inhibitor risk.")
    
    state['agent_logs'].append({
        "agent": "The Pharmacist",
        "insight": f"Screened {drug_name} via openFDA. Warnings: {len(warnings) or 'None'}",
        "confidence": 0.95
    })
    return state

# --- Agent 3: The Correlation Engine (Anomaly Detection) ---
def correlation_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    pid = state['patient_id']
    logger.info(f"[{pid}] Correlation Engine: Analyzing biometric time-series...")
    
    # Simulate HealthKit Correlation (e.g. HRV drop after dose)
    hrv_drop = AnomalySignal(
        metric="HRV",
        delta_pct=-22.0,
        confidence=0.88,
        correlated_event="6PM Dose",
        window_hours=4
    )
    
    state['signals'] = [hrv_drop]
    state['agent_logs'].append({
        "agent": "Correlation Engine",
        "insight": f"Detected {hrv_drop.delta_pct}% drop in {hrv_drop.metric} correlated to {hrv_drop.correlated_event}.",
        "confidence": 0.88
    })
    return state

# --- Agent 4: The Compliance Auditor (Deterministic Gate) ---
def compliance_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    pid = state['patient_id']
    logger.info(f"[{pid}] Compliance Auditor: Validating General Wellness Safe Harbor...")
    
    # Deterministic rule-based gate
    restricted_terms = ["diagnose", "cure", "treat", "prevent"]
    logs = str(state['agent_logs'])
    
    passed = not any(term in logs.lower() for term in restricted_terms)
    
    # Generate the Physician Brief (SOAP-adjacent)
    brief = PhysicianBrief(
        signals=state['signals'],
        recommendations=["Discuss HRV trend with physician", "Monitor glucose stability"],
        compliance_gate_passed=passed,
        clinical_summary=f"Patient {pid} exhibits correlated HRV volatility post-protocol event. Labs show elevated glucose (115mg/dL)."
    )
    
    state['brief'] = brief.dict()
    state['compliance_status'] = passed
    state['agent_logs'].append({
        "agent": "Compliance Auditor",
        "insight": f"Output validated. Safe Harbor Status: {'PASSED' if passed else 'FAILED'}",
        "confidence": 1.0
    })
    return state

# --- Graph Orchestration ---
workflow = StateGraph(dict) # Using dict for easier Flask integration

workflow.add_node("scribe", scribe_agent)
workflow.add_node("pharmacist", pharmacist_agent)
workflow.add_node("correlation", correlation_agent)
workflow.add_node("compliance", compliance_agent)

workflow.set_entry_point("scribe")
workflow.add_edge("scribe", "pharmacist")
workflow.add_edge("pharmacist", "correlation")
workflow.add_edge("correlation", "compliance")
workflow.add_edge("compliance", END)

app_swarm = workflow.compile()

# --- API Layer ---
server = Flask(__name__)
CORS(server)

@server.route('/v1/simulation/rehearse', methods=['POST'])
def run_firewall():
    try:
        data = request.get_json()
        pid = data.get('patient_id', 'PT-2026-ALPHA')
        
        # Build initial state
        initial_state = {
            "patient_id": pid,
            "lab_panels": [],
            "biometrics": [],
            "protocol": data.get('intervention', {
                "substance": "Lisinopril",
                "dose": "10mg",
                "frequency": "QD",
                "start_date": "2026-03-28",
                "route": "Oral"
            }),
            "signals": [],
            "agent_logs": [],
            "brief": None,
            "compliance_status": False
        }
        
        final_state = app_swarm.invoke(initial_state)
        
        return jsonify({
            "status": "success",
            "report": final_state['agent_logs'],
            "brief": final_state['brief'],
            "compliance": final_state['compliance_status'],
            # Map back to dashboard frontend expectations
            "resilience": 0.94 if final_state['compliance_status'] else 0.5,
            "surgical_risk": 0.02,
            "recommendations": [
                {"type": "Safety", "priority": "High", "action": r, "logic": "Correlation detection"} 
                for r in final_state['brief']['recommendations']
            ]
        })
    except Exception as e:
        logger.error(f"Firewall execution failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/v1/simulation/sync', methods=['POST'])
def sync():
    # Keep ingestion layer compatibility
    return jsonify({"status": "synced"}), 200

if __name__ == "__main__":
    logger.info("BioGuardian Swarm: Online.")
    server.run(port=8000)
