const { v4: uuidv4 } = require('uuid');

/**
 * Normalizes raw telemetry data into a standardized HL7 FHIR Observation resource (R4).
 */
function normalizeToFHIR(telemetryData) {
  const { patient_id, source, type, value, unit, timestamp } = telemetryData;

  const observation = {
    resourceType: "Observation",
    id: uuidv4(),
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs"
          }
        ]
      }
    ],
    code: {
      coding: [
        mapTypeToLOINC(type)
      ],
      text: type
    },
    subject: {
      reference: `Patient/${patient_id}`
    },
    effectiveDateTime: new Date(Number(timestamp)).toISOString(),
    valueQuantity: {
      value: value,
      unit: unit,
      system: "http://unitsofmeasure.org",
      code: unit === "mg/dL" ? "mg/dL" : unit // Simplified for MVP
    },
    device: {
      display: source
    },
    meta: {
      source: `bio-guardian://${source}`,
      lastUpdated: new Date().toISOString()
    }
  };

  return observation;
}

/**
 * Maps common biological types to LOINC codes.
 */
function mapTypeToLOINC(type) {
  const loincMap = {
    "glucose": { system: "http://loinc.org", code: "2339-0", display: "Glucose [Mass/volume] in Blood" },
    "heart_rate": { system: "http://loinc.org", code: "8867-4", display: "Heart rate" },
    "sleep": { system: "http://loinc.org", code: "93832-4", display: "Sleep duration" }
  };

  return loincMap[type.toLowerCase()] || { system: "http://loinc.org", code: "unknown", display: type };
}

module.exports = { normalizeToFHIR };
