import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Table } from 'lucide-react';

export interface BiometricReading {
  timestamp: string;
  type: string;
  value: number;
  unit: string;
  source: string;
}

interface CsvUploadProps {
  onDataLoaded: (readings: BiometricReading[]) => void;
}

// ---------------------------------------------------------------------------
// Column-to-type mapping: covers every known Garmin, Apple, Fitbit, and
// Oura column name.  Keys are lowercased header strings; values are
// [internalType, unit, scaleFactor].  Scale factor converts the raw CSV
// value to our canonical unit (e.g. hours -> minutes).
// ---------------------------------------------------------------------------

const COLUMN_MAP: Record<string, [string, string, number]> = {
  // --- Sleep ---
  'sleep duration':              ['SLEEP_DURATION', 'min', 1],
  'sleep duration (min)':        ['SLEEP_DURATION', 'min', 1],
  'sleep duration (hours)':      ['SLEEP_DURATION', 'min', 60],
  'sleep duration (h)':          ['SLEEP_DURATION', 'min', 60],
  'total sleep':                 ['SLEEP_DURATION', 'min', 1],
  'total sleep (min)':           ['SLEEP_DURATION', 'min', 1],
  'total sleep (hours)':         ['SLEEP_DURATION', 'min', 60],
  'total sleep time':            ['SLEEP_DURATION', 'min', 1],
  'deep sleep':                  ['DEEP_SLEEP', 'min', 1],
  'deep sleep (min)':            ['DEEP_SLEEP', 'min', 1],
  'deep sleep (hours)':          ['DEEP_SLEEP', 'min', 60],
  'deep sleep time':             ['DEEP_SLEEP', 'min', 1],
  'light sleep':                 ['LIGHT_SLEEP', 'min', 1],
  'light sleep (min)':           ['LIGHT_SLEEP', 'min', 1],
  'light sleep (hours)':         ['LIGHT_SLEEP', 'min', 60],
  'light sleep time':            ['LIGHT_SLEEP', 'min', 1],
  'rem sleep':                   ['REM_SLEEP', 'min', 1],
  'rem sleep (min)':             ['REM_SLEEP', 'min', 1],
  'rem sleep (hours)':           ['REM_SLEEP', 'min', 60],
  'rem sleep time':              ['REM_SLEEP', 'min', 1],
  'awake':                       ['AWAKE_TIME', 'min', 1],
  'awake (min)':                 ['AWAKE_TIME', 'min', 1],
  'awake (hours)':               ['AWAKE_TIME', 'min', 60],
  'awake time':                  ['AWAKE_TIME', 'min', 1],
  'awake duration':              ['AWAKE_TIME', 'min', 1],
  'sleep score':                 ['SLEEP_SCORE', 'pts', 1],
  'overall sleep score':         ['SLEEP_SCORE', 'pts', 1],
  'sleep quality':               ['SLEEP_SCORE', 'pts', 1],

  // --- Heart / HRV ---
  'hrv':                         ['HRV_RMSSD', 'ms', 1],
  'hrv (ms)':                    ['HRV_RMSSD', 'ms', 1],
  'hrv status':                  ['HRV_STATUS', '', 1],
  'heart rate':                  ['RESTING_HEART_RATE', 'bpm', 1],
  'heart rate (bpm)':            ['RESTING_HEART_RATE', 'bpm', 1],
  'resting heart rate':          ['RESTING_HEART_RATE', 'bpm', 1],
  'resting heart rate (bpm)':    ['RESTING_HEART_RATE', 'bpm', 1],
  'avg heart rate':              ['AVG_HEART_RATE', 'bpm', 1],
  'average heart rate':          ['AVG_HEART_RATE', 'bpm', 1],
  'max heart rate':              ['MAX_HEART_RATE', 'bpm', 1],
  'max heart rate (bpm)':        ['MAX_HEART_RATE', 'bpm', 1],

  // --- Activity ---
  'steps':                       ['STEP_COUNT', 'steps', 1],
  'total steps':                 ['STEP_COUNT', 'steps', 1],
  'daily steps':                 ['STEP_COUNT', 'steps', 1],
  'distance':                    ['DISTANCE', 'km', 1],
  'distance (km)':               ['DISTANCE', 'km', 1],
  'distance (mi)':               ['DISTANCE', 'mi', 1],
  'distance (miles)':            ['DISTANCE', 'mi', 1],
  'calories':                    ['CALORIES_BURNED', 'kcal', 1],
  'calories burned':             ['CALORIES_BURNED', 'kcal', 1],
  'total calories':              ['CALORIES_BURNED', 'kcal', 1],
  'active calories':             ['ACTIVE_CALORIES', 'kcal', 1],
  'floors':                      ['FLOORS_CLIMBED', 'floors', 1],
  'floors climbed':              ['FLOORS_CLIMBED', 'floors', 1],
  'intensity minutes':           ['INTENSITY_MINUTES', 'min', 1],
  'intensity minutes (min)':     ['INTENSITY_MINUTES', 'min', 1],
  'moderate intensity minutes':  ['MODERATE_INTENSITY', 'min', 1],
  'vigorous intensity minutes':  ['VIGOROUS_INTENSITY', 'min', 1],
  'active minutes':              ['INTENSITY_MINUTES', 'min', 1],

  // --- Stress / Recovery ---
  'stress level':                ['STRESS_LEVEL', 'pts', 1],
  'stress':                      ['STRESS_LEVEL', 'pts', 1],
  'average stress':              ['AVG_STRESS', 'pts', 1],
  'average stress level':        ['AVG_STRESS', 'pts', 1],
  'body battery':                ['BODY_BATTERY', 'pts', 1],
  'body battery (charged)':      ['BODY_BATTERY', 'pts', 1],
  'body battery high':           ['BODY_BATTERY_HIGH', 'pts', 1],
  'body battery low':            ['BODY_BATTERY_LOW', 'pts', 1],
  'respiration rate':            ['RESPIRATION_RATE', 'brpm', 1],
  'avg respiration':             ['RESPIRATION_RATE', 'brpm', 1],
  'spo2':                        ['SPO2', '%', 1],
  'spo2 (%)':                    ['SPO2', '%', 1],
  'blood oxygen':                ['SPO2', '%', 1],

  // --- Blood glucose ---
  'blood glucose':               ['BLOOD_GLUCOSE', 'mg/dL', 1],
  'glucose':                     ['BLOOD_GLUCOSE', 'mg/dL', 1],
};

