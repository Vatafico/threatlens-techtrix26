import type { AnalysisResult, InputMode, NormalizedInput, PipelineStageStatus } from '../types';
import { validateInput, normalize } from './normalize';
import { extractEntities } from './extractEntities';
import { runDetectors, dedupeFindings } from './analyze';
import { calculateRiskDetailed } from './calculateRisk';
import { generateRecommendations } from '../recommendations/recommendationEngine';

export interface AnalyzeInput {
  raw: string;
  mode: InputMode;
}

export function analyzeInput({ raw, mode }: AnalyzeInput): AnalysisResult {
  const stages: PipelineStageStatus[] = [];
  const warnings: string[] = [];

  // 1. Validate
  const validation = validateInput(raw, mode);
  if (!validation.ok) {
    stages.push({ stage: 'validate', status: 'failed', detail: validation.error });
    return {
      input: { mode, raw: validation.raw, text: '', lengthChars: 0 },
      entities: { urls: [], domains: [], identities: [] },
      findings: [],
      risk: { score: 0, band: 'low', label: 'Not analysed', summary: 'Input could not be validated.' },
      recommendations: [],
      stages,
      warnings: [validation.error ?? 'Validation failed.'],
      createdAt: new Date().toISOString(),
    };
  }
  stages.push({ stage: 'validate', status: 'completed' });

  // 2. Normalize
  let normalized: NormalizedInput;
  try {
    normalized = normalize(validation.raw);
    stages.push({ stage: 'normalize', status: 'completed', detail: `${normalized.lengthChars} chars` });
  } catch (e) {
    normalized = { mode, raw: validation.raw, text: validation.raw, lengthChars: validation.raw.length };
    stages.push({ stage: 'normalize', status: 'failed', detail: e instanceof Error ? e.message : 'unknown' });
    warnings.push('Normalization encountered an issue; analysis proceeded on raw text.');
  }

  // 3. Extract entities
  let entities;
  try {
    entities = extractEntities(normalized.text);
    stages.push({
      stage: 'extract',
      status: 'completed',
      detail: `${entities.urls.length} URL(s), ${entities.domains.length} domain(s), ${entities.identities.length} identity claim(s)`,
    });
  } catch (e) {
    entities = { urls: [], domains: [], identities: [] };
    stages.push({ stage: 'extract', status: 'failed', detail: e instanceof Error ? e.message : 'unknown' });
    warnings.push('Entity extraction failed; URL and impersonation detectors will run with limited data.');
  }

  // 4. Run detectors
  const detectorResults = runDetectors({ input: normalized, entities });
  stages.push({
    stage: 'detect',
    status: 'completed',
    detail: `${detectorResults.length} detectors ran, ${detectorResults.reduce((n, r) => n + r.findings.length, 0)} raw findings`,
  });

  // 5. Dedupe
  const allRaw = detectorResults.flatMap((r) => r.findings);
  const findings = dedupeFindings(allRaw);
  stages.push({ stage: 'dedupe', status: 'completed', detail: `${allRaw.length} -> ${findings.length} findings` });

  // 6 + 7. Score + classify
  const scoring = calculateRiskDetailed(
    detectorResults.map((r) => ({
      detector: r.detector,
      findings: findings.filter((f) => f.detector === r.detector),
    })),
  );
  const risk = scoring.assessment;
  stages.push({ stage: 'score', status: 'completed', detail: `score ${risk.score}` });
  stages.push({ stage: 'classify', status: 'completed', detail: risk.label });

  // Re-attach the values actually calculated by the scoring engine to the
  // deduplicated findings, preserving the stable presentation order.
  const contributionById = new Map<string, number>();
  for (const finding of scoring.findings) contributionById.set(finding.id, finding.contribution);
  const findingsWithContribution = findings.map((f) => ({
    ...f,
    contribution: contributionById.get(f.id) ?? 0,
  }));

  // 8. Recommendations
  const recommendations = generateRecommendations({ findings: findingsWithContribution });
  stages.push({ stage: 'recommend', status: 'completed', detail: `${recommendations.length} action(s)` });

  // Capability warnings (always present for transparency).
  warnings.push('Reputation, domain age, DNS, redirects, and live threat-intelligence were not checked. Any "reputation" is unchecked by design.');
  if (mode === 'screenshot') {
    warnings.push('Screenshot analysis is based on manually transcribed text, not an automated OCR pass over the image.');
  }

  return {
    input: normalized,
    entities,
    findings: findingsWithContribution,
    risk,
    recommendations,
    stages,
    warnings,
    createdAt: new Date().toISOString(),
  };
}
