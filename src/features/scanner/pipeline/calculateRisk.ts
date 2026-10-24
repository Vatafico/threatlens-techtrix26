import type { DetectionFinding, DetectorResult, RiskAssessment } from '../types';
import { SCORING_POLICY, classifyBand } from '../types';

export interface RiskCalculation {
  assessment: RiskAssessment;
  findings: DetectionFinding[];
}

/**
 * Deterministic scoring.
 * Contributions shown in the UI are normalized score points, after detector
 * caps and the global cap, so the displayed contributions agree with the score.
 */
export function calculateRiskDetailed(results: DetectorResult[]): RiskCalculation {
  const perDetector = new Map<string, DetectionFinding[]>();
  for (const result of results) {
    if (!perDetector.has(result.detector)) perDetector.set(result.detector, []);
    perDetector.get(result.detector)!.push(...result.findings);
  }

  const scoredById = new Map<string, DetectionFinding>();
  let totalRaw = 0;

  for (const [detector, findings] of perDetector) {
    const sorted = [...findings].sort(
      (a, b) =>
        (SCORING_POLICY.severityWeight[b.severity] * b.weight * b.confidence) -
        (SCORING_POLICY.severityWeight[a.severity] * a.weight * a.confidence),
    );

    const rawContributions: { finding: DetectionFinding; contribution: number }[] = [];
    let subtotal = 0;

    sorted.forEach((finding, index) => {
      const base = SCORING_POLICY.severityWeight[finding.severity] * finding.weight;
      const confidenceFactor =
        finding.confidence >= SCORING_POLICY.confidenceFloor
          ? finding.confidence
          : finding.confidence * 0.4;
      const contribution =
        base * confidenceFactor * Math.pow(SCORING_POLICY.repeatedDiminution, index);
      rawContributions.push({ finding, contribution });
      subtotal += contribution;
    });

    const detectorScale = subtotal > SCORING_POLICY.perDetectorCap
      ? SCORING_POLICY.perDetectorCap / subtotal
      : 1;
    const cappedSubtotal = Math.min(subtotal, SCORING_POLICY.perDetectorCap);
    totalRaw += cappedSubtotal;

    for (const item of rawContributions) {
      scoredById.set(item.finding.id, {
        ...item.finding,
        // Filled with final normalized score points after all caps are applied.
        contribution: item.contribution * detectorScale,
      });
    }
  }

  const globalScale = totalRaw > SCORING_POLICY.rawCap
    ? SCORING_POLICY.rawCap / totalRaw
    : 1;
  const cappedTotal = Math.min(totalRaw, SCORING_POLICY.rawCap);
  const score = Math.max(0, Math.min(100, Math.round((cappedTotal / SCORING_POLICY.rawCap) * 100)));
  const band = classifyBand(score);

  const scoredFindings = results.flatMap((result) =>
    result.findings.map((finding) => {
      const scored = scoredById.get(finding.id) ?? finding;
      return {
        ...scored,
        contribution: scored.contribution * globalScale * (100 / SCORING_POLICY.rawCap),
      };
    }),
  );

  // Keep displayed values aligned with the score scale (0–100). Tiny rounding
  // differences can occur because the score itself is rounded to an integer.
  const assessment: RiskAssessment = {
    score,
    band,
    label: bandLabel(band),
    summary: bandSummary(band, scoredFindings),
  };

  return { assessment, findings: scoredFindings };
}

/** Backwards-compatible assessment-only API. */
export function calculateRisk(results: DetectorResult[]): RiskAssessment {
  return calculateRiskDetailed(results).assessment;
}

function bandLabel(band: RiskAssessment['band']): string {
  switch (band) {
    case 'low': return 'Low risk';
    case 'medium': return 'Medium risk';
    case 'high': return 'High risk';
    case 'critical': return 'Critical risk';
  }
}

function bandSummary(band: RiskAssessment['band'], findings: DetectionFinding[]): string {
  if (findings.length === 0) {
    return 'No suspicious indicators were detected. This does not establish that the message or URL is safe.';
  }
  switch (band) {
    case 'low':
      return 'A few weak or informational indicators were present. Treat with ordinary caution; no strong evidence of fraud was detected.';
    case 'medium':
      return 'Several indicators of concern were detected. Verify the message independently before taking any action.';
    case 'high':
      return 'Multiple strong indicators of phishing or fraud were detected. Do not follow links, share credentials, or make payments based on this message.';
    case 'critical':
      return 'A strong combination of indicators characteristic of phishing or financial fraud was detected. Treat this message as untrusted and act accordingly.';
  }
}
