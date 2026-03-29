# BioGuardian: Execution Roadmap

## Hackathon Build (24 Hours)

### Milestone Schedule

| Hours | Phase | Deliverables |
|-------|-------|-------------|
| 0-2 | Schema Lock | Pydantic schemas merged, LLM latency confirmed, scope signed, fallbacks committed |
| 2-10 | Parallel Build | Scribe + Pharmacist (AI Lead), Correlation Engine (Data Scientist), Auditor YAML (Reg. Lead), React shell (Full-Stack) |
| 10-18 | Integration | LangGraph wires all 4 agents, Compliance Auditor gates every output, React connects to live agents |
| 18-22 | Hardening | Happy path 5x, fallbacks verified, demo device locked, intentional block rehearsed |
| 22-24 | Pitch | 3-min presentation rehearsed, fallback video recorded, closing sentence memorized |

### Scope Contract (Signed Before Build)

**IN SCOPE:**
- The Scribe: PDF -> LOINC-normalised JSON (OCR + RAG)
- The Pharmacist: drug names + lab JSON -> openFDA contraindication flags
- The Correlation Engine: HealthKit CSV -> AnomalySignal with Pearson r, p-value, CI
- The Compliance Auditor: 47 deterministic predicate rules (YAML config)
- LangGraph orchestration: stateful directed graph, 4 agents
- MCP server: typed tool schemas, sandboxed on-device
- React dashboard: upload, drug input, status feed, Physician Brief output
- gRPC telemetry gateway: FHIR R4 normalization, audit chain
- Physician Brief PDF: SOAP-formatted with audit hash footer
- SHA-256 audit chain: local, on-device, cryptographically verifiable

**OUT OF SCOPE (roadmap only):**
- Family Risk Guard
- Cloud sync / encrypted cloud backup
- Telehealth pre-booking integration
- FHIR R4 direct-pull (Epic/Cerner)
- Android / HealthConnect
- Agent plugin marketplace
- Multi-user accounts

---

## Post-Hackathon Scalability (Three Layers)

### Layer 2 — Post-MVP (Months 3-9)
- Encrypted cloud sync (AES-256 client-side, server stores ciphertext only)
- Agent plugin marketplace via MCP interface contracts
- Android + HealthConnect using BiometricStream schema
- FHIR R4 direct-pull: Scribe accuracy 94% -> 99.8%
- Telehealth pre-booking via Teladoc API
- Lab panel ordering via Quest Diagnostics API

### Layer 3 — Platform (Year 1+)
- BioGuardian API: white-label Physician Brief engine
- Federated learning: opt-in anonymised gradient contributions
- International expansion (EMA, Health Canada)
- CGM integration (Dexcom, Abbott Libre)
- 23andMe/Ancestry SNP data via Genomics Agent MCP plugin

---

## Commit Strategy

- Commits every 30-60 minutes per engineer during build
- Scope-prefixed messages: `[scribe]`, `[pharmacist]`, `[correlation]`, `[auditor]`, `[mobile]`, `[integration]`
- Co-author attribution on AI-assisted commits
- Fallback assets committed at Hour 0 before build clock starts
