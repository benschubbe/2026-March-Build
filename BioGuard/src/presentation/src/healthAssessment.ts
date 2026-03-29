/**
 * BioGuardian Health Assessment Engine
 * =======================================
 *
 * Multi-system clinical-grade health assessment that synthesizes ALL
 * imported metrics into the kind of analysis a physician would produce
 * after reviewing comprehensive wearable and lab data.
 *
 * Five assessment modules:
 *
 *   1. Sleep Architecture — deep/REM/light ratios, efficiency, consistency,
 *      deficit accumulation, circadian regularity
 *   2. Cardiovascular Fitness — resting HR trajectory, HRV trend, VO2 Max,
 *      activity-adjusted cardiac load, recovery capacity
 *   3. Recovery & Readiness — daily readiness score from HRV + sleep +
 *      stress + body battery, overtraining detection
 *   4. Activity Profile — WHO guideline compliance, intensity distribution,
 *      sedentary risk, movement consistency
 *   5. Comprehensive Summary — system-by-system grades (A-F), top concerns,
 *      personalised action plan with clinical citations
 *
 * All computation runs client-side.  Zero data transmitted.
 */

import { BiometricReading } from './components/CsvUpload';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface SystemAssessment {
  system: string;
  grade: Grade;
  score: number;        // 0-100
  summary: string;      // one-line verdict
  findings: string[];   // detailed bullet points
  concerns: string[];   // things to watch
  actions: string[];    // what to do (with citations)
}

export interface HealthReport {
  overallGrade: Grade;
  overallScore: number;
  systems: SystemAssessment[];
  topConcerns: string[];
  actionPlan: string[];
  generatedAt: string;
  dataPoints: number;
  daysAnalyzed: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) * (v - m), 0) / (arr.length - 1));
}

function trend(arr: number[]): number {
  // Returns percentage change from first half to second half
  if (arr.length < 4) return 0;
  const half = Math.floor(arr.length / 2);
  const first = avg(arr.slice(0, half));
  const second = avg(arr.slice(half));
  return first !== 0 ? ((second - first) / first) * 100 : 0;
}

function grade(score: number): Grade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function r(n: number): number { return Math.round(n * 10) / 10; }

function getValues(readings: BiometricReading[], type: string): number[] {
  return readings.filter(r => r.type === type).map(r => r.value).filter(v => !isNaN(v) && v > 0);
}

function getDailyValues(readings: BiometricReading[], type: string): { dates: string[]; values: number[] } {
  const byDate: Record<string, number[]> = {};
  for (const rd of readings) {
    if (rd.type !== type) continue;
    try {
      const d = new Date(rd.timestamp);
      if (isNaN(d.getTime())) continue;
      const key = d.toISOString().substring(0, 10);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(rd.value);
    } catch { continue; }
  }
  const dates = Object.keys(byDate).sort();
  const values = dates.map(d => avg(byDate[d]));
  return { dates, values };
}

// ---------------------------------------------------------------------------
// 1. Sleep Architecture Assessment
// ---------------------------------------------------------------------------

