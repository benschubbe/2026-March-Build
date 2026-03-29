import React from 'react';
import { Settings as SettingsIcon, Database, Globe, Shield, Cpu } from 'lucide-react';

const SettingsView: React.FC = () => {
  return (
    <div className="SettingsView-Container">
      <h2 className="View-Title"><SettingsIcon size={24} /> System Configuration</h2>

      <div className="Settings-Grid">
        <div className="Card Settings-Card">
          <h3><Globe size={18} /> API & Connectivity</h3>
          <div className="Setting-Item">
            <label>Orchestration URL</label>
            <input type="text" value={process.env.REACT_APP_API_URL || 'http://localhost:8000'} disabled />
            <span className="Setting-Help">Base URL for the LangGraph orchestration layer.</span>
          </div>
          <div className="Setting-Item">
            <label>Telemetry Stream (WS)</label>
            <input type="text" value={process.env.REACT_APP_WS_URL || 'http://localhost:50052'} disabled />
            <span className="Setting-Help">WebSocket endpoint for real-time sensor data.</span>
          </div>
        </div>

        <div className="Card Settings-Card">
          <h3><Shield size={18} /> Privacy & Compliance</h3>
          <div className="Setting-Item">
            <label>Privacy Mode</label>
            <input type="text" value="Topology-Based (Zero PHI Transmitted)" disabled />
            <span className="Setting-Help">All inference runs on-device. No central repository exists.</span>
          </div>
          <div className="Setting-Item">
            <label>Compliance Engine</label>
            <input type="text" value="FDA-GW-2016-V47 (47 predicate rules)" disabled />
            <span className="Setting-Help">Deterministic, non-LLM compliance gate on every output path.</span>
          </div>
          <div className="Setting-Item">
            <label>Audit Chain</label>
            <input type="text" value="SHA-256 Linked (On-Device)" disabled />
            <span className="Setting-Help">Cryptographically verifiable reasoning trace.</span>
          </div>
        </div>

        <div className="Card Settings-Card">
          <h3><Database size={18} /> Local Storage</h3>
          <div className="Setting-Item">
            <label>Database Type</label>
            <input type="text" value="SQLite (Persistent)" disabled />
          </div>
          <button className="Action-Btn secondary">Clear Local Cache</button>
        </div>

        <div className="Card Settings-Card">
          <h3><Cpu size={18} /> Inference Engine</h3>
          <div className="Setting-Item">
            <label>Agent Pipeline</label>
            <input type="text" value="Flask + LangGraph (Server-Side)" disabled />
            <span className="Setting-Help">4-agent stateful directed graph with typed state propagation.</span>
          </div>
          <div className="Setting-Item">
            <label>Vector Store</label>
            <input type="text" value="NumPy Embedded (20 LOINC Refs)" disabled />
            <span className="Setting-Help">Cosine similarity retrieval. Zero server process. Sub-ms latency.</span>
          </div>
          <div className="Setting-Item">
            <label>Orchestration</label>
            <input type="text" value="LangGraph (Stateful Directed Graph)" disabled />
            <span className="Setting-Help">4-agent swarm with conditional routing and checkpointing.</span>
          </div>
        </div>
      </div>

      <div className="System-Status Card">
        <h3>Backend Service Heartbeat</h3>
        <div className="Heartbeat-Grid">
          <div className="Heartbeat-Item">
            <span className="Status-Indicator online"></span>
            <span className="Service-Name">Ingestion (Node.js)</span>
          </div>
          <div className="Heartbeat-Item">
            <span className="Status-Indicator online"></span>
            <span className="Service-Name">Orchestration (Python)</span>
          </div>
          <div className="Heartbeat-Item">
            <span className="Status-Indicator online"></span>
            <span className="Service-Name">Simulation (C++/CUDA)</span>
          </div>
          <div className="Heartbeat-Item">
            <span className="Status-Indicator online"></span>
            <span className="Service-Name">Privacy Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
