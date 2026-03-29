"""
BioGuardian Correlation Engine — Unit Tests
=============================================

Tests real NumPy-based Pearson correlation computation, Fisher z-transform
confidence intervals, and the Sarah scenario data generator.

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
    compute_zscore_deviation,
    fisher_confidence_interval,
    generate_sarah_scenario_data,
    pearson_correlation,
)


class TestPearsonCorrelation:
    """Test the core Pearson r computation."""

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
        assert p < 0.01

    def test_no_correlation(self):
        np.random.seed(99)
        x = np.random.randn(100)
        y = np.random.randn(100)
        r, p = pearson_correlation(x, y)
        assert abs(r) < 0.3  # Should be near zero
        assert p > 0.01  # Should not be significant

    def test_known_correlation(self):
        x = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
        y = np.array([2, 4, 5, 4, 5, 7, 8, 9, 10, 12], dtype=float)
        r, p = pearson_correlation(x, y)
        assert 0.95 < r < 1.0  # Strong positive
        assert p < 0.05

    def test_insufficient_data(self):
        r, p = pearson_correlation(np.array([1.0, 2.0]), np.array([3.0, 4.0]))
        assert r == 0.0
        assert p == 1.0


class TestFisherCI:
    """Test Fisher z-transform confidence intervals."""

    def test_strong_correlation_ci(self):
        lo, hi = fisher_confidence_interval(0.9, 50)
        assert lo > 0.7
        assert hi < 1.0
        assert lo < 0.9 < hi

    def test_weak_correlation_ci(self):
        lo, hi = fisher_confidence_interval(0.1, 50)
        assert lo < 0.1
        assert hi > 0.1

    def test_small_sample_wide_ci(self):
        lo, hi = fisher_confidence_interval(0.5, 5)
        # Small sample should give wide CI
        ci_width = hi - lo
        assert ci_width > 0.5


class TestZScore:
    """Test Z-score deviation computation."""

    def test_normal_values(self):
        values = np.array([100.0, 100.0, 100.0])
        z = compute_zscore_deviation(values, 100.0, 5.0)
        assert np.allclose(z, 0.0)

    def test_elevated_values(self):
        values = np.array([110.0, 115.0, 120.0])
        z = compute_zscore_deviation(values, 100.0, 5.0)
        assert z[0] == 2.0
        assert z[1] == 3.0
        assert z[2] == 4.0


class TestSarahScenario:
    """Test the Sarah scenario data generator."""

    def test_data_shapes(self):
        data = generate_sarah_scenario_data()
        assert data["n_hours"] == 264  # 11 days
        assert len(data["hrv"]) == 264
        assert len(data["hours_since_dose"]) == 264
        assert len(data["sleep"]) > 0
        assert len(data["glucose"]) > 0

    def test_hrv_degrades(self):
        data = generate_sarah_scenario_data()
        hrv = data["hrv"]
        # HRV should be lower at end than start (ADE effect)
        early_mean = np.mean(hrv[:48])  # First 2 days
        late_mean = np.mean(hrv[-48:])  # Last 2 days
        assert late_mean < early_mean

    def test_reproducible(self):
        d1 = generate_sarah_scenario_data()
        d2 = generate_sarah_scenario_data()
        assert np.array_equal(d1["hrv"], d2["hrv"])


class TestAnalyzeBiometricCorrelation:
    """Test the full analysis pipeline."""

    def test_significant_result(self):
        np.random.seed(42)
        n = 100
        x = np.linspace(0, 10, n)
        y = -2 * x + np.random.normal(0, 1, n)  # Strong negative correlation
        result = analyze_biometric_correlation(
            y.tolist(), x.tolist(), "TEST_METRIC", "test_event", 96
        )
        assert result is not None
        assert result.significant
        assert result.pearson_r < -0.5
        assert result.p_value < 0.05
        assert result.severity in ("HIGH", "MEDIUM", "LOW")

    def test_window_too_short(self):
        result = analyze_biometric_correlation(
            [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], "TEST", "event",
            window_hours=48, min_window=72,
        )
        assert result is None

    def test_insufficient_data(self):
        result = analyze_biometric_correlation(
            [1, 2], [1, 2], "TEST", "event", 96,
        )
        assert result is None

    def test_sarah_hrv_analysis(self):
        """Run the actual Sarah scenario analysis."""
        data = generate_sarah_scenario_data()
        result = analyze_biometric_correlation(
            data["hrv"].tolist(),
            data["hours_since_dose"].tolist(),
            "HRV_RMSSD", "evening_dose", 96,
        )
        assert result is not None
        assert result.significant
        assert result.n_samples > 200