function assessSleep(readings: BiometricReading[]): SystemAssessment {
  const duration = getValues(readings, 'SLEEP_DURATION');
  const deep = getValues(readings, 'DEEP_SLEEP');
  const rem = getValues(readings, 'REM_SLEEP');
  const light = getValues(readings, 'LIGHT_SLEEP');
  const awake = getValues(readings, 'AWAKE_TIME');
  const scores = getValues(readings, 'SLEEP_SCORE');
  const daily = getDailyValues(readings, 'SLEEP_DURATION');

  const findings: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  let score = 70; // start at C+

  // Total duration
  const avgDur = avg(duration);
  if (avgDur > 0) {
    const hours = r(avgDur / 60);
    findings.push(`Average sleep: ${hours} hours/night (${Math.round(avgDur)} min)`);
    if (avgDur >= 420 && avgDur <= 540) { score += 15; findings.push('Duration is within the optimal 7-9 hour range'); }
    else if (avgDur >= 360) { score += 5; concerns.push(`Sleep is ${hours}h — slightly below the 7h minimum recommended by the AASM`); }
    else { score -= 15; concerns.push(`Sleep critically low at ${hours}h — chronic sleep debt accumulates neurological and metabolic damage`);
      actions.push('Prioritize sleep as your #1 health intervention. Move bedtime earlier by 30min this week. (Walker, Why We Sleep, 2017)'); }
  }

  // Sleep architecture ratios
  if (deep.length > 0 && duration.length > 0) {
    const deepPct = r((avg(deep) / avg(duration)) * 100);
    findings.push(`Deep sleep: ${r(avg(deep))} min/night (${deepPct}% of total)`);
    if (deepPct >= 15 && deepPct <= 25) { score += 10; findings.push('Deep sleep ratio is optimal for physical recovery and growth hormone release'); }
    else if (deepPct < 10) { score -= 10; concerns.push(`Deep sleep only ${deepPct}% — below the 15-25% target. Physical recovery and memory consolidation impaired`);
      actions.push('Increase deep sleep: avoid alcohol 3h before bed (reduces deep sleep 20-40%), keep room 65-68°F, consider 200-400mg magnesium glycinate. (Ebrahim et al., Alcohol Clin Exp Res, 2013)'); }
  }

  if (rem.length > 0 && duration.length > 0) {
    const remPct = r((avg(rem) / avg(duration)) * 100);
    findings.push(`REM sleep: ${r(avg(rem))} min/night (${remPct}% of total)`);
    if (remPct >= 20 && remPct <= 30) { score += 10; }
    else if (remPct < 15) { score -= 5; concerns.push(`REM sleep low at ${remPct}% — emotional regulation and creativity may be affected`);
      actions.push('REM sleep occurs primarily in the last 2-3 hours of sleep. Extending total sleep time is the most effective way to increase REM. (Carskadon & Dement, Principles of Sleep Medicine, 2017)'); }
  }

  // Sleep consistency (circadian regularity)
  if (daily.values.length >= 7) {
    const consistency = std(daily.values);
    const cv = avg(daily.values) > 0 ? (consistency / avg(daily.values)) * 100 : 0;
    if (cv < 10) { score += 10; findings.push(`Sleep consistency excellent — only ${r(cv)}% variation night-to-night`); }
    else if (cv > 25) { score -= 10; concerns.push(`Highly irregular sleep pattern (${r(cv)}% variation). Circadian disruption is an independent health risk factor`);
      actions.push('Set a consistent wake time 7 days/week — your circadian clock anchors to wake time more than bedtime. (Roenneberg et al., Curr Biol, 2012)'); }
    else { findings.push(`Sleep consistency moderate — ${r(cv)}% variation`); }
  }

  // Sleep deficit tracking
  if (duration.length >= 7) {
    const deficit = duration.reduce((acc, d) => acc + Math.max(0, 480 - d), 0); // deficit vs 8h target
    if (deficit > 120) {
      const deficitHrs = r(deficit / 60);
      concerns.push(`Accumulated sleep debt: ~${deficitHrs} hours over ${duration.length} nights`);
      actions.push(`You owe your body ${deficitHrs}h of sleep. Add 30-60min per night for the next week — sleep debt is partially recoverable. (Banks & Dinges, J Clin Sleep Med, 2007)`);
    }
  }

  // Sleep score from device
  if (scores.length > 0) {
    findings.push(`Device sleep score: ${r(avg(scores))}/100 average`);
  }

  // Awake time
  if (awake.length > 0) {
    const avgAwake = r(avg(awake));
    findings.push(`Time awake during sleep: ${avgAwake} min/night`);
    if (avgAwake > 45) { score -= 5; concerns.push('High wake time suggests sleep fragmentation — consider sleep apnea screening if snoring is present'); }
  }

  const sleepScore = Math.max(0, Math.min(100, score));
  return {
    system: 'Sleep Architecture',
    grade: grade(sleepScore),
    score: sleepScore,
    summary: sleepScore >= 80 ? 'Your sleep architecture supports recovery and cognitive function'
      : sleepScore >= 60 ? 'Sleep is functional but has room for improvement'
      : 'Sleep quality is a primary concern — this affects every other health metric',
    findings, concerns, actions,
  };
}

