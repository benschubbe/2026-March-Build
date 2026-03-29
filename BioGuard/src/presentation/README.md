# BioGuardian Presentation Layer

React + TypeScript dashboard for the BioGuardian clinical intelligence system.

## Components

| Component | Purpose |
|-----------|---------|
| `App.tsx` | Main layout, WebSocket connection, swarm execution trigger |
| `TwinModel.tsx` | React Three Fiber 3D neural soma (glucose-responsive colour) |
| `MetabolicChart.tsx` | Recharts area chart for biometric drift visualization |
| `PhysicianBriefView.tsx` | SOAP-structured Physician Brief with lab/drug/anomaly panels |
| `AuditTrailView.tsx` | SHA-256 audit chain visualization with integrity badge |
| `HistoryView.tsx` | Patient telemetry + simulation history timeline |
| `ScenarioView.tsx` | Pre-defined scenarios (Sarah's ADE, compliance block demo) |
| `SettingsView.tsx` | System config: privacy mode, compliance engine, inference engine |

## Running

```bash
npm install --legacy-peer-deps
npm start
```

Requires the orchestration layer running on `localhost:8000` and the ingestion layer WebSocket on `localhost:50052`.

## Stack

- React 19 + TypeScript 6
- Three.js via @react-three/fiber (3D visualization)
- Recharts (biometric charts)
- Socket.io-client (real-time telemetry)
- Axios (orchestration API)
- Lucide React (icons)
