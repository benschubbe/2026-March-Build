import React, { useState } from 'react';
import { Zap, Save, FolderOpen, PlusCircle } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  description: string;
  parameters: { [key: string]: any };
}

const ScenarioView: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 'scenario-sarah-ade',
      name: "Sarah's Statin ADE Trajectory",
      description: "Master plan §2: Atorvastatin 20mg + Metformin + Magnesium. 11-day trajectory where HRV degrades 22% post-dose, sleep efficiency falls 18%, fasting glucose creeps +8 mg/dL.",
      parameters: {
        patient_id: 'PT-2026-SARAH',
        substance: 'Atorvastatin',
        dose: '20mg',
        concurrent: ['Metformin 1000mg', 'Magnesium 400mg'],
        observation_window: '96h',
        expected_hrv_drop: '22%',
      },
    },
    {
      id: 'scenario-baseline',
      name: 'Healthy Baseline (Control)',
      description: 'Steady-state healthy ranges with no drug intervention. Used to establish baseline biometric patterns for correlation comparison.',
      parameters: {
        patient_id: 'PT-2026-CTRL',
        substance: 'None',
        initial_glucose: 95,
        duration: '72h',
      },
    },
    {
      id: 'scenario-compliance-block',
      name: 'Compliance Auditor Block Demo',
      description: 'Intentional output containing diagnostic language to demonstrate the Compliance Auditor catching and blocking a violation. This is a scripted demo beat.',
      parameters: {
        test_type: 'intentional_block',
        forbidden_output: 'Your statin is causing reduced HRV',
        expected_rule: 'GW-024/NO_DEFINITIVE_CAUSATION',
      },
    },
  ]);

  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [newScenarioParams, setNewScenarioParams] = useState('{ "initial_glucose": 95 }');

  const handleAddScenario = () => {
    if (newScenarioName.trim() === '') return;
    try {
      const params = JSON.parse(newScenarioParams);
      const newScenario: Scenario = {
        id: `scenario-${Date.now()}`,
        name: newScenarioName,
        description: newScenarioDesc,
        parameters: params,
      };
      setScenarios([...scenarios, newScenario]);
      setNewScenarioName('');
      setNewScenarioDesc('');
      setNewScenarioParams('{}');
    } catch (e) {
      alert('Invalid JSON for parameters.');
    }
  };

  const renderParameters = (params: { [key: string]: any }) => (
    <ul className="Scenario-Params">
      {Object.entries(params).map(([key, value]) => (
        <li key={key}><strong>{key}:</strong> {JSON.stringify(value)}</li>
      ))}
    </ul>
  );

  return (
    <div className="ScenarioView-Container">
      <h2 className="View-Title"><Zap size={24} /> Scenario Management</h2>

      <div className="Scenario-Creation-Panel Card">
        <h3>Create New Scenario</h3>
        <div className="Input-Group">
          <label>Scenario Name</label>
          <input 
            type="text" 
            value={newScenarioName} 
            onChange={(e) => setNewScenarioName(e.target.value)} 
            placeholder="e.g., Post-Surgery Recovery"
          />
        </div>
        <div className="Input-Group">
          <label>Description</label>
          <textarea 
            value={newScenarioDesc} 
            onChange={(e) => setNewScenarioDesc(e.target.value)} 
            placeholder="A brief description of the simulation scenario."
          />
        </div>
        <div className="Input-Group">
          <label>Parameters (JSON)</label>
          <textarea 
            value={newScenarioParams} 
            onChange={(e) => setNewScenarioParams(e.target.value)} 
            placeholder='{ "initial_glucose": 120, "intervention": { "drug": "Metformin" } }'
            rows={4}
          />
        </div>
        <button className="Action-Btn primary" onClick={handleAddScenario}><PlusCircle size={16} /> Add Scenario</button>
      </div>

      <div className="Scenario-List-Panel Card">
        <h3>Available Scenarios</h3>
        <div className="Scenario-List">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="Scenario-Card">
              <h4>{scenario.name}</h4>
              <p className="Scenario-Description">{scenario.description}</p>
              {renderParameters(scenario.parameters)}
              <div className="Scenario-Actions">
                <button className="Action-Btn secondary"><FolderOpen size={16} /> Load</button>
                <button className="Action-Btn secondary"><Save size={16} /> Save</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenarioView;
