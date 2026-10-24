import type { AnalysisResult } from '@/features/scanner/types';
import { BAND_THEME } from '@/components/Badges';
import { cn } from '@/lib/cn';

export function RiskSummary({ result }: { result: AnalysisResult }) {
  const theme = BAND_THEME[result.risk.band];
  const Icon = theme.icon;
  return (
    <div className="card overflow-hidden p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1', theme.bg, theme.ring)}>
          <Icon className={cn('h-6 w-6', theme.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={cn('text-lg font-semibold', theme.text)}>{result.risk.label}</h2>
            <span className="font-mono text-2xl font-bold text-navy-100">{result.risk.score}</span>
          </div>
          <p className="mt-2 text-sm text-navy-200">{result.risk.summary}</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-navy-800">
          <div
            className={cn('h-full rounded-full transition-all duration-500', theme.bar)}
            style={{ width: `${result.risk.score}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-navy-500">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Critical</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-navy-400">
        Score is a deterministic indicator of how many phishing-like signals were found, not a probability that the message is fraudulent.
      </p>
    </div>
  );
}
