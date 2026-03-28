from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class LabPanel(BaseModel):
    loinc_code: str
    value: float
    unit: str
    reference_range: str
    date: str
    source_pdf_hash: str

class BiometricStream(BaseModel):
    metric_type: str
    value: float
    timestamp: datetime
    device_id: str

class ProtocolEvent(BaseModel):
    substance: str
    dose: str
    frequency: str
    start_date: str
    route: str

class AnomalySignal(BaseModel):
    metric: str
    delta_pct: float
    confidence: float
    correlated_event: Optional[str]
    window_hours: int

class PhysicianBrief(BaseModel):
    generated_at: datetime = Field(default_factory=datetime.now)
    signals: List[AnomalySignal]
    recommendations: List[str]
    compliance_gate_passed: bool
    clinical_summary: str

class AgentState(BaseModel):
    patient_id: str
    lab_panels: List[LabPanel] = []
    biometrics: List[BiometricStream] = []
    protocol: Optional[ProtocolEvent] = None
    signals: List[AnomalySignal] = []
    agent_logs: List[Dict[str, Any]] = []
    brief: Optional[PhysicianBrief] = None
    compliance_status: bool = False
