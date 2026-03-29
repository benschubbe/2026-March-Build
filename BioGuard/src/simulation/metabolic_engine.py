"""
BioGuardian Metabolic Simulation Engine (v2.1)
===============================================

A state-space model based on the Minimal Model of Glucose-Insulin Kinetics
(Bergman et al., 1979) extended with pharmacodynamic (PD) modulation for
the drug classes relevant to BioGuardian's target population:

  - **Metformin**: Enhances insulin sensitivity (S_I) and reduces hepatic
    glucose output (p1).
  - **Statins** (Atorvastatin, Simvastatin, Rosuvastatin): Modulates
    insulin sensitivity as a secondary metabolic effect; HMG-CoA reductase
    inhibition can impair mitochondrial function, reducing HRV (the
    primary ADE signal in Sarah's scenario).
  - **Lisinopril**: ACE inhibitor with minor metabolic cross-talk.
  - **Magnesium**: Supplement with insulin-sensitizing properties and
    potential statin interaction on muscle recovery.

The engine simulates the glucose-insulin differential equation via Euler
integration at 1-minute resolution, with biological safety bounds
[35, 550] mg/dL to prevent non-physiological states.

Usage:
    engine = MetabolicEngine(baseline_glucose=95.0)
    engine.apply_medication("Metformin", 1000)
    engine.apply_medication("Atorvastatin", 20)
    for minute in range(120):
        glucose = engine.simulate_step(carbohydrate_intake=(50.0 if minute == 0 else 0))
"""

from __future__ import annotations

import math


