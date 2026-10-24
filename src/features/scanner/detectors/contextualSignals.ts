import type { DetectionFinding, DetectorResult, NormalizedInput, ExtractedEntities } from '../types';
import { makeFindingId } from '../pipeline/analyze';

/**
 * Contextual detector: looks at combinations of signals produced by other detectors
 * and the raw text to catch reinforcing patterns that are stronger together than apart.
 * It intentionally does NOT re-run phrase matching; it composes from entities + text.
 */
interface Combo {
  test: (ctx: { text: string; entities: ExtractedEntities }) => boolean;
  title: string;
  severity: 'high' | 'critical';
  explanation: string;
  weight: number;
  recommendation: string;
}

const COMBOS: Combo[] = [
  {
    test: ({ text, entities }) =>
      /\b(otp|password|pin|login|verify|account|credentials)\b/i.test(text) &&
      entities.urls.length > 0,
    title: 'Credential request combined with a link',
    severity: 'critical',
    explanation: 'The message requests credentials or verification and contains at least one link — a classic credential-harvesting pattern.',
    weight: 1.3,
    recommendation: 'Do not enter credentials through the link. Sign in by typing the official domain yourself.',
  },
  {
    test: ({ text, entities }) =>
      entities.identities.length > 0 &&
      /\b(pay|payment|fee|refund|transfer|neft|imps|rtgs|upi|gift card)\b/i.test(text),
    title: 'Brand impersonation combined with a payment request',
    severity: 'critical',
    explanation: 'A claimed brand identity appears together with a payment request. This combination strongly raises the risk of financial fraud.',
    weight: 1.3,
    recommendation: 'Do not pay. Independently verify the request through an official channel.',
  },
  {
    test: ({ text, entities }) =>
      /\b(urgent|immediately|within \d+|suspend\w*|deactivat\w+|expire\w*)\b/i.test(text) &&
      /\b(password|otp|pin|verify|account|login)\b/i.test(text) &&
      entities.urls.length > 0,
    title: 'Urgency + credential request + link',
    severity: 'critical',
    explanation: 'Urgency pressure, a credential request, and a link appear together. This triad is one of the most reliable phishing signatures.',
    weight: 1.4,
    recommendation: 'Treat as high risk. Do not act from this message; use an official app or website.',
  },
  {
    test: ({ text, entities }) =>
      entities.urls.length >= 2 &&
      /\b(click|tap|visit|open|follow|link)\b/i.test(text),
    title: 'Multiple links with click encouragement',
    severity: 'medium',
    explanation: 'The message contains multiple links alongside language encouraging a click. Alone this is weak, but it reinforces other signals.',
    weight: 0.6,
    recommendation: 'If one of the links is unexpected, do not click. Inspect each link before opening.',
  },
];

export function detectContextual(input: { input: NormalizedInput; entities: ExtractedEntities }): DetectorResult {
  const text = input.input.text;
  const findings: DetectionFinding[] = [];
  for (const combo of COMBOS) {
    if (combo.test({ text, entities: input.entities })) {
      findings.push({
        id: makeFindingId('contextual'),
        detector: 'contextual',
        title: combo.title,
        severity: combo.severity,
        evidence: '(composite signal from multiple indicators)',
        explanation: combo.explanation,
        confidence: combo.severity === 'critical' ? 0.85 : 0.65,
        weight: combo.weight,
        contribution: 0,
        recommendation: combo.recommendation,
      });
    }
  }
  return { detector: 'contextual', findings };
}