const HEALTHKIT_TYPE_MAP: Record<string, [string, string]> = {
  'hkquantitytypeidentifierheartratevariabilitysdnn': ['HRV_RMSSD', 'ms'],
  'hkquantitytypeidentifierrestingheartrate': ['RESTING_HEART_RATE', 'bpm'],
  'hkquantitytypeidentifierheartrate': ['AVG_HEART_RATE', 'bpm'],
  'hkquantitytypeidentifierbloodglucose': ['BLOOD_GLUCOSE', 'mg/dL'],
  'hkquantitytypeidentifierstepcount': ['STEP_COUNT', 'steps'],
  'hkcategorytypeidentifiersleepanalysis': ['SLEEP_DURATION', 'min'],
  'hkquantitytypeidentifieractivecalories': ['ACTIVE_CALORIES', 'kcal'],
  'hkquantitytypeidentifierdistancewalkingrunning': ['DISTANCE', 'km'],
  'hkquantitytypeidentifierflightsclimbed': ['FLOORS_CLIMBED', 'floors'],
  'hkquantitytypeidentifierrespiratoryrate': ['RESPIRATION_RATE', 'brpm'],
  'hkquantitytypeidentifieroxygenssaturation': ['SPO2', '%'],
};

// ---------------------------------------------------------------------------
// Parsing
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

function detectFormat(headers: string[]): 'apple' | 'garmin' | 'generic' {
  const lower = headers.map(h => h.toLowerCase().trim());
  // Apple Health: has "type" + "sourceName"
  if (lower.includes('type') && (lower.includes('sourcename') || lower.includes('source name'))) return 'apple';
  // Garmin / any tracker: if ANY header matches our column map, treat as garmin-style
  if (lower.some(h => COLUMN_MAP[h] !== undefined)) return 'garmin';
  // Generic: has "type" + "value"
  if (lower.includes('type') && lower.includes('value')) return 'generic';
  // Fallback: try garmin-style anyway with fuzzy matching
  if (lower.some(h => Object.keys(COLUMN_MAP).some(k => h.includes(k) || k.includes(h)))) return 'garmin';
  return 'generic'; // never return unknown — try to parse everything
}

function parseGarminStyle(rows: string[][], headers: string[]): BiometricReading[] {
  const lower = headers.map(h => h.toLowerCase().trim());
  const dateIdx = lower.findIndex(h => h.includes('date') || h.includes('time') || h === 'day');

  // Build column index -> [type, unit, scale] mapping as parallel arrays
  const mappedCols: number[] = [];
  const mappedTypes: string[] = [];
  const mappedUnits: string[] = [];
  const mappedScales: number[] = [];

  for (let i = 0; i < lower.length; i++) {
    const exact = COLUMN_MAP[lower[i]];
    if (exact) {
      mappedCols.push(i); mappedTypes.push(exact[0]); mappedUnits.push(exact[1]); mappedScales.push(exact[2]);
      continue;
    }
    // Fuzzy: check if any key is a substring of the header or vice versa
    const keys = Object.keys(COLUMN_MAP);
    for (let k = 0; k < keys.length; k++) {
      if (lower[i].includes(keys[k]) || keys[k].includes(lower[i])) {
        const val = COLUMN_MAP[keys[k]];
        mappedCols.push(i); mappedTypes.push(val[0]); mappedUnits.push(val[1]); mappedScales.push(val[2]);
        break;
      }
    }
  }

  const readings: BiometricReading[] = [];
  for (const row of rows) {
    const ts = dateIdx >= 0 && row[dateIdx] ? row[dateIdx] : new Date().toISOString();
    for (let m = 0; m < mappedCols.length; m++) {
      const raw = parseFloat(row[mappedCols[m]]);
      if (isNaN(raw) || raw === 0) continue;
      readings.push({ timestamp: ts, type: mappedTypes[m], value: raw * mappedScales[m], unit: mappedUnits[m], source: 'Garmin Connect' });
    }
  }
  return readings;
}

