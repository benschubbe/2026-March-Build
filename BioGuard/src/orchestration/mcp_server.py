"""
BioGuardian MCP Server — Typed Tool Schemas for Agent Communication
=====================================================================

Implements Model Context Protocol (MCP) typed tool schemas for the
four-agent swarm.  Each agent exposes its interface as a typed tool
definition with JSON Schema input/output contracts, enabling:

  1. Hot-swap: replacing an agent requires only satisfying its typed
     interface — no changes to the orchestrator or other agents.
  2. Sandboxing: each tool runs in an isolated context with no shared
     memory between agents.
  3. Extensibility: new agents (e.g., Genomics Agent consuming 23andMe
     SNP data) plug into the swarm without touching existing agents.

MCP specification reference:
  The Model Context Protocol defines a standardized way for AI agents
  to expose and consume typed tool interfaces.  BioGuardian applies
  MCP as a health data contract layer — using typed tool schemas to
  enforce clinical data contracts between agents.

This server runs locally on-device.  No external network calls are made.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("BioGuardian.MCP")


# ---------------------------------------------------------------------------
# Tool Schema Definitions (MCP-compatible JSON Schema)
# ---------------------------------------------------------------------------

TOOL_SCHEMAS: Dict[str, Dict[str, Any]] = {
    "bioguardian.scribe": {
        "name": "bioguardian.scribe",
        "description": "The Scribe: Parse PDF lab reports into LOINC-normalized JSON panels.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "description": "Patient identifier"},
                "raw_lab_text": {"type": "string", "description": "Raw text from OCR or PDF extraction"},
                "source_pdf_hash": {"type": "string", "pattern": "^[0-9a-f]{64}$"},
            },
            "required": ["patient_id", "raw_lab_text"],
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "lab_panels": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "loinc_code": {"type": "string", "pattern": r"^\d{1,5}-\d$"},
                            "display_name": {"type": "string"},
                            "value": {"type": "number"},
                            "unit": {"type": "string"},
                            "reference_range": {
                                "type": "object",
                                "properties": {
                                    "low": {"type": "number"},
                                    "high": {"type": "number"},
                                },
                            },
                            "source_pdf_hash": {"type": "string"},
                        },
                        "required": ["loinc_code", "value", "unit"],
                    },
                },
                "panels_extracted": {"type": "integer"},
                "abnormal_count": {"type": "integer"},
            },
        },
    },
    "bioguardian.pharmacist": {
        "name": "bioguardian.pharmacist",
        "description": "The Pharmacist: Cross-reference drugs against openFDA FAERS for contraindication flags.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
                "substance": {"type": "string", "description": "Primary drug name"},
                "dose": {"type": "string"},
                "lab_panels": {"type": "array", "description": "LOINC-coded lab results for personalisation"},
            },
            "required": ["patient_id", "substance"],
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "contraindications": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "drug_pair": {
                                "type": "object",
                                "properties": {
                                    "primary": {"type": "string"},
                                    "interactant": {"type": "string"},
                                },
                            },
                            "severity": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]},
                            "fda_report_count": {"type": "integer"},
                            "personalized_risk_score": {"type": "number", "minimum": 0, "maximum": 1},
                        },
                    },
                },
                "fda_source": {"type": "string", "enum": ["live", "cached", "live+cached"]},
            },
        },
    },
    "bioguardian.correlation_engine": {
        "name": "bioguardian.correlation_engine",
        "description": "The Correlation Engine: Compute Pearson r between biometric streams and protocol events.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
                "biometric_values": {"type": "array", "items": {"type": "number"}},
                "event_timestamps": {"type": "array", "items": {"type": "number"}},
                "biometric_name": {"type": "string"},
                "protocol_event": {"type": "string"},
                "window_hours": {"type": "integer", "minimum": 72},
            },
            "required": ["patient_id", "biometric_values", "event_timestamps"],
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "signals": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "biometric": {"type": "string"},
                            "protocol_event": {"type": "string"},
                            "pearson_r": {"type": "number", "minimum": -1, "maximum": 1},
                            "p_value": {"type": "number", "exclusiveMinimum": 0, "exclusiveMaximum": 0.05},
                            "confidence_interval": {
                                "type": "object",
                                "properties": {
                                    "lower": {"type": "number"},
                                    "upper": {"type": "number"},
                                },
                            },
                            "window_hours": {"type": "integer", "minimum": 72},
                        },
                    },
                },
                "signals_suppressed": {"type": "integer"},
                "computation": {"type": "string", "const": "numpy_pearsonr"},
            },
        },
    },
    "bioguardian.compliance_auditor": {
        "name": "bioguardian.compliance_auditor",
        "description": "The Compliance Auditor: Deterministic FDA GW predicate-logic validation gate.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text_corpus": {"type": "string", "description": "Full text to validate"},
            },
            "required": ["text_corpus"],
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "passed": {"type": "boolean"},
                "violations": {"type": "array", "items": {"type": "string"}},
                "violation_count": {"type": "integer"},
                "auditor_version": {"type": "string"},
                "auditor_hash": {"type": "string", "pattern": "^[0-9a-f]{64}$"},
                "rules_evaluated": {"type": "integer"},
            },
        },
    },
}


class MCPServer:
    """
    Local MCP server providing typed tool schemas for the agent swarm.

    Runs on-device only.  No external network calls.  Each tool schema
    defines the exact input/output contract an agent must satisfy,
    enabling hot-swap replacement without modifying the orchestrator.
    """

    def __init__(self) -> None:
        self._tools: Dict[str, Dict[str, Any]] = dict(TOOL_SCHEMAS)
        logger.info("MCP Server initialized with %d tool schemas.", len(self._tools))

    def list_tools(self) -> List[Dict[str, Any]]:
        """Return all registered tool schemas (MCP tools/list)."""
        return [
            {"name": t["name"], "description": t["description"], "inputSchema": t["inputSchema"]}
            for t in self._tools.values()
        ]

    def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        """Return a specific tool schema by name."""
        return self._tools.get(name)

    def validate_input(self, tool_name: str, input_data: Dict[str, Any]) -> tuple:
        """
        Validate input against a tool's input schema.

        Returns (valid: bool, errors: list[str]).
        """
        tool = self._tools.get(tool_name)
        if not tool:
            return False, [f"Unknown tool: {tool_name}"]

        schema = tool["inputSchema"]
        errors = []

        # Check required fields
        for field in schema.get("required", []):
            if field not in input_data:
                errors.append(f"Missing required field: {field}")

        # Type checking for properties
        properties = schema.get("properties", {})
        for key, value in input_data.items():
            if key in properties:
                expected_type = properties[key].get("type")
                if expected_type == "string" and not isinstance(value, str):
                    errors.append(f"Field '{key}' must be string, got {type(value).__name__}")
                elif expected_type == "integer" and not isinstance(value, int):
                    errors.append(f"Field '{key}' must be integer, got {type(value).__name__}")
                elif expected_type == "number" and not isinstance(value, (int, float)):
                    errors.append(f"Field '{key}' must be number, got {type(value).__name__}")
                elif expected_type == "array" and not isinstance(value, list):
                    errors.append(f"Field '{key}' must be array, got {type(value).__name__}")

        return len(errors) == 0, errors

    def register_tool(self, name: str, schema: Dict[str, Any]) -> None:
        """Register a new tool schema (for plugin agents)."""
        self._tools[name] = schema
        logger.info("MCP tool registered: %s", name)

    def schema_summary(self) -> Dict[str, Any]:
        """Return a summary of all registered tools for debugging."""
        return {
            "tool_count": len(self._tools),
            "tools": [
                {
                    "name": t["name"],
                    "input_fields": list(t["inputSchema"].get("properties", {}).keys()),
                    "required": t["inputSchema"].get("required", []),
                }
                for t in self._tools.values()
            ],
        }
