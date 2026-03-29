"""
BioGuardian Embedded Vector Store
===================================

On-device, zero-dependency vector store for clinical reference range
retrieval and lab value grounding.  Implements the same functional
contract as LanceDB (embedded, no server process, fast similarity
search) using NumPy for zero-copy vectorized operations.

This store is used by The Scribe to ground ambiguous OCR-extracted lab
values against known reference range embeddings, and by The Pharmacist
to retrieve drug interaction context vectors.

Design decisions:
  - NumPy-only: no external DB process, works on any Python environment
  - Cosine similarity for semantic matching of lab test descriptions
  - Pre-built embeddings for the 20 most common lab panels (LOINC-coded)
  - Sub-millisecond retrieval at our reference range embedding density

In production (Layer 2), this module would be backed by LanceDB with
Apache Arrow zero-copy memory mapping for larger embedding sets.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger("BioGuardian.VectorStore")


class EmbeddedVectorStore:
    """
    On-device vector store for clinical reference data retrieval.

    Stores text embeddings as NumPy arrays with associated metadata.
    Supports cosine similarity search for nearest-neighbour retrieval.
    """

    def __init__(self) -> None:
        self._vectors: List[np.ndarray] = []
        self._metadata: List[Dict[str, Any]] = []
        self._ids: List[str] = []

    @property
    def size(self) -> int:
        return len(self._vectors)

    def add(self, text: str, metadata: Dict[str, Any], vector: Optional[np.ndarray] = None) -> str:
        """
        Add a document to the store.

        Parameters
        ----------
        text : str
            The text content to store.
        metadata : dict
            Associated metadata (LOINC code, reference ranges, etc.).
        vector : np.ndarray or None
            Pre-computed embedding vector. If None, a simple TF-IDF-style
            hash embedding is generated from the text.

        Returns
        -------
        str
            Document ID (SHA-256 of content).
        """
        doc_id = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

        if vector is None:
            vector = self._text_to_vector(text)

        self._vectors.append(vector)
        self._metadata.append({"text": text, "doc_id": doc_id, **metadata})
        self._ids.append(doc_id)

        return doc_id

    def search(self, query: str, top_k: int = 5, query_vector: Optional[np.ndarray] = None) -> List[Dict[str, Any]]:
        """
        Search for the most similar documents by cosine similarity.

        Parameters
        ----------
        query : str
            Query text.
        top_k : int
            Number of results to return.
        query_vector : np.ndarray or None
            Pre-computed query vector. If None, generated from text.

        Returns
        -------
        list[dict]
            Top-k results with similarity scores and metadata.
        """
        if not self._vectors:
            return []

        if query_vector is None:
            query_vector = self._text_to_vector(query)

        # Stack all vectors into a matrix for vectorized cosine similarity
        matrix = np.stack(self._vectors)
        similarities = self._cosine_similarity(query_vector, matrix)

        # Get top-k indices
        k = min(top_k, len(similarities))
        top_indices = np.argsort(similarities)[-k:][::-1]

        results = []
        for idx in top_indices:
            results.append({
                "score": float(similarities[idx]),
                "doc_id": self._ids[idx],
                **self._metadata[idx],
            })

        return results

    def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a document by its ID."""
        for i, did in enumerate(self._ids):
            if did == doc_id:
                return dict(self._metadata[i])
        return None

    @staticmethod
    def _cosine_similarity(query: np.ndarray, matrix: np.ndarray) -> np.ndarray:
        """Compute cosine similarity between a query vector and a matrix of vectors."""
        query_norm = np.linalg.norm(query)
        if query_norm == 0:
            return np.zeros(matrix.shape[0])

        matrix_norms = np.linalg.norm(matrix, axis=1)
        matrix_norms[matrix_norms == 0] = 1.0  # avoid division by zero

        dots = matrix @ query
        return dots / (matrix_norms * query_norm)

    @staticmethod
    def _text_to_vector(text: str, dim: int = 128) -> np.ndarray:
        """
        Generate a deterministic embedding vector from text.

        Uses character n-gram hashing to produce a fixed-dimension vector.
        This is a lightweight alternative to transformer embeddings that
        works well for structured clinical text (lab names, LOINC codes).
        """
        vector = np.zeros(dim, dtype=np.float64)
        text_lower = text.lower().strip()

        # Character trigram hashing
        for i in range(len(text_lower) - 2):
            trigram = text_lower[i:i + 3]
            h = int(hashlib.md5(trigram.encode()).hexdigest(), 16)
            idx = h % dim
            vector[idx] += 1.0

        # Word-level hashing for semantic content
        for word in text_lower.split():
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % dim
            vector[idx] += 2.0

        # L2 normalize
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector /= norm

        return vector


