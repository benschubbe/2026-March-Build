import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Table, Moon, Footprints } from 'lucide-react';

export interface BiometricReading {
  timestamp: string;
  type: string;
  value: number;
  unit: string;
  source: string;
}

interface CsvUploadProps {
  label: string;
  hint: string;
  onDataLoaded: (readings: BiometricReading[]) => void;
}

// ---------------------------------------------------------------------------
// Universal type mapper — handles HK identifiers, human-readable names,
// Garmin column headers, and fuzzy substring matching
// ---------------------------------------------------------------------------

const TYPE_MAP: [string, string, string, number][] = [
  // [keyword (lowercased substring), internal type, unit, scale]
  // Sleep — Garmin exports use (s) for seconds, (min) for minutes, (hours)/(h) for hours
  ['total sleep time (s)', 'SLEEP_DURATION', 'min', 1/60],   // seconds -> minutes
  ['sleep duration (s)', 'SLEEP_DURATION', 'min', 1/60],
  ['sleep duration (hours)', 'SLEEP_DURATION', 'min', 60],    // hours -> minutes
  ['sleep duration (h)', 'SLEEP_DURATION', 'min', 60],
  ['total sleep (hours)', 'SLEEP_DURATION', 'min', 60],
  ['sleep duration (min)', 'SLEEP_DURATION', 'min', 1],
  ['sleep duration', 'SLEEP_DURATION', 'min', 1],
  ['total sleep time', 'SLEEP_DURATION', 'min', 1],
  ['total sleep', 'SLEEP_DURATION', 'min', 1],
  ['sleep analysis', 'SLEEP_DURATION', 'min', 1],
  ['sleepanalysis', 'SLEEP_DURATION', 'min', 1],
  ['deep sleep time (s)', 'DEEP_SLEEP', 'min', 1/60],
  ['deep sleep (s)', 'DEEP_SLEEP', 'min', 1/60],
  ['deep sleep (hours)', 'DEEP_SLEEP', 'min', 60],
  ['deep sleep (min)', 'DEEP_SLEEP', 'min', 1],
  ['deep sleep time', 'DEEP_SLEEP', 'min', 1],
  ['deep sleep', 'DEEP_SLEEP', 'min', 1],
  ['light sleep time (s)', 'LIGHT_SLEEP', 'min', 1/60],
  ['light sleep (s)', 'LIGHT_SLEEP', 'min', 1/60],
  ['light sleep (hours)', 'LIGHT_SLEEP', 'min', 60],
  ['light sleep (min)', 'LIGHT_SLEEP', 'min', 1],
  ['light sleep time', 'LIGHT_SLEEP', 'min', 1],
  ['light sleep', 'LIGHT_SLEEP', 'min', 1],
  ['rem sleep time (s)', 'REM_SLEEP', 'min', 1/60],
  ['rem sleep (s)', 'REM_SLEEP', 'min', 1/60],
  ['rem sleep (hours)', 'REM_SLEEP', 'min', 60],
  ['rem sleep (min)', 'REM_SLEEP', 'min', 1],
  ['rem sleep time', 'REM_SLEEP', 'min', 1],
  ['rem sleep', 'REM_SLEEP', 'min', 1],
  ['awake sleep time (s)', 'AWAKE_TIME', 'min', 1/60],
  ['awake time (s)', 'AWAKE_TIME', 'min', 1/60],
  ['awake (hours)', 'AWAKE_TIME', 'min', 60],
  ['awake (min)', 'AWAKE_TIME', 'min', 1],
  ['awake duration', 'AWAKE_TIME', 'min', 1],
  ['awake time', 'AWAKE_TIME', 'min', 1],
  ['awake', 'AWAKE_TIME', 'min', 1],
  ['nap time (s)', 'NAP_TIME', 'min', 1/60],
  ['nap time', 'NAP_TIME', 'min', 1],
  ['unmeasurable sleep time (s)', 'UNMEASURED_SLEEP', 'min', 1/60],
  ['sleep score 1 day', 'SLEEP_SCORE', 'pts', 1],             // exact Garmin column name
  ['overall score qualifier', 'SLEEP_QUALITY', '', 1],
  ['sleep score', 'SLEEP_SCORE', 'pts', 1],
  ['sleep quality', 'SLEEP_SCORE', 'pts', 1],
  ['score qualifier', 'SLEEP_QUALITY', '', 1],
  // Heart
  ['heartratevariability', 'HRV_RMSSD', 'ms', 1],
  ['heart rate variability', 'HRV_RMSSD', 'ms', 1],
  ['hrv (ms)', 'HRV_RMSSD', 'ms', 1],
  ['hrv', 'HRV_RMSSD', 'ms', 1],
  ['restingheartrate', 'RESTING_HEART_RATE', 'bpm', 1],
  ['resting heart rate', 'RESTING_HEART_RATE', 'bpm', 1],
  ['resting hr', 'RESTING_HEART_RATE', 'bpm', 1],
  ['avg heart rate', 'AVG_HEART_RATE', 'bpm', 1],
  ['average heart rate', 'AVG_HEART_RATE', 'bpm', 1],
  ['heartrate', 'AVG_HEART_RATE', 'bpm', 1],
  ['heart rate (bpm)', 'AVG_HEART_RATE', 'bpm', 1],
  ['heart rate', 'AVG_HEART_RATE', 'bpm', 1],
  ['max heart rate', 'MAX_HEART_RATE', 'bpm', 1],
  // Activity
  ['stepcount', 'STEP_COUNT', 'steps', 1],
  ['step count', 'STEP_COUNT', 'steps', 1],
  ['daily steps', 'STEP_COUNT', 'steps', 1],
  ['total steps', 'STEP_COUNT', 'steps', 1],
  ['steps', 'STEP_COUNT', 'steps', 1],
  ['distancewalkingrunning', 'DISTANCE', 'km', 1],
  ['distancecycling', 'DISTANCE', 'km', 1],
  ['distance (km)', 'DISTANCE', 'km', 1],
  ['distance (mi)', 'DISTANCE', 'mi', 1],
  ['distance', 'DISTANCE', 'km', 1],
  ['activeenergyburned', 'ACTIVE_CALORIES', 'kcal', 1],
  ['activecalories', 'ACTIVE_CALORIES', 'kcal', 1],
  ['active calories', 'ACTIVE_CALORIES', 'kcal', 1],
  ['basalenergyburned', 'CALORIES_BURNED', 'kcal', 1],
  ['calories burned', 'CALORIES_BURNED', 'kcal', 1],
  ['total calories', 'CALORIES_BURNED', 'kcal', 1],
  ['calories', 'CALORIES_BURNED', 'kcal', 1],
  ['flightsclimbed', 'FLOORS_CLIMBED', 'floors', 1],
  ['floors climbed', 'FLOORS_CLIMBED', 'floors', 1],
  ['floors', 'FLOORS_CLIMBED', 'floors', 1],
  ['exercisetime', 'INTENSITY_MINUTES', 'min', 1],
  ['exercise time', 'INTENSITY_MINUTES', 'min', 1],
  ['intensity minutes', 'INTENSITY_MINUTES', 'min', 1],
  ['active minutes', 'INTENSITY_MINUTES', 'min', 1],
  ['vigorous intensity', 'VIGOROUS_INTENSITY', 'min', 1],
  ['moderate intensity', 'MODERATE_INTENSITY', 'min', 1],
  // Recovery / Stress
  ['stress level', 'STRESS_LEVEL', 'pts', 1],
  ['average stress', 'AVG_STRESS', 'pts', 1],
  ['stress', 'STRESS_LEVEL', 'pts', 1],
  ['body battery', 'BODY_BATTERY', 'pts', 1],
  ['respiratoryrate', 'RESPIRATION_RATE', 'brpm', 1],
  ['respiration rate', 'RESPIRATION_RATE', 'brpm', 1],
  ['respiration', 'RESPIRATION_RATE', 'brpm', 1],
  ['oxygensaturation', 'SPO2', '%', 1],
  ['blood oxygen', 'SPO2', '%', 1],
  ['spo2', 'SPO2', '%', 1],
  ['bloodglucose', 'BLOOD_GLUCOSE', 'mg/dL', 1],
  ['blood glucose', 'BLOOD_GLUCOSE', 'mg/dL', 1],
  ['glucose', 'BLOOD_GLUCOSE', 'mg/dL', 1],
  ['vo2max', 'VO2_MAX', 'mL/kg/min', 1],
  ['vo2 max', 'VO2_MAX', 'mL/kg/min', 1],
  ['bodymass', 'BODY_MASS', 'kg', 1],
  ['body mass', 'BODY_MASS', 'kg', 1],
  ['weight', 'BODY_MASS', 'kg', 1],
];

