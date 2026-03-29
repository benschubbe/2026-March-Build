import React, { useState } from 'react';
import {
  ShieldCheck,
  Moon,
  Footprints,
  Heart,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Pill,
  Stethoscope,
  ArrowRight,
  BarChart3,
  Settings as SettingsIcon,
  Lock
} from 'lucide-react';
import CsvUpload, { BiometricReading } from './components/CsvUpload';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './App.css';

// ---------------------------------------------------------------------------
// Analysis helpers — all client-side, zero data transmitted
// ---------------------------------------------------------------------------

interface MetricSummary {
  label: string;
  avg: number;
  min: number;
  max: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPct: number;
  readings: number;
  anomalies: number;
  data: { date: string; value: number }[];
}

interface Anomaly {
  type: string;
  date: string;
  value: number;
  expected: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface Recommendation {
  category: 'supplement' | 'lifestyle' | 'doctor';
  title: string;
  detail: string;
  priority: 'low' | 'medium' | 'high';
  source: string;
}

const SLEEP_NORMAL = { low: 420, high: 540, unit: 'min' };  // 7-9 hours
const HRV_NORMAL = { low: 20, high: 60, unit: 'ms' };
const HR_NORMAL = { low: 50, high: 85, unit: 'bpm' };
const STEPS_NORMAL = { low: 6000, high: 12000, unit: 'steps' };

function summarize(readings: BiometricReading[], type: string, label: string, unit: string, normLow: number, normHigh: number): MetricSummary | null {
  const filtered = readings.filter(r => r.type === type).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  if (filtered.length === 0) return null;

  const values = filtered.map(r => r.value);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.length ? firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length : avg;
  const secondAvg = secondHalf.length ? secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length : avg;
  const trendPct = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  let anomalies = 0;
  for (const v of values) {
    if (v < normLow * 0.85 || v > normHigh * 1.15) anomalies++;
  }

  return {
    label, unit, avg: Math.round(avg * 10) / 10,
    min: Math.round(Math.min(...values) * 10) / 10,
    max: Math.round(Math.max(...values) * 10) / 10,
    trend: trendPct > 3 ? 'up' : trendPct < -3 ? 'down' : 'stable',
    trendPct: Math.round(trendPct * 10) / 10,
    readings: filtered.length,
    anomalies,
    data: filtered.map(r => ({ date: new Date(r.timestamp).toLocaleDateString(), value: Math.round(r.value * 10) / 10 })),
  };
}

function detectAnomalies(readings: BiometricReading[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const byType: Record<string, BiometricReading[]> = {};
  for (const r of readings) {
    (byType[r.type] = byType[r.type] || []).push(r);
  }

  const checks: { type: string; label: string; low: number; high: number; unit: string }[] = [
    { type: 'SLEEP_ANALYSIS', label: 'Sleep Duration', low: 420, high: 540, unit: 'min' },
    { type: 'HRV_RMSSD', label: 'HRV (RMSSD)', low: 20, high: 60, unit: 'ms' },
    { type: 'RESTING_HEART_RATE', label: 'Resting HR', low: 50, high: 85, unit: 'bpm' },
    { type: 'STEP_COUNT', label: 'Daily Steps', low: 6000, high: 12000, unit: 'steps' },
  ];

  for (const check of checks) {
    const data = byType[check.type] || [];
    for (const r of data) {
      if (r.value < check.low * 0.85) {
        anomalies.push({
          type: check.label, date: new Date(r.timestamp).toLocaleDateString(),
          value: r.value, expected: `${check.low}-${check.high} ${check.unit}`,
          severity: r.value < check.low * 0.7 ? 'high' : 'medium',
          message: `${check.label} critically low at ${Math.round(r.value)} ${check.unit}`,
        });
      } else if (r.value > check.high * 1.15) {
        anomalies.push({
          type: check.label, date: new Date(r.timestamp).toLocaleDateString(),
          value: r.value, expected: `${check.low}-${check.high} ${check.unit}`,
          severity: r.value > check.high * 1.3 ? 'high' : 'medium',
          message: `${check.label} elevated at ${Math.round(r.value)} ${check.unit}`,
        });
      }
    }
    // Trend anomaly: 3+ consecutive declining values
    if (data.length >= 5) {
      const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      let declineStreak = 0;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].value < sorted[i - 1].value * 0.95) declineStreak++;
        else declineStreak = 0;
        if (declineStreak >= 3) {
          anomalies.push({
            type: check.label, date: new Date(sorted[i].timestamp).toLocaleDateString(),
            value: sorted[i].value, expected: 'Stable or improving trend',
            severity: 'medium',
            message: `${check.label} declining for ${declineStreak + 1} consecutive readings`,
          });
          break;
        }
      }
    }
  }
  return anomalies.slice(0, 10); // cap at 10
}

