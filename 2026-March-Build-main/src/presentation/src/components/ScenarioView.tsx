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
      id: 'scenario-1',
      name: 'Standard Metabolic Stress',
      description: 'Simulates a high-carb meal followed by moderate stress.',
      parameters: {
        initial_glucose: 100,
        carb_intake: 75,
        stress_level: 'moderate',
        duration: '4h',
      },
    },
    {
      id: 'scenario-2',
      name: 'Lisinopril Sensitivity Test',
      description: 'Assesses patient response to Lisinopril intervention.',
      parameters: {
        initial_glucose: 110,
        drug: 'Lisinopril',
        dose: 10,
        genomic_flag: 'ACEI-Sensitive',
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
