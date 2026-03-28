import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows, Environment } from '@react-three/drei';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Settings, 
  Lock, 
  Cpu, 
  History,
  Play
} from 'lucide-react';
import TwinModel from './components/TwinModel';
import MetabolicChart from './components/MetabolicChart';
import './App.css';

// --- Environment Configuration ---
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:50052';

interface Recommendation { type: string; priority: string; action: string; logic: string; }
interface AgentInsight { agent: string; insight: string; confidence: number; }
interface PrivacyMetrics { he_protocol?: string; computation_proof?: string; data_encrypted?: boolean; noise_level?: string; }
interface LearningMetrics { efficacy_score?: number; last_cycle?: string; }

function App() {
  const [bioState, setBioState] = useState({ glucose: 100, source: 'Initializing...', patient_id: 'PT-2026-ALPHA' });
  const [chartData, setChartData] = useState<{time: string, value: number}[]>([]);
  const [resilience, setResilience] = useState(94.2);
  const [surgicalRisk, setSurgicalRisk] = useState(0.85);
  const [simResults, setSimResults] = useState<AgentInsight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { type: 'Safety', priority: 'High', action: 'Monitor Cortisol', logic: 'Simulated spike detected in stress-loop.' }
  ]);
  const [privacy, setPrivacy] = useState<PrivacyMetrics>({ data_encrypted: true, he_protocol: 'Microsoft SEAL v4.0' });
  const [learning, setLearning] = useState<LearningMetrics>({ efficacy_score: 0.982, last_cycle: new Date().toISOString() });
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedInterventionType, setSelectedInterventionType] = useState('medication');
  const [selectedDrug, setSelectedDrug] = useState('Metformin');
  const [dosage, setDosage] = useState(500);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(WS_URL);
    
    socketRef.current.on('telemetry-update', (data) => {
      setBioState({ glucose: data.value, source: data.source, patient_id: data.patient_id });
      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), value: data.value }];
        return newData.slice(-20); // Keep last 20 points
      });
    });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  const triggerRehearsal = async () => {
    setIsLoading(true);
    try {
      const payload: any = {
        patient_id: bioState.patient_id,
        markers: { glucose: bioState.glucose, carbohydrate_intake: 50 },
      };

      if (selectedInterventionType === 'medication') {
        payload.intervention = { drug: selectedDrug, dose: dosage };
      } else if (selectedInterventionType === 'surgery') {
        payload.intervention = { procedure: "Robotic Appendectomy (Simulated)" };
      }

      const response = await axios.post(`${API_BASE_URL}/v1/simulation/rehearse`, payload);
      
      setSimResults(response.data.report);
      setResilience(Number((response.data.resilience * 100).toFixed(1)));
      setSurgicalRisk(Number((response.data.surgical_risk * 100).toFixed(2)));
      setRecommendations(response.data.recommendations);
      setPrivacy(response.data.privacy_metrics);
      setLearning(response.data.learning_metrics);
    } catch (err) { 
      console.error("Rehearsal Error:", err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="App premium-theme">
      <nav className="Sidebar">
        <div className="Logo">
          <ShieldCheck size={32} color="#58a6ff" />
          <span>BioGuardian</span>
        </div>
        <div className="Nav-Items">
          <div className="Nav-Item active"><Activity size={20} /> Dashboard</div>
          <div className="Nav-Item"><History size={20} /> History</div>
          <div className="Nav-Item"><Zap size={20} /> Scenarios</div>
          <div className="Nav-Item"><Settings size={20} /> System</div>
        </div>
        <div className="Privacy-Indicator">
          <Lock size={14} />
          <span>E2E Encrypted</span>
        </div>
      </nav>

      <main className="Main-Content">
        <header className="Top-Bar">
          <div className="Header-Left">
            <h1>Patient Twin Overview</h1>
            <span className="Patient-Badge">{bioState.patient_id} • Metabolic Focus</span>
          </div>
          <div className="Header-Right">
            <button className={`Rehearse-Btn ${isLoading ? 'loading' : ''}`} onClick={triggerRehearsal}>
              {isLoading ? 'Processing...' : <><Play size={16} fill="currentColor"/> Run Rehearsal</>}
            </button>
          </div>
        </header>

        <section className="Dashboard-Grid">
          {/* 3D Visualizer Card */}
          <div className="Card Visualizer-Card">
            <div className="Card-Header">
              <div className="Title-Group">
                <Cpu size={18} />
                <h3>Neural Soma Visualizer</h3>
              </div>
              <span className="Live-Tag">LIVE STREAM</span>
            </div>
            <div className="Visualizer-Container">
              <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                <TwinModel glucose={bioState.glucose} resilience={resilience} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <OrbitControls enableZoom={false} />
                <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                <Environment preset="night" />
              </Canvas>
            </div>
          </div>

          {/* Stats Column */}
          <div className="Stats-Column">
            <div className="Card Stat-Card highlight-blue">
              <div className="Stat-Icon"><Activity size={24} /></div>
              <div className="Stat-Info">
                <label>Glucose Level</label>
                <div className="Value-Group">
                  <span className="Value">{bioState.glucose.toFixed(1)}</span>
                  <span className="Unit">mg/dL</span>
                </div>
              </div>
              <div className="Trend-Indicator neutral">STABLE</div>
            </div>

            <div className="Card Stat-Card highlight-green">
              <div className="Stat-Icon"><ShieldCheck size={24} /></div>
              <div className="Stat-Info">
                <label>System Resilience</label>
                <div className="Value-Group">
                  <span className="Value">{resilience}%</span>
                </div>
              </div>
              <div className="Trend-Indicator plus">+2.4%</div>
            </div>

            <div className="Card Stat-Card highlight-red">
              <div className="Stat-Icon"><AlertTriangle size={24} /></div>
              <div className="Stat-Info">
                <label>Surgical Risk</label>
                <div className="Value-Group">
                  <span className="Value">{surgicalRisk}%</span>
                </div>
              </div>
              <div className="Trend-Indicator neutral">NOMINAL</div>
            </div>
          </div>

          {/* Real-time Chart Card */}
          <div className="Card Chart-Card">
            <div className="Card-Header">
              <h3>Metabolic Trend (Real-time)</h3>
            </div>
            <MetabolicChart data={chartData} />
          </div>

          {/* Recommendations Card */}
          <div className="Card Recommendations-Card">
            <div className="Card-Header">
              <h3>Guardian Insights</h3>
            </div>
            <div className="Rec-List">
              {recommendations.map((rec, i) => (
                <div key={i} className={`Rec-Item ${rec.type.toLowerCase()}`}>
                  <div className="Rec-Meta">{rec.type} • {rec.priority}</div>
                  <div className="Rec-Body">{rec.action}</div>
                  <div className="Rec-Footer">{rec.logic}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Control Panel Card */}
          <div className="Card Controls-Card">
            <div className="Card-Header">
              <h3>Intervention Parameters</h3>
            </div>
            <div className="Control-Groups">
              <div className="Group">
                <label>Type</label>
                <select value={selectedInterventionType} onChange={(e) => setSelectedInterventionType(e.target.value)}>
                  <option value="medication">Medication</option>
                  <option value="surgery">Surgical Procedure</option>
                </select>
              </div>
              {selectedInterventionType === 'medication' && (
                <>
                  <div className="Group">
                    <label>Agent</label>
                    <select value={selectedDrug} onChange={(e) => setSelectedDrug(e.target.value)}>
                      <option value="Metformin">Metformin</option>
                      <option value="Lisinopril">Lisinopril</option>
                    </select>
                  </div>
                  <div className="Group">
                    <label>Dosage (mg)</label>
                    <input type="number" value={dosage} onChange={(e) => setDosage(Number(e.target.value))} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Multi-Agent Console */}
          <div className="Card Console-Card">
            <div className="Card-Header">
              <h3>Simulation Multi-Agent Report</h3>
            </div>
            <div className="Console-Output">
              {simResults.length > 0 ? simResults.map((result, i) => (
                <div key={i} className="Console-Log">
                  <span className="Agent-Name">[{result.agent}]</span>
                  <span className="Agent-Message">{result.insight}</span>
                </div>
              )) : (
                <div className="Empty-State">No simulation data. Run rehearsal to trigger agents.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
