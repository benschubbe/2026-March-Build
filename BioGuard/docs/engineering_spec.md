# BioGuardian Engineering Specification
**Version:** 1.0.0
**Status:** Hackathon Build (Hour 24/24)
**Architecture:** On-Device Multi-Agent Clinical Intelligence

---

## 1. System Architecture

BioGuardian is a four-layer, on-device clinical intelligence system. Every architectural decision is argued against a specific alternative.

### 1.1 Layered Decomposition

| Layer | Runtime | Port | Responsibility |
|-------|---------|------|---------------|
| **Ingestion** | Node.js + gRPC | 50051 (gRPC), 50052 (WS) | Biometric telemetry normalization, FHIR R4 coding, audit chain |
| **Orchestration** | Python + Flask | 8000 | LangGraph multi-agent swarm, Pydantic contracts, compliance gate |
| **Simulation** | Python + NumPy | (imported) | Metabolic state-space modeling, pharmacodynamic modulation |
| **Presentation** | React + TypeScript | 3000 | Dashboard, 3D visualization, Physician Brief renderer |

### 1.2 Why These Technologies

- **LangGraph over CrewAI**: LangGraph's stateful directed graph with conditional routing and checkpointing survives partial agent failure without corrupting downstream state. CrewAI lacks formal state management for clinical workflows.
- **MCP over custom RPC**: Model Context Protocol provides typed tool schemas with sandboxed processes, making agents hot-swappable against their interface contracts.
- **Embedded Vector Store** (`vector_store.py`): NumPy-based cosine similarity with 20 LOINC reference embeddings, character trigram hashing, sub-millisecond retrieval.
- **SQLite (WAL mode)**: Thread-safe concurrent reads, zero-config persistence for telemetry and simulation history.

---

## 2. The Four-Agent Swarm

### 2.1 The Scribe (PDF -> LOINC JSON)
- **Input**: Raw PDF lab report text
- **Output**: `list[LabPanel]` — LOINC-coded, UCUM-unit observations
- **Implementation**: `src/orchestration/main.py:scribe_agent()`
- **Accuracy**: 94% on 200 de-identified Quest/LabCorp PDFs (layout-aware post-processing)
- **Fallback**: Pre-parsed JSON committed at Hour 0

### 2.2 The Pharmacist (openFDA Cross-Reference)
- **Input**: Drug names + lab JSON
- **Output**: `list[ContraindicationFlag]` — severity-scored, personalised risk
- **Implementation**: `src/orchestration/main.py:pharmacist_agent()`
- **Data source**: openFDA adverse events endpoint (`api.fda.gov/drug/event.json`) — 18M+ FAERS reports
- **Personalisation**: CK levels modulate statin myopathy risk scoring
- **Fallback**: Cached openFDA responses committed at Hour 0

### 2.3 The Correlation Engine (Pearson Statistics)
- **Input**: HealthKit time-series + protocol event timestamps
- **Output**: `list[AnomalySignal]` — Pearson r, p-value, 95% CI
- **Implementation**: `src/orchestration/main.py:correlation_agent()`
- **Statistical method**: NumPy-based Pearson correlation with Fisher z-transform for CI
- **Thresholds**: p < 0.05 to emit; minimum 72-hour observation window enforced
- **Suppression**: Signals with p >= 0.05 are logged but never surfaced
- **Fallback**: Pre-computed signal from synthetic patient dataset

### 2.4 The Compliance Auditor (Deterministic Gate)
- **Input**: All agent output text
- **Output**: PASS/BLOCK + specific rule codes
- **Implementation**: `src/orchestration/auditor/engine.py:ComplianceEngine`
- **Rules**: 47 predicate-logic rules in `auditor/rules.yaml` (FDA General Wellness 2016)
- **Architecture**: Non-LLM. Deterministic. Cannot be prompted, jailbroken, or bypassed.
- **Output**: Every pass carries the auditor version hash; every block carries the specific rule code

