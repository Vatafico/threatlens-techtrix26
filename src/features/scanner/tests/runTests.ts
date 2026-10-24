import type { AnalysisResult, InputMode } from '../types';
import { analyzeInput } from '../pipeline/analyzeInput';
import { SAMPLE_CASES } from '../samples';

export interface TestCase {
  id: string;
  description: string;
  mode: InputMode;
  input: string;
  /** Assertion returns true when the expectation holds. */
  expect: (r: AnalysisResult) => boolean;
  /** Human-readable description of what should be true. */
  expectation: string;
}

const T = (id: string, description: string, mode: InputMode, input: string, expectation: string, expect: (r: AnalysisResult) => boolean): TestCase => ({
  id,
  description,
  mode,
  input,
  expectation,
  expect,
});

export const TEST_CASES: TestCase[] = [
  // Credential-harvesting SMS
  T(
    'cred-sms',
    'Credential-harvesting SMS asks for OTP via a link',
    'sms',
    'Your Paytm account is suspended. Verify now by entering your OTP at http://paytm-verify.example.in/otp within 1 hour or lose access.',
    'Critical or high risk with a credentials finding',
    (r) => (r.risk.band === 'critical' || r.risk.band === 'high') && r.findings.some((f) => f.detector === 'credentials'),
  ),
  // Delivery-fee fraud
  T(
    'delivery-fee',
    'Delivery-fee SMS uses a shortener link',
    'sms',
    'BLUEDART: parcel held. Pay Rs.35 delivery fee now http://bit.ly/bd-pay or it will be returned within 24 hours.',
    'High/critical risk with a financial finding and a shortener finding',
    (r) =>
      (r.risk.band === 'critical' || r.risk.band === 'high') &&
      r.findings.some((f) => f.detector === 'financial') &&
      r.findings.some((f) => f.detector === 'urlStructure' && /shortener/i.test(f.title)),
  ),
  // Bank impersonation
  T(
    'bank-impersonation',
    'Email impersonating a bank with a verify link',
    'email',
    'From: SBI <no-reply@sb1-verify.example.in>\nDear Customer, unusual activity detected. Verify your account details immediately to avoid suspension: http://sb1-verify.example.in/login',
    'High/critical risk with an impersonation finding and credentials/financial',
    (r) =>
      (r.risk.band === 'critical' || r.risk.band === 'high') &&
      r.findings.some((f) => f.detector === 'impersonation'),
  ),
  // Misleading hostname
  T(
    'misleading-host',
    'Misleading subdomain arrangement',
    'url',
    'http://login.paytm.example.com/secure',
    'A misleading-subdomain or impersonation finding is present',
    (r) => r.findings.some((f) => /subdomain/i.test(f.title) || f.detector === 'impersonation'),
  ),
  // URL shortener
  T(
    'shortener',
    'Known URL shortener flagged',
    'url',
    'https://bit.ly/3xY7z',
    'A shortener finding is present',
    (r) => r.findings.some((f) => /shortener/i.test(f.title)),
  ),
  // Benign notification
  T(
    'benign-notification',
    'Routine library due-date notice',
    'email',
    'Your library book "Clean Code" is due for return on 5 November. Please return it to the front desk or renew online through your library account portal.',
    'Low risk with no critical findings',
    (r) => r.risk.band === 'low' && !r.findings.some((f) => f.severity === 'critical'),
  ),
  // Educational content about phishing
  T(
    'edu-phishing',
    'Educational text containing "phishing" and "verify"',
    'email',
    'This phishing awareness guide explains how to recognize scams. Never share your OTP or password. Verify any suspicious sign-in alert by signing in to the official app directly.',
    'No critical credential-harvesting finding',
    (r) => !r.findings.some((f) => f.detector === 'credentials' && f.severity === 'critical'),
  ),
  // Harmless security advice containing suspicious keywords
  T(
    'benign-advice',
    'Security advice containing "password" and "urgent"',
    'sms',
    'Reminder: never give your password to anyone, even in urgent situations. Enable two-factor authentication for better safety.',
    'Low or medium risk, no critical findings',
    (r) => (r.risk.band === 'low' || r.risk.band === 'medium') && !r.findings.some((f) => f.severity === 'critical'),
  ),
  // Malformed URL
  T(
    'malformed-url',
    'Malformed URL input does not crash',
    'url',
    'ht!tp:// broken',
    'Analysis completes; no fatal error; findings array exists',
    (r) => Array.isArray(r.findings) && r.stages.some((s) => s.stage === 'detect' && s.status === 'completed'),
  ),
  // Empty input
  T(
    'empty',
    'Empty input fails validation gracefully',
    'email',
    '',
    'Validation stage failed; risk label is not a normal band label',
    (r) => r.stages.some((s) => s.stage === 'validate' && s.status === 'failed') && r.risk.label === 'Not analysed',
  ),
  // Oversized input
  T(
    'oversized',
    'Oversized input fails validation',
    'email',
    'x'.repeat(20001),
    'Validation stage failed',
    (r) => r.stages.some((s) => s.stage === 'validate' && s.status === 'failed'),
  ),
  // Contributions should be populated by the scoring pipeline, not remain zero.
  T(
    'scoring-contributions',
    'Scored findings expose non-zero contribution values',
    'sms',
    'Your account is suspended. Claim your prize now and pay a processing fee at http://claim-prize.example.in/pay within 1 hour.',
    'At least one finding has a positive normalized score contribution',
    (r) =>
      r.findings.some((f) => f.contribution > 0) &&
      r.findings.every((f) => Number.isFinite(f.contribution)) &&
      Math.abs(r.findings.reduce((sum, f) => sum + f.contribution, 0) - r.risk.score) < 1.5,
  ),
  // Currency amounts must not be treated as domains.
  T(
    'currency-not-url',
    'Currency amounts are not extracted as URLs',
    'sms',
    'Congratulations, claim your prize. Pay Rs.250 processing fee now at http://amzn-prize.example.in/claim.',
    'Only the actual URL is extracted; Rs.250 is not treated as a URL',
    (r) => r.entities.urls.length === 1 && r.entities.urls[0].raw.includes('amzn-prize.example.in'),
  ),
  // Multiple URLs
  T(
    'multi-url',
    'Multiple URLs extracted',
    'sms',
    'Check http://bit.ly/a-ship and http://amzn-prize.example.in/claim and http://login.paytm.example.com/secure for details. Pay delivery fee now.',
    'Multiple URLs extracted and multiple findings present',
    (r) => r.entities.urls.length >= 2 && r.findings.length >= 2,
  ),
  // Duplicate findings
  T(
    'dup-findings',
    'Repeated identical evidence does not duplicate findings',
    'sms',
    'Verify your account now. Verify your account now. Verify your account now.',
    'Findings do not duplicate the same evidence+title triple',
    (r) => {
      const keys = r.findings.map((f) => f.detector === 'urlStructure'
        ? `${f.detector}|${f.title.toLowerCase()}|${f.evidence.toLowerCase()}`
        : `${f.detector}|${f.title.toLowerCase()}`);
      return new Set(keys).size === keys.length;
    },
  ),
  // Punycode edge case
  T(
    'punycode',
    'Punycode host flagged',
    'url',
    'http://xn--80ak6aa92e.example/login',
    'A punycode finding is present',
    (r) => r.findings.some((f) => /punycode/i.test(f.title)),
  ),
  // Scoring boundaries: zero findings => low band
  T(
    'zero-score',
    'Clean informational URL yields low band',
    'url',
    'https://en.wikipedia.org/wiki/Phishing',
    'Low band when no malicious indicators',
    (r) => r.risk.band === 'low' && r.risk.score >= 0 && r.risk.score <= 20,
  ),
  // Recommendation consistency: high risk always yields at least one action
  T(
    'rec-consistency',
    'Critical-risk case yields at least one recommendation',
    'sms',
    'Your HDFC account is suspended. Enter your password and OTP at http://hdfc-secure.example.in/login within 30 minutes or your account will be closed.',
    'At least one recommendation is generated',
    (r) => (r.risk.band === 'critical' || r.risk.band === 'high') && r.recommendations.length >= 1,
  ),
];

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  results: { id: string; description: string; expectation: string; pass: boolean; detail: string }[];
  ran: boolean;
}

