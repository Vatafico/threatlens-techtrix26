import type { DetectionFinding, DetectorResult, NormalizedInput, ExtractedEntities, Severity } from '../types';
import { makeFindingId } from '../pipeline/analyze';

// Each phrase group is a configurable detection resource, not exhaustive coverage.
interface Signal {
  pattern: RegExp;
  title: string;
  severity: Severity;
  weight: number;
  explanation: string;
}

// Negation / benign-context guards. If any match near a signal, suppress or downgrade.
const BENIGN_GUARD =
  /\b(your (own )?(policy|security (policy|guide|best practices?))|how (to|does one) (spot|recogni[sz]e|avoid)|to (spot|avoid|recogni[sz]e)|phishing (awareness|training|course|guide)|never (share|give|provide) your|do not (share|send) your|educational (guide|article|video|module))\b/i;

export const URGENCY_SIGNALS: Signal[] = [
  {
    pattern: /\baccount (will be|has been|is being)?\s?(suspended|deactivat\w+|terminat\w+|locked|restricted|disabled)\b/i,
    title: 'Account suspension threat',
    severity: 'high',
    weight: 1,
    explanation: 'Threatens that an account will be suspended or disabled, a common coercion tactic.',
  },
  {
    pattern: /\b(immediately|right now|within \d+ (hour|minute|day)s?|in the next \d+ (hour|minute|day)s?|before (midnight|end of (the )?day|tomorrow|tonight))\b/i,
    title: 'Immediate-action deadline',
    severity: 'medium',
    weight: 0.8,
    explanation: 'Imposes a tight artificial deadline to pressure a hasty decision.',
  },
  {
    pattern: /\b(verify.{0,40}(account|identity|details?|information)|confirm.{0,40}(account|identity|details?|information)).{0,40}(otherwise|else|or (we|your|account)|failure)\b/i,
    title: 'Verify-or-lose-access demand',
    severity: 'high',
    weight: 1,
    explanation: 'Demand to "verify" details with an explicit consequence for inaction.',
  },
  {
    pattern: /\b(security alert|unusual (sign-?in|activity|login)|suspicious (sign-?in|activity|login|attempt)|account access (attempt|detected)|we (detected|noticed) (a|some)?\s?(suspicious|unauthorized))\b/i,
    title: 'Security-alert pressure',
    severity: 'medium',
    weight: 0.7,
    explanation: 'Frames the message as an urgent security alert — a frequent phishing pretext.',
  },
  {
    pattern: /\b(you[r]?\s+(prize|reward|winnings?)|congratulations,?\s+you|you have (won|been selected)|claim your (prize|reward|winnings?))\b/i,
    title: 'Unexpected reward or prize',
    severity: 'medium',
    weight: 0.7,
    explanation: 'Unexpected prize or reward is a classic lure used to extract fees or data.',
  },
  {
    pattern: /\b(you will (lose|loose) (access|your account)|your (account|access) will be (closed|removed|deleted|terminated)|final (notice|warning|reminder))\b/i,
    title: 'Loss-of-access threat',
    severity: 'high',
    weight: 1,
    explanation: 'Threatens loss of access to pressure compliance.',
  },
];

export function detectUrgency(input: { input: NormalizedInput; entities: ExtractedEntities }): DetectorResult {
  const text = input.input.text;
  const findings: DetectionFinding[] = [];

  const guarded = BENIGN_GUARD.test(text);

  for (const sig of URGENCY_SIGNALS) {
    const matches = text.matchAll(new RegExp(sig.pattern.source, sig.pattern.flags.includes('g') ? sig.pattern.flags : sig.pattern.flags + 'g'));
    let matched = false;
    for (const m of matches) {
      matched = true;
      const evidence = m[0].trim().slice(0, 120);
      // If the whole message reads as educational, downgrade.
      if (guarded) {
        findings.push({
          id: makeFindingId('urgency'),
          detector: 'urgency',
          title: sig.title,
          severity: 'info',
          evidence,
          explanation: `${sig.explanation} (Flagged at low confidence because the surrounding text reads as educational discussion.)`,
          confidence: 0.3,
          weight: sig.weight * 0.4,
          contribution: 0,
          recommendation: undefined,
        });
      } else {
        findings.push({
          id: makeFindingId('urgency'),
          detector: 'urgency',
          title: sig.title,
          severity: sig.severity,
          evidence,
          explanation: sig.explanation,
          confidence: sig.severity === 'high' ? 0.8 : 0.65,
          weight: sig.weight,
          contribution: 0,
        });
      }
    }
    if (!matched) continue;
  }

  return {
    detector: 'urgency',
    findings,
    notes: guarded ? 'Surrounding text appears educational; urgency signals downgraded.' : undefined,
  };
}
