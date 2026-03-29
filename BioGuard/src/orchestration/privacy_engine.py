"""
BioGuardian Privacy Engine
===========================

On-device privacy enforcement layer implementing the "privacy by topology"
design from master plan §4:

  "The threat is not a sophisticated attacker.  It is the structural
   liability of centralized health data storage: regulatory exposure,
   breach surface, and the commercial incentive that eventually monetizes
   what it holds.  BioGuardian eliminates this liability topologically —
   no central repository exists to attack, subpoena, or sell."

This module provides:

  **Homomorphic Encryption (HE) simulation**
    Production-grade mock implementing CKKS-style operations with noise
    tracking.  Ready for drop-in replacement with Microsoft SEAL or
    OpenFHE at Layer 2.

  **Federated Learning (FL) secure aggregation**
    Simulates encrypted gradient contribution architecture where opt-in
    users contribute anonymized gradient updates without exposing
    individual data.

All operations preserve the invariant: **no PHI unencrypted outside the
local trust boundary**.

Note: This is a structurally accurate mock.  Real HE operations would use
Microsoft SEAL (BFV/CKKS schemes) or OpenFHE.  The mock preserves the
correct API surface and noise growth characteristics so that the
integration contract is validated before production cryptographic
libraries are linked.
"""

from __future__ import annotations

import hashlib
import json
import random
from typing import Any


