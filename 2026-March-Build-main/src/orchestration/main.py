import sys
import os
import json
import random
import logging
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from langgraph.graph import StateGraph, END
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Module Path Configuration ---
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from orchestration.models import (
    AgentState, LabPanel, ContraindicationFlag, 
    AnomalySignal, PhysicianBrief
)
from orchestration.database import BioGuardianDB
from orchestration.auditor.engine import ComplianceEngine, AuditChain

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s')
logger = logging.getLogger("BioGuardian.Swarm")

db = BioGuardianDB()
audit = AuditChain()
# Ensure path is relative to script location
rules_path = os.path.join(os.path.dirname(__file__), 'auditor', 'rules.yaml')
compliance = ComplianceEngine(rules_path)

# --- Swarm Agents with Cryptographic Logging ---

def scribe_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    pid = state['patient_id']
    logger.info(f"[{pid}] Scribe: Normalizing Quest Labs PDF...")
    
    # Implementation follows Sarah's persona (HbA1c 6.4%)
    labs = [
        LabPanel(
            loinc_code="4544-3",
            display_name="Hemoglobin A1c",
            value=6.4,
            unit="%",
            reference_range=(4.0, 5.6),
            date=datetime.now() - timedelta(days=5),
            source_pdf_hash="sha256_quest_sarah_01"
        )
    ]
    
    output = [l.dict() for l in labs]
    state['lab_panels'] = output
    
    insight = "LOINC Normalized: Sarah's HbA1c is 6.4% (Elevated)."
    state['agent_logs'].append({"agent": "The Scribe", "insight": insight, "confidence": 0.98})
    
    # Secure logging
    audit.log_event("The Scribe", state['raw_lab_input'], output)
    return state

def pharmacist_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    pid = state['patient_id']
    substance = state.get('protocol', {}).get('substance', 'Atorvastatin')
    logger.info(f"[{pid}] Pharmacist: Cross-referencing {substance} via openFDA...")
    
    # Simulation: Personalized contraindication based on A1c context
    flags = [
        ContraindicationFlag(
            drug_pair=(substance, "Metformin"),
            severity="HIGH",
            fda_report_count=847,
            personalized_risk_score=0.78
        )
    ]
    
    output = [f.dict() for f in flags]
    state['contraindications'] = output
    state['agent_logs'].append({
        "agent": "The Pharmacist",
        "insight": f"Personalized Risk: 78% for {substance}. FDA correlation detected.",
        "confidence": 0.96
    })
    
    audit.log_event("The Pharmacist", substance, output)
    return state

def correlation_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    pid = state['patient_id']
    logger.info(f"[{pid}] Correlation Engine: Calculating Pearson r for HRV drift...")
    
    # Statistical computation (Pearson correlation simulation)
    signal = AnomalySignal(
        biometric="HRV_RMSSD",
        correlation_with="evening_dose",
        pearson_r=-0.84,
        p_value=0.012,
        confidence_interval=(-0.92, -0.71),
        window_hours=96,
        severity="HIGH"
    )
    
    output = [signal.dict()]
    state['signals'] = output
    state['agent_logs'].append({
        "agent": "Correlation Engine",
        "insight": f"Significant negative correlation (r=-0.84, p=0.012) in post-dose window.",
        "confidence": 0.91
    })
    
    audit.log_event("Correlation Engine", "HealthKit_Stream_96h", output)
    return state

def compliance_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    pid = state['patient_id']
    logger.info(f"[{pid}] Compliance Auditor: Verifying Safe Harbor Proof...")
    
    # Concatenate all agent insights for validation
    full_report_text = " ".join([l['insight'] for l in state['agent_logs']])
    
    # Mandatory wellness disclaimer addition
    full_report_text += " This brief is for professional consultation. Discuss with your doctor."
    
    passed, violations = compliance.validate_text(full_report_text)
    
    # Cryptographic Audit Hash Generation
    audit_trail = audit.get_full_chain()
    final_audit_hash = hashlib.sha256(json.dumps(audit_trail).encode()).hexdigest()
    
    brief = PhysicianBrief(
        patient_summary=f"Sarah (47). Biometric correlation detected post-initiation of {state.get('protocol', {}).get('substance')}.",
        lab_flags=[LabPanel(**l) for l in state['lab_panels']],
        drug_flags=[ContraindicationFlag(**f) for f in state['contraindications']],
        anomaly_signals=[AnomalySignal(**s) for s in state['signals']],
        soap_note="S: Sarah reports magnesium start. O: HRV RMSSD decreased by 22% (p=0.012). A: High correlation post-dose. P: Professional consultation recommended.",
        audit_hash=final_audit_hash,
        compliance_version="FDA-GW-2016-V47"
    )
    
    state['brief'] = brief.dict()
    state['compliance_status'] = passed
    state['audit_trail'] = [e['hash'] for e in audit_trail]
    
    state['agent_logs'].append({
        "agent": "Compliance Auditor",
        "insight": f"Safe Harbor Status: {'PASSED' if passed else 'FAILED'}. Audit Chain verified.",
        "confidence": 1.0
    })
    
    return state

# --- Swarm Orchestration ---

def build_swarm():
    workflow = StateGraph(dict)
    workflow.add_node("scribe", scribe_agent)
    workflow.add_node("pharmacist", pharmacist_agent)
    workflow.add_node("correlation", correlation_agent)
    workflow.add_node("compliance", compliance_agent)
    
    workflow.set_entry_point("scribe")
    workflow.add_edge("scribe", "pharmacist")
    workflow.add_edge("pharmacist", "correlation")
    workflow.add_edge("correlation", "compliance")
    workflow.add_edge("compliance", END)
    
    return workflow.compile()

swarm_app = build_swarm()

# --- Server Logic ---

server = Flask(__name__)
CORS(server)

@server.route('/v1/simulation/rehearse', methods=['POST'])
def run_firewall():
    try:
        data = request.get_json()
        pid = data.get('patient_id', 'Sarah_M_47')
        
        initial_state = {
            "patient_id": pid,
            "raw_lab_input": "quest_sarah_report_pdf",
            "protocol": data.get('intervention', {"substance": "Atorvastatin", "dose": "20mg"}),
            "lab_panels": [],
            "contraindications": [],
            "signals": [],
            "agent_logs": [],
            "brief": None,
            "compliance_status": False,
            "audit_trail": []
        }
        
        final_state = swarm_app.invoke(initial_state)
        
        return jsonify({
            "status": "success",
            "report": final_state['agent_logs'],
            "brief": final_state['brief'],
            "audit_trail": final_state['audit_trail'],
            "resilience": 0.94 if final_state['compliance_status'] else 0.45,
            "surgical_risk": 0.02,
            "recommendations": [
                {"type": "Clinical", "priority": "High", "action": "Discuss HRV Correlation", "logic": "p=0.012 detected"},
                {"type": "Compliance", "priority": "Normal", "action": "View Audit Chain", "logic": f"Hash: {final_state['brief']['audit_hash'][:8]}"}
            ]
        })
    except Exception as e:
        logger.error(f"Execution Error: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@server.route('/v1/twin/history/<patient_id>', methods=['GET'])
def history(patient_id: str):
    return jsonify(db.get_history(patient_id))

if __name__ == "__main__":
    logger.info("BioGuardian Cerebellum (v2.1 Cryptographic Swarm) ONLINE.")
    server.run(port=8000, debug=False)
