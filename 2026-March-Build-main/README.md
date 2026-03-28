# BioGuardian: Autonomous Biological Firewall

**North Star:** Eliminate preventable adverse drug events by giving every patient an autonomous, private biological intelligence layer.

---

## 🚀 The Vision
BioGuardian closes the "prescribe and observe" loop. We are building the operating system for proactive personal health: a federated multi-agent system that knows your biology well enough to simulate intervention outcomes entirely on-device.

## 🛠️ Technical Architecture

### The Swarm (LangGraph + MCP)
BioGuardian utilizes a stateful multi-agent graph with conditional routing. Every action is governed by typed tool schemas and sandboxed processes.

1.  **The Scribe (OCR + RAG):** Normalizes PDF labs into LOINC-standard structured JSON.
2.  **The Pharmacist (openFDA):** Cross-references protocols against openFDA and PubMed for drug-drug and drug-genomic contraindications.
3.  **The Correlation Engine:** Performs time-series anomaly detection on HealthKit data, correlating biometrics (like HRV) to protocol events.
4.  **The Compliance Auditor (Deterministic Gate):** A rule-based terminal gate ensuring all outputs stay within the FDA General Wellness safe harbor.

### The Stack
*   **Orchestration:** LangGraph (Stateful Swarm)
*   **Privacy Layer:** Edge-compute focused (PII never leaves the device)
*   **Data Models:** Pydantic-enforced contracts (LabPanel, BiometricStream, ProtocolEvent)
*   **Frontend:** React-based High-Fidelity Dashboard with 3D Soma Visualizer
*   **Ingestion:** Node.js/gRPC telemetry sink

## 💎 Key Features
*   **Biological "Dry Run":** Simulate potential metabolic/biometric impact before the first dose.
*   **Autonomous Physician Briefs:** One-tap generation of SOAP-adjacent "Discussion Reports" for clinicians.
*   **Smart Anomaly Response:** Statistical confidence-backed detection of physiological shifts.
*   **Privacy-by-Architecture:** Zero-trust design where the user owns the intelligence layer.

## 🏁 Hackathon Status (Hour 18/24)
*   [x] LangGraph Swarm (Scribe, Pharmacist, Correlation, Auditor)
*   [x] Pydantic Data Contracts
*   [x] High-Fidelity 3D Dashboard
*   [x] Real-time gRPC Ingestion
*   [x] Clinical Summary / Physician Brief Generator

---
*Built for the 2026 Inter-Collegiate AI Hackathon.*