function parseApple(rows: string[][], headers: string[]): BiometricReading[] {
  const lower = headers.map(h => h.toLowerCase().trim());
  const typeIdx = lower.indexOf('type');
  const valIdx = lower.indexOf('value');
  const startIdx = lower.findIndex(h => h.includes('start'));
  const srcIdx = lower.findIndex(h => h.includes('source'));

  const readings: BiometricReading[] = [];
  for (const row of rows) {
    const rawType = (row[typeIdx] || '').toLowerCase().trim();
    const mapped = HEALTHKIT_TYPE_MAP[rawType];
    if (!mapped) continue;
    const value = parseFloat(row[valIdx]);
    if (isNaN(value)) continue;
    readings.push({
      timestamp: row[startIdx] || new Date().toISOString(),
      type: mapped[0], value, unit: mapped[1],
      source: row[srcIdx] || 'Apple Health',
    });
  }
  return readings;
}

function parseGeneric(rows: string[][], headers: string[]): BiometricReading[] {
  const lower = headers.map(h => h.toLowerCase().trim());
  const typeIdx = lower.indexOf('type');
  const valIdx = lower.indexOf('value');
  const tsIdx = lower.findIndex(h => h.includes('time') || h.includes('date'));
  const unitIdx = lower.indexOf('unit');

  const readings: BiometricReading[] = [];
  for (const row of rows) {
    const type = (row[typeIdx] || '').toUpperCase().replace(/\s+/g, '_');
    const value = parseFloat(row[valIdx]);
    if (!type || isNaN(value)) continue;
    readings.push({
      timestamp: tsIdx >= 0 ? row[tsIdx] : new Date().toISOString(),
      type, value,
      unit: unitIdx >= 0 ? row[unitIdx] : '',
      source: 'CSV',
    });
  }
  return readings;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CsvUpload: React.FC<CsvUploadProps> = ({ onDataLoaded }) => {
  const [status, setStatus] = useState<'idle' | 'loaded' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<BiometricReading[]>([]);
  const [detectedFormat, setDetectedFormat] = useState('');

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length < 2) { setStatus('error'); setMessage('CSV has no data rows.'); return; }

        const headers = parsed[0];
        const rows = parsed.slice(1).filter(r => r.some(c => c.trim()));
        const format = detectFormat(headers);
        setDetectedFormat(format);

        let readings: BiometricReading[];
        if (format === 'apple') readings = parseApple(rows, headers);
        else if (format === 'garmin') readings = parseGarminStyle(rows, headers);
        else readings = parseGeneric(rows, headers);

        if (readings.length === 0) {
          setStatus('error');
          setMessage(`No readings found. Detected ${headers.length} columns: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}. Check that column names match sleep, activity, or health metrics.`);
          return;
        }

        const typeArr = readings.map(r => r.type);
        const uniqueTypes = typeArr.filter((t, i) => typeArr.indexOf(t) === i);
        setPreview(readings.slice(0, 10));
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
    else { setStatus('error'); setMessage('Drop a file to import.'); }
  }, [handleFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clear = () => { setStatus('idle'); setMessage(''); setPreview([]); setDetectedFormat(''); };

  return (
    <div className="Card CsvUpload-Card">
      <div className="Card-Header">
        <div className="Title-Group"><Upload size={18} /><h3>Import Health Data</h3></div>
        {status === 'loaded' && <button className="Clear-Btn" onClick={clear} title="Clear"><X size={14} /></button>}
      </div>

      {status === 'idle' && (
        <div className="Upload-Zone" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
          <FileText size={32} className="Upload-Icon" />
          <p>Drop a CSV here or click to browse</p>
          <p className="Upload-Hint">Garmin Connect, Apple Health, Fitbit, Oura, or any CSV with health columns</p>
          <input type="file" accept=".csv,text/csv,.txt" onChange={handleInput} className="Upload-Input" />
        </div>
      )}

      {status === 'loaded' && (
        <div className="Upload-Result success">
          <div className="Result-Header">
            <CheckCircle2 size={16} className="success-text" />
            <span>{message}</span>
            {detectedFormat && <span className="Format-Badge">{detectedFormat.toUpperCase()}</span>}
          </div>
          {preview.length > 0 && (
            <div className="Preview-Table">
              <div className="Preview-Header"><Table size={14} /><span>Preview</span></div>
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
