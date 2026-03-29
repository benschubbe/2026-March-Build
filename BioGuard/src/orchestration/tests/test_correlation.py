"""
BioGuardian Correlation Engine — Unit Tests
=============================================

Tests pharmacovigilance-grade statistical methods: Pearson correlation,
Welch's t-test, Cohen's d effect size, Fisher z-transform CI, baseline
comparison, post-dose windowed analysis, Bonferroni correction, and
multi-stream analysis.

Run:
    python -m pytest src/orchestration/tests/test_correlation.py -v
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from orchestration.correlation_engine import (
    analyze_biometric_correlation,
    analyze_post_dose_window,
    bonferroni_alpha,
    cohens_d,
    compare_baseline_observation,
    compute_zscore_deviation,
    fisher_confidence_interval,
    generate_sarah_scenario_data,
    pearson_correlation,
    run_full_analysis,
    welch_t_test,
)


class TestPearsonCorrelation:

    def test_perfect_positive(self):
        x = np.array([1, 2, 3, 4, 5], dtype=float)
        y = np.array([2, 4, 6, 8, 10], dtype=float)
        r, p = pearson_correlation(x, y)
        assert abs(r - 1.0) < 0.001
        assert p < 0.01

    def test_perfect_negative(self):
        x = np.array([1, 2, 3, 4, 5], dtype=float)
        y = np.array([10, 8, 6, 4, 2], dtype=float)
        r, p = pearson_correlation(x, y)
        assert abs(r - (-1.0)) < 0.001

    def test_no_correlation(self):
        np.random.seed(99)
        x = np.random.randn(100)
        y = np.random.randn(100)
        r, p = pearson_correlation(x, y)
        assert abs(r) < 0.3

    def test_insufficient_data(self):
        r, p = pearson_correlation(np.array([1.0, 2.0]), np.array([3.0, 4.0]))
        assert r == 0.0 and p == 1.0


class TestFisherCI:

    def test_strong_correlation_narrow_ci(self):
        lo, hi = fisher_confidence_interval(0.9, 50)
        assert lo > 0.7 and hi < 1.0 and lo < 0.9 < hi

    def test_small_sample_wide_ci(self):
        lo, hi = fisher_confidence_interval(0.5, 5)
        assert (hi - lo) > 0.5


class TestWelchTTest:

    def test_equal_means(self):
        a = np.array([10.0, 10.1, 9.9, 10.0, 10.2])
        b = np.array([10.0, 9.8, 10.1, 10.0, 9.9])
        t, p = welch_t_test(a, b)
        assert p > 0.05  # not significantly different

    def test_different_means(self):
        a = np.array([10.0, 10.1, 9.9, 10.0, 10.2, 10.3, 9.8, 10.1])
        b = np.array([5.0, 5.1, 4.9, 5.0, 5.2, 5.3, 4.8, 5.1])
        t, p = welch_t_test(a, b)
        assert p < 0.01  # clearly different

    def test_unequal_variance(self):
        # Welch's should handle this without assuming equal variance
        a = np.array([10.0, 10.5, 9.5, 11.0, 9.0])  # var = 0.5
        b = np.array([5.0, 5.01, 4.99, 5.0, 5.0])    # var = 0.0001
        t, p = welch_t_test(a, b)
        assert p < 0.05


class TestCohensD:

    def test_large_effect(self):
        np.random.seed(10)
        a = np.random.normal(10.0, 1.0, 20)
        b = np.random.normal(5.0, 1.0, 20)
        d = cohens_d(a, b)
        assert abs(d) > 3.0  # very large (5 SD difference)

    def test_no_effect(self):
        a = np.array([10.0, 10.1, 9.9, 10.0])
        b = np.array([10.0, 9.9, 10.1, 10.0])
        d = cohens_d(a, b)
        assert abs(d) < 0.2  # negligible

    def test_medium_effect(self):
        np.random.seed(42)
        a = np.random.normal(10, 2, 30)
        b = np.random.normal(11, 2, 30)
        d = cohens_d(a, b)
        assert 0.3 < abs(d) < 0.8


class TestBonferroni:

    def test_correction(self):
        assert bonferroni_alpha(0.05, 10) == pytest.approx(0.005)
        assert bonferroni_alpha(0.05, 1) == 0.05

    def test_no_tests(self):
        assert bonferroni_alpha(0.05, 0) == 0.05


class TestBaselineComparison:

    def test_sarah_hrv_shifts(self):
        data = generate_sarah_scenario_data()
        bc = compare_baseline_observation(
            data["hrv"], baseline_days=3, samples_per_day=24, biometric_name="HRV_RMSSD")
        assert bc is not None
        assert bc.observation_mean < bc.baseline_mean  # HRV decreased
        assert bc.direction == "decreased"
        assert bc.percent_change < 0

    def test_clinically_significant_shift(self):
        data = generate_sarah_scenario_data()
        bc = compare_baseline_observation(
            data["hrv"], baseline_days=3, samples_per_day=24, biometric_name="HRV_RMSSD")
        assert bc is not None
        # Cohen's d should indicate at least medium effect
        assert abs(bc.cohens_d) > 0.3

    def test_insufficient_data(self):
        result = compare_baseline_observation(np.array([1.0, 2.0]), baseline_days=3)
        assert result is None


class TestPostDoseWindow:

    def test_sarah_hrv_window(self):
        data = generate_sarah_scenario_data()
        pw = analyze_post_dose_window(
            data["hrv"], data["hours_since_dose"], 0, 4, "HRV_RMSSD")
        assert pw is not None
        assert pw.in_window_mean < pw.out_window_mean  # depressed in window
        assert pw.depression_pct < 0

    def test_window_effect_size(self):
        data = generate_sarah_scenario_data()
        pw = analyze_post_dose_window(
            data["hrv"], data["hours_since_dose"], 0, 4, "HRV_RMSSD")
        assert pw is not None
        # The post-dose window should show a meaningful effect size
        assert abs(pw.cohens_d) > 0.3  # at least small-medium effect
        assert abs(pw.welch_t) > 1.0   # t-statistic indicates real difference


class TestZScore:

    def test_normal_values(self):
        values = np.array([100.0, 100.0, 100.0])
        z = compute_zscore_deviation(values, 100.0, 5.0)
        assert np.allclose(z, 0.0)

    def test_elevated_values(self):
        values = np.array([110.0, 115.0, 120.0])
        z = compute_zscore_deviation(values, 100.0, 5.0)
        assert z[0] == 2.0 and z[2] == 4.0


class TestSarahScenario:

    def test_data_shapes(self):
        data = generate_sarah_scenario_data()
        assert data["n_hours"] == 264
        assert len(data["hrv"]) == 264
        assert len(data["sleep"]) > 0

    def test_hrv_degrades(self):
        data = generate_sarah_scenario_data()
        early = np.mean(data["hrv"][:48])
        late = np.mean(data["hrv"][-48:])
        assert late < early

    def test_reproducible(self):
        d1 = generate_sarah_scenario_data()
        d2 = generate_sarah_scenario_data()
        assert np.array_equal(d1["hrv"], d2["hrv"])


class TestMultiStreamAnalysis:
    """Tests for the full pharmacovigilance-grade analysis."""

    def test_report_structure(self):
        report = run_full_analysis("PT-TEST", "Atorvastatin")
        assert report.patient_id == "PT-TEST"
        assert report.substance == "Atorvastatin"
        assert report.observation_hours == 264

    def test_bonferroni_applied(self):
        report = run_full_analysis()
        assert report.bonferroni_alpha < 0.05
        assert report.tests_performed == 9

    def test_baseline_comparisons_present(self):
        report = run_full_analysis()
        assert len(report.baseline_comparisons) >= 2  # HRV + sleep at minimum

    def test_hrv_baseline_decreased(self):
        report = run_full_analysis()
        hrv_bc = next((bc for bc in report.baseline_comparisons if bc.biometric == "HRV_RMSSD"), None)
        assert hrv_bc is not None
        assert hrv_bc.direction == "decreased"

    def test_post_dose_window_detected(self):
        report = run_full_analysis()
        assert len(report.post_dose_windows) >= 1
        hrv_pw = report.post_dose_windows[0]
        assert hrv_pw.biometric == "HRV_RMSSD"
        assert hrv_pw.in_window_mean < hrv_pw.out_window_mean

    def test_signals_and_suppression(self):
        report = run_full_analysis()
        assert report.signals_emitted + report.signals_suppressed > 0

    def test_effect_sizes_computed(self):
        report = run_full_analysis()
        for bc in report.baseline_comparisons:
            assert isinstance(bc.cohens_d, float)
        for pw in report.post_dose_windows:
            assert isinstance(pw.cohens_d, float)
