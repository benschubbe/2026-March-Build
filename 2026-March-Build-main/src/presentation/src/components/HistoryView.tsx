import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History as HistoryIcon, Activity, FlaskConical } from 'lucide-react';
import moment from 'moment';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface TelemetryEntry {
  time: string;
  type: string;
  value: number;
  source?: string;
}

interface SimulationReportEntry {
  agent: string;
  insight: string;
  confidence: number;
}

interface SimulationEntry {
  time: string;
  scenario: string;
  report: SimulationReportEntry[];
}

interface HistoryData {
  telemetry: TelemetryEntry[];
  simulations: SimulationEntry[];
}

interface HistoryViewProps {
  patientId: string;
}

const HistoryView: React.FC<HistoryViewProps> = ({ patientId }) => {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/twin/history/${patientId}`);
        setHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setError("Failed to load history data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

  if (isLoading) return <div className="LoadingState">Loading history...</div>;
  if (error) return <div className="ErrorState">Error: {error}</div>;
  if (!history || (history.telemetry.length === 0 && history.simulations.length === 0)) {
    return <div className="EmptyState">No historical data available for {patientId}.</div>;
  }

  const renderTelemetryEntry = (entry: TelemetryEntry, index: number) => (
    <div key={`telemetry-${index}`} className="History-Entry telemetry-entry">
      <div className="Entry-Icon"><Activity size={18} /></div>
      <div className="Entry-Content">
        <span className="Entry-Timestamp">{moment(entry.time).format('MMM D, YYYY HH:mm:ss')}</span>
        <p><strong>{entry.type}:</strong> {entry.value.toFixed(2)} {entry.type === 'Glucose' ? 'mg/dL' : ''} <span className="Entry-Source">({entry.source || 'N/A'})</span></p>
      </div>
    </div>
  );

  const renderSimulationEntry = (entry: SimulationEntry, index: number) => (
    <div key={`simulation-${index}`} className="History-Entry simulation-entry">
      <div className="Entry-Icon"><FlaskConical size={18} /></div>
      <div className="Entry-Content">
        <span className="Entry-Timestamp">{moment(entry.time).format('MMM D, YYYY HH:mm:ss')}</span>
        <p><strong>Scenario:</strong> {entry.scenario}</p>
        <div className="Simulation-Report-Summary">
          {entry.report.map((item, i) => (
            <p key={`report-item-${i}`} className="Report-Item">
              <span className="Agent-Badge">{item.agent}</span>: {item.insight}
            </p>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="HistoryView-Container">
      <h2 className="View-Title"><HistoryIcon size={24} /> Simulation History for {patientId}</h2>
      
      <div className="History-Timeline">
        {history.telemetry.length > 0 && (
          <div className="Timeline-Section">
            <h3>Real-time Telemetry</h3>
            {history.telemetry.map(renderTelemetryEntry)}
          </div>
        )}

        {history.simulations.length > 0 && (
          <div className="Timeline-Section">
            <h3>Simulation Rehearsals</h3>
            {history.simulations.map(renderSimulationEntry)}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