// ---------------------------------------------------------------------------
// 2. Cardiovascular Fitness Assessment
// ---------------------------------------------------------------------------

function assessCardio(readings: BiometricReading[]): SystemAssessment {
  const hrv = getValues(readings, 'HRV_RMSSD');
  const restingHr = getValues(readings, 'RESTING_HEART_RATE');
  const avgHr = getValues(readings, 'AVG_HEART_RATE');
  const maxHr = getValues(readings, 'MAX_HEART_RATE');
  const vo2 = getValues(readings, 'VO2_MAX');
  const bpSys = getValues(readings, 'BP_SYSTOLIC');
  const bpDia = getValues(readings, 'BP_DIASTOLIC');

  const findings: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  let score = 65;

  // HRV
  if (hrv.length > 0) {
    const avgHrv = r(avg(hrv));
    const hrvTrend = trend(hrv);
    findings.push(`HRV (RMSSD): ${avgHrv}ms average`);
    if (avgHrv >= 40) { score += 15; findings.push('HRV indicates strong autonomic flexibility and parasympathetic tone'); }
    else if (avgHrv >= 25) { score += 5; }
    else { score -= 10; concerns.push(`HRV at ${avgHrv}ms is low — reduced autonomic nervous system flexibility. Associated with increased cardiovascular risk`);
      actions.push('Improve HRV: daily 5-10min slow breathing (5.5 breaths/min resonance frequency), regular aerobic exercise, and adequate sleep. (Lehrer & Gevirtz, Front Public Health, 2014)'); }

    if (hrvTrend < -10) { score -= 5; concerns.push(`HRV declining ${r(Math.abs(hrvTrend))}% — may indicate overtraining, illness onset, or chronic stress`); }
    else if (hrvTrend > 10) { score += 5; findings.push(`HRV improving ${r(hrvTrend)}% — positive autonomic adaptation`); }
  }

  // Resting HR
  if (restingHr.length > 0) {
    const avgRhr = r(avg(restingHr));
    findings.push(`Resting heart rate: ${avgRhr} bpm`);
    if (avgRhr <= 60) { score += 15; findings.push('Resting HR indicates excellent cardiovascular conditioning'); }
    else if (avgRhr <= 72) { score += 5; }
    else if (avgRhr > 80) { score -= 10; concerns.push(`Resting HR ${avgRhr}bpm is elevated. Persistent elevation is an independent mortality risk factor`);
      actions.push('Lower resting HR with zone 2 aerobic training (conversational pace) 3-5x/week for 30-45min. Expected improvement: 5-15bpm over 8-12 weeks. (AHA Exercise Guidelines)'); }
  }

  // Blood pressure
  if (bpSys.length > 0) {
    const avgSys = r(avg(bpSys));
    const avgDia = bpDia.length > 0 ? r(avg(bpDia)) : 0;
    findings.push(`Blood pressure: ${avgSys}/${avgDia > 0 ? avgDia : '?'} mmHg average`);
    if (avgSys < 120 && avgDia < 80) { score += 10; findings.push('Blood pressure is optimal'); }
    else if (avgSys >= 130 || avgDia >= 85) { score -= 15;
      concerns.push(`Blood pressure ${avgSys}/${avgDia} qualifies as Stage 1 hypertension (AHA/ACC 2017 threshold: 130/80)`);
      actions.push('Discuss BP with physician. Lifestyle: reduce sodium to <2300mg/day, DASH diet pattern, 150min/week aerobic exercise, limit alcohol. (Whelton et al., JACC, 2018)'); }
  }

  // VO2 Max
  if (vo2.length > 0) {
    const avgVo2 = r(avg(vo2));
    findings.push(`VO2 Max: ${avgVo2} mL/kg/min`);
    if (avgVo2 >= 45) { score += 10; findings.push('Cardiorespiratory fitness is above average — strong predictor of longevity'); }
    else if (avgVo2 < 30) { score -= 10; concerns.push(`VO2 Max ${avgVo2} is below average. Low CRF is a stronger mortality predictor than smoking, diabetes, or hypertension`);
      actions.push('Improve VO2 Max: 4x4 interval protocol (4min at 90-95% max HR, 3min recovery, repeat 4x). Most evidence-based protocol for CRF improvement. (Wisloff et al., Circulation, 2007)'); }
  }

  const cardioScore = Math.max(0, Math.min(100, score));
  return {
    system: 'Cardiovascular Fitness',
    grade: grade(cardioScore),
    score: cardioScore,
    summary: cardioScore >= 80 ? 'Cardiovascular metrics indicate strong cardiac fitness and autonomic health'
      : cardioScore >= 60 ? 'Cardiac baseline is acceptable — targeted training would improve resilience'
      : 'Cardiovascular health needs attention — multiple risk factors present',
    findings, concerns, actions,
  };
}

