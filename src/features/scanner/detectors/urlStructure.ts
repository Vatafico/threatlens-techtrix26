import type { DetectionFinding, DetectorResult, NormalizedInput, ExtractedEntities } from '../types';
import { makeFindingId } from '../pipeline/analyze';

export function detectUrlStructure(input: { input: NormalizedInput; entities: ExtractedEntities }): DetectorResult {
  const { entities, input: norm } = input;
  const findings: DetectionFinding[] = [];

  if (entities.urls.length === 0 && norm.mode === 'url') {
    // A URL input that produced no parsed URL is itself a weak signal.
    findings.push({
      id: makeFindingId('urlStructure'),
      detector: 'urlStructure',
      title: 'Malformed URL',
      severity: 'low',
      evidence: norm.text.slice(0, 80),
      explanation: 'A URL was entered but could not be parsed into a valid structure. This alone is not malicious, but URL-mode analysis is limited.',
      confidence: 0.5,
      weight: 0.4,
      contribution: 0,
    });
    return { detector: 'urlStructure', findings };
  }

  for (const u of entities.urls) {
    if (u.isIpHost && u.host) {
      findings.push({
        id: makeFindingId('urlStructure'),
        detector: 'urlStructure',
        title: 'IP-literal host',
        severity: 'high',
        evidence: u.host,
        explanation: `The host "${u.host}" is a raw IP address rather than a domain name. Legitimate brands almost never send links to IP-literal hosts.`,
        confidence: 0.8,
        weight: 1,
        contribution: 0,
        recommendation: 'Avoid clicking. Real sign-in pages use a registered domain, not a raw IP.',
      });
    }
    if (u.hasUserinfo) {
      findings.push({
        id: makeFindingId('urlStructure'),
        detector: 'urlStructure',
        title: 'User-info deception',
        severity: 'high',
        evidence: u.raw,
        explanation: 'The URL includes a user-info segment (user@host), which can be abused to hide the real destination behind a trusted-looking prefix.',
        confidence: 0.85,
        weight: 1.1,
        contribution: 0,
        recommendation: 'Treat the link as untrusted. The text before "@" is not the real host.',
      });
    }
    if (u.isPunycode && u.host) {
      findings.push({
        id: makeFindingId('urlStructure'),
        detector: 'urlStructure',
        title: 'Punycode / IDN host',
        severity: 'high',
        evidence: u.host,
        explanation: `The host "${u.host}" uses punycode (xn--). Punycode can disguise non-Latin characters as a well-known brand.`,
        confidence: 0.75,
        weight: 1,
        contribution: 0,
        recommendation: 'Do not click. If you must, verify the destination by typing the brand domain yourself.',
      });
    }
    if (u.port) {
      findings.push({
        id: makeFindingId('urlStructure'),
        detector: 'urlStructure',
        title: 'Non-standard port',
        severity: 'medium',
        evidence: `${u.host ?? u.raw}:${u.port}`,
        explanation: `The URL uses an explicit port (:${u.port}). Legitimate sign-in pages rarely specify a non-default port.`,
        confidence: 0.6,
        weight: 0.6,
        contribution: 0,
      });
    }
    if (u.isShortener && u.host) {
      findings.push({
        id: makeFindingId('urlStructure'),
        detector: 'urlStructure',
        title: 'URL shortener',
        severity: 'medium',
        evidence: u.host,
        explanation: `The link uses a known shortener (${u.host}). Shorteners hide the real destination, common in phishing.`,
        confidence: 0.7,
        weight: 0.7,
        contribution: 0,
        recommendation: 'Expand the link with a preview service before opening, or avoid it entirely.',
      });
    }
    // Misleading subdomain: trusted brand appears in a subdomain label of an unrelated domain.
    if (u.host) {
      const labels = u.host.split('.');
      if (labels.length >= 3) {
        const trusted = ['login', 'secure', 'account', 'verify', 'bank', 'update', 'confirm', 'app'];
        const tld = labels.slice(-2).join('.');
        // Reserved example TLDs that should never be flagged as deceptive brands
        const reservedTlds = new Set(['example.com', 'example.in', 'test.com', 'invalid.com', 'localhost', 'example.co.in', 'example.net', 'example.org']);
        const brandy = labels.find((l) => trusted.includes(l.toLowerCase()));
        if (brandy && !reservedTlds.has(tld) && !trusted.includes(tld.split('.')[0])) {
          findings.push({
            id: makeFindingId('urlStructure'),
            detector: 'urlStructure',
            title: 'Misleading subdomain arrangement',
            severity: 'medium',
            evidence: u.host,
            explanation: `The subdomain "${brandy}" appears on an unrelated registrable domain "${tld}". This can make a link look like a brand page while pointing elsewhere.`,
            confidence: 0.65,
            weight: 0.8,
            contribution: 0,
          });
        }
      }
    }
  }

  return { detector: 'urlStructure', findings };
}
