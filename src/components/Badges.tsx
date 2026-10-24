import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { RiskBand, Severity } from '@/features/scanner/types';
import { cn } from '@/lib/cn';

export const BAND_THEME: Record<RiskBand, { text: string; bg: string; ring: string; bar: string; icon: LucideIcon }> = {
  low: { text: 'text-teal-300', bg: 'bg-teal-500/10', ring: 'ring-teal-500/30', bar: 'bg-teal-500', icon: ShieldCheck },
  medium: { text: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', bar: 'bg-amber-500', icon: Info },
  high: { text: 'text-orange-300', bg: 'bg-orange-500/10', ring: 'ring-orange-500/30', bar: 'bg-orange-500', icon: ShieldAlert },
  critical: { text: 'text-red-300', bg: 'bg-red-500/10', ring: 'ring-red-500/30', bar: 'bg-red-500', icon: AlertTriangle },
};

export const SEVERITY_THEME: Record<Severity, { label: string; badge: string; dot: string }> = {
  info: { label: 'Info', badge: 'bg-navy-600/50 text-navy-100', dot: 'bg-navy-300' },
  low: { label: 'Low', badge: 'bg-teal-500/15 text-teal-300', dot: 'bg-teal-400' },
  medium: { label: 'Medium', badge: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-400' },
  high: { label: 'High', badge: 'bg-orange-500/15 text-orange-300', dot: 'bg-orange-400' },
  critical: { label: 'Critical', badge: 'bg-red-500/15 text-red-300', dot: 'bg-red-400' },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const t = SEVERITY_THEME[severity];
  return (
    <span className={cn('badge', t.badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />
      {t.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Submitted: 'bg-navy-600/50 text-navy-100',
    'Under Review': 'bg-amber-500/15 text-amber-300',
    Resolved: 'bg-teal-500/15 text-teal-300',
  };
  return <span className={cn('badge', map[status] ?? 'bg-navy-600/50 text-navy-100')}>{status}</span>;
}

export { CheckCircle2 };
