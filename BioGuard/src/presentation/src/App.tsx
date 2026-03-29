import React, { useState } from 'react';
import {
  ShieldCheck, Moon, Footprints, Heart, AlertTriangle, TrendingDown,
  TrendingUp, ArrowRight, Pill, Stethoscope, BarChart3, Lock, Flame,
  Zap, Battery, Wind, Target
} from 'lucide-react';
import CsvUpload, { BiometricReading } from './components/CsvUpload';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

// ---------------------------------------------------------------------------
// Metric definitions — what we track, normal ranges, display config
// ---------------------------------------------------------------------------

interface MetricDef {
  type: string; label: string; unit: string; icon: string;
  normLow: number; normHigh: number; color: string;
  category: 'sleep' | 'activity' | 'heart' | 'recovery';
}

const METRICS: MetricDef[] = [
  { type: 'SLEEP_DURATION', label: 'Sleep Duration', unit: 'min', icon: 'moon', normLow: 420, normHigh: 540, color: '#a78bfa', category: 'sleep' },
  { type: 'DEEP_SLEEP', label: 'Deep Sleep', unit: 'min', icon: 'moon', normLow: 60, normHigh: 120, color: '#7c3aed', category: 'sleep' },
  { type: 'REM_SLEEP', label: 'REM Sleep', unit: 'min', icon: 'moon', normLow: 60, normHigh: 120, color: '#8b5cf6', category: 'sleep' },
  { type: 'LIGHT_SLEEP', label: 'Light Sleep', unit: 'min', icon: 'moon', normLow: 180, normHigh: 300, color: '#c4b5fd', category: 'sleep' },
  { type: 'SLEEP_SCORE', label: 'Sleep Score', unit: 'pts', icon: 'moon', normLow: 60, normHigh: 100, color: '#ddd6fe', category: 'sleep' },
  { type: 'NAP_TIME', label: 'Nap Time', unit: 'min', icon: 'moon', normLow: 0, normHigh: 30, color: '#e9d5ff', category: 'sleep' },
  { type: 'AWAKE_TIME', label: 'Awake Time', unit: 'min', icon: 'moon', normLow: 0, normHigh: 60, color: '#fecaca', category: 'sleep' },
  { type: 'STEP_COUNT', label: 'Daily Steps', unit: 'steps', icon: 'steps', normLow: 7000, normHigh: 12000, color: '#34d399', category: 'activity' },
  { type: 'DISTANCE', label: 'Distance', unit: 'km', icon: 'steps', normLow: 4, normHigh: 10, color: '#6ee7b7', category: 'activity' },
  { type: 'CALORIES_BURNED', label: 'Calories Burned', unit: 'kcal', icon: 'flame', normLow: 1800, normHigh: 3000, color: '#fb923c', category: 'activity' },
  { type: 'ACTIVE_CALORIES', label: 'Active Calories', unit: 'kcal', icon: 'flame', normLow: 300, normHigh: 800, color: '#fdba74', category: 'activity' },
  { type: 'FLOORS_CLIMBED', label: 'Floors Climbed', unit: 'floors', icon: 'steps', normLow: 5, normHigh: 20, color: '#a7f3d0', category: 'activity' },
  { type: 'INTENSITY_MINUTES', label: 'Intensity Minutes', unit: 'min', icon: 'zap', normLow: 20, normHigh: 60, color: '#fbbf24', category: 'activity' },
  { type: 'HRV_RMSSD', label: 'HRV (RMSSD)', unit: 'ms', icon: 'heart', normLow: 20, normHigh: 60, color: '#f472b6', category: 'heart' },
  { type: 'RESTING_HEART_RATE', label: 'Resting HR', unit: 'bpm', icon: 'heart', normLow: 50, normHigh: 80, color: '#fb7185', category: 'heart' },
  { type: 'AVG_HEART_RATE', label: 'Avg Heart Rate', unit: 'bpm', icon: 'heart', normLow: 60, normHigh: 100, color: '#fda4af', category: 'heart' },
  { type: 'MAX_HEART_RATE', label: 'Max Heart Rate', unit: 'bpm', icon: 'heart', normLow: 120, normHigh: 190, color: '#e11d48', category: 'heart' },
  { type: 'BODY_BATTERY', label: 'Body Battery', unit: 'pts', icon: 'battery', normLow: 30, normHigh: 100, color: '#22d3ee', category: 'recovery' },
  { type: 'STRESS_LEVEL', label: 'Stress Level', unit: 'pts', icon: 'wind', normLow: 0, normHigh: 50, color: '#f97316', category: 'recovery' },
  { type: 'AVG_STRESS', label: 'Avg Stress', unit: 'pts', icon: 'wind', normLow: 0, normHigh: 40, color: '#ea580c', category: 'recovery' },
  { type: 'RESPIRATION_RATE', label: 'Respiration Rate', unit: 'brpm', icon: 'wind', normLow: 12, normHigh: 20, color: '#67e8f9', category: 'recovery' },
  { type: 'SPO2', label: 'SpO2', unit: '%', icon: 'wind', normLow: 95, normHigh: 100, color: '#06b6d4', category: 'recovery' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  moon: <Moon size={20} />, steps: <Footprints size={20} />, heart: <Heart size={20} />,
  flame: <Flame size={20} />, zap: <Zap size={20} />, battery: <Battery size={20} />,
  wind: <Wind size={20} />,
};

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

interface Summary {
  def: MetricDef; avg: number; min: number; max: number; count: number;
  trend: 'up' | 'down' | 'stable'; trendPct: number; anomalyCount: number;
  data: { date: string; value: number }[];
  status: 'good' | 'warning' | 'bad';
}

interface Anomaly {
  metric: string; date: string; value: number; expected: string;
  severity: 'low' | 'medium' | 'high'; message: string;
}

interface Rec {
  cat: 'supplement' | 'lifestyle' | 'doctor';
  title: string; detail: string; priority: 'low' | 'medium' | 'high'; source: string;
}

function analyze(readings: BiometricReading[]): { summaries: Summary[]; anomalies: Anomaly[]; recs: Rec[]; score: number } {
  const byType: Record<string, BiometricReading[]> = {};
  for (const r of readings) (byType[r.type] = byType[r.type] || []).push(r);

  const summaries: Summary[] = [];
  const anomalies: Anomaly[] = [];

  for (const def of METRICS) {
    const arr = (byType[def.type] || []).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (arr.length === 0) continue;

    const vals = arr.map(r => r.value);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const half = Math.floor(vals.length / 2);
    const firstAvg = vals.slice(0, half || 1).reduce((s, v) => s + v, 0) / (half || 1);
    const secondAvg = vals.slice(half).reduce((s, v) => s + v, 0) / (vals.length - half);
    const trendPct = firstAvg ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    let anomalyCount = 0;
    for (const v of vals) {
      const lo = def.normLow * 0.85, hi = def.normHigh * 1.15;
      if (v < lo || v > hi) {
        anomalyCount++;
        if (anomalies.length < 15) {
          const idx = vals.indexOf(v);
          anomalies.push({
            metric: def.label, date: new Date(arr[idx]?.timestamp || '').toLocaleDateString(),
            value: Math.round(v * 10) / 10, expected: `${def.normLow}-${def.normHigh} ${def.unit}`,
            severity: (v < def.normLow * 0.7 || v > def.normHigh * 1.3) ? 'high' : 'medium',
            message: `${def.label} at ${Math.round(v)} ${def.unit} (${v < def.normLow ? 'below' : 'above'} range)`,
          });
        }
      }
    }

    const status = avg < def.normLow * 0.9 || avg > def.normHigh * 1.1 ? 'bad' : avg < def.normLow || avg > def.normHigh ? 'warning' : 'good';

    summaries.push({
      def, avg: Math.round(avg * 10) / 10, min: Math.round(Math.min(...vals) * 10) / 10,
      max: Math.round(Math.max(...vals) * 10) / 10, count: arr.length,
      trend: trendPct > 3 ? 'up' : trendPct < -3 ? 'down' : 'stable',
      trendPct: Math.round(trendPct * 10) / 10, anomalyCount, status,
      data: arr.map(r => ({ date: new Date(r.timestamp).toLocaleDateString(), value: Math.round(r.value * 10) / 10 })),
    });
  }

  const recs = buildRecs(summaries, anomalies);
  const goodCount = summaries.filter(s => s.status === 'good').length;
  const score = summaries.length ? Math.round((goodCount / summaries.length) * 100) : 0;

  return { summaries, anomalies, recs, score };
}

function buildRecs(summaries: Summary[], anomalies: Anomaly[]): Rec[] {
  const recs: Rec[] = [];
  const get = (type: string) => summaries.find(s => s.def.type === type);

  const sleep = get('SLEEP_DURATION');
  const deep = get('DEEP_SLEEP');
  const hrv = get('HRV_RMSSD');
  const steps = get('STEP_COUNT');
  const hr = get('RESTING_HEART_RATE');
  const stress = get('AVG_STRESS') || get('STRESS_LEVEL');
  const intensity = get('INTENSITY_MINUTES');
  const battery = get('BODY_BATTERY');
  const spo2 = get('SPO2');

  if (sleep && sleep.avg < 420) {
    recs.push({ cat: 'supplement', title: 'Magnesium Glycinate 200-400mg', detail: `Sleep averaging ${(sleep.avg/60).toFixed(1)}h (${Math.round(sleep.avg)} min). Magnesium before bed supports GABA activity and improves sleep onset.`, priority: 'high', source: 'Abbasi et al., J Res Med Sci, 2012' });
    recs.push({ cat: 'lifestyle', title: 'Sleep Hygiene Protocol', detail: 'Target 7-9h. No screens 1h before bed, bedroom 65-68°F, consistent schedule even weekends.', priority: 'high', source: 'CDC Sleep Guidelines' });
  }
  if (deep && deep.avg < 60) {
    recs.push({ cat: 'lifestyle', title: 'Increase Deep Sleep', detail: `Deep sleep averaging ${Math.round(deep.avg)} min (target: 60-120). Exercise earlier in the day, avoid alcohol within 3h of bed, keep room cool.`, priority: 'medium', source: 'Walker, Why We Sleep, 2017' });
  }
  if (hrv && hrv.avg < 25) {
    recs.push({ cat: 'supplement', title: 'Omega-3 EPA/DHA 1000-2000mg', detail: `HRV averaging ${hrv.avg}ms — low autonomic flexibility. Omega-3 improves HRV in RCTs.`, priority: 'high', source: 'Xin et al., Eur J Clin Nutr, 2013' });
    recs.push({ cat: 'doctor', title: 'Discuss Low HRV', detail: `HRV ${hrv.avg}ms is below typical range (20-60ms). Persistently low HRV may warrant cardiac evaluation.`, priority: 'high', source: 'Shaffer & Ginsberg, Front Public Health, 2017' });
  } else if (hrv && hrv.trend === 'down' && Math.abs(hrv.trendPct) > 10) {
    recs.push({ cat: 'doctor', title: 'HRV Declining', detail: `HRV dropped ${Math.abs(hrv.trendPct).toFixed(1)}% — could indicate medication effects, overtraining, or stress.`, priority: 'medium', source: 'Clinical guideline' });
  }
  if (steps && steps.avg < 6000) {
    recs.push({ cat: 'lifestyle', title: 'Increase Daily Steps', detail: `Averaging ${Math.round(steps.avg)} steps. Add a 20-min walk after meals — even 7,000 steps/day reduces all-cause mortality 50-70%.`, priority: 'medium', source: 'Paluch et al., Lancet, 2022' });
    recs.push({ cat: 'supplement', title: 'Vitamin D3 1000-2000 IU', detail: 'Low activity correlates with low sun exposure. Vitamin D supports immunity, bone health, and mood.', priority: 'low', source: 'Holick, NEJM, 2007' });
  }
  if (hr && hr.avg > 80) {
    recs.push({ cat: 'lifestyle', title: 'Aerobic Conditioning', detail: `Resting HR ${Math.round(hr.avg)} bpm. Zone 2 cardio 3-5x/week can lower resting HR by 5-15 bpm over 8-12 weeks.`, priority: 'medium', source: 'AHA Exercise Guidelines' });
  }
  if (stress && stress.avg > 45) {
    recs.push({ cat: 'supplement', title: 'Ashwagandha 300-600mg', detail: `Average stress score ${Math.round(stress.avg)} — elevated. Ashwagandha (KSM-66) reduces cortisol by 30% in RCTs.`, priority: 'medium', source: 'Chandrasekhar et al., Indian J Psychol Med, 2012' });
    recs.push({ cat: 'lifestyle', title: 'Stress Reduction', detail: '10-min daily breathwork (box breathing 4-4-4-4) or guided meditation. Even 5 min reduces acute stress markers.', priority: 'medium', source: 'Huberman Lab, Stanford' });
  }
  if (intensity && intensity.avg < 15) {
    recs.push({ cat: 'lifestyle', title: 'More Vigorous Activity', detail: `Only ${Math.round(intensity.avg)} intensity min/day. WHO recommends 150 min moderate or 75 min vigorous per week. Try interval walks or bodyweight circuits.`, priority: 'medium', source: 'WHO Physical Activity Guidelines, 2020' });
  }
  if (battery && battery.avg < 30) {
    recs.push({ cat: 'lifestyle', title: 'Prioritize Recovery', detail: `Body Battery averaging ${Math.round(battery.avg)} — very low. Take a rest day, get to bed 30 min earlier, reduce high-intensity training.`, priority: 'high', source: 'Garmin Body Battery guidance' });
  }
  if (spo2 && spo2.avg < 95) {
    recs.push({ cat: 'doctor', title: 'Low Blood Oxygen', detail: `SpO2 averaging ${spo2.avg}%. Values below 95% warrant medical evaluation — could indicate respiratory or cardiac issues.`, priority: 'high', source: 'Clinical threshold' });
  }
  if (anomalies.filter(a => a.severity === 'high').length >= 3) {
    recs.push({ cat: 'doctor', title: 'Multiple Anomalies', detail: `${anomalies.filter(a => a.severity === 'high').length} high-severity anomalies detected. Schedule a wellness check.`, priority: 'high', source: 'BioGuardian threshold' });
  }
  if (recs.length === 0) {
    recs.push({ cat: 'lifestyle', title: 'Looking Good', detail: 'All metrics within healthy ranges. Keep it up and check back next week.', priority: 'low', source: 'General wellness' });
  }
  return recs;
}

// ---------------------------------------------------------------------------
// Motivation component
// ---------------------------------------------------------------------------

function getMotivation(score: number, summaries: Summary[]): { emoji: string; headline: string; body: string; tone: 'great' | 'good' | 'nudge' | 'urgent' } {
  const badMetrics = summaries.filter(s => s.status === 'bad');
  const decliners = summaries.filter(s => s.trend === 'down' && Math.abs(s.trendPct) > 5);

  if (score >= 80 && badMetrics.length === 0) return {
    emoji: '🔥', headline: 'You\'re crushing it.',
    body: `${score}% of your metrics are in healthy range. Your consistency is building compounding health returns — the kind that adds years, not just days. Keep showing up.`,
    tone: 'great'
  };
  if (score >= 60) return {
    emoji: '💪', headline: 'Solid foundation. Room to push.',
    body: `${score}% in range. ${badMetrics.length > 0 ? badMetrics.map(s => s.def.label).join(' and ') + ' need attention. ' : ''}Small changes compound — one more walk, 30 min more sleep. Future you will thank present you.`,
    tone: 'good'
  };
  if (score >= 40) return {
    emoji: '⚡', headline: 'Time to take control.',
    body: `${badMetrics.length} metrics need work${decliners.length > 0 ? ` and ${decliners.length} are trending down` : ''}. You don't need to fix everything today — pick ONE thing from the recommendations below and start there. Progress beats perfection.`,
    tone: 'nudge'
  };
  return {
    emoji: '🚨', headline: 'Your body is asking for help.',
    body: `${badMetrics.length} metrics are outside healthy range. This isn't about guilt — it's data showing you where to focus. Start with sleep: it's the foundation everything else is built on. Even 30 extra minutes tonight changes tomorrow's numbers.`,
    tone: 'urgent'
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MetricCard: React.FC<{ s: Summary }> = ({ s }) => (
  <div className={`Card Metric-Card status-${s.status}`}>
    <div className="Metric-Header">
      <div className="Metric-Icon" style={{ color: s.def.color }}>{ICON_MAP[s.def.icon]}</div>
      <div><h4>{s.def.label}</h4><span className="Metric-Count">{s.count} readings</span></div>
    </div>
    <div className="Metric-Value" style={{ color: s.def.color }}>{s.avg} <span className="Metric-Unit">{s.def.unit}</span></div>
    <div className="Metric-Range"><span>Low: {s.min}</span><span>High: {s.max}</span></div>
    <div className={`Metric-Trend trend-${s.trend}`}>
      {s.trend === 'up' ? <TrendingUp size={14} /> : s.trend === 'down' ? <TrendingDown size={14} /> : <ArrowRight size={14} />}
      <span>{s.trend === 'stable' ? 'Stable' : `${s.trendPct > 0 ? '+' : ''}${s.trendPct}%`}</span>
    </div>
    {s.anomalyCount > 0 && <div className="Metric-Anomaly-Badge"><AlertTriangle size={12} /> {s.anomalyCount}</div>}
  </div>
);

const MiniChart: React.FC<{ s: Summary }> = ({ s }) => (
  <div className="Card Chart-Card-Mini">
    <h4>{s.def.label} ({s.def.unit})</h4>
    <div style={{ width: '100%', height: 140 }}>
      <ResponsiveContainer>
        <AreaChart data={s.data}>
          <defs><linearGradient id={`g-${s.def.type}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={s.def.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={s.def.color} stopOpacity={0} />
          </linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#30363d" />
          <XAxis dataKey="date" hide />
          <YAxis stroke="#8b949e" fontSize={10} width={45} />
          <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke={s.def.color} fillOpacity={1} fill={`url(#g-${s.def.type})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  const [sleepData, setSleepData] = useState<BiometricReading[]>([]);
  const [activityData, setActivityData] = useState<BiometricReading[]>([]);
  const allReadings = sleepData.concat(activityData);
  const hasData = allReadings.length > 0;
  const { summaries, anomalies, recs, score } = hasData ? analyze(allReadings) : { summaries: [], anomalies: [], recs: [], score: 0 };
  const motivation = hasData ? getMotivation(score, summaries) : null;

  const sleepMetrics = summaries.filter(s => s.def.category === 'sleep');
  const activityMetrics = summaries.filter(s => s.def.category === 'activity');
  const heartMetrics = summaries.filter(s => s.def.category === 'heart');
  const recoveryMetrics = summaries.filter(s => s.def.category === 'recovery');

  return (
    <div className="App premium-theme">
      <nav className="Sidebar">
        <div className="Logo"><ShieldCheck size={32} color="#58a6ff" /><span>BioGuardian</span></div>
        <div className="Nav-Items"><div className="Nav-Item active"><BarChart3 size={20} /> Dashboard</div></div>
        <div className="Privacy-Indicator"><Lock size={14} /><span>LOCAL ONLY</span></div>
      </nav>

      <main className="Main-Content">
        <header className="Top-Bar">
          <div className="Header-Left">
            <h1>BioGuardian</h1>
            <span className="Patient-Badge">{hasData ? `${allReadings.length} readings | ${summaries.length} metrics analyzed` : 'Import your health data to begin'}</span>
          </div>
        </header>

        <section className="Simple-Dashboard">
          <div className="Import-Row">
            <CsvUpload label="Import Sleep Data" hint="Garmin sleep export, Apple Health sleep, or CSV with sleep columns" onDataLoaded={setSleepData} />
            <CsvUpload label="Import Activity Data" hint="Garmin activities, Apple Health steps/exercise, or CSV with activity columns" onDataLoaded={setActivityData} />
          </div>

          {hasData && motivation && (
            <div className={`Card Motivation-Card tone-${motivation.tone}`}>
              <div className="Motivation-Score"><Target size={20} /><span className="Score-Value">{score}%</span><span className="Score-Label">Health Score</span></div>
              <div className="Motivation-Body">
                <span className="Motivation-Emoji">{motivation.emoji}</span>
                <div><h3>{motivation.headline}</h3><p>{motivation.body}</p></div>
              </div>
            </div>
          )}

          {sleepMetrics.length > 0 && (<>
            <h3 className="Section-Title"><Moon size={18} /> Sleep</h3>
            <div className="Metrics-Row">{sleepMetrics.map(s => <MetricCard key={s.def.type} s={s} />)}</div>
            <div className="Charts-Row">{sleepMetrics.filter(s => s.data.length > 1).map(s => <MiniChart key={s.def.type} s={s} />)}</div>
          </>)}

          {activityMetrics.length > 0 && (<>
            <h3 className="Section-Title"><Footprints size={18} /> Activity</h3>
            <div className="Metrics-Row">{activityMetrics.map(s => <MetricCard key={s.def.type} s={s} />)}</div>
            <div className="Charts-Row">{activityMetrics.filter(s => s.data.length > 1).map(s => <MiniChart key={s.def.type} s={s} />)}</div>
          </>)}

          {heartMetrics.length > 0 && (<>
            <h3 className="Section-Title"><Heart size={18} /> Heart</h3>
            <div className="Metrics-Row">{heartMetrics.map(s => <MetricCard key={s.def.type} s={s} />)}</div>
            <div className="Charts-Row">{heartMetrics.filter(s => s.data.length > 1).map(s => <MiniChart key={s.def.type} s={s} />)}</div>
          </>)}

          {recoveryMetrics.length > 0 && (<>
            <h3 className="Section-Title"><Battery size={18} /> Recovery & Stress</h3>
            <div className="Metrics-Row">{recoveryMetrics.map(s => <MetricCard key={s.def.type} s={s} />)}</div>
            <div className="Charts-Row">{recoveryMetrics.filter(s => s.data.length > 1).map(s => <MiniChart key={s.def.type} s={s} />)}</div>
          </>)}

          {anomalies.length > 0 && (
            <div className="Card Anomalies-Card">
              <div className="Card-Header"><AlertTriangle size={18} /><h3>Anomalies ({anomalies.length})</h3></div>
              <div className="Anomaly-List">
                {anomalies.map((a, i) => (
                  <div key={i} className={`Anomaly-Item severity-${a.severity}`}>
                    <div className="Anomaly-Header"><span className={`Severity-Dot ${a.severity}`} /><strong>{a.message}</strong></div>
                    <div className="Anomaly-Detail"><span>{a.date}</span><span>Expected: {a.expected}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recs.length > 0 && (
            <div className="Card Recs-Card">
              <div className="Card-Header"><Stethoscope size={18} /><h3>Recommendations ({recs.length})</h3></div>
              <div className="Recs-List">
                {recs.map((r, i) => (
                  <div key={i} className={`Rec-Card priority-${r.priority}`}>
                    <div className="Rec-Icon">{r.cat === 'supplement' ? <Pill size={20} /> : r.cat === 'doctor' ? <Stethoscope size={20} /> : <Footprints size={20} />}</div>
                    <div className="Rec-Content">
                      <div className="Rec-Title"><strong>{r.title}</strong><span className={`Priority-Tag ${r.priority}`}>{r.priority.toUpperCase()}</span><span className="Category-Tag">{r.cat}</span></div>
                      <p>{r.detail}</p>
                      <span className="Rec-Source">{r.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasData && (
            <div className="Empty-Dashboard Card">
              <Moon size={48} className="Empty-Icon" />
              <h3>Import Your Health Data</h3>
              <p>Use the two upload areas above to import your sleep and activity data separately. Drop CSVs from Garmin Connect, Apple Health, Fitbit, or Oura. BioGuardian analyzes sleep stages, activity levels, heart metrics, stress, and recovery — then generates personalised recommendations.</p>
              <p className="Empty-Hint">All analysis runs locally in your browser. No data is transmitted anywhere.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