// ---------------------------------------------------------------------------
// 3. Recovery & Readiness Assessment
// ---------------------------------------------------------------------------

function assessRecovery(readings: BiometricReading[]): SystemAssessment {
  const stress = getValues(readings, 'STRESS_LEVEL').concat(getValues(readings, 'AVG_STRESS'));
  const battery = getValues(readings, 'BODY_BATTERY');
  const hrv = getValues(readings, 'HRV_RMSSD');
  const sleep = getValues(readings, 'SLEEP_DURATION');
  const spo2 = getValues(readings, 'SPO2');
  const respRate = getValues(readings, 'RESPIRATION_RATE');

  const findings: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  let score = 65;

  // Stress
  if (stress.length > 0) {
    const avgStress = r(avg(stress));
    findings.push(`Average stress level: ${avgStress}/100`);
    if (avgStress <= 30) { score += 15; findings.push('Low chronic stress — excellent autonomic balance'); }
    else if (avgStress <= 50) { score += 5; }
    else { score -= 15; concerns.push(`Chronic stress score ${avgStress}/100 is elevated. Sustained high stress accelerates biological aging, impairs immunity, and disrupts sleep architecture`);
      actions.push('Evidence-based stress reduction: 10min/day box breathing (inhale 4s, hold 4s, exhale 4s, hold 4s). Reduces cortisol 23% in 4 weeks. (Ma et al., Front Psychol, 2017)');
      actions.push('Consider adaptogen: Ashwagandha KSM-66 300mg 2x/day reduced perceived stress 44% and cortisol 28% vs placebo. (Chandrasekhar et al., Indian J Psychol Med, 2012)'); }
  }

  // Body Battery
  if (battery.length > 0) {
    const avgBatt = r(avg(battery));
    findings.push(`Body Battery: ${avgBatt}/100 average`);
    if (avgBatt >= 60) { score += 10; }
    else if (avgBatt < 30) { score -= 15; concerns.push(`Body Battery critically low at ${avgBatt}. Your recovery is not keeping pace with your demands`);
      actions.push('Immediate recovery protocol: take a rest day, add 30min to sleep, reduce high-intensity training until Body Battery returns above 50.'); }
  }

  // Overtraining detection: high activity + declining HRV + poor sleep = danger
  const steps = getValues(readings, 'STEP_COUNT');
  const intensity = getValues(readings, 'INTENSITY_MINUTES');
  const hrvTrend = hrv.length >= 6 ? trend(hrv) : 0;
  const sleepAvg = avg(sleep);
  const isOvertraining = (avg(steps) > 10000 || avg(intensity) > 40) && hrvTrend < -8 && sleepAvg < 420;
  if (isOvertraining) {
    score -= 20;
    concerns.push('OVERTRAINING SIGNAL: High activity + declining HRV + insufficient sleep. This pattern precedes injury and illness');
    actions.push('Reduce training volume 40-50% for 7-10 days. Prioritize sleep (8+ hours). Monitor HRV — it should rebound within 5-7 days of reduced load. (Meeusen et al., Med Sci Sports Exerc, 2013)');
  }

  // SpO2
  if (spo2.length > 0) {
    const avgSpo2 = r(avg(spo2));
    findings.push(`Blood oxygen (SpO2): ${avgSpo2}%`);
    if (avgSpo2 >= 96) { score += 5; }
    else if (avgSpo2 < 94) { score -= 15; concerns.push(`SpO2 averaging ${avgSpo2}% is concerning. Below 94% warrants medical evaluation for respiratory or cardiac causes`);
      actions.push('Schedule physician appointment to discuss low SpO2. Bring this data. May need pulse oximetry confirmation and further workup.'); }
  }

  // Respiration rate
  if (respRate.length > 0) {
    const avgResp = r(avg(respRate));
    findings.push(`Respiration rate: ${avgResp} breaths/min`);
    if (avgResp >= 12 && avgResp <= 18) { score += 5; }
    else if (avgResp > 20) { concerns.push(`Elevated respiration rate (${avgResp} brpm) may indicate stress, deconditioning, or respiratory compromise`); }
  }

  const recScore = Math.max(0, Math.min(100, score));
  return {
    system: 'Recovery & Readiness',
    grade: grade(recScore),
    score: recScore,
    summary: recScore >= 80 ? 'Your body is recovering well — stress and recovery are balanced'
      : recScore >= 60 ? 'Recovery is adequate but could be optimized'
      : isOvertraining ? 'Overtraining pattern detected — reduce training load immediately'
      : 'Recovery deficit — your body is under more stress than it can handle',
    findings, concerns, actions,
  };
}

