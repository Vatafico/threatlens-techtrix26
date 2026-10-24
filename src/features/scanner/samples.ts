import type { InputMode } from '@/features/scanner/types';

export interface SampleCase {
  id: string;
  label: string;
  description: string;
  mode: InputMode;
  content: string;
}

// Reserved example domains (RFC 2606) are used so no real site is ever implicated.
export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'delivery-sms',
    label: 'Suspicious delivery-fee SMS',
    description: 'A parcel-scam SMS demanding a small delivery fee via a shortened link.',
    mode: 'sms',
    content:
      'From: BLUEDART\nYour parcel #BD9921 is held at the hub. Pay a Rs.35 delivery charge to resume delivery within 24 hours or it will be returned. Pay now: http://bit.ly/bd-ship-pay',
  },
  {
    id: 'bank-impersonation',
    label: 'Bank impersonation email',
    description: 'An email claiming to be from a bank, asking you to verify account details via a link.',
    mode: 'email',
    content:
      'From: SBI Customer Care <no-reply@sb1-verify.example.in>\nDear Customer,\nWe noticed unusual activity on your SBI account. To avoid account suspension, verify your account details immediately by signing in through the link below.\nhttp://sb1-verify.example.in/login?ref=secure\nThank you,\nState Bank of India',
  },
  {
    id: 'prize-scam',
    label: 'Unexpected prize message',
    description: 'A message claiming you have won a prize, requiring a claim fee.',
    mode: 'sms',
    content:
      'CONGRATULATIONS! You have been selected as the winner of the Amazon India Mega Draw 2026. Claim your reward of Rs.2,50,000 now. Pay a one-time processing fee of Rs.250 to release your winnings. Claim within 2 hours: http://amzn-prize.example.in/claim',
  },
  {
    id: 'benign-notification',
    label: 'Routine benign notification',
    description: 'A normal service notification with no suspicious indicators.',
    mode: 'email',
    content:
      'Your library book "Clean Code" is due for return on 5 November. Please return it to the front desk or renew online through your library account portal.\nThank you,\nCity Public Library',
  },
  {
    id: 'harmless-url',
    label: 'Harmless informational URL',
    description: 'A link to a legitimate-looking informational page.',
    mode: 'url',
    content: 'https://en.wikipedia.org/wiki/Phishing',
  },
];
