# BioGuardian: Autonomous Biological Firewall

**Clinical Intelligence Infrastructure** | Built by Yconic | 2026 Inter-Collegiate AI Hackathon

**North Star:** Close the 4.3-day median ADE detection gap to same-day for chronically medicated patients.

---

## What's Built and Working

### The Four-Agent Swarm (LangGraph)

| Agent | Implementation | What It Does | Status |
|-------|---------------|-------------|--------|
| **The Scribe** | `lab_parser.py` + `vector_store.py` | Parses lab text into LOINC-coded JSON via 20-entry reference table and embedded vector store | Functional |
| **The Pharmacist** | `openfda_client.py` | Live HTTP queries to `api.fda.gov/drug/event.json` with cached fallback | Functional |
| **The Correlation Engine** | `correlation_engine.py` | Real NumPy Pearson r, Fisher z-transform 95% CI, p-value suppression | Functional |
| **The Compliance Auditor** | `auditor/engine.py` + `rules.yaml` | 47 deterministic predicate rules (FDA GW 2016), non-LLM | Functional |

### Orchestration and Infrastructure

| Component | Implementation | Status |
|-----------|---------------|--------|
| **LangGraph Swarm** | `main.py` — stateful directed graph: scribe -> pharmacist -> correlation -> compliance -> END | Functional |
| **MCP Tool Schemas** | `mcp_server.py` — typed JSON Schema input/output contracts for all 4 agents | Functional |
| **Embedded Vector Store** | `vector_store.py` — NumPy cosine similarity, 20 LOINC reference embeddings | Functional |
| **Pydantic Schemas** | `models.py` — frozen v2 models with validators (LOINC format, p < 0.05, window >= 72h) | Functional |
| **Audit Chain** | `auditor/engine.py:AuditChain` — SHA-256 linked, integrity-verifiable | Functional |
| **SQLite Persistence** | `database.py` — WAL mode, parameterised queries, telemetry + simulation tables | Functional |
| **openFDA Client** | `openfda_client.py` — live FAERS queries with severity classification | Functional |
| **gRPC Telemetry** | `server.js` — streaming gateway with FHIR R4/LOINC normalization | Functional |
| **Mock Producer** | `mock_producer.js` — Sarah's 11-day ADE trajectory with Box-Muller noise | Functional |
| **React Dashboard** | `App.tsx` + 7 components — 3D Twin, Physician Brief, audit trail | Functional |
| **Metabolic Simulation** | `metabolic_engine.py` — Bergman minimal model with statin PD | Functional |

### Privacy Architecture

All processing runs locally. No central server. No PHI transmitted externally.
- Orchestration targets `localhost:8000` only
- SHA-256 audit chain logs every agent action on-device
- Agents communicate via typed MCP tool calls with no shared memory

### Compliance

47 deterministic predicate rules (non-LLM) in 8 categories:
- Diagnostic claims (8 rules) | Treatment claims (8) | Prescription modification (6)
- Wellness framing (8) | Professional consultation (5) | Data integrity (6)
- Privacy constraints (2) | Scope constraints (4)

Every output PASS carries the auditor version hash. Every BLOCK carries the specific rule code.

## Running the Demo

```bash
# Run the full pipeline — produces a complete Physician Brief
python demo.py

# Run with custom inputs
python demo.py --patient PT-CUSTOM --drug Simvastatin --dose 40mg
```

Output: SOAP-structured Physician Brief with lab panels, drug flags, Pearson correlation signals, compliance validation, and sealed audit chain. Full JSON written to `demo_output.json`.

## Testing

```bash
# 115 tests across 4 test suites — all passing
python -m pytest src/orchestration/tests/ -v

# Individual suites
python -m pytest src/orchestration/tests/test_pipeline.py -v      # 10 tests — end-to-end pipeline
python -m pytest src/orchestration/tests/test_auditor.py -v        # 74 tests — compliance rules
python -m pytest src/orchestration/tests/test_correlation.py -v    # 17 tests — Pearson statistics
python -m pytest src/orchestration/tests/test_vector_store.py -v   # 14 tests — vector store + MCP
```

## Stack

| Layer | Technology | Implementation |
|-------|-----------|---------------|
| Orchestration | LangGraph | Stateful directed graph with typed state |
| Agent Contracts | MCP-compatible JSON Schema | Typed input/output per agent |
| Vector Store | NumPy embedded store | Cosine similarity, 20 LOINC embeddings |
| Statistics | NumPy | Pearson r, Fisher z-transform, t-distribution |
| Drug Data | openFDA API | Live FAERS queries + cached fallback |
| Compliance | Predicate logic (YAML) | 47 FDA GW rules, deterministic, non-LLM |
| Persistence | SQLite (WAL) | Telemetry + simulation history |
| Telemetry | Node.js + gRPC | FHIR R4 normalization, LOINC coding |
| Frontend | React + TypeScript + Three.js | 3D visualization, SOAP brief renderer |
| Simulation | Python + NumPy | Bergman minimal model, statin PD |

## Roadmap (Post-Hackathon)

- On-device inference migration (agent architecture already backend-agnostic via MCP)
- Native mobile shell with HealthKit integration (mock_producer.js substitutes for demo)
- Direct PDF OCR ingestion (lab_parser.py handles text; PDF parsing is next milestone)
- FHIR R4 direct-pull from EHR systems
- Cloud sync, telehealth booking, Android support

---

*Built for the 2026 Inter-Collegiate AI Hackathon by Yconic.*
