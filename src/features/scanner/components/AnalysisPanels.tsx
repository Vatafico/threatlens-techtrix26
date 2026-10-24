import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import type { AnalysisResult, ExtractedUrl } from '@/features/scanner/types';
import { cn } from '@/lib/cn';

function UrlDetail({ url }: { url: ExtractedUrl }) {
  const flags: string[] = [];
  if (url.isIpHost) flags.push('IP host');
  if (url.hasUserinfo) flags.push('user-info');
  if (url.isPunycode) flags.push('punycode');
  if (url.port) flags.push(`port :${url.port}`);
  if (url.isShortener) flags.push('shortener');
  return (
    <li className="rounded-lg border border-navy-700/60 bg-navy-800/30 p-3">
      <div className="flex items-start gap-2">
        <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
        <div className="min-w-0 flex-1">
          <p className="break-all font-mono text-xs text-navy-200">{url.raw}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-navy-400">
            {url.host && <span>host: <span className="text-navy-200">{url.host}</span></span>}
            {flags.map((f) => (
              <span key={f} className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">{f}</span>
            ))}
            {!url.parsed && <span className="rounded bg-navy-600/40 px-1.5 py-0.5">unparseable</span>}
          </div>
        </div>
      </div>
    </li>
  );
}

export function ExtractedEntitiesPanel({ result }: { result: AnalysisResult }) {
  const { urls, domains, identities } = result.entities;
  if (urls.length === 0 && domains.length === 0 && identities.length === 0) {
    return null;
  }
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <ExternalLink className="h-4 w-4 text-navy-400" />
        <h3 className="text-sm font-semibold text-navy-100">Extracted entities</h3>
      </div>
      <p className="mt-1 text-xs text-navy-400">
        Links are shown as inert text only. ThreatLens never opens, fetches, or navigates to them.
      </p>

      {urls.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">URLs</p>
          <ul className="mt-2 space-y-2">
            {urls.map((u, i) => (
              <UrlDetail key={`${u.raw}-${i}`} url={u} />
            ))}
          </ul>
        </div>
      )}

      {identities.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">Claimed identities</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {identities.map((id, i) => (
              <span key={i} className="badge bg-navy-700/50 text-navy-100">{id.raw}</span>
            ))}
          </div>
        </div>
      )}

      {domains.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">Registrable domains</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {domains.map((d, i) => (
              <span key={i} className="badge bg-navy-700/40 font-mono text-navy-200">{d}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PipelinePanel({ result }: { result: AnalysisResult }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-navy-100">Pipeline stages</h3>
      <ul className="mt-3 space-y-1.5 text-sm">
        {result.stages.map((s) => (
          <li key={s.stage} className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                s.status === 'completed' && 'bg-teal-400',
                s.status === 'skipped' && 'bg-navy-500',
                s.status === 'failed' && 'bg-red-400',
              )}
            />
            <span className="capitalize text-navy-200">{s.stage}</span>
            <span className="text-xs text-navy-500">{s.status}</span>
            {s.detail && <span className="ml-auto truncate text-xs text-navy-400">{s.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WarningsPanel({ result }: { result: AnalysisResult }) {
  if (result.warnings.length === 0) return null;
  return (
    <div className="card border-amber-500/30 bg-amber-500/5 p-4">
      <p className="text-xs font-semibold text-amber-200">Limitations & unchecked capabilities</p>
      <ul className="mt-2 space-y-1 text-xs text-amber-100/80">
        {result.warnings.map((w, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-amber-400">•</span>
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}
