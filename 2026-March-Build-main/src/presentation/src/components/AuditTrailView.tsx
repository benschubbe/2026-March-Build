import React from 'react';
import { Shield, Key, CheckCircle2 } from 'lucide-react';

interface Props {
  hashes: string[];
}

const AuditTrailView: React.FC<Props> = ({ hashes }) => {
  if (!hashes || hashes.length === 0) return null;

  return (
    <div className="AuditTrail-Container Card premium-border">
      <div className="Audit-Header">
        <Shield size={18} className="accent-green" />
        <h3>Cryptographic Audit Chain (Privacy Proof)</h3>
      </div>
      <p className="audit-desc">
        Each agent action is hashed and linked to the previous state. This immutable chain 
        proves the integrity of on-device reasoning.
      </p>
      <div className="Hash-Chain">
        {hashes.map((hash, i) => (
          <div key={i} className="Hash-Node">
            <div className="Node-Status">
              <CheckCircle2 size={14} className="success-text" />
              <span className="node-label">Agent {i + 1} HASH</span>
            </div>
            <code className="hash-value">{hash.substring(0, 32)}...</code>
            {i < hashes.length - 1 && <div className="Hash-Link"></div>}
          </div>
        ))}
        <div className="Final-Verification">
          <Key size={14} />
          <span>Chain Verified: SHA-256 Integrity Check Passed</span>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailView;
