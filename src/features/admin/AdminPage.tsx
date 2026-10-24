import { useMemo } from 'react';
import { AlertTriangle, BarChart3, FileWarning, Lock } from 'lucide-react';
import type { IncidentReport, IncidentCategory } from '@/features/reports/incidentTypes';
import { SEED_INCIDENTS } from '@/features/reports/incidentTypes';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { SeverityBadge, StatusBadge } from '@/components/Badges';
import { cn } from '@/lib/cn';

// Pattern labels derived from categories — used to describe common scam patterns.
const PATTERN_LABELS: Record<IncidentCategory, string> = {
  Phishing: 'Phishing links',
  Impersonation: 'Brand impersonation',
  'Financial Fraud': 'Payment / fee fraud',
  'Suspicious URL': 'Deceptive URLs',
  'Credential Theft': 'Credential harvesting',
  Other: 'Other',
};

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function BarRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : (count / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-xs text-navy-300">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-800">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-navy-200">{count}</span>
    </div>
  );
}

export function AdminPage() {
  const [userReports] = useLocalStorage<IncidentReport[]>('threatlens:reports', []);

  // Combine seeded demo incidents with user reports. Demo incidents are clearly labelled.
  const all = useMemo(() => {
    return [...userReports, ...SEED_INCIDENTS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [userReports]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of all) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const bySeverity = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of all) m.set(r.severity, (m.get(r.severity) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => (SEVERITY_ORDER[a[0]] ?? 9) - (SEVERITY_ORDER[b[0]] ?? 9));
  }, [all]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of all) m.set(r.status, (m.get(r.status) ?? 0) + 1);
    return [...m.entries()];
  }, [all]);

  const maxCat = Math.max(1, ...byCategory.map(([, n]) => n));
  const maxSev = Math.max(1, ...bySeverity.map(([, n]) => n));
  const maxStatus = Math.max(1, ...byStatus.map(([, n]) => n));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Admin Insights</h1>
          <p className="text-sm text-navy-400">Aggregate view of reported incidents.</p>
        </div>
        <span className="badge bg-navy-700/50 text-navy-100">
          <Lock className="h-3 w-3" /> Demonstration only
        </span>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100/80">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p>
          This dashboard has no real authentication and is for demonstration. Incident counts combine clearly labelled seeded mock data with reports you submit locally. Personal details are not displayed.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total incidents', value: all.length, icon: FileWarning },
          { label: 'Critical severity', value: bySeverity.find(([s]) => s === 'critical')?.[1] ?? 0, icon: AlertTriangle },
          { label: 'Under review', value: byStatus.find(([s]) => s === 'Under Review')?.[1] ?? 0, icon: BarChart3 },
          { label: 'Resolved', value: byStatus.find(([s]) => s === 'Resolved')?.[1] ?? 0, icon: BarChart3 },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-navy-400">{s.label}</span>
                <Icon className="h-4 w-4 text-teal-400" />
              </div>
              <p className="mt-1.5 font-mono text-2xl font-bold text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-navy-100">Incidents by category</h3>
          <div className="mt-4 space-y-3">
            {byCategory.length === 0 && <p className="text-xs text-navy-400">No data.</p>}
            {byCategory.map(([cat, n]) => (
              <BarRow key={cat} label={PATTERN_LABELS[cat as IncidentCategory] ?? cat} count={n} max={maxCat} color="bg-teal-500" />
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-navy-100">Severity distribution</h3>
          <div className="mt-4 space-y-3">
            {bySeverity.length === 0 && <p className="text-xs text-navy-400">No data.</p>}
            {bySeverity.map(([sev, n]) => {
              const color = sev === 'critical' ? 'bg-red-500' : sev === 'high' ? 'bg-orange-500' : sev === 'medium' ? 'bg-amber-500' : 'bg-teal-500';
              return <BarRow key={sev} label={sev} count={n} max={maxSev} color={color} />;
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 card p-5">
        <h3 className="text-sm font-semibold text-navy-100">Status distribution</h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {['Submitted', 'Under Review', 'Resolved'].map((st) => (
            <div key={st} className="rounded-lg border border-navy-700/60 bg-navy-800/30 p-3 text-center">
              <p className="font-mono text-xl font-bold text-white">{byStatus.find(([s]) => s === st)?.[1] ?? 0}</p>
              <p className="mt-1 text-xs text-navy-400">{st}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent reports */}
      <div className="mt-4 card p-5">
        <h3 className="text-sm font-semibold text-navy-100">Recent reports</h3>
        <ul className="mt-3 divide-y divide-navy-800">
          {all.slice(0, 8).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <span className="font-mono text-xs text-teal-300">{r.id}</span>
              <span className="badge bg-navy-700/50 text-navy-100">{r.category}</span>
              <SeverityBadge severity={r.severity} />
              <StatusBadge status={r.status} />
              <span className="ml-auto text-[11px] text-navy-500">{new Date(r.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
