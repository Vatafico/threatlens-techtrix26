// Shared detection-engine types.

export type InputMode = 'email' | 'sms' | 'url' | 'screenshot';

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type RiskBand = 'low' | 'medium' | 'high' | 'critical';

export interface NormalizedInput {
  mode: InputMode;
  raw: string;
  text: string; // normalized (whitespace + safe unicode), preserves original semantics
  lengthChars: number;
}

export interface ExtractedUrl {
  /** Raw substring as found in the text. Inert: never fetched or linked. */
  raw: string;
  /** Parsed hostname (lowercased), or undefined if parse failed. */
  host?: string;
  /** Full parsed URL object if URL() accepted it. */
  parsed?: URL;
  /** True if the URL appears to be a known shortener. */
  isShortener?: boolean;
  /** True if host uses punycode / IDN (xn--). */
  isPunycode?: boolean;
  /** True if host is an IP literal. */
  isIpHost?: boolean;
  /** True if parsed URL included user-info (userinfo@host). */
  hasUserinfo?: boolean;
  /** Port if explicitly present and non-default. */
  port?: string;
}

export interface IdentityClaim {
  raw: string;
  brand: string;
  /** Lowercased brand alias matched. */
  match: string;
}

export interface ExtractedEntities {
  urls: ExtractedUrl[];
  domains: string[];
  identities: IdentityClaim[];
}

export type DetectorId =
  | 'urgency'
  | 'credentials'
  | 'financial'
  | 'impersonation'
  | 'urlStructure'
  | 'contextual';

export interface DetectionFinding {
  id: string;
  detector: DetectorId;
  title: string;
  severity: Severity;
  /** Evidence snippet drawn from the original input. */
  evidence: string;
  explanation: string;
  /** Strength of this individual finding's evidence (0-1). */
  confidence: number;
  /** Weight applied to this finding's score contribution. */
  weight: number;
  /** Actual contribution to the risk score after policy math. */
  contribution: number;
  recommendation?: string;
}

export interface DetectorResult {
  detector: DetectorId;
  findings: DetectionFinding[];
  notes?: string;
}

export interface PipelineStageStatus {
  stage: 'validate' | 'normalize' | 'extract' | 'detect' | 'dedupe' | 'score' | 'classify' | 'recommend';
  status: 'completed' | 'skipped' | 'failed';
  detail?: string;
}

export type RecommendedActionCategory =
  | 'do_not_respond'
  | 'do_not_click'
  | 'verify_independently'
  | 'report'
  | 'change_credentials'
  | 'enable_mfa'
  | 'general_caution';

export interface RecommendedAction {
  category: RecommendedActionCategory;
  title: string;
  detail: string;
  /** Finding ids that motivated this action, if any. */
  sources: string[];
}

export interface RiskAssessment {
  score: number; // 0-100 bounded
  band: RiskBand;
  label: string;
  summary: string;
}

export interface AnalysisResult {
  input: NormalizedInput;
  entities: ExtractedEntities;
  findings: DetectionFinding[];
  risk: RiskAssessment;
  recommendations: RecommendedAction[];
  stages: PipelineStageStatus[];
  warnings: string[];
  createdAt: string;
}

export interface ScoringPolicy {
  severityWeight: Record<Severity, number>;
  /** Diminishing returns factor for repeated findings from same detector. */
  repeatedDiminution: number;
  /** Cap on how much a single detector can contribute. */
  perDetectorCap: number;
  /** Soft cap applied before final normalization to 100. */
  rawCap: number;
  /** Confidence floor below which a finding contributes only minimally. */
  confidenceFloor: number;
}

export const SCORING_POLICY: ScoringPolicy = {
  severityWeight: {
    info: 2,
    low: 8,
    medium: 18,
    high: 32,
    critical: 46,
  },
  repeatedDiminution: 0.65,
  perDetectorCap: 55,
  rawCap: 150,
  confidenceFloor: 0.35,
};

export const RISK_THRESHOLDS = {
  low: 20,
  medium: 45,
  high: 70,
} as const;

export function classifyBand(score: number): RiskBand {
  if (score >= RISK_THRESHOLDS.high) return 'critical';
  if (score >= RISK_THRESHOLDS.medium) return 'high';
  if (score >= RISK_THRESHOLDS.low) return 'medium';
  return 'low';
}
