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
          <h3><Shield size={18} /> Privacy & Security</h3>
          <div className="Setting-Item">
            <label>HE Protocol</label>
            <select disabled>
              <option>Microsoft SEAL (CKKS)</option>
              <option>OpenFHE</option>
            </select>
          </div>
          <div className="Setting-Item">
            <div className="Toggle-Group">
              <span>Enable Zero-Knowledge Proofs</span>
              <input type="checkbox" checked disabled />
            </div>
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
          <h3><Cpu size={18} /> Simulation Soma</h3>
          <div className="Setting-Item">
            <label>Compute Provider</label>
            <select disabled>
              <option>NVIDIA Holoscan (Local)</option>
              <option>Cloud CUDA Kernel</option>
            </select>
          </div>
          <div className="Setting-Item">
            <label>Precision</label>
            <select disabled>
              <option>Float32 (Standard)</option>
              <option>Float64 (Clinical)</option>
            </select>
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
