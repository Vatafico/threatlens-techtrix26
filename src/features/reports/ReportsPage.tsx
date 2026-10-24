import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, ShieldAlert } from 'lucide-react';
import {
  INCIDENT_CATEGORIES,
  generateReportId,
  type IncidentCategory,
  type IncidentReport,
} from '@/features/reports/incidentTypes';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { StatusBadge, SeverityBadge } from '@/components/Badges';
import { cn } from '@/lib/cn';

interface ReportsPageProps {
  externalDraft: { summary: string; suspectedUrl?: string } | null;
  consumeExternalDraft: () => void;
}

const MAX_DESC = 500;

export function ReportsPage({ externalDraft, consumeExternalDraft }: ReportsPageProps) {
  const [reports, setReports] = useLocalStorage<IncidentReport[]>('threatlens:reports', []);
  const [category, setCategory] = useState<IncidentCategory>('Phishing');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentReport['severity']>('medium');
  const [suspectedUrl, setSuspectedUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill from scanner "Report this incident" action.
  useEffect(() => {
    if (!externalDraft) return;
    setDescription(externalDraft.summary.slice(0, MAX_DESC));
    setSuspectedUrl(externalDraft.suspectedUrl ?? '');
    setCategory('Phishing');
    setSeverity('medium');
    consumeExternalDraft();
    descRef.current?.focus();
  }, [externalDraft, consumeExternalDraft]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const desc = description.trim();
    if (desc.length < 5) {
      setError('Please add a short description of the incident.');
      return;
    }
    const report: IncidentReport = {
      id: generateReportId(),
      category,
      description: desc,
      severity,
      suspectedUrl: suspectedUrl.trim() || undefined,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [report, ...prev]);
    setDescription('');
    setSuspectedUrl('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white sm:text-2xl">My Reports</h1>
        <p className="text-sm text-navy-400">
          Submit and track demo incident reports. Reports are stored locally in your browser.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Form */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-100">
            <FileText className="h-4 w-4 text-teal-400" />
            New incident report
          </h2>

          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100/90">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <p>
              Do not include passwords, OTPs, banking credentials, or personal identification numbers. This is a local prototype and does not transmit reports to law enforcement, banks, or authorities.
            </p>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="input"
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-navy-900">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-300">Severity</label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition',
                      severity === s
                        ? 'border-teal-500 bg-teal-500/15 text-teal-200'
                        : 'border-navy-700 bg-navy-800/40 text-navy-300 hover:bg-navy-800/70',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-300">Description</label>
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
                rows={3}
                placeholder="Briefly describe what happened (no secrets)…"
                className="input text-sm"
              />
              <div className="mt-1 text-right text-[11px] text-navy-500">{description.length}/{MAX_DESC}</div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-300">Suspected URL (optional)</label>
              <input
                value={suspectedUrl}
                onChange={(e) => setSuspectedUrl(e.target.value)}
                placeholder="http://…"
                className="input font-mono text-xs"
              />
            </div>

            {error && <p className="text-xs text-red-300">{error}</p>}

            <button type="submit" className="btn-primary w-full">
              Submit report
            </button>

            {submitted && (
              <p className="flex items-center gap-1.5 rounded-md bg-teal-500/10 px-3 py-2 text-xs text-teal-200">
                <CheckCircle2 className="h-4 w-4" />
                Report submitted. It now appears in the list below and on the Admin dashboard.
              </p>
            )}
          </form>
        </div>

        {/* List */}
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="card flex flex-col items-center justify-center p-10 text-center">
              <ShieldAlert className="h-10 w-10 text-navy-500" />
              <p className="mt-3 text-sm font-medium text-navy-200">No reports yet</p>
              <p className="mt-1 text-xs text-navy-400">
                Submitted reports will appear here with a generated reference and status you can track.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-navy-300">{reports.length} report(s)</p>
                <button
                  onClick={() => {
                    if (confirm('Remove all local reports? This cannot be undone.')) setReports([]);
                  }}
                  className="text-xs text-navy-500 hover:text-red-300"
                >
                  Clear all
                </button>
              </div>
              <ul className="space-y-3">
                {reports.map((r) => (
                  <li key={r.id} className="card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-teal-300">{r.id}</span>
                      <span className="badge bg-navy-700/50 text-navy-100">{r.category}</span>
                      <SeverityBadge severity={r.severity} />
                      <StatusBadge status={r.status} />
                      <span className="ml-auto text-[11px] text-navy-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-navy-200">{r.description}</p>
                    {r.suspectedUrl && (
                      <p className="mt-2 break-all font-mono text-xs text-navy-400">{r.suspectedUrl}</p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
