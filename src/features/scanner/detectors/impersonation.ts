import type { DetectionFinding, DetectorResult, NormalizedInput, ExtractedEntities, Severity } from '../types';
import { makeFindingId } from '../pipeline/analyze';
import { BRAND_DOMAINS } from '../pipeline/extractEntities';

/**
 * Impersonation detector. Two families of finding:
 * 1) A claimed brand identity is present alongside a request-like context (credentials, money, urgency).
 * 2) A claimed brand's domains do not match the domains extracted from URLs in the message.
 */
function hasRequestContext(text: string): boolean {
  return /\b(verify|confirm|update|login|sign[- ]?in|password|otp|pin|pay|payment|fee|refund|transfer|account|suspend\w*|immediately|urgent)\b/i.test(text);
}

function domainsContainBrandDomain(brand: string, domains: string[]): boolean {
  const brandDomains = BRAND_DOMAINS[brand] ?? [brand];
  return domains.some((d) => brandDomains.some((bd) => d === bd || d.includes(`${bd}.`) || d.endsWith(`.${bd}`) || d === bd.replace(/\..*/, '') || d.includes(bd.split('.')[0])));
}

export function detectImpersonation(input: { input: NormalizedInput; entities: ExtractedEntities }): DetectorResult {
  const { input: norm, entities } = input;
  const text = norm.text;
  const findings: DetectionFinding[] = [];
  const hasRequest = hasRequestContext(text);

  for (const id of entities.identities) {
    if (hasRequest) {
      findings.push({
        id: makeFindingId('impersonation'),
        detector: 'impersonation',
        title: `Claims to represent ${id.raw}`,
        severity: 'high',
        evidence: id.raw,
        explanation: `The message presents as "${id.raw}" while also containing a request (credentials, payment, or urgent action). This combination is a strong impersonation indicator.`,
        confidence: 0.8,
        weight: 1.1,
        contribution: 0,
        recommendation: `Contact ${id.raw} through an officially listed phone number or app — not through any link in this message.`,
      });
    } else {
      // Brand mention without an actionable request — lower confidence.
      findings.push({
        id: makeFindingId('impersonation'),
        detector: 'impersonation',
        title: `Brand mention: ${id.raw}`,
        severity: 'low',
        evidence: id.raw,
        explanation: `Mentions "${id.raw}". Without a coupled request this is weak on its own, but worth noting.`,
        confidence: 0.4,
        weight: 0.3,
        contribution: 0,
      });
    }
  }

  // Claimed-brand vs extracted-domain mismatch (only when both present).
  if (entities.identities.length > 0 && entities.domains.length > 0) {
    for (const id of entities.identities) {
      if (!domainsContainBrandDomain(id.brand, entities.domains)) {
        findings.push({
          id: makeFindingId('impersonation'),
          detector: 'impersonation',
          title: `Brand/domain mismatch: ${id.raw}`,
          severity: 'high' as Severity,
          evidence: entities.domains.join(', '),
          explanation: `The message claims to represent "${id.raw}" but the extracted domains (${entities.domains.join(', ')}) do not match that brand's known domains.`,
          confidence: 0.85,
          weight: 1.2,
          contribution: 0,
          recommendation: 'Treat the sender domain as unverified. Do not log in through this message.',
        });
      }
    }
  }

  return { detector: 'impersonation', findings };
}