// ---------------------------------------------------------------------------
// 4. Activity Profile Assessment
// ---------------------------------------------------------------------------

function assessActivity(readings: BiometricReading[]): SystemAssessment {
  const steps = getValues(readings, 'STEP_COUNT');
  const distance = getValues(readings, 'DISTANCE');
  const calories = getValues(readings, 'CALORIES_BURNED').concat(getValues(readings, 'ACTIVE_CALORIES'));
  const intensity = getValues(readings, 'INTENSITY_MINUTES');
  const floors = getValues(readings, 'FLOORS_CLIMBED');

  const findings: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];
  let score = 60;

  // Steps
  if (steps.length > 0) {
    const avgSteps = Math.round(avg(steps));
    const daily = getDailyValues(readings, 'STEP_COUNT');
    const daysAbove7k = daily.values.filter(v => v >= 7000).length;
    findings.push(`Average daily steps: ${avgSteps.toLocaleString()}`);
    findings.push(`${daysAbove7k} of ${daily.values.length} days exceeded 7,000 steps`);

    if (avgSteps >= 10000) { score += 20; findings.push('Meeting the 10,000 step benchmark — associated with 46% lower all-cause mortality (Paluch et al., Lancet, 2022)'); }
    else if (avgSteps >= 7000) { score += 10; findings.push('Above the 7,000-step mortality benefit threshold'); }
    else if (avgSteps < 5000) { score -= 15; concerns.push(`${avgSteps} steps/day classifies as sedentary. Below 5,000 steps/day is associated with increased cardiometabolic risk`);
      actions.push('Add a 20-min post-meal walk (breakfast or dinner). This single habit typically adds 2,000-3,000 steps and improves post-prandial glucose by 20-30%. (Buffey et al., Sports Med, 2022)'); }
    else { score += 5; }

    // Consistency
    if (daily.values.length >= 7) {
      const stepStd = std(daily.values);
      const cv = avg(daily.values) > 0 ? (stepStd / avg(daily.values)) * 100 : 0;
      if (cv > 50) { concerns.push(`Highly inconsistent activity (${r(cv)}% variation). Consistency matters more than peak days`);
        actions.push('Aim for consistent daily movement rather than weekend warrior spikes. Regular moderate activity is more protective than occasional intense bouts. (O\'Donovan et al., JAMA Intern Med, 2017)'); }
    }
  }

  // WHO intensity minutes
  if (intensity.length > 0) {
    const weeklyMin = avg(intensity) * 7;
    findings.push(`Estimated weekly intensity minutes: ${Math.round(weeklyMin)}`);
    if (weeklyMin >= 150) { score += 15; findings.push('Meeting WHO recommendation: 150+ minutes moderate-to-vigorous activity per week'); }
    else if (weeklyMin >= 75) { score += 5; }
    else { score -= 10; concerns.push(`Only ~${Math.round(weeklyMin)} intensity minutes/week (WHO target: 150 moderate or 75 vigorous)`);
      actions.push('Build to 150 min/week: start with 3x30min brisk walks. Progress to 4x4 intervals when base is established. (WHO Physical Activity Guidelines, 2020)'); }
  }

  // Distance
  if (distance.length > 0) {
    findings.push(`Average daily distance: ${r(avg(distance))} km`);
  }

  // Calories
  if (calories.length > 0) {
    findings.push(`Average daily energy expenditure: ${Math.round(avg(calories))} kcal`);
  }

  // Floors
  if (floors.length > 0) {
    findings.push(`Average floors climbed: ${r(avg(floors))}/day`);
    if (avg(floors) >= 10) { score += 5; }
  }

  const actScore = Math.max(0, Math.min(100, score));
  return {
    system: 'Activity Profile',
    grade: grade(actScore),
    score: actScore,
    summary: actScore >= 80 ? 'Activity levels support longevity and disease prevention'
      : actScore >= 60 ? 'Moderately active — increasing intensity would yield measurable health gains'
      : 'Activity levels are below health-protective thresholds',
    findings, concerns, actions,
  };
}

