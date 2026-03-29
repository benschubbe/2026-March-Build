/**
 * BioGuardian — Clinical Intelligence Infrastructure
 * src/ingestion/normalizer.js
 *
 * FHIR R4 Normalization Layer
 *
 * Converts raw biometric telemetry packets (from the Swift HealthKit bridge or
 * manual CSV input) into fully conformant HL7 FHIR R4 Observation resources,
 * LOINC-coded and UCUM-unit-annotated, ready for consumption by the LangGraph
 * orchestration layer and the Correlation Engine.
 *
 * Design contracts (from master plan §4):
 *   - Every outbound observation carries a LOINC code. Unknown types produce a
 *     structured error Observation rather than an uncoded record — the
 *     Compliance Auditor requires every resource to be typed.
 *   - UCUM unit codes are authoritative (http://unitsofmeasure.org). Display
 *     units are human-readable equivalents stored in valueQuantity.unit.
 *   - The HealthKit read scopes are the closed set of supported types:
 *       HRV_RMSSD | SLEEP_ANALYSIS | BLOOD_GLUCOSE | STEP_COUNT | RESTING_HEART_RATE
 *   - category codes reflect clinical domain: vital-signs vs. activity vs. laboratory.
 *   - All timestamps are normalized to ISO-8601 UTC. Epoch milliseconds, epoch
 *     seconds, and ISO strings are all accepted on input.
 *   - No PHI leaves this module. patient_id is stored only as a FHIR reference.
 *
 * FHIR R4 spec references:
 *   https://hl7.org/fhir/R4/observation.html
 *   https://hl7.org/fhir/R4/valueset-observation-category.html
 *   https://loinc.org/
 *   https://ucum.org/
 *
 * @module bioguardian/ingestion/normalizer
 */
 
'use strict';
 
const { v4: uuidv4 } = require('uuid');
 
// ─── LOINC Mapping Table ──────────────────────────────────────────────────────
//
// Keyed by the canonical biometric type strings used in server.js and the Swift
// HealthKit bridge. Each entry carries:
//
//   loincCode    — LOINC code (authoritative clinical identifier)
//   loincDisplay — LOINC long common name
//   category     — FHIR observation-category code
//                  "vital-signs" | "activity" | "laboratory"
//   ucumCode     — UCUM unit code (machine-readable, authoritative)
//   ucumDisplay  — UCUM display label (human-readable)
//   valueType    — "Quantity" | "CodeableConcept"
//                  Quantity: numeric measurements
//                  CodeableConcept: coded categorical values (e.g. sleep stages)
//
// Sources:
//   HRV_RMSSD       — LOINC 80404-7  (R-R interval.standard deviation (Heart rate variability))
//   RESTING_HR      — LOINC 40443-4  (Heart rate --resting)
//   BLOOD_GLUCOSE   — LOINC 2339-0   (Glucose [Mass/volume] in Blood)
//   SLEEP_ANALYSIS  — LOINC 93832-4  (Sleep duration)
//   STEP_COUNT      — LOINC 55423-8  (Number of steps in unspecified time Pedometer)
 
/** @type {Record<string, LoincEntry>} */
const LOINC_MAP = {
  HRV_RMSSD: {
    loincCode:    '80404-7',
    loincDisplay: 'R-R interval.standard deviation (Heart rate variability)',
    category:     'vital-signs',
    ucumCode:     'ms',
    ucumDisplay:  'ms',
    valueType:    'Quantity',
  },
  RESTING_HEART_RATE: {
    loincCode:    '40443-4',
    loincDisplay: 'Heart rate --resting',
    category:     'vital-signs',
    ucumCode:     '/min',
    ucumDisplay:  'beats/min',
    valueType:    'Quantity',
  },
  BLOOD_GLUCOSE: {
    loincCode:    '2339-0',
    loincDisplay: 'Glucose [Mass/volume] in Blood',
    category:     'laboratory',
    ucumCode:     'mg/dL',
    ucumDisplay:  'mg/dL',
    valueType:    'Quantity',
  },
  SLEEP_ANALYSIS: {
    loincCode:    '93832-4',
    loincDisplay: 'Sleep duration',
    category:     'vital-signs',
    ucumCode:     'min',
    ucumDisplay:  'min',
    valueType:    'Quantity',
  },
  STEP_COUNT: {
    loincCode:    '55423-8',
    loincDisplay: 'Number of steps in unspecified time Pedometer',
    category:     'activity',
    ucumCode:     '1',           // UCUM dimensionless unit for counts
    ucumDisplay:  'steps',
    valueType:    'Quantity',
  },
};
 
// FHIR category system URL (R4)
const FHIR_CATEGORY_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/observation-category';
 
// LOINC system URL
const LOINC_SYSTEM = 'http://loinc.org';
 
