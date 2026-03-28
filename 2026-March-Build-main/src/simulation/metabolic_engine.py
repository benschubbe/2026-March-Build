import numpy as np
from typing import Optional

class MetabolicEngine:
    """
    BioGuardian Metabolic Simulation Engine (v2.0).
    
    A state-space model based on the 'Minimal Model of Glucose-Insulin Kinetics'.
    Simulates the pharmacodynamics (PD) of interventions on biological state.
    
    Attributes:
        glucose (float): Current plasma glucose concentration (mg/dL).
        insulin_sensitivity (float): Ability of insulin to enhance glucose disappearance (S_I).
        glucose_effectiveness (float): Ability of glucose to enhance its own disappearance (p1).
        dt (float): Simulation time step in minutes.
    """
    
    def __init__(
        self, 
        baseline_glucose: float = 95.0, 
        insulin_sensitivity: float = 0.012, 
        glucose_effectiveness: float = 0.05
    ):
        self.glucose = baseline_glucose
        self.s_i = insulin_sensitivity
        self.p1 = glucose_effectiveness
        self.dt = 1.0  # 1-minute resolution
        
    def apply_medication(self, drug_id: str, dose_mg: float) -> str:
        """
        Modulates physiological parameters based on drug pharmacodynamics.
        
        Args:
            drug_id: Identifier for the medication (e.g., 'Metformin').
            dose_mg: Dosage in milligrams.
            
        Returns:
            A string describing the PD effect.
        """
        id_lower = drug_id.lower()
        if id_lower == "metformin":
            # Metformin enhances insulin sensitivity and reduces hepatic glucose output.
            improvement = (dose_mg / 1000.0) * 0.4
            self.s_i *= (1.0 + improvement)
            self.p1 *= 1.15
            return f"PD: Metformin {dose_mg}mg optimized S_I by {(improvement*100):.1f}%."
        
        if id_lower == "lisinopril":
            # ACE-Inhibitor (Hemodynamic focus, minor metabolic secondary effect)
            self.s_i *= 1.05
            return "PD: Lisinopril 10mg modeling hemodynamic-metabolic cross-talk."
            
        return f"PD: {drug_id} processed. No primary metabolic modulation mapped."

    def simulate_step(self, carbohydrate_intake: float = 0.0, exogenous_insulin: float = 0.0) -> float:
        """
        Executes one time-step of the glucose-insulin differential equation.
        
        dG/dt = -[p1 + S_I * I(t)] * G(t) + p1 * G_baseline + Meal(t)
        
        Args:
            carbohydrate_intake: Grams of CHO entering the system this minute.
            exogenous_insulin: Units of insulin active in the system.
            
        Returns:
            The new glucose concentration.
        """
        # 1. Calculate appearance of glucose from meals (simplified absorption)
        ra = carbohydrate_intake * 0.22 
        
        # 2. Calculate insulin effect (Basal insulin assumed at 6.0 uU/mL)
        effective_insulin = exogenous_insulin + 6.0
        
        # 3. Calculate derivative dG/dt
        # We simplify G_baseline to 90.0 for the recovery term
        dg_dt = ra - (self.p1 + self.s_i * effective_insulin) * self.glucose + (self.p1 * 90.0)
        
        # 4. Update state using Euler integration
        self.glucose += dg_dt * self.dt
        
        # 5. Biological constraints (Safety clipping)
        self.glucose = max(35.0, min(550.0, self.glucose))
        
        return self.glucose

if __name__ == "__main__":
    # Internal Validation Run
    engine = MetabolicEngine(baseline_glucose=160.0)
    print(f"Initial State: {engine.glucose} mg/dL | S_I: {engine.s_i}")
    
    # Test Metformin impact
    log = engine.apply_medication("Metformin", 1000)
    print(log)
    
    # Simulate a post-prandial recovery
    for minute in range(10):
        g = engine.simulate_step(carbohydrate_intake=(20.0 if minute == 0 else 0))
        if minute % 2 == 0:
            print(f"T+{minute}m: {g:.2f} mg/dL")