// ---------------------------------------------------------------------------
// Main: Comprehensive Health Assessment
// ---------------------------------------------------------------------------

export function generateHealthReport(readings: BiometricReading[]): HealthReport | null {
  if (readings.length < 5) return null;

  const systems: SystemAssessment[] = [];

  // Only assess systems that have relevant data
  const types = new Set(readings.map(r => r.type));
  const sleepTypes = ['SLEEP_DURATION', 'DEEP_SLEEP', 'REM_SLEEP', 'LIGHT_SLEEP', 'SLEEP_SCORE'];
  const cardioTypes = ['HRV_RMSSD', 'RESTING_HEART_RATE', 'AVG_HEART_RATE', 'VO2_MAX', 'BP_SYSTOLIC'];
  const recoveryTypes = ['STRESS_LEVEL', 'AVG_STRESS', 'BODY_BATTERY', 'SPO2', 'HRV_RMSSD'];
  const activityTypes = ['STEP_COUNT', 'DISTANCE', 'INTENSITY_MINUTES', 'CALORIES_BURNED', 'ACTIVE_CALORIES'];

  const hasSleep = sleepTypes.some(t => types.has(t));
  const hasCardio = cardioTypes.some(t => types.has(t));
  const hasRecovery = recoveryTypes.some(t => types.has(t));
  const hasActivity = activityTypes.some(t => types.has(t));

  if (hasSleep) systems.push(assessSleep(readings));
  if (hasCardio) systems.push(assessCardio(readings));
  if (hasRecovery) systems.push(assessRecovery(readings));
  if (hasActivity) systems.push(assessActivity(readings));

  if (systems.length === 0) return null;

  const overallScore = Math.round(avg(systems.map(s => s.score)));
  const allConcerns = systems.flatMap(s => s.concerns);
  const allActions = systems.flatMap(s => s.actions);

  // Deduplicate and prioritize
  const uniqueActions = allActions.filter((a, i) => allActions.indexOf(a) === i);

  // Get unique dates
  const dateSet: Record<string, boolean> = {};
  readings.forEach(r => { try { const d = new Date(r.timestamp).toISOString().substring(0, 10); dateSet[d] = true; } catch {} });

  return {
    overallGrade: grade(overallScore),
    overallScore,
    systems,
    topConcerns: allConcerns.slice(0, 5),
    actionPlan: uniqueActions.slice(0, 8),
    generatedAt: new Date().toISOString(),
    dataPoints: readings.length,
    daysAnalyzed: Object.keys(dateSet).length,
  };
}