// UCUM system URL
const UCUM_SYSTEM = 'http://unitsofmeasure.org';
 
// BioGuardian device reference prefix (audit chain §4)
const DEVICE_URI_PREFIX = 'bio-guardian://device/';
 
// FHIR profile URL for HealthKit-sourced observations
const HEALTHKIT_PROFILE =
  'http://bioguardian.io/fhir/StructureDefinition/HealthKitObservation';
 
// ─── Timestamp Normalization ──────────────────────────────────────────────────
 
/**
 * Normalizes any timestamp representation to an ISO-8601 UTC string.
 *
 * Accepts:
 *   - ISO-8601 string:       "2025-03-29T14:00:00.000Z"
 *   - Epoch milliseconds:    1743256800000  (number or numeric string, > 1e10)
 *   - Epoch seconds:         1743256800     (number or numeric string, <= 1e10)
 *   - Date object:           new Date()
 *
 * Returns null if the input cannot be resolved to a valid date.
 *
 * @param {string|number|Date|null|undefined} ts
 * @returns {string|null} ISO-8601 UTC string, or null
 */
function normalizeTimestamp(ts) {
  if (ts == null) return null;
 
  // Already a Date object
  if (ts instanceof Date) {
    return isNaN(ts.getTime()) ? null : ts.toISOString();
  }
 
  // Numeric or numeric-string epoch
  const asNum = Number(ts);
  if (!isNaN(asNum) && isFinite(asNum)) {
    // Heuristic: values > 1e10 are milliseconds, otherwise seconds
    const ms = asNum > 1e10 ? asNum : asNum * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
 
  // ISO string or any other parseable date string
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
 
  return null;
}
 
// ─── FHIR Resource Builders ───────────────────────────────────────────────────
 
/**
 * Builds a FHIR R4 Observation.category array for the given category code.
 *
 * @param {string} categoryCode - e.g. "vital-signs", "activity", "laboratory"
 * @returns {Array<object>} FHIR CodeableConcept array
 */
function buildCategory(categoryCode) {
  return [
    {
      coding: [
        {
          system:  FHIR_CATEGORY_SYSTEM,
          code:    categoryCode,
          display: categoryCode
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
        },
      ],
    },
  ];
}
 
/**
 * Builds a FHIR R4 Observation.code CodeableConcept for a known LOINC entry.
 *
 * @param {string} biometricType - Canonical type key (e.g. "HRV_RMSSD")
 * @param {LoincEntry} loincEntry
 * @returns {object} FHIR CodeableConcept
 */
function buildCode(biometricType, loincEntry) {
  return {
    coding: [
      {
        system:  LOINC_SYSTEM,
        code:    loincEntry.loincCode,
        display: loincEntry.loincDisplay,
      },
    ],
    text: biometricType,
  };
}
 
/**
 * Builds a FHIR R4 Observation.valueQuantity for a numeric measurement.
 * Uses authoritative UCUM codes — never raw unit strings from the packet.
 *
 * @param {number} value
 * @param {LoincEntry} loincEntry
 * @returns {object} FHIR Quantity
 */
function buildValueQuantity(value, loincEntry) {
  return {
    value:  value,
    unit:   loincEntry.ucumDisplay,
    system: UCUM_SYSTEM,
    code:   loincEntry.ucumCode,
  };
}
 
/**
 * Builds an error-state FHIR Observation for unknown biometric types.
 * Returns a structured resource rather than throwing, so the ingestion pipeline
 * can log and continue — unknown types must not crash the stream.
 *
 * The Compliance Auditor will block this observation from reaching the
 * Physician Brief; it is stored in the audit chain only.
 *
 * @param {object} params
 * @param {string} params.patient_id
 * @param {string} params.biometricType
 * @param {number} params.value
 * @param {string} params.effectiveDateTime
 * @param {string} params.source
 * @returns {object} FHIR Observation (status: "unknown")
 */
function buildUnknownTypeObservation({ patient_id, biometricType, value, effectiveDateTime, source }) {
  return {
    resourceType: 'Observation',
    id:           uuidv4(),
    status:       'unknown',
    meta: {
      lastUpdated: new Date().toISOString(),
      tag: [
        {
          system:  'http://bioguardian.io/fhir/tags',
          code:    'normalization-error',
          display: `Unknown biometric type: ${biometricType}`,
        },
      ],
    },
    category: buildCategory('vital-signs'),
    code: {
      coding: [
        {
          system:  LOINC_SYSTEM,
          code:    'unknown',
          display: `Unmapped biometric type: ${biometricType}`,
        },
      ],
      text: biometricType,
    },
    subject: {
      reference: `Patient/${patient_id}`,
    },
    effectiveDateTime,
    valueQuantity: {
      value:  value,
      unit:   'unknown',
      system: UCUM_SYSTEM,
      code:   '1',
    },
    device: {
      display: source,
    },
  };
}
 
// ─── Main Export ──────────────────────────────────────────────────────────────
 
/**
 * Normalizes a raw biometric telemetry packet to a conformant FHIR R4
 * Observation resource.
 *
 * Input contract (BiometricStream — mirrors Python Pydantic schema):
 * ```
 * {
 *   patient_id: string,          // required
 *   type:       string,          // one of SUPPORTED_BIOMETRIC_TYPES
 *   value:      number,          // required, finite
 *   timestamp:  string|number,   // ISO-8601 | epoch ms | epoch s
 *   source:     string,          // device identifier, e.g. "AppleWatch_S9"
 * }
 * ```
 *
 * Output: FHIR R4 Observation resource.
 *   - status "final" for known types with valid inputs
 *   - status "unknown" for unrecognized biometric types (never throws)
 *
 * @param {object} packet - Raw gRPC telemetry packet
 * @returns {object} FHIR R4 Observation
 * @throws {NormalizationError} if required fields are missing or value is invalid
 */
function normalizeToFHIR(packet) {
  const { patient_id, type, value, timestamp, source } = packet;
 
  // ── Required field validation ─────────────────────────────────────────────
  const missing = [];
  if (!patient_id || typeof patient_id !== 'string') missing.push('patient_id');
  if (!type       || typeof type       !== 'string') missing.push('type');
  if (!source     || typeof source     !== 'string') missing.push('source');
  if (typeof value !== 'number' || !isFinite(value))  missing.push('value (must be finite number)');
 
  if (missing.length > 0) {
    throw new NormalizationError(
      `Missing or invalid required fields: [${missing.join(', ')}]`,
      { packet, missing }
    );
  }
 
  // ── Timestamp normalization ───────────────────────────────────────────────
  const effectiveDateTime = normalizeTimestamp(timestamp) || new Date().toISOString();
  const ingestionTime     = new Date().toISOString();
 
  // Normalize type to uppercase for consistent map lookup
  const canonicalType = type.toUpperCase();
 
  // ── LOINC lookup ──────────────────────────────────────────────────────────
  const loincEntry = LOINC_MAP[canonicalType];
 
  if (!loincEntry) {
    // Unknown type: return a structured error observation, never throw.
    // The ingestion pipeline logs this; the Compliance Auditor blocks it downstream.
    return buildUnknownTypeObservation({
      patient_id,
      biometricType: type,
      value,
      effectiveDateTime,
      source,
    });
  }
 
  // ── Build conformant FHIR R4 Observation ──────────────────────────────────
  return {
    resourceType: 'Observation',
    id:           uuidv4(),
    status:       'final',
 
    meta: {
      versionId:   '1',
      lastUpdated: ingestionTime,
      profile:     [HEALTHKIT_PROFILE],
      source:      `${DEVICE_URI_PREFIX}${encodeURIComponent(source)}`,
    },
 
    category: buildCategory(loincEntry.category),
 
    code: buildCode(canonicalType, loincEntry),
 
    subject: {
      reference: `Patient/${patient_id}`,
    },
 
    effectiveDateTime,
 
    issued: ingestionTime,
 
    valueQuantity: buildValueQuantity(value, loincEntry),
 
    device: {
      // FHIR R4 Device.display — identifies the source device (e.g. "AppleWatch_S9")
      // Not a reference because BioGuardian does not maintain a Device registry in Layer 1.
      // Promoted to a proper Device resource in Layer 2 (§12 Scalability).
      display: source,
    },
  };
}
 
// ─── NormalizationError ───────────────────────────────────────────────────────
 
/**
 * Thrown when a packet is structurally invalid (missing required fields,
 * non-finite value). Distinct from unknown biometric type, which produces
 * an error-state Observation instead of throwing.
 */
class NormalizationError extends Error {
  /**
   * @param {string} message
   * @param {object} context - Additional debug context (packet, missing fields)
   */
  constructor(message, context = {}) {
    super(message);
    this.name    = 'NormalizationError';
    this.context = context;
  }
}
 
// ─── Exports ──────────────────────────────────────────────────────────────────
 
module.exports = {
  normalizeToFHIR,
  normalizeTimestamp, // exported for unit testing
  NormalizationError,
  LOINC_MAP,          // exported for reference by orchestration layer and tests
};
 
// ─── JSDoc typedefs ───────────────────────────────────────────────────────────
 
/**
 * @typedef {object} LoincEntry
 * @property {string} loincCode
 * @property {string} loincDisplay
 * @property {'vital-signs'|'activity'|'laboratory'} category
 * @property {string} ucumCode
 * @property {string} ucumDisplay
 * @property {'Quantity'|'CodeableConcept'} valueType
 */