function generateRecommendations(summaries: (MetricSummary | null)[], anomalies: Anomaly[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const sleep = summaries.find(s => s && s.label === 'Sleep Duration');
  const hrv = summaries.find(s => s && s.label === 'HRV (RMSSD)');
  const steps = summaries.find(s => s && s.label === 'Daily Steps');
  const hr = summaries.find(s => s && s.label === 'Resting Heart Rate');

  if (sleep && sleep.avg < 420) {
    recs.push({ category: 'supplement', title: 'Magnesium Glycinate (200-400mg)', detail: 'Low sleep duration detected. Magnesium glycinate taken 1h before bed supports GABA activity and may improve sleep onset latency and total duration.', priority: 'high', source: 'Abbasi et al., J Res Med Sci, 2012' });
    recs.push({ category: 'lifestyle', title: 'Sleep Hygiene Protocol', detail: `Average sleep is ${Math.round(sleep.avg)} min (${(sleep.avg/60).toFixed(1)}h). Target 7-9 hours. Limit screen exposure 1h before bed, keep bedroom at 65-68°F, maintain consistent sleep/wake times.`, priority: 'high', source: 'CDC Sleep Guidelines' });
  } else if (sleep && sleep.avg < 480) {
    recs.push({ category: 'lifestyle', title: 'Extend Sleep Window', detail: `Average sleep is ${Math.round(sleep.avg)} min (${(sleep.avg/60).toFixed(1)}h). Aim for 480+ min. Consider moving bedtime 30 min earlier.`, priority: 'medium', source: 'Walker, Why We Sleep, 2017' });
  }

  if (hrv && hrv.avg < 25) {
    recs.push({ category: 'supplement', title: 'Omega-3 (EPA/DHA 1000-2000mg)', detail: 'Low HRV indicates reduced autonomic flexibility. Omega-3 supplementation has demonstrated HRV improvement in multiple RCTs.', priority: 'high', source: 'Xin et al., Eur J Clin Nutr, 2013' });
    recs.push({ category: 'doctor', title: 'Discuss HRV with Physician', detail: `Average HRV is ${hrv.avg}ms (normal: 20-60ms). Persistently low HRV may warrant cardiac or autonomic evaluation.`, priority: 'high', source: 'Clinical threshold' });
  } else if (hrv && hrv.trend === 'down' && Math.abs(hrv.trendPct) > 10) {
    recs.push({ category: 'doctor', title: 'HRV Declining Trend', detail: `HRV decreased ${Math.abs(hrv.trendPct).toFixed(1)}% over the observation period. Discuss with physician — declining HRV can indicate stress, medication effects, or autonomic changes.`, priority: 'medium', source: 'Shaffer & Ginsberg, Front Public Health, 2017' });
  }
  if (hrv && hrv.avg >= 25) {
    recs.push({ category: 'lifestyle', title: 'Maintain HRV with Recovery', detail: `HRV averaging ${hrv.avg}ms is within range. Prioritize recovery days after intense training. Avoid alcohol within 3h of sleep.`, priority: 'low', source: 'General wellness guidance' });
  }

  if (steps && steps.avg < 6000) {
    recs.push({ category: 'lifestyle', title: 'Increase Daily Movement', detail: `Average ${Math.round(steps.avg)} steps/day. Target 7,000-10,000. Add a 20-min walk after meals to improve insulin sensitivity and cardiovascular health.`, priority: 'medium', source: 'Tudor-Locke et al., Int J Behav Nutr Phys Act, 2011' });
    recs.push({ category: 'supplement', title: 'Vitamin D3 (1000-2000 IU)', detail: 'Low activity often correlates with reduced sun exposure. Vitamin D supports bone health, immune function, and mood regulation.', priority: 'low', source: 'Holick, NEJM, 2007' });
  }

  if (hr && hr.avg > 80) {
    recs.push({ category: 'lifestyle', title: 'Cardio Conditioning', detail: `Resting HR averaging ${Math.round(hr.avg)} bpm. Aerobic exercise 3-5x/week (zone 2, conversational pace) can lower resting HR by 5-15 bpm over 8-12 weeks.`, priority: 'medium', source: 'AHA Exercise Guidelines' });
  }

  if (anomalies.filter(a => a.severity === 'high').length >= 3) {
    recs.push({ category: 'doctor', title: 'Multiple High-Severity Anomalies', detail: `${anomalies.filter(a => a.severity === 'high').length} high-severity anomalies detected. Schedule a wellness check to discuss these findings with your physician.`, priority: 'high', source: 'BioGuardian anomaly threshold' });
  }

  if (recs.length === 0) {
    recs.push({ category: 'lifestyle', title: 'All Metrics Within Range', detail: 'Your sleep and activity data looks healthy. Keep up your current routine and check back after your next data export.', priority: 'low', source: 'General wellness' });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const MetricCard: React.FC<{ summary: MetricSummary; icon: React.ReactNode; color: string }> = ({ summary, icon, color }) => (
  <div className="Card Metric-Card">
    <div className="Metric-Header">
      <div className="Metric-Icon" style={{ color }}>{icon}</div>
      <div>
        <h4>{summary.label}</h4>
        <span className="Metric-Count">{summary.readings} readings</span>
      </div>
    </div>
    <div className="Metric-Value" style={{ color }}>
      {summary.avg} <span className="Metric-Unit">{summary.unit}</span>
    </div>
    <div className="Metric-Range">
      <span>Min: {summary.min}</span>
      <span>Max: {summary.max}</span>
    </div>
    <div className={`Metric-Trend trend-${summary.trend}`}>
      {summary.trend === 'up' ? <TrendingUp size={14} /> : summary.trend === 'down' ? <TrendingDown size={14} /> : <ArrowRight size={14} />}
      <span>{summary.trend === 'stable' ? 'Stable' : `${summary.trendPct > 0 ? '+' : ''}${summary.trendPct}%`}</span>
    </div>
    {summary.anomalies > 0 && (
      <div className="Metric-Anomaly-Badge">
        <AlertTriangle size={12} /> {summary.anomalies} anomal{summary.anomalies === 1 ? 'y' : 'ies'}
      </div>
    )}
  </div>
);

const MiniChart: React.FC<{ data: { date: string; value: number }[]; color: string; label: string }> = ({ data, color, label }) => (
  <div className="Card Chart-Card-Mini">
    <h4>{label}</h4>
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" />
          <XAxis dataKey="date" hide />
          <YAxis stroke="#8b949e" fontSize={10} width={40} />
          <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', fontSize: '12px' }} />
          <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#grad-${label})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  const [readings, setReadings] = useState<BiometricReading[]>([]);
  const [hasData, setHasData] = useState(false);

  const handleData = (data: BiometricReading[]) => {
    setReadings(data);
    setHasData(data.length > 0);
  };

  const sleep = hasData ? summarize(readings, 'SLEEP_ANALYSIS', 'Sleep Duration', 'min', SLEEP_NORMAL.low, SLEEP_NORMAL.high) : null;
  const hrv = hasData ? summarize(readings, 'HRV_RMSSD', 'HRV (RMSSD)', 'ms', HRV_NORMAL.low, HRV_NORMAL.high) : null;
  const steps = hasData ? summarize(readings, 'STEP_COUNT', 'Daily Steps', 'steps', STEPS_NORMAL.low, STEPS_NORMAL.high) : null;
  const hr = hasData ? summarize(readings, 'RESTING_HEART_RATE', 'Resting Heart Rate', 'bpm', HR_NORMAL.low, HR_NORMAL.high) : null;
  const anomalies = hasData ? detectAnomalies(readings) : [];
  const summaries = [sleep, hrv, steps, hr];
  const recs = hasData ? generateRecommendations(summaries, anomalies) : [];

  return (
    <div className="App premium-theme">
      <nav className="Sidebar">
        <div className="Logo">
          <ShieldCheck size={32} color="#58a6ff" />
          <span>BioGuardian</span>
        </div>
        <div className="Nav-Items">
          <div className="Nav-Item active"><BarChart3 size={20} /> Dashboard</div>
        </div>
        <div className="Privacy-Indicator">
          <Lock size={14} />
          <span>LOCAL ONLY</span>
        </div>
      </nav>

      <main className="Main-Content">
        <header className="Top-Bar">
          <div className="Header-Left">
            <h1>BioGuardian</h1>
            <span className="Patient-Badge">
              {hasData ? `${readings.length} readings loaded | ${new Set(readings.map(r => r.type)).size} biometric types` : 'Import your health data to begin'}
            </span>
          </div>
        </header>

        <section className="Simple-Dashboard">
          <CsvUpload onDataLoaded={handleData} />

          {hasData && (
            <>
              {/* Metric cards */}
              <div className="Metrics-Row">
                {sleep && <MetricCard summary={sleep} icon={<Moon size={24} />} color="#a78bfa" />}
                {hrv && <MetricCard summary={hrv} icon={<Heart size={24} />} color="#f472b6" />}
                {steps && <MetricCard summary={steps} icon={<Footprints size={24} />} color="#34d399" />}
                {hr && <MetricCard summary={hr} icon={<Heart size={24} />} color="#fb923c" />}
              </div>

              {/* Charts */}
              <div className="Charts-Row">
                {sleep && sleep.data.length > 1 && <MiniChart data={sleep.data} color="#a78bfa" label="Sleep Duration (min)" />}
                {hrv && hrv.data.length > 1 && <MiniChart data={hrv.data} color="#f472b6" label="HRV RMSSD (ms)" />}
                {steps && steps.data.length > 1 && <MiniChart data={steps.data} color="#34d399" label="Daily Steps" />}
                {hr && hr.data.length > 1 && <MiniChart data={hr.data} color="#fb923c" label="Resting HR (bpm)" />}
              </div>

              {/* Anomalies */}
              {anomalies.length > 0 && (
                <div className="Card Anomalies-Card">
                  <div className="Card-Header">
                    <AlertTriangle size={18} />
                    <h3>Anomalies Detected ({anomalies.length})</h3>
                  </div>
                  <div className="Anomaly-List">
                    {anomalies.map((a, i) => (
                      <div key={i} className={`Anomaly-Item severity-${a.severity}`}>
                        <div className="Anomaly-Header">
                          <span className={`Severity-Dot ${a.severity}`} />
                          <strong>{a.message}</strong>
                        </div>
                        <div className="Anomaly-Detail">
                          <span>{a.date}</span>
                          <span>Value: {Math.round(a.value)}</span>
                          <span>Expected: {a.expected}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="Card Recs-Card">
                <div className="Card-Header">
                  <Stethoscope size={18} />
                  <h3>Recommendations ({recs.length})</h3>
                </div>
                <div className="Recs-List">
                  {recs.map((rec, i) => (
                    <div key={i} className={`Rec-Card priority-${rec.priority}`}>
                      <div className="Rec-Icon">
                        {rec.category === 'supplement' ? <Pill size={20} /> : rec.category === 'doctor' ? <Stethoscope size={20} /> : <Footprints size={20} />}
                      </div>
                      <div className="Rec-Content">
                        <div className="Rec-Title">
                          <strong>{rec.title}</strong>
                          <span className={`Priority-Tag ${rec.priority}`}>{rec.priority.toUpperCase()}</span>
                          <span className="Category-Tag">{rec.category}</span>
                        </div>
                        <p>{rec.detail}</p>
                        <span className="Rec-Source">{rec.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!hasData && (
            <div className="Empty-Dashboard Card">
              <Moon size={48} className="Empty-Icon" />
              <h3>Import Your Health Data</h3>
              <p>Drop a CSV export from Apple Health, Garmin Connect, or any tracker above. BioGuardian will analyze your sleep and activity patterns, detect anomalies, and generate personalised recommendations.</p>
              <p className="Empty-Hint">All analysis runs locally in your browser. No data is transmitted anywhere.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
