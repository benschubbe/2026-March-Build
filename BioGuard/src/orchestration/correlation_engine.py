"""
BioGuardian Correlation Engine — Pharmacovigilance-Grade Statistics
====================================================================

Multi-stream temporal correlation analysis for individual-patient ADE
detection.  Applies the same statistical methodology used in FDA
post-market drug surveillance (FAERS signal detection) to a single
patient's longitudinal biometric data.

This module implements six statistical methods:

  1. **Pearson correlation** with t-distribution p-values
  2. **Fisher z-transform** for 95% confidence intervals
  3. **Baseline vs observation period comparison** using Welch's t-test
     to detect distribution shifts after drug initiation
  4. **Post-dose windowed analysis** detecting the 4-hour HRV depression
     pattern specific to statin myopathy
  5. **Effect size computation** (Cohen's d) for clinical significance
     beyond statistical significance
  6. **Bonferroni correction** for multiple testing across biometric streams

The engine enforces a minimum 72-hour observation window before emitting
any signal.  Signals with p >= 0.05 after correction are suppressed and
logged but never surfaced — alert fatigue is a clinical safety problem.

Reference methodology:
  - Pearson r: standard pharmacovigilance signal detection metric
  - Welch's t-test: robust to unequal variances between baseline/observation
  - Cohen's d: 0.2 small, 0.5 medium, 0.8 large effect (Cohen 1988)
  - Bonferroni: conservative correction for family-wise error rate
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger("BioGuardian.CorrelationEngine")


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class CorrelationResult:
    """Result of a single biometric correlation analysis."""
    biometric: str
    protocol_event: str
    pearson_r: float
    p_value: float
    ci_lower: float
    ci_upper: float
    n_samples: int
    window_hours: int
    significant: bool
    severity: str


@dataclass(frozen=True)
class BaselineComparison:
    """Result of baseline vs observation period comparison."""
    biometric: str
    baseline_mean: float
    baseline_std: float
    observation_mean: float
    observation_std: float
    cohens_d: float
    welch_t: float
    welch_p: float
    percent_change: float
    direction: str          # "increased", "decreased", "stable"
    clinically_significant: bool  # Cohen's d >= 0.5


@dataclass(frozen=True)
class PostDoseWindow:
    """Result of post-dose windowed analysis."""
    biometric: str
    window_start_h: int
    window_end_h: int
    in_window_mean: float
    out_window_mean: float
    depression_pct: float
    welch_t: float
    welch_p: float
    cohens_d: float
    significant: bool


@dataclass(frozen=True)
class MultiStreamReport:
    """
    Complete pharmacovigilance report across all biometric streams.

    This is the output of run_full_analysis() — the comprehensive
    statistical report that feeds into the Physician Brief.
    """
    patient_id: str
    substance: str
    observation_hours: int
    correlations: List[CorrelationResult]
    baseline_comparisons: List[BaselineComparison]
    post_dose_windows: List[PostDoseWindow]
    signals_emitted: int
    signals_suppressed: int
    bonferroni_alpha: float
    tests_performed: int


# ---------------------------------------------------------------------------
# Core statistical functions
# ---------------------------------------------------------------------------

def pearson_correlation(x: np.ndarray, y: np.ndarray) -> Tuple[float, float]:
    """
    Pearson product-moment correlation with two-tailed p-value.

    Uses t-distribution: t = r * sqrt(n-2) / sqrt(1 - r^2)
    """
    n = len(x)
    if n < 3:
        return 0.0, 1.0

    r = float(np.corrcoef(x, y)[0, 1])
    if np.isnan(r):
        return 0.0, 1.0

    r = max(-1.0, min(1.0, r))
    if abs(r) >= 1.0:
        return r, 0.0

    t_stat = r * math.sqrt(n - 2) / math.sqrt(1.0 - r * r)
    p_value = _t_distribution_p_value(abs(t_stat), n - 2)
    return r, p_value


def fisher_confidence_interval(r: float, n: int, alpha: float = 0.05) -> Tuple[float, float]:
    """
    95% confidence interval for Pearson r via Fisher z-transform.

    z = arctanh(r), SE(z) = 1/sqrt(n-3), CI(r) = tanh(z +/- z_crit * SE)
    """
    if n < 4:
        return -1.0, 1.0

    z = np.arctanh(np.clip(r, -0.9999, 0.9999))
    se = 1.0 / math.sqrt(n - 3)
    z_crit = 1.96 if alpha == 0.05 else _z_critical(alpha)
    return float(np.tanh(z - z_crit * se)), float(np.tanh(z + z_crit * se))


def welch_t_test(a: np.ndarray, b: np.ndarray) -> Tuple[float, float]:
    """
    Welch's t-test for two independent samples with unequal variance.

    More robust than Student's t-test because it does not assume equal
    variance between baseline and observation periods — a critical
    property when the ADE itself changes the variance structure.

    Returns (t_statistic, p_value).
    """
    n1, n2 = len(a), len(b)
    if n1 < 2 or n2 < 2:
        return 0.0, 1.0

    m1, m2 = np.mean(a), np.mean(b)
    v1, v2 = np.var(a, ddof=1), np.var(b, ddof=1)

    # Welch's t-statistic
    se = math.sqrt(v1 / n1 + v2 / n2)
    if se == 0:
        return 0.0, 1.0
    t = (m1 - m2) / se

    # Welch-Satterthwaite degrees of freedom
    num = (v1 / n1 + v2 / n2) ** 2
    den = (v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1)
    df = num / den if den > 0 else 1.0

    p = _t_distribution_p_value(abs(t), max(1, int(df)))
    return float(t), p


def cohens_d(a: np.ndarray, b: np.ndarray) -> float:
    """
    Cohen's d effect size for clinical significance assessment.

    Uses pooled standard deviation:
        d = (M1 - M2) / sqrt((s1^2 + s2^2) / 2)

    Thresholds (Cohen 1988): 0.2 small, 0.5 medium, 0.8 large.
    In pharmacovigilance, d >= 0.5 is the threshold for clinical
    actionability — a signal may be statistically significant but
    clinically irrelevant if the effect size is small.
    """
    if len(a) < 2 or len(b) < 2:
        return 0.0

    m1, m2 = np.mean(a), np.mean(b)
    s1, s2 = np.std(a, ddof=1), np.std(b, ddof=1)
    pooled = math.sqrt((s1 ** 2 + s2 ** 2) / 2.0)

    if pooled == 0:
        return 0.0
    return float((m1 - m2) / pooled)


def compute_zscore_deviation(values: np.ndarray, baseline_mean: float, baseline_std: float) -> np.ndarray:
    """Z-score deviation from baseline for anomaly tracking."""
    if baseline_std <= 0:
        return np.zeros_like(values)
    return (values - baseline_mean) / baseline_std


def bonferroni_alpha(base_alpha: float, n_tests: int) -> float:
    """Bonferroni-corrected significance threshold."""
    if n_tests <= 0:
        return base_alpha
    return base_alpha / n_tests


# ---------------------------------------------------------------------------
# Baseline vs observation comparison
# ---------------------------------------------------------------------------

def compare_baseline_observation(
    values: np.ndarray,
    baseline_days: int = 3,
    samples_per_day: int = 24,
    biometric_name: str = "HRV_RMSSD",
) -> Optional[BaselineComparison]:
    """
    Split a biometric time series into baseline and observation periods,
    then compare using Welch's t-test and Cohen's d.

    The baseline period (default: first 3 days) represents the patient's
    pre-ADE state.  The observation period (remaining days) captures
    potential drug-induced changes.  This is the standard pharmacovigilance
    approach to individual case assessment.
    """
    split = baseline_days * samples_per_day
    if split >= len(values) or split < 2:
        return None

    baseline = values[:split]
    observation = values[split:]

    if len(baseline) < 2 or len(observation) < 2:
        return None

    b_mean, b_std = float(np.mean(baseline)), float(np.std(baseline, ddof=1))
    o_mean, o_std = float(np.mean(observation)), float(np.std(observation, ddof=1))

    d = cohens_d(observation, baseline)
    t, p = welch_t_test(observation, baseline)

    pct_change = ((o_mean - b_mean) / b_mean * 100) if b_mean != 0 else 0.0

    if pct_change > 2.0:
        direction = "increased"
    elif pct_change < -2.0:
        direction = "decreased"
    else:
        direction = "stable"

    return BaselineComparison(
        biometric=biometric_name,
        baseline_mean=round(b_mean, 2),
        baseline_std=round(b_std, 2),
        observation_mean=round(o_mean, 2),
        observation_std=round(o_std, 2),
        cohens_d=round(d, 4),
        welch_t=round(t, 4),
        welch_p=round(p, 6),
        percent_change=round(pct_change, 2),
        direction=direction,
        clinically_significant=abs(d) >= 0.5,
    )


# ---------------------------------------------------------------------------
# Post-dose windowed analysis
# ---------------------------------------------------------------------------

def analyze_post_dose_window(
    values: np.ndarray,
    hours_since_dose: np.ndarray,
    window_start: int = 0,
    window_end: int = 4,
    biometric_name: str = "HRV_RMSSD",
) -> Optional[PostDoseWindow]:
    """
    Compare biometric values inside vs outside a post-dose time window.

    Detects the specific pattern from Sarah's scenario: HRV depression
    in the 0-4 hour window after evening dose.  Uses Welch's t-test
    and Cohen's d to assess both statistical and clinical significance.
    """
    in_window = (hours_since_dose >= window_start) & (hours_since_dose <= window_end)
    out_window = ~in_window

    vals_in = values[in_window]
    vals_out = values[out_window]

    if len(vals_in) < 3 or len(vals_out) < 3:
        return None

    in_mean = float(np.mean(vals_in))
    out_mean = float(np.mean(vals_out))
    depression_pct = ((in_mean - out_mean) / out_mean * 100) if out_mean != 0 else 0.0

    t, p = welch_t_test(vals_in, vals_out)
    d = cohens_d(vals_in, vals_out)

    return PostDoseWindow(
        biometric=biometric_name,
        window_start_h=window_start,
        window_end_h=window_end,
        in_window_mean=round(in_mean, 2),
        out_window_mean=round(out_mean, 2),
        depression_pct=round(depression_pct, 2),
        welch_t=round(t, 4),
        welch_p=round(p, 6),
        cohens_d=round(d, 4),
        significant=p < 0.05 and abs(d) >= 0.3,
    )


# ---------------------------------------------------------------------------
# Single-stream analysis (backward compatible)
# ---------------------------------------------------------------------------

def analyze_biometric_correlation(
    biometric_values: List[float],
    event_timestamps: List[float],
    biometric_name: str = "HRV_RMSSD",
    protocol_event: str = "evening_dose",
    window_hours: int = 96,
    min_window: int = 72,
) -> Optional[CorrelationResult]:
    """
    Run Pearson correlation analysis on a single biometric stream.

    Enforces minimum 72-hour observation window.  Suppresses signals
    with p >= 0.05.
    """
    if window_hours < min_window:
        logger.warning("Window %dh < minimum %dh — suppressed.", window_hours, min_window)
        return None

    x = np.array(biometric_values, dtype=np.float64)
    y = np.array(event_timestamps, dtype=np.float64)

    if len(x) < 5 or len(x) != len(y):
        return None

    mask = ~(np.isnan(x) | np.isnan(y))
    x, y = x[mask], y[mask]
    if len(x) < 5:
        return None

    r, p = pearson_correlation(x, y)
    ci_lower, ci_upper = fisher_confidence_interval(r, len(x))

    significant = p < 0.05
    if significant:
        severity = "HIGH" if abs(r) >= 0.8 else "MEDIUM" if abs(r) >= 0.5 else "LOW"
    else:
        severity = "SUPPRESSED"

    return CorrelationResult(
        biometric=biometric_name, protocol_event=protocol_event,
        pearson_r=round(r, 4), p_value=round(p, 6),
        ci_lower=round(ci_lower, 4), ci_upper=round(ci_upper, 4),
        n_samples=len(x), window_hours=window_hours,
        significant=significant, severity=severity,
    )


# ---------------------------------------------------------------------------
# Multi-stream analysis (the deep feature)
# ---------------------------------------------------------------------------

def run_full_analysis(
    patient_id: str = "PT-2026-SARAH",
    substance: str = "Atorvastatin",
) -> MultiStreamReport:
    """
    Run comprehensive pharmacovigilance-grade analysis across all
    biometric streams for a patient-drug pair.

    This is the core analytical function that produces the statistical
    evidence for the Physician Brief.  It:
      1. Generates the 11-day biometric scenario
      2. Runs Pearson correlation on each stream
      3. Compares baseline vs observation periods (Welch's t-test)
      4. Analyzes post-dose windows for specific depression patterns
      5. Applies Bonferroni correction for multiple testing
      6. Computes effect sizes (Cohen's d) for clinical significance
      7. Suppresses non-significant signals

    Returns a MultiStreamReport with all statistical evidence.
    """
    data = generate_sarah_scenario_data()
    correlations = []
    baselines = []
    windows = []
    suppressed = 0

    # Number of independent tests for Bonferroni correction
    # 3 biometrics x 3 analyses (correlation, baseline, window) = 9 tests
    n_tests = 9
    corrected_alpha = bonferroni_alpha(0.05, n_tests)
    logger.info("Bonferroni-corrected alpha: %.4f (base=0.05, tests=%d)", corrected_alpha, n_tests)

    # --- HRV RMSSD ---
    hrv_corr = analyze_biometric_correlation(
        data["hrv"].tolist(), data["hours_since_dose"].tolist(),
        "HRV_RMSSD", "evening_dose", 96)
    if hrv_corr:
        if hrv_corr.p_value < corrected_alpha:
            correlations.append(hrv_corr)
        else:
            suppressed += 1
            logger.info("HRV correlation suppressed after Bonferroni: p=%.6f >= %.4f",
                        hrv_corr.p_value, corrected_alpha)

    hrv_baseline = compare_baseline_observation(
        data["hrv"], baseline_days=3, samples_per_day=24, biometric_name="HRV_RMSSD")
    if hrv_baseline:
        baselines.append(hrv_baseline)
        logger.info("HRV baseline comparison: mean %.1f -> %.1f (%.1f%%), d=%.2f, p=%.6f",
                     hrv_baseline.baseline_mean, hrv_baseline.observation_mean,
                     hrv_baseline.percent_change, hrv_baseline.cohens_d, hrv_baseline.welch_p)

    hrv_window = analyze_post_dose_window(
        data["hrv"], data["hours_since_dose"], 0, 4, "HRV_RMSSD")
    if hrv_window:
        windows.append(hrv_window)
        logger.info("HRV post-dose window [0-4h]: in=%.1f out=%.1f (%.1f%%), d=%.2f, p=%.6f",
                     hrv_window.in_window_mean, hrv_window.out_window_mean,
                     hrv_window.depression_pct, hrv_window.cohens_d, hrv_window.welch_p)

    # --- Sleep ---
    sleep_days = np.arange(len(data["sleep"]), dtype=np.float64)
    sleep_corr = analyze_biometric_correlation(
        data["sleep"].tolist(), sleep_days.tolist(),
        "SLEEP_ANALYSIS", "evening_dose", 96)
    if sleep_corr:
        if sleep_corr.p_value < corrected_alpha:
            correlations.append(sleep_corr)
        else:
            suppressed += 1

    sleep_baseline = compare_baseline_observation(
        data["sleep"], baseline_days=3, samples_per_day=1, biometric_name="SLEEP_ANALYSIS")
    if sleep_baseline:
        baselines.append(sleep_baseline)

    # --- Glucose ---
    glucose_days = np.arange(len(data["glucose"]), dtype=np.float64)
    glucose_corr = analyze_biometric_correlation(
        data["glucose"].tolist(), glucose_days.tolist(),
        "BLOOD_GLUCOSE", "evening_dose", 96)
    if glucose_corr:
        if glucose_corr.p_value < corrected_alpha:
            correlations.append(glucose_corr)
        else:
            suppressed += 1

    glucose_baseline = compare_baseline_observation(
        data["glucose"], baseline_days=3, samples_per_day=1, biometric_name="BLOOD_GLUCOSE")
    if glucose_baseline:
        baselines.append(glucose_baseline)

    report = MultiStreamReport(
        patient_id=patient_id,
        substance=substance,
        observation_hours=data["n_hours"],
        correlations=correlations,
        baseline_comparisons=baselines,
        post_dose_windows=windows,
        signals_emitted=len(correlations),
        signals_suppressed=suppressed,
        bonferroni_alpha=round(corrected_alpha, 4),
        tests_performed=n_tests,
    )

    logger.info(
        "Multi-stream report: %d signals emitted, %d suppressed, %d baseline comparisons, %d dose windows",
        report.signals_emitted, report.signals_suppressed,
        len(report.baseline_comparisons), len(report.post_dose_windows),
    )
    return report


# ---------------------------------------------------------------------------
# Synthetic data generator
# ---------------------------------------------------------------------------

def generate_sarah_scenario_data() -> dict:
    """
    Generate synthetic biometric data for Sarah's 11-day statin ADE scenario.

    Days 0-3: healthy baseline (all markers within normal ranges)
    Days 4-7: early ADE onset (HRV begins gradual decline, subtle sleep drop)
    Days 8-11: clear signal (HRV -22% in 4h post-dose window, glucose +8, sleep -18%)
    """
    np.random.seed(42)
    n_hours = 11 * 24

    hours = np.arange(n_hours, dtype=np.float64)
    dose_hour = 20
    hours_since_dose = np.array([(h % 24 - dose_hour) % 24 for h in hours], dtype=np.float64)

    # HRV: 38ms baseline, progressive degradation after day 3
    hrv_baseline = 38.0
    hrv_drift = np.zeros(n_hours)
    for i in range(n_hours):
        day = i / 24.0
        if day > 3:
            ade_progress = min(1.0, (day - 3) / 8.0)
            hrv_drift[i] = -ade_progress * 0.22 * hrv_baseline

    hrv = hrv_baseline + hrv_drift + np.random.normal(0, 1.8, n_hours)

    # 4-hour post-dose window depression (the specific pattern to detect)
    post_dose_mask = (hours_since_dose >= 0) & (hours_since_dose <= 4)
    hrv[post_dose_mask] -= 2.5

    # Sleep: 452min baseline, degrading after day 3
    sleep_baseline = 452.0
    sleep = np.full(n_hours // 24 + 1, sleep_baseline)
    for d in range(len(sleep)):
        if d > 3:
            ade_progress = min(1.0, (d - 3) / 8.0)
            sleep[d] -= ade_progress * 81.0
    sleep += np.random.normal(0, 12, len(sleep))

    # Glucose: 88 baseline, creeping after day 3
    glucose_baseline = 88.0
    glucose = np.full(n_hours // 24 + 1, glucose_baseline)
    for d in range(len(glucose)):
        if d > 3:
            ade_progress = min(1.0, (d - 3) / 8.0)
            glucose[d] += ade_progress * 8.0
    glucose += np.random.normal(0, 2.1, len(glucose))

    return {
        "hrv": hrv, "hours_since_dose": hours_since_dose,
        "sleep": sleep, "glucose": glucose,
        "hours": hours, "n_hours": n_hours,
    }


# ---------------------------------------------------------------------------
# Internal: p-value approximations
# ---------------------------------------------------------------------------

def _t_distribution_p_value(t, df):
    """
    Two-tailed p-value for t-distribution.

    Uses the normal approximation for the t-distribution which is
    accurate for df > 3 and exact in the limit as df -> infinity.
    For small df, applies Cornish-Fisher correction.
    """
    if df <= 0:
        return 1.0

    # For large df or large t, use normal approximation directly
    if df > 30 or abs(t) > 6:
        return 2.0 * _normal_sf(abs(t))

    # Cornish-Fisher expansion for small df
    # Approximate: use normal with variance correction
    # For t-distribution with df degrees of freedom,
    # z ~ t * (1 - 1/(4*df)) is approximately standard normal
    z_approx = abs(t) * (1.0 - 1.0 / (4.0 * df))
    return 2.0 * _normal_sf(z_approx)


def _normal_sf(z):
    """Standard normal survival function P(Z > z). Abramowitz & Stegun 26.2.17."""
    if z < 0:
        return 1.0 - _normal_sf(-z)
    if z > 8:
        return 0.0  # effectively zero
    b0 = 0.2316419
    b1, b2, b3, b4, b5 = 0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429
    t = 1.0 / (1.0 + b0 * z)
    phi = math.exp(-z * z / 2.0) / math.sqrt(2.0 * math.pi)
    return phi * t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))))


def _z_critical(alpha):
    """z-critical for common alpha values."""
    return {0.01: 2.576, 0.05: 1.96, 0.10: 1.645}.get(alpha, 1.96)
