import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { AnalysisResult, DetectionFinding } from '@/features/scanner/types';
import { SeverityBadge } from '@/components/Badges';
import { cn } from '@/lib/cn';

const DETECTOR_LABELS: Record<string, string> = {
  urgency: 'Urgency & coercion',
  credentials: 'Credential harvesting',
  financial: 'Financial fraud',
  impersonation: 'Impersonation',
  urlStructure: 'URL structure',
  contextual: 'Contextual combination',
};

function FindingRow({ f }: { f: DetectionFinding }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-navy-700/70 bg-navy-800/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-navy-400 transition', open && 'rotate-90')} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-navy-100">{f.title}</p>
          <p className="mt-0.5 truncate text-xs text-navy-400">{DETECTOR_LABELS[f.detector] ?? f.detector}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-xs text-navy-300">+{f.contribution.toFixed(1)}</span>
          <SeverityBadge severity={f.severity} />
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t border-navy-700/60 px-4 py-3 text-sm">
          <p className="text-navy-200">{f.explanation}</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">Evidence</p>
            <p className="mt-1 break-words rounded-md bg-navy-900/70 px-3 py-2 font-mono text-xs text-teal-200">
              {f.evidence}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-navy-400">
            <span>Confidence: <span className="text-navy-200">{Math.round(f.confidence * 100)}%</span></span>
            <span>Weight: <span className="text-navy-200">{f.weight.toFixed(2)}</span></span>
            <span>Contribution: <span className="text-navy-200">{f.contribution.toFixed(2)}</span></span>
          </div>
          {f.recommendation && (
            <p className="rounded-md bg-teal-500/10 px-3 py-2 text-xs text-teal-200">{f.recommendation}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function EvidenceList({ result }: { result: AnalysisResult }) {
  if (result.findings.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-navy-100">Detected indicators</h3>
        <p className="mt-2 text-sm text-navy-300">
          No suspicious indicators were detected by the configured detectors.
        </p>
        <p className="mt-2 text-xs text-navy-400">
          This does not establish that the message or URL is safe. ThreatLens checks structure and language only — it does not check reputation, domain age, or live threat intelligence.
        </p>
      </div>
    );
  }

  const bySeverity = [...result.findings].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-100">Detected indicators</h3>
        <span className="text-xs text-navy-400">{result.findings.length} finding(s)</span>
      </div>
      <div className="mt-3 space-y-2">
        {bySeverity.map((f) => (
          <FindingRow key={f.id} f={f} />
        ))}
      </div>
    </div>
  );
}