function matchType(text: string): [string, string, number] | null {
  const lower = text.toLowerCase().replace(/[_]/g, '').trim();
  for (let i = 0; i < TYPE_MAP.length; i++) {
    if (lower.includes(TYPE_MAP[i][0])) return [TYPE_MAP[i][1], TYPE_MAP[i][2], TYPE_MAP[i][3]];
  }
  return null;
}

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

function parseCSV(text: string): string[][] {
  return text.trim().split(/\r?\n/).map(line => {
    const cells: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

// ---------------------------------------------------------------------------
// Universal parser — works for Apple, Garmin, Fitbit, Oura, and generic CSV
// ---------------------------------------------------------------------------

function parseUniversal(rows: string[][], headers: string[]): { readings: BiometricReading[]; debug: string } {
  const lower = headers.map(h => h.toLowerCase().trim());

  // Find key column indices
  const typeIdx = lower.indexOf('type');
  const valIdx = lower.indexOf('value');
  const dateIdx = lower.findIndex(h =>
    (h.includes('start') && !h.includes('source')) || h === 'date' || h === 'day' || h.includes('creation')
  );
  const srcIdx = lower.findIndex(h => h === 'sourcename' || h === 'source name' || (h.includes('source') && h.includes('name')));

  const readings: BiometricReading[] = [];
  const unmatchedTypes = new Set<string>();

  // Mode 1: Row-per-reading (Apple Health style) — each row has a "type" and "value" column
  if (typeIdx >= 0 && valIdx >= 0) {
    for (const row of rows) {
      if (row.length <= Math.max(typeIdx, valIdx)) continue;
      const rawType = row[typeIdx] || '';
      if (!rawType) continue;
      const mapped = matchType(rawType);
      if (!mapped) { unmatchedTypes.add(rawType.substring(0, 50)); continue; }
      const value = parseFloat(row[valIdx]);
      if (isNaN(value)) continue;
      readings.push({
        timestamp: (dateIdx >= 0 ? row[dateIdx] : '') || new Date().toISOString(),
        type: mapped[0], value: value * mapped[2], unit: mapped[1],
        source: (srcIdx >= 0 ? row[srcIdx] : '') || 'Import',
      });
    }
    const debugLines = [];
    if (unmatchedTypes.size > 0) {
      const arr: string[] = [];
      unmatchedTypes.forEach(t => arr.push(t));
      debugLines.push('Skipped types: ' + arr.slice(0, 5).join(', ') + (arr.length > 5 ? '...' : ''));
    }
    return { readings, debug: debugLines.join('. ') };
  }

  // Mode 2: Column-per-metric (Garmin style) — headers are metric names, rows are days
  const mappedCols: number[] = [];
  const mappedInfo: [string, string, number][] = [];

  for (let i = 0; i < lower.length; i++) {
    const mapped = matchType(headers[i]);
    if (mapped) {
      mappedCols.push(i);
      mappedInfo.push(mapped);
    }
  }

  for (const row of rows) {
    const ts = dateIdx >= 0 && row[dateIdx] ? row[dateIdx] : new Date().toISOString();
    for (let m = 0; m < mappedCols.length; m++) {
      const raw = parseFloat(row[mappedCols[m]]);
      if (isNaN(raw)) continue;
      readings.push({
        timestamp: ts, type: mappedInfo[m][0],
        value: raw * mappedInfo[m][2], unit: mappedInfo[m][1], source: 'Import',
      });
    }
  }

  return { readings, debug: mappedCols.length === 0 ? 'No columns matched any known metric name.' : '' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CsvUpload: React.FC<CsvUploadProps> = ({ label, hint, onDataLoaded }) => {
  const [status, setStatus] = useState<'idle' | 'loaded' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [debug, setDebug] = useState('');
  const [preview, setPreview] = useState<BiometricReading[]>([]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length < 2) { setStatus('error'); setMessage('CSV has no data rows.'); return; }

        const headers = parsed[0];
        const rows = parsed.slice(1).filter(r => r.some(c => c.trim()));
        const { readings, debug: dbg } = parseUniversal(rows, headers);

        setDebug(dbg);

        if (readings.length === 0) {
          const sampleTypes: string[] = [];
          if (headers.indexOf('Type') >= 0 || headers.indexOf('type') >= 0) {
            const typeCol = headers.findIndex(h => h.toLowerCase() === 'type');
            for (let i = 0; i < Math.min(rows.length, 5); i++) {
              if (rows[i][typeCol]) sampleTypes.push(rows[i][typeCol].substring(0, 60));
            }
          }
          setStatus('error');
          setMessage(
            `No readings matched. Columns: ${headers.slice(0, 6).join(', ')}` +
            (sampleTypes.length > 0 ? `. Sample Type values: ${sampleTypes.join('; ')}` : '') +
            (dbg ? `. ${dbg}` : '')
          );
          return;
        }

        const typeArr = readings.map(r => r.type);
        const uniqueTypes = typeArr.filter((t, i) => typeArr.indexOf(t) === i);
        setPreview(readings.slice(0, 8));
        setStatus('loaded');
        setMessage(`${readings.length} readings | ${uniqueTypes.length} metrics: ${uniqueTypes.join(', ')}`);
        onDataLoaded(readings);
      } catch (err) {
        setStatus('error');
        setMessage('Parse error: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clear = () => { setStatus('idle'); setMessage(''); setDebug(''); setPreview([]); };

  return (
    <div className="Card CsvUpload-Card">
      <div className="Card-Header">
        <div className="Title-Group"><Upload size={18} /><h3>{label}</h3></div>
        {status === 'loaded' && <button className="Clear-Btn" onClick={clear} title="Clear"><X size={14} /></button>}
      </div>

      {status === 'idle' && (
        <div className="Upload-Zone" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
          <FileText size={28} className="Upload-Icon" />
          <p>Drop CSV here or click to browse</p>
          <p className="Upload-Hint">{hint}</p>
          <input type="file" accept=".csv,text/csv,.txt" onChange={handleInput} className="Upload-Input" />
        </div>
      )}

      {status === 'loaded' && (
        <div className="Upload-Result success">
          <div className="Result-Header"><CheckCircle2 size={16} className="success-text" /><span>{message}</span></div>
          {debug && <p style={{fontSize:11,color:'#8b949e',margin:'4px 0 0'}}>{debug}</p>}
          {preview.length > 0 && (
            <div className="Preview-Table">
              <table>
                <thead><tr><th>Metric</th><th>Value</th><th>Unit</th><th>Date</th></tr></thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i}><td>{r.type}</td><td>{r.value.toFixed(1)}</td><td>{r.unit}</td><td>{new Date(r.timestamp).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="Upload-Result error">
          <AlertTriangle size={16} className="danger-text" />
          <span>{message}</span>
          <button className="Action-Btn secondary" onClick={clear}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default CsvUpload;