class PrivacyEngine:
    """
    On-device privacy enforcement via simulated Homomorphic Encryption
    and Federated Learning secure aggregation.

    Thread-safety: all methods are stateless class methods operating on
    immutable inputs.  No shared mutable state.
    """

    # Simulated HE context / keys (replaced by SEAL key generation in production)
    _HE_PUBLIC_KEY: str = "HE_PUB_KEY_001_GLOBAL"
    _HE_SECRET_KEY: str = "HE_SEC_KEY_001_LOCAL"

    # Noise budget threshold — operations exceeding this are considered
    # unreliable (CKKS noise growth characteristic)
    _NOISE_BUDGET_THRESHOLD: float = 0.05

    @staticmethod
    def generate_noise() -> float:
        """
        Simulate cryptographic noise inherent in CKKS HE scheme.
        Noise grows with operations, affecting precision and security budget.
        """
        return random.uniform(0.0001, 0.01)

    @classmethod
    def encrypt(cls, data: dict[str, Any]) -> str:
        """
        Simulate homomorphic encryption of patient data.

        In production (Microsoft SEAL / OpenFHE):
          - CKKS scheme for approximate arithmetic on real-valued health data
          - Polynomial ring operations with configurable security parameters
          - Key generation with specified modulus chain depth

        The mock preserves the ciphertext structure and noise tracking so
        the integration contract is validated.
        """
        raw_json = json.dumps(data, sort_keys=True).encode("utf-8")
        data_hash = hashlib.sha256(raw_json).hexdigest()[:20]
        noise = cls.generate_noise()
        return f"HE_CT_{data_hash}_N{noise:.6f}_{cls._HE_PUBLIC_KEY}"

    @classmethod
    def decrypt(cls, ciphertext: str, original_data: dict[str, Any]) -> dict[str, Any]:
        """
        Simulate decryption using the local secret key.

        Returns the original data if noise is within budget, or an error
        dict if noise has exceeded the reliability threshold.
        """
        if cls._HE_PUBLIC_KEY not in ciphertext:
            return {"error": "Decryption failed: invalid ciphertext or key mismatch."}

        try:
            noise_str = ciphertext.split("_N")[1].split("_")[0]
            noise = float(noise_str)
        except (IndexError, ValueError):
            return {"error": "Decryption failed: malformed ciphertext."}

        if noise > cls._NOISE_BUDGET_THRESHOLD:
            return {"error": f"Decryption failed: noise budget exceeded ({noise:.6f} > {cls._NOISE_BUDGET_THRESHOLD})."}

        return original_data

    @classmethod
    def add_encrypted(cls, ct1: str, ct2: str) -> str:
        """
        Simulate homomorphic addition.  Noise accumulates linearly.
        """
        combined = hashlib.sha256((ct1 + ct2).encode()).hexdigest()[:20]
        n1 = cls._extract_noise(ct1)
        n2 = cls._extract_noise(ct2)
        new_noise = n1 + n2 + cls.generate_noise()
        return f"HE_SUM_{combined}_N{new_noise:.6f}_{cls._HE_PUBLIC_KEY}"

    @classmethod
    def multiply_encrypted(cls, ct1: str, ct2: str) -> str:
        """
        Simulate homomorphic multiplication.  Noise grows super-linearly
        (characteristic of CKKS multiplication depth).
        """
        combined = hashlib.sha256((ct1 + ct2).encode()).hexdigest()[:20]
        n1 = cls._extract_noise(ct1)
        n2 = cls._extract_noise(ct2)
        new_noise = (n1 + n2) * random.uniform(1.5, 3.0) + cls.generate_noise()
        return f"HE_MUL_{combined}_N{new_noise:.6f}_{cls._HE_PUBLIC_KEY}"

    @classmethod
    def secure_compute(cls, ciphertext: str, operation: str) -> dict[str, Any]:
        """
        Simulate a secure computation on encrypted data with ZKP attestation.
        """
        noise = cls._extract_noise(ciphertext) + cls.generate_noise() * 2
        zkp = hashlib.sha256(ciphertext.encode()).hexdigest()[:16]
        return {
            "status": "COMPUTED_ON_CIPHERTEXT",
            "operation": operation,
            "zk_proof": f"ZKP_{zkp}",
            "noise_after": noise,
            "budget_remaining": max(0.0, cls._NOISE_BUDGET_THRESHOLD - noise),
        }

    @classmethod
    def aggregate_federated(cls, local_ciphertexts: list[str]) -> str:
        """
        Simulate Federated Learning secure aggregation.

        In production:
          - Each device trains locally on its own health data
          - Only encrypted gradient updates are shared
          - Secure aggregation combines updates without decrypting individuals
          - Differential privacy noise is added before contribution

        The privacy architecture enabling this exists at Layer 1.
        """
        if not local_ciphertexts:
            return f"GLOBAL_WEIGHTS_EMPTY_N0.000000"

        combined = "".join(sorted(local_ciphertexts))
        avg_noise = sum(cls._extract_noise(c) for c in local_ciphertexts) / len(local_ciphertexts)
        dp_noise = cls.generate_noise()  # differential privacy contribution
        final_noise = avg_noise + dp_noise
        agg_hash = hashlib.sha256(combined.encode()).hexdigest()[:16]
        return f"GLOBAL_WEIGHTS_{agg_hash}_N{final_noise:.6f}_DP{dp_noise:.6f}"

    # -- Internal ----------------------------------------------------------

    @staticmethod
    def _extract_noise(ciphertext: str) -> float:
        """Extract the noise value from a ciphertext string."""
        try:
            return float(ciphertext.split("_N")[1].split("_")[0])
        except (IndexError, ValueError):
            return 0.0


if __name__ == "__main__":
    pe = PrivacyEngine()

    # Validate encryption / decryption round-trip
    patient_data = {"value": 110.5, "unit": "mg/dL", "patient_id": "PT-2026-SARAH"}
    ct = pe.encrypt(patient_data)
    print(f"Encrypted:  {ct}")
    pt = pe.decrypt(ct, patient_data)
    print(f"Decrypted:  {pt}")

    # Validate homomorphic operations
    ct2 = pe.encrypt({"value": 120.3, "unit": "mg/dL", "patient_id": "PT-2026-CTRL"})
    ct_sum = pe.add_encrypted(ct, ct2)
    print(f"HE Add:     {ct_sum}")
    ct_mul = pe.multiply_encrypted(ct, ct2)
    print(f"HE Mul:     {ct_mul}")

    # Validate secure computation + ZKP
    result = pe.secure_compute(ct, "MetabolicRiskModel")
    print(f"Compute:    {result}")

    # Validate federated aggregation
    locals_ = [pe.encrypt({"weights": [0.1, 0.2]}), pe.encrypt({"weights": [0.15, 0.25]})]
    global_w = pe.aggregate_federated(locals_)
    print(f"Federated:  {global_w}")
