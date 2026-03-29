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
  //
  // ORDER MATTERS: longer/more-specific patterns must come FIRST because
  // matchType() returns the first substring match.  "sleep score" must
  // come before "sleep" to prevent scores matching duration entries.

  // Sleep SCORES first (prevent score values getting duration scaling)
  ['sleep score 1 day', 'SLEEP_SCORE', 'pts', 1],
  ['sleepscorequalifier', 'SLEEP_QUALITY', '', 1],
  ['sleepscore', 'SLEEP_SCORE', 'pts', 1],
  ['sleep score', 'SLEEP_SCORE', 'pts', 1],
  ['sleep quality', 'SLEEP_SCORE', 'pts', 1],
  ['overall score qualifier', 'SLEEP_QUALITY', '', 1],
  ['overallscore', 'SLEEP_SCORE', 'pts', 1],
  ['qualityscore', 'SLEEP_SCORE', 'pts', 1],
  ['recoveryscore', 'SLEEP_SCORE', 'pts', 1],
  ['score qualifier', 'SLEEP_QUALITY', '', 1],

  // Sleep DURATIONS — every format Garmin, Apple, Fitbit, Oura uses
  // Hours-based columns (multiply by 60 to get minutes)
  ['duration (hrs)', 'SLEEP_DURATION', 'min', 60],
  ['duration (hours)', 'SLEEP_DURATION', 'min', 60],
  ['duration (h)', 'SLEEP_DURATION', 'min', 60],
  ['time asleep (hrs)', 'SLEEP_DURATION', 'min', 60],
  ['time asleep (hours)', 'SLEEP_DURATION', 'min', 60],
  ['hours of sleep', 'SLEEP_DURATION', 'min', 60],
  ['sleep hours', 'SLEEP_DURATION', 'min', 60],
  ['time in bed (hrs)', 'TIME_IN_BED', 'min', 60],
  ['time in bed (hours)', 'TIME_IN_BED', 'min', 60],
  ['deep (hrs)', 'DEEP_SLEEP', 'min', 60],
  ['deep (hours)', 'DEEP_SLEEP', 'min', 60],
  ['light (hrs)', 'LIGHT_SLEEP', 'min', 60],
  ['light (hours)', 'LIGHT_SLEEP', 'min', 60],
  ['rem (hrs)', 'REM_SLEEP', 'min', 60],
  ['rem (hours)', 'REM_SLEEP', 'min', 60],
  ['awake (hrs)', 'AWAKE_TIME', 'min', 60],
  // Seconds-based columns (divide by 60 to get minutes)
  ['total sleep time (s)', 'SLEEP_DURATION', 'min', 1/60],
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
  // Garmin camelCase API-style column names (from developer exports / bulk export)
  ['sleeptimeseconds', 'SLEEP_DURATION', 'min', 1/60],
  ['sleeptimeinseconds', 'SLEEP_DURATION', 'min', 1/60],
  ['sleeptime', 'SLEEP_DURATION', 'min', 1],
  ['deepsleepseconds', 'DEEP_SLEEP', 'min', 1/60],
  ['deepsleepinseconds', 'DEEP_SLEEP', 'min', 1/60],
  ['deepsleepduration', 'DEEP_SLEEP', 'min', 1],
  ['lightsleepseconds', 'LIGHT_SLEEP', 'min', 1/60],
  ['lightsleepinseconds', 'LIGHT_SLEEP', 'min', 1/60],
  ['lightsleepduration', 'LIGHT_SLEEP', 'min', 1],
  ['remsleepseconds', 'REM_SLEEP', 'min', 1/60],
  ['remsleepinseconds', 'REM_SLEEP', 'min', 1/60],
  ['remsleepduration', 'REM_SLEEP', 'min', 1],
  ['awakesleepseconds', 'AWAKE_TIME', 'min', 1/60],
  ['awakesleepinseconds', 'AWAKE_TIME', 'min', 1/60],
  ['unmeasurablesleepseconds', 'UNMEASURED_SLEEP', 'min', 1/60],
  ['averagehr', 'AVG_HEART_RATE', 'bpm', 1],
  ['averagespo2', 'SPO2', '%', 1],
  ['lowestspo2', 'SPO2', '%', 1],
  ['averagerespirationvalue', 'RESPIRATION_RATE', 'brpm', 1],
  ['averagestresslevel', 'AVG_STRESS', 'pts', 1],
  ['sleepscores', 'SLEEP_SCORE', 'pts', 1],
  ['overallscore', 'SLEEP_SCORE', 'pts', 1],
  ['qualityscore', 'SLEEP_SCORE', 'pts', 1],
  ['recoveryscore', 'SLEEP_SCORE', 'pts', 1],
  ['remscore', 'REM_SLEEP', 'min', 1],
  ['naptimeseconds', 'NAP_TIME', 'min', 1/60],
  ['calendardate', '_DATE', '', 1],  // date column marker
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
  const lower = text.toLowerCase().trim();
  // Try exact-ish substring match first (preserving spaces for multi-word matches)
  for (let i = 0; i < TYPE_MAP.length; i++) {
    if (lower.includes(TYPE_MAP[i][0])) {
      if (TYPE_MAP[i][1] === '_DATE') return null; // date column, not a metric
      return [TYPE_MAP[i][1], TYPE_MAP[i][2], TYPE_MAP[i][3]];
    }
  }
  // Try again with all spaces, underscores, hyphens removed (catches camelCase after lowering)
  const compact = lower.replace(/[\s_\-()]/g, '');
  for (let i = 0; i < TYPE_MAP.length; i++) {
    const compactKey = TYPE_MAP[i][0].replace(/[\s_\-()]/g, '');
    if (compact.includes(compactKey) || compactKey.includes(compact)) {
      if (TYPE_MAP[i][1] === '_DATE') return null;
      return [TYPE_MAP[i][1], TYPE_MAP[i][2], TYPE_MAP[i][3]];
    }
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

  // Post-processing: if we have SLEEP_SCORE but no SLEEP_DURATION, estimate
  // duration from the score.  Garmin scores roughly: 80→7.5h, 60→6h, 40→4.5h, 100→9h.
  // This lets users with score-only exports still see meaningful sleep metrics.
  const hasScore = readings.some(r => r.type === 'SLEEP_SCORE');
  const hasDuration = readings.some(r => r.type === 'SLEEP_DURATION');

  if (hasScore && !hasDuration) {
    const scores = readings.filter(r => r.type === 'SLEEP_SCORE');
    for (const s of scores) {
      if (s.value <= 0) continue;
      // Garmin sleep scores are 0-100.  If value looks like it's already in
      // hours (< 15) or minutes (> 100), don't convert — just use as-is.
      let estimatedMin: number;
      if (s.value > 100) {
        // Already in minutes (or seconds if very large)
        estimatedMin = s.value > 1000 ? Math.round(s.value / 60) : Math.round(s.value);
      } else if (s.value <= 12) {
        // Likely hours
        estimatedMin = Math.round(s.value * 60);
      } else {
        // 13-100 range: treat as Garmin score (0-100)
        estimatedMin = Math.round(s.value * 5.4);
      }
      if (estimatedMin > 0 && estimatedMin < 1440) {
        readings.push({
          timestamp: s.timestamp,
          type: 'SLEEP_DURATION',
          value: estimatedMin,
          unit: 'min',
          source: s.source + ' (estimated)',
        });
      }
    }
  }

  // Also handle Bed Time / Wake Time columns: compute duration from the pair
  const bedIdx = lower.findIndex(h => h.includes('bed time') || h.includes('bedtime') || h.includes('sleep start'));
  const wakeIdx = lower.findIndex(h => h.includes('wake time') || h.includes('waketime') || h.includes('sleep end'));
  if (bedIdx >= 0 && wakeIdx >= 0 && !hasDuration) {
    for (const row of rows) {
      const bed = new Date(row[bedIdx]);
      const wake = new Date(row[wakeIdx]);
      if (!isNaN(bed.getTime()) && !isNaN(wake.getTime())) {
        let diffMin = (wake.getTime() - bed.getTime()) / 60000;
        if (diffMin < 0) diffMin += 1440; // crossed midnight
        if (diffMin > 0 && diffMin < 1440) {
          const ts = dateIdx >= 0 && row[dateIdx] ? row[dateIdx] : row[bedIdx];
          readings.push({
            timestamp: ts, type: 'SLEEP_DURATION',
            value: Math.round(diffMin), unit: 'min', source: 'Computed from Bed/Wake times',
          });
        }
      }
    }
  }

  // Build debug info showing exactly what was matched
  const debugParts: string[] = [];
  if (mappedCols.length > 0) {
    const matched = mappedCols.map((col, i) => headers[col] + ' -> ' + mappedInfo[i][0]).join(', ');
    debugParts.push('Matched: ' + matched);
  } else {
    debugParts.push('No columns matched any known metric name.');
  }

  // Show sample values for first matched column to help diagnose scaling issues
  if (readings.length > 0) {
    const first3 = readings.slice(0, 3);
    debugParts.push('Sample: ' + first3.map(r => r.type + '=' + r.value.toFixed(1) + r.unit).join(', '));
  }

  return { readings, debug: debugParts.join(' | ') };
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
          // Show ALL column names and sample values so the user can report the exact format
          const allCols = headers.join(' | ');
          const sampleRow = rows.length > 0 ? rows[0].join(' | ') : '(empty)';
          setStatus('error');
          setMessage(
            `No readings matched. All ${headers.length} columns: [${allCols}]. ` +
            `First row: [${sampleRow.substring(0, 200)}]` +
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