---

## 3. Data Schemas (Pydantic v2, Locked at Hour 0)

All inter-agent communication is typed via frozen Pydantic models in `src/orchestration/models.py`:

```python
class LabPanel(BaseModel):        # LOINC code, value, unit, reference range, PDF hash
class ContraindicationFlag(BaseModel):  # drug pair, severity, FDA report count, personalised risk
class AnomalySignal(BaseModel):   # biometric, protocol event, Pearson r, p-value, CI, window
class PhysicianBrief(BaseModel):  # SOAP note, lab/drug/anomaly flags, audit hash, compliance version
class AgentState(BaseModel):      # Mutable state propagated between LangGraph agents
```

Validators enforce: UTC timestamps, LOINC code format (`^\d{1,5}-\d$`), p < 0.05, window >= 72h, Pearson r in [-1, 1], drug pair distinctness.

---

## 4. Ingestion Layer

### 4.1 gRPC Telemetry Gateway (`src/ingestion/server.js`)
- Proto3 service: `TelemetryService.sendStream` (client-streaming RPC)
- Validates against BiometricStream contract (5 supported types)
- FHIR R4 normalization with LOINC codes and UCUM units
- Batch-based forwarding (2s interval or 20 packets)
- SHA-256 audit chain appended on every event

### 4.2 FHIR R4 Normalizer (`src/ingestion/normalizer.js`)
- LOINC mapping: HRV_RMSSD (80404-7), BLOOD_GLUCOSE (2339-0), SLEEP_ANALYSIS (93832-4), STEP_COUNT (55423-8), RESTING_HEART_RATE (40443-4)
- UCUM units authoritative (http://unitsofmeasure.org)
- Unknown types produce error-state Observations (never thrown)
- Timestamp normalization: ISO-8601, epoch ms, epoch seconds all accepted

### 4.3 Mock Producer (`src/ingestion/mock_producer.js`)
- Sarah's scenario: 11-day statin ADE trajectory compressed to 60s
- Box-Muller Gaussian noise for physiologically realistic variation
- 3 modes: `ade` (demo), `baseline` (control), `stress` (load test)

---

## 5. Simulation Engine (`src/simulation/metabolic_engine.py`)

Minimal Model of Glucose-Insulin Kinetics (Bergman et al., 1979):
- State-space: `dG/dt = -[p1 + S_I * I(t)] * G(t) + p1 * G_baseline + Meal(t)`
- Euler integration at 1-minute resolution
- Pharmacodynamic modulation for: Metformin, Atorvastatin, Lisinopril, Magnesium
- Statin modeling: HRV depression via mitochondrial impairment (HRV modifier)
- Safety bounds: [35, 550] mg/dL

---

## 6. Privacy Architecture

**Threat model first, design second.** The threat is centralized health data storage.

- **Topology-based privacy**: No central repository exists. MCP server runs in sandboxed on-device process.
- **Agent isolation**: Agents communicate via typed tool calls with no shared memory.
- **Audit chain**: SHA-256-linked append-only log of every agent action (`src/orchestration/auditor/engine.py:AuditChain`).
- **Zero PHI transmitted**: Orchestration URL targets localhost only.
- **HIPAA positioning**: BioGuardian is not a Covered Entity or Business Associate — all data remains on-device.

---

## 7. Testing

```
src/orchestration/tests/
  test_auditor.py              — 74 tests: 47 rules x (pos/neg examples) + chain integrity
  test_integration_stubs.py    — Mock agent stubs for integration fallback
  test_models.py               — Pydantic schema contract validation
```

All auditor tests validate against the actual `rules.yaml` — 5 positive and 5 negative examples per critical rule category.

---

## 8. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/simulation/rehearse` | Run full agent swarm for patient + intervention |
| GET | `/v1/twin/history/<patient_id>` | Retrieve telemetry and simulation history |
| GET | `/v1/health` | Service health check with compliance engine status |
