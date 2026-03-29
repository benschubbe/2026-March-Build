import yaml
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Tuple
class ComplianceEngine:
    """
    Deterministic predicate logic engine for FDA General Wellness compliance.
    Non-LLM based to ensure formal verifiability.
    """
    def __init__(self, rules_path: str):
        with open(rules_path, 'r') as f:
            self.config = yaml.safe_load(f)
        self.rules = self.config.get('rules', [])
    def validate_text(self, text: str) -> Tuple[bool, List[str]]:
        """
        Validates text against forbidden patterns and required phrases.
        Returns (passed, list_of_violations).
        """
        violations = []
        text_lower = text.lower()

        for rule in self.rules:
            # Check forbidden patterns
            for pattern in rule.get('forbidden_patterns', []):
                if pattern in text_lower:
                    violations.append(f"{rule['code']}: Found forbidden term '{pattern}'")

            # Check required phrases (if applicable to this text)
            # This is a simplified check for the demo
            if "required_phrases" in rule and rule['id'] == "GW-033":
                if not any(phrase in text_lower for phrase in rule['required_phrases']):
                    violations.append(f"{rule['code']}: Missing required disclaimer")

        return len(violations) == 0, violations
class AuditChain:
    """
    SHA-256 hashed cryptographic audit log.
    Ensures every agent action is immutable and verifiable.
    """
    def __init__(self):
        self.chain: List[Dict[str, Any]] = []
    def log_event(self, agent_name: str, input_data: Any, output_data: Any):
        prev_hash = self.chain[-1]['hash'] if self.chain else "0" * 64

        event = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent_name,
            "input_hash": self._hash(input_data),
            "output_hash": self._hash(output_data),
            "prev_hash": prev_hash
        }

        event['hash'] = self._hash(event)
        self.chain.append(event)
        return event['hash']
    def _hash(self, data: Any) -> str:
        s = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(s.encode()).hexdigest()
    def get_full_chain(self) -> List[Dict[str, Any]]:
        return self.chain
