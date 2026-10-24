import {
  BookOpen,
  KeyRound,
  Link as LinkIcon,
  Link2Off,
  MousePointerClick,
  Phone,
  ShieldCheck,
  StickyNote,
  UserX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  points: string[];
}

const LESSONS: Lesson[] = [
  {
    id: 'phishing',
    title: 'Recognising phishing',
    icon: StickyNote,
    summary: 'Phishing messages impersonate trusted senders to extract credentials, money, or access.',
    points: [
      'Watch for urgency ("verify now", "account suspended") and generic greetings.',
      'Be suspicious of any message that asks for passwords, OTPs, or payment via a link.',
      'Check the sender address and link destination before clicking — mismatches are a red flag.',
      'When unsure, contact the organization through an official channel, never via the message itself.',
    ],
  },
  {
    id: 'domains',
    title: 'Detecting misleading domains',
    icon: Link2Off,
    summary: 'Attackers register look-alike domains to imitate real services.',
    points: [
      'Read the registrable domain (last two labels before the TLD) — that is the real site.',
      'Beware of subdomains like "login.realbrand.example.com" — the real site is example.com.',
      'Watch for punycode (xn--) domains that visually mimic well-known brands.',
      'IP addresses, unusual ports, and user-info (@) segments are warning signs.',
    ],
  },
  {
    id: 'passwords',
    title: 'Password managers & unique passwords',
    icon: KeyRound,
    summary: 'Reuse one password everywhere and one breach exposes every account.',
    points: [
      'Use a reputable password manager to generate and store a unique password per account.',
      'Never reuse passwords across banking, email, and social accounts.',
      'A long passphrase (4+ random words) is both strong and easy to remember.',
      'Change a password immediately if you suspect it was entered on a phishing page.',
    ],
  },
  {
    id: 'mfa',
    title: 'Multi-factor authentication',
    icon: ShieldCheck,
    summary: 'MFA blocks most account takeovers even when a password leaks.',
    points: [
      'Enable MFA on email, banking, and any account that supports it.',
      'Prefer an authenticator app or hardware key over SMS-based codes.',
      'Never share an MFA code with anyone — legitimate support will never ask for it.',
      'Be wary of unexpected MFA prompts; deny them and review recent sign-ins.',
    ],
  },
  {
    id: 'browsing',
    title: 'Safe browsing & attachments',
    icon: MousePointerClick,
    summary: 'Most compromises start with a click. Slow down before you click.',
    points: [
      'Keep your browser and operating system updated.',
      'Do not open unexpected attachments, especially .zip, .exe, or macro-enabled documents.',
      'Hover (or long-press on mobile) to preview a link destination before clicking.',
      'Type the official domain yourself rather than following a link from a message.',
    ],
  },
  {
    id: 'after-click',
    title: 'After clicking a suspicious link',
    icon: LinkIcon,
    summary: 'Acting quickly limits damage if you clicked something you shouldn\'t have.',
    points: [
      'Disconnect from the internet and close the tab immediately.',
      'Run a reputable antivirus or malware scan on your device.',
      'Change the password for the account that may have been exposed, from a trusted device.',
      'Enable MFA and review recent sign-in activity on the affected account.',
    ],
  },
  {
    id: 'impersonation',
    title: 'Spotting impersonation',
    icon: UserX,
    summary: 'Fraudsters pose as banks, couriers, government, and employers.',
    points: [
      'Banks never ask for your PIN, OTP, CVV, or full password by call, SMS, or email.',
      'Government agencies use official portals and never demand instant payment by gift card.',
      'Courier scams invent a delivery fee or customs charge to lure payments.',
      'Verify caller identity by hanging up and calling back on an officially published number.',
    ],
  },
  {
    id: 'report-india',
    title: 'Reporting cyber fraud in India',
    icon: Phone,
    summary: 'Official Indian resources for reporting cybercrime and fraud.',
    points: [
      'National Cyber Crime Reporting Portal: https://cybercrime.gov.in',
      'Cybercrime helpline: 1930 (for financial fraud, report within the "golden hour").',
      'Keep evidence: screenshots, sender details, transaction references, and timestamps.',
      'For card/UPI fraud, also notify your bank or payment app to block the transaction.',
    ],
  },
];

export function AcademyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-500/30">
            <BookOpen className="h-5 w-5 text-teal-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Cyber Safety Academy</h1>
            <p className="text-sm text-navy-400">Practical, accurate guidance for spotting and responding to fraud.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LESSONS.map((l) => {
          const Icon = l.icon;
          return (
            <article key={l.id} className="card card-hover p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-800 ring-1 ring-navy-700">
                  <Icon className="h-4.5 w-4.5 text-teal-300" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-navy-100">{l.title}</h2>
                  <p className="mt-1 text-xs text-navy-400">{l.summary}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {l.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-navy-200">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <p className="mt-6 rounded-lg border border-navy-700/60 bg-navy-900/40 p-4 text-xs text-navy-400">
        ThreatLens does not automatically submit reports to external authorities. Use the resources above to report directly when needed.
      </p>
    </div>
  );
}
