import type { DetectionFinding, DetectorResult, NormalizedInput, ExtractedEntities } from '../types';
import { makeFindingId } from '../pipeline/analyze';

interface Signal {
  pattern: RegExp;
  title: string;
  severity: 'medium' | 'high' | 'critical';
  explanation: string;
}

export const FINANCIAL_SIGNALS: Signal[] = [
  {
    pattern: /\b(delivery (fee|charge|payment)|package (fee|charge)|customs (fee|charge)|clearance (fee|charge))\b/i,
    title: 'Unexpected delivery fee',
    severity: 'high',
    explanation: 'Requests a delivery, customs, or clearance fee — a common parcel-scam lure.',
  },
  {
    pattern: /\b(refund (fee|processing fee)|claim (fee|charge)|processing fee.{0,30}(prize|winnings?|refund))\b/i,
    title: 'Refund or prize-claim fee',
    severity: 'high',
    explanation: 'Asks for a fee to release a refund or prize. Legitimate refunds never require upfront payment.',
  },
  {
    pattern: /\b(urgent payment|payment (is )?due|outstanding (payment|balance|invoice)|pay.{0,20}(now|immediately|today).{0,30}(invoice|balance|due))\b/i,
    title: 'Urgent payment demand',
    severity: 'medium',
    explanation: 'Pressures the recipient to make an urgent payment.',
  },
  {
    pattern: /\b((bank|account) (details?|information|number)|update.{0,20}(bank|payment|billing|card).{0,20}(details?|information)|confirm.{0,20}(bank|card|payment))\b/i,
    title: 'Banking / payment detail request',
    severity: 'high',
    explanation: 'Asks for banking or payment details, often paired with impersonation.',
  },
  {
    pattern: /\b(transfer.{0,30}(funds?|money|amount)|wire transfer|neft|imps|rtgs|upi (transaction|payment|transfer))\b/i,
    title: 'Payment transfer request',
    severity: 'medium',
    explanation: 'Mentions a money transfer method; combined with urgency or impersonation this becomes a strong signal.',
  },
  {
    pattern: /\b(escrow|secure payment|verified (payment|account))\b/i,
    title: 'Trust-language payment framing',
    severity: 'low',
    explanation: 'Uses trust-building language ("escrow", "secure payment") near payment context; weak standalone signal.',
  },
  {
    pattern: /\b((gift card|voucher|itunes|google play|amazon pay).{0,30}(payment|pay|purchase|buy)|pay.{0,20}(gift card|voucher))\b/i,
    title: 'Gift-card payment request',
    severity: 'high',
    explanation: 'Requests payment via gift cards — a hallmark of fraud.',
  },
];

export function detectFinancial(input: { input: NormalizedInput; entities: ExtractedEntities }): DetectorResult {
  const text = input.input.text;
  const findings: DetectionFinding[] = [];

  for (const sig of FINANCIAL_SIGNALS) {
    const re = new RegExp(sig.pattern.source, sig.pattern.flags + (sig.pattern.flags.includes('g') ? '' : 'g'));
    for (const m of text.matchAll(re)) {
      const evidence = m[0].trim().slice(0, 120);
      const confidence = sig.severity === 'critical' ? 0.85 : sig.severity === 'high' ? 0.75 : 0.55;
      findings.push({
        id: makeFindingId('financial'),
        detector: 'financial',
        title: sig.title,
        severity: sig.severity,
        evidence,
        explanation: sig.explanation,
        confidence,
        weight: sig.severity === 'high' ? 1.1 : sig.severity === 'critical' ? 1.2 : 0.8,
        contribution: 0,
        recommendation: 'Do not make any payment. If you already did, contact your bank or UPI app to dispute and block the transaction.',
      });
    }
  }

  return { detector: 'financial', findings };
}
