import type { AnalysisResult, DetectionFinding, RecommendedAction } from '../types';

// Central mapping from detector / finding patterns to recommended actions.
// Each finding already may carry its own recommendation; this engine synthesizes
// a compact, deduplicated, ordered list of actions across the whole result.

interface Rule {
  category: RecommendedAction['category'];
  title: string;
  detail: string;
  match: (f: DetectionFinding) => boolean;
  priority: number; // lower = earlier
}

const RULES: Rule[] = [
  {
    category: 'do_not_respond',
    title: 'Do not reply or call any number in the message',
    detail: 'Replies confirm your number is active. Call numbers listed in the message only to verify through an officially published source instead.',
    match: (f) => f.detector === 'urgency' || f.detector === 'impersonation',
    priority: 30,
  },
  {
    category: 'do_not_click',
    title: 'Do not click any link in the message',
    detail: 'If a link is present and suspicious, avoid opening it. Type the official domain of the service directly into your browser instead.',
    match: (f) => f.detector === 'urlStructure' || f.detector === 'contextual',
    priority: 10,
  },
  {
    category: 'change_credentials',
    title: 'Change your password if you already entered it',
    detail: 'If you submitted a password through the message or link, change it immediately on the legitimate service. Use a unique password.',
    match: (f) => f.detector === 'credentials' && f.severity !== 'info',
    priority: 5,
  },
  {
    category: 'enable_mfa',
    title: 'Enable multi-factor authentication',
    detail: 'Turn on MFA on the affected account. If you disclosed an OTP, the attacker may still have it — act quickly.',
    match: (f) => f.detector === 'credentials' && f.severity === 'critical',
    priority: 6,
  },
  {
    category: 'verify_independently',
    title: 'Verify the request through an official channel',
    detail: 'Contact the organization using a phone number or app from their official website — not any contact details from this message.',
    match: (f) => f.detector === 'impersonation' || f.detector === 'financial',
    priority: 15,
  },
  {
    category: 'report',
    title: 'Report this message',
    detail: 'Use the My Reports tab to log this incident locally, and report cyber fraud to official Indian authorities via cybercrime.gov.in or 1930.',
    match: (f) => ['urgency', 'credentials', 'financial', 'impersonation', 'contextual'].includes(f.detector) && f.severity !== 'info',
    priority: 20,
  },
  {
    category: 'general_caution',
    title: 'Keep ordinary caution',
    detail: 'No strong indicators were found, but the absence of detected indicators is not proof of safety.',
    match: (f) => f.severity === 'info' || f.severity === 'low',
    priority: 50,
  },
];

export function generateRecommendations(result: Pick<AnalysisResult, 'findings'>): RecommendedAction[] {
  const matched: { rule: Rule; sources: string[] }[] = [];
  const seen = new Set<RecommendedAction['category']>();

  for (const rule of RULES) {
    const sources: string[] = [];
    for (const f of result.findings) {
      if (rule.match(f)) sources.push(f.id);
    }
    if (sources.length === 0) continue;
    if (seen.has(rule.category)) {
      // merge sources into existing entry
      const existing = matched.find((m) => m.rule.category === rule.category);
      if (existing) existing.sources.push(...sources);
      continue;
    }
    seen.add(rule.category);
    matched.push({ rule, sources });
  }

  matched.sort((a, b) => a.rule.priority - b.rule.priority);

  return matched.map(({ rule, sources }) => ({
    category: rule.category,
    title: rule.title,
    detail: rule.detail,
    sources,
  }));
}
