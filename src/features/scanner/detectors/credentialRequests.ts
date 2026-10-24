import type { DetectionFinding, DetectorResult, NormalizedInput, ExtractedEntities } from '../types';
import { makeFindingId } from '../pipeline/analyze';

interface Signal {
  pattern: RegExp;
  title: string;
  severity: 'medium' | 'high' | 'critical';
  explanation: string;
}

export const CREDENTIAL_SIGNALS: Signal[] = [
  {
    pattern: /\benter your (password|pin|otp|one[- ]?time password|cvv|cvv2|atm pin|upi pin|mpin)\b/i,
    title: 'Direct request for credentials',
    severity: 'critical',
    explanation: 'Asks the recipient to enter a password, PIN, OTP, or CVV — legitimate services never request these.',
  },
  {
    pattern: /\b(verify your (account|identity|login|sign[- ]?in) (by|via|through|with)|confirm.{0,30}(password|pin|otp|code))\b/i,
    title: 'Verify-account credential request',
    severity: 'high',
    explanation: 'Frames credential disclosure as an account verification step.',
  },
  {
    pattern: /\b(recovery (phrase|words?|code|key)|seed phrase|backup (codes?|phrase|key)|24[- ]?word (phrase|seed)|12[- ]?word (phrase|seed))\b/i,
    title: 'Recovery phrase / seed phrase request',
    severity: 'critical',
    explanation: 'Mentions recovery or seed phrases — access to these equals access to the wallet or account.',
  },
  {
    pattern: /\bshare your (password|pin|otp|code|cvv|mpin|upi pin|otp code)\b/i,
    title: 'Request to share credentials',
    severity: 'critical',
    explanation: 'Explicitly asks the user to share a credential or OTP.',
  },
  {
    pattern: /\b(otp|one[- ]?time password|verification code|security code|login code).{0,40}(expire|expir\w+|valid for|within)\b/i,
    title: 'OTP / verification code framing',
    severity: 'medium',
    explanation: 'Mentions OTP or verification codes near expiry language; can precede a request to disclose the code.',
  },
  {
    pattern: /\b(update|confirm|verify|reactivate).{0,30}(your )?(password|login|credentials|account details|banking details|payment details).{0,40}(link|website|portal|below|here)\b/i,
    title: 'Credential update via link',
    severity: 'high',
    explanation: 'Directs the user to update or verify credentials through a link — classic credential-harvesting flow.',
  },
];

// Benign guard: security education that tells the user NOT to share.
const BENIGN_GUARD = /\b(never share your (otp|pin|password|cvv|mpin)|do not share your (otp|pin|password|cvv|mpin)|never (share|disclose|give out) your (otp|pin|password))\b/i;

export function detectCredentials(input: { input: NormalizedInput; entities: ExtractedEntities }): DetectorResult {
  const text = input.input.text;
  const findings: DetectionFinding[] = [];
  const guarded = BENIGN_GUARD.test(text);

  for (const sig of CREDENTIAL_SIGNALS) {
    const re = new RegExp(sig.pattern.source, sig.pattern.flags + (sig.pattern.flags.includes('g') ? '' : 'g'));
    for (const m of text.matchAll(re)) {
      const evidence = m[0].trim().slice(0, 120);
      if (guarded) {
        // Only suppress if the match itself is instructional ("never share your OTP"); direct credential requests still fire.
        findings.push({
          id: makeFindingId('credentials'),
          detector: 'credentials',
          title: sig.title,
          severity: 'info',
          evidence,
          explanation: `${sig.explanation} (Surrounding text advises protecting credentials; downgraded.)`,
          confidence: 0.3,
          weight: 0.3,
          contribution: 0,
        });
      } else {
        findings.push({
          id: makeFindingId('credentials'),
          detector: 'credentials',
          title: sig.title,
          severity: sig.severity,
          evidence,
          explanation: sig.explanation,
          confidence: sig.severity === 'critical' ? 0.9 : 0.8,
          weight: sig.severity === 'critical' ? 1.2 : 1,
          contribution: 0,
          recommendation:
            sig.severity === 'critical'
              ? 'Never share the requested credential. If you already did, change the password immediately and enable MFA.'
              : undefined,
        });
      }
    }
  }
  return { detector: 'credentials', findings, notes: guarded ? 'Benign guard phrase detected; downgraded.' : undefined };
}
