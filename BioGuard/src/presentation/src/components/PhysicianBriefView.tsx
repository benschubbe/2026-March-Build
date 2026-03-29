import React from 'react';
import { 
  FileText, 
  Activity, 
  ShieldCheck, 
  AlertOctagon, 
  TrendingDown, 
  BarChart3,
  Search,
  Lock
} from 'lucide-react';
import moment from 'moment';

interface ReferenceRange {
  low: number;
  high: number;
}

interface LabPanel {
  loinc_code: string;
  display_name: string;
  value: number;
  unit: string;
  reference_range: ReferenceRange;
  status: string;
}

interface DrugPair {
  primary: string;
  interactant: string;
}

interface ContraindicationFlag {
  drug_pair: DrugPair;
  severity: string;
  fda_report_count: number;
  personalized_risk_score: number;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
}

interface AnomalySignal {
  biometric: string;
  protocol_event: string;
  pearson_r: number;
  p_value: number;
  confidence_interval: ConfidenceInterval;
  window_hours: number;
  severity: string;
}

interface PhysicianBriefData {
  brief_id: string;
  generated_at: string;
  patient_summary: string;
  lab_flags: LabPanel[];
  drug_flags: ContraindicationFlag[];
  anomaly_signals: AnomalySignal[];
  soap_note: string;
  audit_hash: string;
  compliance_version: string;
}

interface Props {
  brief: PhysicianBriefData;
}

const PhysicianBriefView: React.FC<Props> = ({ brief }) => {
  if (!brief) return null;

  return (
    <div className="PhysicianBrief-Container Card premium-border clinical-theme">
      {/* 1. Header & Compliance Proof */}
      <div className="Brief-Header">
        <div className="Header-Left">
          <div className="Service-Identity">
            <ShieldCheck size={20} className="accent-blue" />
            <span className="brand-label">BioGuardian | Autonomous Swarm Analysis</span>
          </div>
          <h2>Clinical Discussion Brief</h2>
        </div>
        <div className="Header-Right">
          <div className="Audit-Proof">
            <Lock size={12} />
            <code>Audit Hash: {brief.audit_hash.substring(0, 12)}...</code>
          </div>
          <div className="Compliance-Badge passed">
            {brief.compliance_version} Validated
          </div>
        </div>
      </div>

      <div className="Brief-Grid">
        {/* 2. Patient Summary & Lab Evidence */}
        <div className="Section Summary-Section">
          <label><Search size={14} /> Patient & Lab Evidence</label>
          <p className="summary-text">{brief.patient_summary}</p>
          <div className="Lab-Grid">
            {brief.lab_flags.map((lab, i) => {
              const isAbnormal = lab.value < lab.reference_range.low || lab.value > lab.reference_range.high;
              return (
                <div key={i} className={`Lab-Mini-Card ${isAbnormal ? 'abnormal' : ''}`}>
                  <span className="lab-name">{lab.display_name}</span>
                  <span className="lab-loinc">LOINC: {lab.loinc_code}</span>
                  <span className={`lab-value ${isAbnormal ? 'highlight-warning' : ''}`}>{lab.value} {lab.unit}</span>
                  <span className="lab-ref">Ref: {lab.reference_range.low}-{lab.reference_range.high} {lab.unit}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Pharmacovigilance Signals (openFDA) */}
        <div className="Section Drug-Section">
          <label><AlertOctagon size={14} /> Personalized Contraindications</label>
          {brief.drug_flags.map((flag, i) => (
            <div key={i} className={`Drug-Alert-Card ${flag.severity.toLowerCase()}`}>
              <div className="Alert-Title">
                <strong>{flag.drug_pair.primary} x {flag.drug_pair.interactant}</strong>
                <span className="severity-tag">{flag.severity}</span>
              </div>
              <div className="Alert-Metrics">
                <span>openFDA FAERS Reports: {flag.fda_report_count.toLocaleString()}</span>
                <span>Personalised Risk: {(flag.personalized_risk_score * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Statistical Correlation (Correlation Engine) */}
        <div className="Section Correlation-Section">
          <label><BarChart3 size={14} /> Statistical Anomaly Detection</label>
          {brief.anomaly_signals.map((sig, i) => (
            <div key={i} className="Correlation-Card">
              <div className="Corr-Header">
                <TrendingDown size={18} className="danger-text" />
                <strong>{sig.biometric} Correlation</strong>
                <span className={`severity-tag ${sig.severity.toLowerCase()}`}>{sig.severity}</span>
              </div>
              <div className="Stats-Line">
                <div className="Stat">
                  <span className="label">Pearson r</span>
                  <span className="value">{sig.pearson_r.toFixed(2)}</span>
                </div>
                <div className="Stat">
                  <span className="label">p-value</span>
                  <span className="value highlight-danger">{sig.p_value.toFixed(3)}</span>
                </div>
                <div className="Stat">
                  <span className="label">95% CI</span>
                  <span className="value">[{sig.confidence_interval.lower.toFixed(2)}, {sig.confidence_interval.upper.toFixed(2)}]</span>
                </div>
                <div className="Stat">
                  <span className="label">Window</span>
                  <span className="value">{sig.window_hours}h</span>
                </div>
              </div>
              <div className="Context-Tag">Protocol event: {sig.protocol_event}</div>
            </div>
          ))}
        </div>

        {/* 5. SOAP Discussion Note */}
        <div className="Section SOAP-Section">
          <label><FileText size={14} /> SOAP Discussion Structure (EHR-Pasteable)</label>
          <pre className="soap-content">{brief.soap_note}</pre>
          <div className="soap-meta">
            <span>Format: SOAP-note-adjacent | EHR Compatible | {brief.compliance_version}</span>
          </div>
        </div>
      </div>

      <div className="Brief-Footer">
        <div className="Footer-Meta">
          <span>Brief ID: {brief.brief_id}</span>
          <span>Generated: {moment(brief.generated_at).format('YYYY-MM-DD HH:mm:ss Z')}</span>
          <span>{brief.compliance_version}</span>
        </div>
        <div className="Footer-Audit">
          <Lock size={10} />
          <code>Audit Chain Hash: {brief.audit_hash}</code>
        </div>
        <p className="legal-disclaimer">
          PRIVATE & ON-DEVICE: This brief was generated entirely on-device by BioGuardian's local agent swarm.
          Zero raw health data was transmitted externally. For professional clinical discussion only.
          Discuss all findings with your licensed physician. Correlation does not imply causation.
        </p>
      </div>
    </div>
  );
};

export default PhysicianBriefView;
