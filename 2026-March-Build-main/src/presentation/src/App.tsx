import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows, Environment } from '@react-three/drei';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Settings as SettingsIcon, 
  Lock, 
  Cpu, 
  History as HistoryIcon,
  Play,
  Shield
} from 'lucide-react';
import TwinModel from './components/TwinModel';
import MetabolicChart from './components/MetabolicChart';
import HistoryView from './components/HistoryView'; 
import ScenarioView from './components/ScenarioView'; 
import SettingsView from './components/SettingsView';
import PhysicianBriefView from './components/PhysicianBriefView';
import AuditTrailView from './components/AuditTrailView';
import './App.css';

// --- Environment Configuration ---
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:50052';

interface Recommendation { type: string; priority: string; action: string; logic: string; }
interface AgentInsight { agent: string; insight: string; confidence: number; }

type AppView = 'dashboard' | 'history' | 'scenarios' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [bioState, setBioState] = useState({ glucose: 100, source: 'Sarah_M_47 (Ready)', patient_id: 'SARAH-ALPHA-2025' });
  const [chartData, setChartData] = useState<{time: string, value: number}[]>([]);
  const [resilience, setResilience] = useState(94.2);
  const [simResults, setSimResults] = useState<AgentInsight[]>([]);
  const [brief, setBrief] = useState<any>(null);
  const [auditTrail, setAuditTrail] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { type: 'Status', priority: 'Low', action: 'Firewall Active', logic: 'Topology-based privacy: ON' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedDrug, setSelectedDrug] = useState('Atorvastatin');
  const [dosage, setDosage] = useState(20);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(WS_URL);
    
    socketRef.current.on('telemetry-update', (data) => {
      setBioState(prev => ({ ...prev, glucose: data.value }));
      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), value: data.value }];
        return newData.slice(-20); 
      });
    });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  const triggerRehearsal = async () => {
    setIsLoading(true);
    setSimResults([]);
    setBrief(null);
    setAuditTrail([]);
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/simulation/rehearse`, {
        patient_id: bioState.patient_id,
        intervention: { drug: selectedDrug, dose: dosage },
      });
      
      setSimResults(response.data.report);
      setBrief(response.data.brief);
      setAuditTrail(response.data.audit_trail);
      setResilience(Number((response.data.resilience * 100).toFixed(1)));
      setRecommendations(response.data.recommendations);
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
          <div className={`Nav-Item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}><Activity size={20} /> Sarah's Twin</div>
          <div className={`Nav-Item ${currentView === 'history' ? 'active' : ''}`} onClick={() => setCurrentView('history')}><HistoryIcon size={20} /> History</div>
          <div className={`Nav-Item ${currentView === 'scenarios' ? 'active' : ''}`} onClick={() => setCurrentView('scenarios')}><Zap size={20} /> Protocols</div>
          <div className={`Nav-Item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => setCurrentView('settings')}><SettingsIcon size={20} /> Privacy</div>
        </div>
        <div className="Privacy-Indicator">
          <Lock size={14} />
          <span>SARAH: LOCAL_ONLY</span>
        </div>
      </nav>

      <main className="Main-Content">
        <header className="Top-Bar">
          <div className="Header-Left">
            <h1>Autonomous Biological Firewall</h1>
            <span className="Patient-Badge">{bioState.source} • Multi-Step Reasoning active</span>
          </div>
          <div className="Header-Right">
            {currentView === 'dashboard' && (
              <button className={`Rehearse-Btn ${isLoading ? 'loading' : ''}`} onClick={triggerRehearsal} disabled={isLoading}>
                {isLoading ? 'The Swarm is Reasoning...' : <><Play size={16} fill="currentColor"/> Execute Swarm</>}
              </button>
            )}
          </div>
        </header>

        {currentView === 'dashboard' && (
          <section className="Dashboard-Grid">
            <div className="Card Visualizer-Card">
              <div className="Card-Header">
                <div className="Title-Group">
                  <Cpu size={18} />
                  <h3>Neural Soma Visualizer</h3>
                </div>
                <span className="Live-Tag">SYNCED</span>
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

            <div className="Stats-Column">
              <div className="Card Stat-Card highlight-blue">
                <div className="Stat-Icon"><Activity size={24} /></div>
                <div className="Stat-Info">
                  <label>Current Glucose</label>
                  <div className="Value-Group">
                    <span className="Value">{bioState.glucose.toFixed(1)}</span>
                    <span className="Unit">mg/dL</span>
                  </div>
                </div>
              </div>

              <div className="Card Stat-Card highlight-green">
                <div className="Stat-Icon"><ShieldCheck size={24} /></div>
                <div className="Stat-Info">
                  <label>Biological Integrity</label>
                  <div className="Value-Group">
                    <span className="Value">{resilience}%</span>
                  </div>
                </div>
              </div>

              <div className="Card Controls-Card">
                <div className="Card-Header">
                  <h3>Protocol Event Input</h3>
                </div>
                <div className="Control-Groups">
                  <div className="Group">
                    <label>Substance</label>
                    <select value={selectedDrug} onChange={(e) => setSelectedDrug(e.target.value)}>
                      <option value="Atorvastatin">Atorvastatin</option>
                      <option value="Metformin">Metformin</option>
                    </select>
                  </div>
                  <div className="Group">
                    <label>Dose (mg)</label>
                    <input type="number" value={dosage} onChange={(e) => setDosage(Number(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>

            <div className="Card Chart-Card">
              <div className="Card-Header">
                <h3>Biometric Drift (Pearson r Analysis)</h3>
              </div>
              <MetabolicChart data={chartData} />
            </div>

            <div className="Card Recommendations-Card">
              <div className="Card-Header">
                <h3>Firewall Status</h3>
              </div>
              <div className="Rec-List">
                {recommendations.map((rec, i) => (
                  <div key={i} className={`Rec-Item ${rec.type.toLowerCase()}`}>
                    <div className="Rec-Meta">{rec.type} • PRIORITY_{rec.priority.toUpperCase()}</div>
                    <div className="Rec-Body">{rec.action}</div>
                    <div className="Rec-Footer">{rec.logic}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="Card Console-Card">
              <div className="Card-Header">
                <h3>Agent Swarm Reasoning Trace</h3>
              </div>
              <div className="Console-Output">
                {simResults.length > 0 ? simResults.map((result, i) => (
                  <div key={i} className="Console-Log">
                    <span className="Agent-Name">[{result.agent}]</span>
                    <span className="Agent-Message">{result.insight}</span>
                  </div>
                )) : (
                  <div className="Empty-State">Standby. Awaiting protocol event execution.</div>
                )}
              </div>
            </div>

            {brief && (
              <div style={{ gridColumn: 'span 2' }}>
                <PhysicianBriefView brief={brief} />
              </div>
            )}
            
            {auditTrail.length > 0 && (
              <div style={{ gridColumn: 'span 1' }}>
                <AuditTrailView hashes={auditTrail} />
              </div>
            )}
          </section>
        )}

        {currentView === 'history' && <HistoryView patientId={bioState.patient_id} />}
        {currentView === 'scenarios' && <ScenarioView />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default App;