class MetabolicEngine:
    """
    Minimal Model of Glucose-Insulin Kinetics with pharmacodynamic extensions.

    Attributes
    ----------
    glucose : float
        Current plasma glucose concentration (mg/dL).
    s_i : float
        Insulin sensitivity — ability of insulin to enhance glucose
        disappearance.
    p1 : float
        Glucose effectiveness — ability of glucose to enhance its own
        disappearance at basal insulin.
    hrv_modifier : float
        Multiplicative modifier on HRV from drug effects.  1.0 = no change.
        Values < 1.0 indicate HRV depression (e.g. statin myopathy).
    dt : float
        Simulation time step in minutes.
    """

    # Physiological safety bounds (mg/dL)
    _GLUCOSE_MIN = 35.0
    _GLUCOSE_MAX = 550.0

    # Baseline parameters
    _BASELINE_GLUCOSE = 95.0  # Recovery target (mg/dL)
    _BASAL_INSULIN = 4.0      # Basal insulin (uU/mL) — T2D patients have reduced secretion

    def __init__(
        self,
        baseline_glucose: float = 95.0,
        insulin_sensitivity: float = 0.012,
        glucose_effectiveness: float = 0.05,
    ) -> None:
        self.glucose = baseline_glucose
        self.s_i = insulin_sensitivity
        self.p1 = glucose_effectiveness
        self.hrv_modifier = 1.0
        self.dt = 1.0  # 1-minute resolution
        self._medications: list[dict[str, float | str]] = []

    def apply_medication(self, drug_id: str, dose_mg: float) -> str:
        """
        Modulate physiological parameters based on drug pharmacodynamics.

        Parameters
        ----------
        drug_id : str
            Medication identifier (e.g. "Metformin", "Atorvastatin").
        dose_mg : float
            Dosage in milligrams.

        Returns
        -------
        str
            Description of the pharmacodynamic effect applied.
        """
        name = drug_id.lower()
        self._medications.append({"drug": drug_id, "dose_mg": dose_mg})

        if name == "metformin":
            # Metformin enhances insulin sensitivity and reduces hepatic glucose output.
            # Clinical effect: ~15-20% improvement in S_I at therapeutic dose (1000mg).
            improvement = (dose_mg / 1000.0) * 0.18
            self.s_i *= (1.0 + improvement)
            self.p1 *= 1.08
            return f"PD: Metformin {dose_mg}mg — S_I +{improvement * 100:.1f}%, p1 +8%."

        if name in ("atorvastatin", "simvastatin", "rosuvastatin"):
            # Statins: HMG-CoA reductase inhibition.
            # Primary: cholesterol reduction (not modeled in glucose kinetics).
            # Secondary: mitochondrial impairment can reduce HRV (master plan §2).
            # Dose-dependent insulin sensitivity reduction (statin-induced diabetes risk).
            si_reduction = (dose_mg / 80.0) * 0.08  # up to 8% S_I reduction at max dose
            self.s_i *= (1.0 - si_reduction)
            # HRV depression: up to 22% at therapeutic doses (master plan §2: "HRV drops 22%")
            hrv_impact = (dose_mg / 80.0) * 0.22
            self.hrv_modifier *= (1.0 - hrv_impact)
            return (
                f"PD: {drug_id} {dose_mg}mg — S_I -{si_reduction * 100:.1f}%, "
                f"HRV modifier {self.hrv_modifier:.2f} (mitochondrial cross-talk)."
            )

        if name == "lisinopril":
            # ACE inhibitor: hemodynamic focus, minor metabolic secondary effect
            self.s_i *= 1.05
            return f"PD: Lisinopril {dose_mg}mg — S_I +5% (hemodynamic-metabolic cross-talk)."

        if name == "magnesium":
            # Magnesium supplementation: mild insulin-sensitizing effect.
            # Potential statin interaction on muscle recovery.
            mg_effect = min(0.03, (dose_mg / 400.0) * 0.03)
            self.s_i *= (1.0 + mg_effect)
            return f"PD: Magnesium {dose_mg}mg — S_I +{mg_effect * 100:.1f}%."

        return f"PD: {drug_id} {dose_mg}mg — no primary metabolic modulation mapped."

    def simulate_step(
        self,
        carbohydrate_intake: float = 0.0,
        exogenous_insulin: float = 0.0,
    ) -> float:
        """
        Execute one time-step of the glucose-insulin differential equation.

        dG/dt = -[p1 + S_I * I(t)] * G(t) + p1 * G_baseline + Meal(t)

        Parameters
        ----------
        carbohydrate_intake : float
            Grams of carbohydrate entering the system this minute.
        exogenous_insulin : float
            Units of exogenous insulin active in the system.

        Returns
        -------
        float
            Updated glucose concentration (mg/dL).
        """
        # 1. Glucose appearance from meals (simplified first-order absorption)
        ra = carbohydrate_intake * 0.22

        # 2. Effective insulin (basal + exogenous)
        effective_insulin = exogenous_insulin + self._BASAL_INSULIN

        # 3. Differential equation: dG/dt
        dg_dt = (
            ra
            - (self.p1 + self.s_i * effective_insulin) * self.glucose
            + (self.p1 * self._BASELINE_GLUCOSE)
        )

        # 4. Euler integration
        self.glucose += dg_dt * self.dt

        # 5. Biological safety bounds
        self.glucose = max(self._GLUCOSE_MIN, min(self._GLUCOSE_MAX, self.glucose))

        return self.glucose

    def simulate_trajectory(
        self,
        duration_minutes: int,
        meal_at: int | None = None,
        meal_carbs: float = 50.0,
    ) -> list[float]:
        """
        Simulate a full trajectory and return the glucose time series.

        Parameters
        ----------
        duration_minutes : int
            Total simulation duration.
        meal_at : int or None
            Minute at which a meal is ingested (None = fasting).
        meal_carbs : float
            Carbohydrate content of the meal in grams.

        Returns
        -------
        list[float]
            Glucose values at each minute.
        """
        trajectory: list[float] = []
        for minute in range(duration_minutes):
            carbs = meal_carbs if (meal_at is not None and minute == meal_at) else 0.0
            trajectory.append(self.simulate_step(carbohydrate_intake=carbs))
        return trajectory

    @property
    def state_summary(self) -> dict[str, float]:
        """Current engine state as a dict for serialisation."""
        return {
            "glucose_mg_dl": round(self.glucose, 2),
            "insulin_sensitivity": round(self.s_i, 6),
            "glucose_effectiveness": round(self.p1, 6),
            "hrv_modifier": round(self.hrv_modifier, 4),
            "medications_applied": len(self._medications),
        }


if __name__ == "__main__":
    # Sarah's scenario validation: Metformin + Atorvastatin
    engine = MetabolicEngine(baseline_glucose=95.0)
    print(f"Initial:     {engine.glucose:.1f} mg/dL | S_I: {engine.s_i:.4f} | HRV mod: {engine.hrv_modifier:.2f}")

    log = engine.apply_medication("Metformin", 1000)
    print(log)

    log = engine.apply_medication("Atorvastatin", 20)
    print(log)

    log = engine.apply_medication("Magnesium", 400)
    print(log)

    print(f"\nPost-meds:   {engine.glucose:.1f} mg/dL | S_I: {engine.s_i:.4f} | HRV mod: {engine.hrv_modifier:.2f}")

    # Simulate 2-hour post-prandial recovery
    print("\nPost-prandial trajectory (50g CHO at T=0):")
    trajectory = engine.simulate_trajectory(120, meal_at=0, meal_carbs=50.0)
    for t in range(0, 120, 10):
        print(f"  T+{t:3d}m: {trajectory[t]:.1f} mg/dL")

    print(f"\nFinal state: {engine.state_summary}")