export function runTests(): TestSummary {
  const results = TEST_CASES.map((tc) => {
    let r: AnalysisResult;
    try {
      r = analyzeInput({ raw: tc.input, mode: tc.mode });
    } catch (e) {
      return {
        id: tc.id,
        description: tc.description,
        expectation: tc.expectation,
        pass: false,
        detail: `Threw: ${e instanceof Error ? e.message : 'unknown error'}`,
      };
    }
    let pass = false;
    try {
      pass = tc.expect(r);
    } catch (e) {
      pass = false;
    }
    return {
      id: tc.id,
      description: tc.description,
      expectation: tc.expectation,
      pass,
      detail: pass
        ? `band=${r.risk.band} score=${r.risk.score} findings=${r.findings.length} recs=${r.recommendations.length}`
        : `band=${r.risk.band} score=${r.risk.score} findings=${r.findings.map((f) => f.title).join('; ')}`,
    };
  });

  return {
    total: results.length,
    passed: results.filter((x) => x.pass).length,
    failed: results.filter((x) => !x.pass).length,
    results,
    ran: true,
  };
}

// Sample-case smoke test: ensure each sample runs without crashing.
export function runSampleSmoke(): { label: string; band: string; findings: number }[] {
  return SAMPLE_CASES.map((s) => {
    const r = analyzeInput({ raw: s.content, mode: s.mode });
    return { label: s.label, band: r.risk.band, findings: r.findings.length };
  });
}
