export interface IncidentReport {
  id: string;            // TL-XXXX-YYYY
  category: IncidentCategory;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suspectedUrl?: string;
  status: 'Submitted' | 'Under Review' | 'Resolved';
  createdAt: string;     // ISO
}

export type IncidentCategory =
  | 'Phishing'
  | 'Impersonation'
  | 'Financial Fraud'
  | 'Suspicious URL'
  | 'Credential Theft'
  | 'Other';

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  'Phishing',
  'Impersonation',
  'Financial Fraud',
  'Suspicious URL',
  'Credential Theft',
  'Other',
];

export function generateReportId(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-6);
  const r = Math.floor(Math.random() * 0xffff).toString(36).toUpperCase().padStart(4, '0');
  return `TL-${t}-${r}`;
}

// Seeded mock incidents so the dashboard is useful on first launch.
// Clearly labelled as demo data.
export const SEED_INCIDENTS: IncidentReport[] = [
  {
    id: 'TL-DEMO1-A1B2',
    category: 'Phishing',
    description: '[Demo] SMS linking to a parcel-tracking page that requested a delivery fee.',
    severity: 'high',
    suspectedUrl: 'http://bit.ly/demo-parcel',
    status: 'Under Review',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'TL-DEMO2-C3D4',
    category: 'Impersonation',
    description: '[Demo] Email claiming to be from a bank asking to verify account details.',
    severity: 'critical',
    suspectedUrl: 'http://sb1-verify.example.in/login',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: 'TL-DEMO3-E5F6',
    category: 'Financial Fraud',
    description: '[Demo] Prize message requesting a processing fee to release winnings.',
    severity: 'high',
    suspectedUrl: 'http://amzn-prize.example.in/claim',
    status: 'Submitted',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'TL-DEMO4-G7H8',
    category: 'Suspicious URL',
    description: '[Demo] Punycode link pretending to be a major bank.',
    severity: 'medium',
    suspectedUrl: 'http://xn--80ak6aa92e.example',
    status: 'Under Review',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 75).toISOString(),
  },
  {
    id: 'TL-DEMO5-I9J0',
    category: 'Credential Theft',
    description: '[Demo] OTP harvesting SMS pretending to be from a payments app.',
    severity: 'critical',
    status: 'Submitted',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];