# ---------------------------------------------------------------------------
# Pre-built clinical reference store
# ---------------------------------------------------------------------------

def build_clinical_reference_store() -> EmbeddedVectorStore:
    """
    Build the pre-populated vector store with LOINC-coded lab reference
    ranges for The Scribe's RAG retrieval pipeline.

    Contains the 20 most common lab panels with reference ranges,
    clinical context, and LOINC codes.
    """
    store = EmbeddedVectorStore()

    references = [
        {
            "text": "Hemoglobin A1c glycated hemoglobin diabetes HbA1c blood sugar control",
            "loinc_code": "4544-3",
            "display_name": "Hemoglobin A1c",
            "unit": "%",
            "reference_low": 4.0,
            "reference_high": 5.6,
            "clinical_context": "Elevated in diabetes and pre-diabetes. Reflects 2-3 month glucose average.",
        },
        {
            "text": "Glucose blood sugar fasting glucose plasma glucose",
            "loinc_code": "2339-0",
            "display_name": "Glucose",
            "unit": "mg/dL",
            "reference_low": 70.0,
            "reference_high": 100.0,
            "clinical_context": "Fasting glucose. Elevated in diabetes, stress, Cushing syndrome.",
        },
        {
            "text": "Total cholesterol lipid panel cardiovascular risk",
            "loinc_code": "2093-3",
            "display_name": "Total Cholesterol",
            "unit": "mg/dL",
            "reference_low": 125.0,
            "reference_high": 200.0,
            "clinical_context": "Elevated with statin indication. Major CVD risk factor.",
        },
        {
            "text": "LDL cholesterol low density lipoprotein bad cholesterol",
            "loinc_code": "2089-1",
            "display_name": "LDL Cholesterol",
            "unit": "mg/dL",
            "reference_low": 0.0,
            "reference_high": 100.0,
            "clinical_context": "Primary target for statin therapy. Lower is better for CVD risk.",
        },
        {
            "text": "HDL cholesterol high density lipoprotein good cholesterol",
            "loinc_code": "2085-9",
            "display_name": "HDL Cholesterol",
            "unit": "mg/dL",
            "reference_low": 40.0,
            "reference_high": 60.0,
            "clinical_context": "Protective factor. Low HDL increases CVD risk.",
        },
        {
            "text": "Triglycerides lipid panel metabolic syndrome",
            "loinc_code": "2571-8",
            "display_name": "Triglycerides",
            "unit": "mg/dL",
            "reference_low": 0.0,
            "reference_high": 150.0,
            "clinical_context": "Elevated in metabolic syndrome, diabetes, alcohol use.",
        },
        {
            "text": "Creatine kinase CK CPK muscle enzyme statin myopathy rhabdomyolysis",
            "loinc_code": "2157-6",
            "display_name": "Creatine Kinase (CK)",
            "unit": "U/L",
            "reference_low": 22.0,
            "reference_high": 198.0,
            "clinical_context": "Key statin safety marker. Elevated CK with statin use suggests myopathy risk.",
        },
        {
            "text": "Creatinine kidney function renal GFR",
            "loinc_code": "2160-0",
            "display_name": "Creatinine",
            "unit": "mg/dL",
            "reference_low": 0.6,
            "reference_high": 1.2,
            "clinical_context": "Elevated in renal impairment. Used to calculate eGFR.",
        },
        {
            "text": "ALT SGPT alanine aminotransferase liver function hepatic",
            "loinc_code": "1742-6",
            "display_name": "ALT (SGPT)",
            "unit": "U/L",
            "reference_low": 7.0,
            "reference_high": 56.0,
            "clinical_context": "Liver enzyme. Statin safety monitoring — check before and during therapy.",
        },
        {
            "text": "AST SGOT aspartate aminotransferase liver function",
            "loinc_code": "1920-8",
            "display_name": "AST (SGOT)",
            "unit": "U/L",
            "reference_low": 10.0,
            "reference_high": 40.0,
            "clinical_context": "Liver and muscle enzyme. Elevated with liver damage or myopathy.",
        },
        {
            "text": "Hemoglobin red blood cell oxygen carrying capacity anemia",
            "loinc_code": "718-7",
            "display_name": "Hemoglobin",
            "unit": "g/dL",
            "reference_low": 12.0,
            "reference_high": 17.5,
            "clinical_context": "Low in anemia. High in polycythemia, dehydration.",
        },
        {
            "text": "White blood cell count WBC leukocyte infection immune",
            "loinc_code": "6690-2",
            "display_name": "White Blood Cell Count",
            "unit": "10*3/uL",
            "reference_low": 4.5,
            "reference_high": 11.0,
            "clinical_context": "Elevated in infection, inflammation. Low in immunosuppression.",
        },
        {
            "text": "Platelet count thrombocyte bleeding clotting coagulation",
            "loinc_code": "777-3",
            "display_name": "Platelet Count",
            "unit": "10*3/uL",
            "reference_low": 150.0,
            "reference_high": 400.0,
            "clinical_context": "Low in thrombocytopenia. High in reactive thrombocytosis.",
        },
        {
            "text": "TSH thyroid stimulating hormone thyroid function hypothyroid hyperthyroid",
            "loinc_code": "3016-3",
            "display_name": "TSH",
            "unit": "mIU/L",
            "reference_low": 0.27,
            "reference_high": 4.2,
            "clinical_context": "High in hypothyroidism, low in hyperthyroidism.",
        },
        {
            "text": "Potassium electrolyte cardiac rhythm kidney",
            "loinc_code": "2823-3",
            "display_name": "Potassium",
            "unit": "mEq/L",
            "reference_low": 3.5,
            "reference_high": 5.0,
            "clinical_context": "Critical for cardiac function. Monitor with ACE inhibitors and diuretics.",
        },
        {
            "text": "Sodium electrolyte fluid balance hyponatremia",
            "loinc_code": "2951-2",
            "display_name": "Sodium",
            "unit": "mEq/L",
            "reference_low": 136.0,
            "reference_high": 145.0,
            "clinical_context": "Low in SIADH, diuretic use. Critical electrolyte.",
        },
        {
            "text": "Magnesium mineral supplement muscle cramp statin interaction",
            "loinc_code": "19123-9",
            "display_name": "Magnesium",
            "unit": "mg/dL",
            "reference_low": 1.7,
            "reference_high": 2.2,
            "clinical_context": "Low with statin use. Supplementation may reduce muscle symptoms.",
        },
        {
            "text": "HRV heart rate variability RMSSD autonomic nervous system cardiac",
            "loinc_code": "80404-7",
            "display_name": "Heart Rate Variability (RMSSD)",
            "unit": "ms",
            "reference_low": 20.0,
            "reference_high": 50.0,
            "clinical_context": "Wearable-derived. Reduced HRV associated with statin myopathy and stress.",
        },
        {
            "text": "Resting heart rate pulse cardiac fitness autonomic",
            "loinc_code": "40443-4",
            "display_name": "Resting Heart Rate",
            "unit": "/min",
            "reference_low": 60.0,
            "reference_high": 80.0,
            "clinical_context": "Wearable-derived. Compensatory rise may accompany HRV depression.",
        },
        {
            "text": "Sleep duration analysis efficiency quality rest",
            "loinc_code": "93832-4",
            "display_name": "Sleep Duration",
            "unit": "min",
            "reference_low": 420.0,
            "reference_high": 480.0,
            "clinical_context": "Wearable-derived. Reduced sleep efficiency is an early ADE signal.",
        },
    ]

    for ref in references:
        text = ref.pop("text")
        store.add(text, ref)

    logger.info("Clinical vector store built: %d reference embeddings.", store.size)
    return store


# Module-level singleton
_clinical_store: Optional[EmbeddedVectorStore] = None


def get_clinical_store() -> EmbeddedVectorStore:
    """Return the singleton clinical reference store."""
    global _clinical_store
    if _clinical_store is None:
        _clinical_store = build_clinical_reference_store()
    return _clinical_store
