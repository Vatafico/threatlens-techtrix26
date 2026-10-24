import {
  Ban,
  CheckCircle2,
  KeyRound,
  LifeBuoy,
  Link2Off,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import type { AnalysisResult, RecommendedAction } from '@/features/scanner/types';

const ICONS: Record<RecommendedAction['category'], typeof Ban> = {
  do_not_respond: Ban,
  do_not_click: Link2Off,
  verify_independently: UserCog,
  report: LifeBuoy,
  change_credentials: KeyRound,
  enable_mfa: ShieldCheck,
  general_caution: CheckCircle2,
};

export function Recommendations({ result }: { result: AnalysisResult }) {
  if (result.recommendations.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-navy-100">Recommended actions</h3>
        <p className="mt-2 text-sm text-navy-300">No specific actions recommended for this input.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-navy-100">Recommended actions</h3>
      <p className="mt-1 text-xs text-navy-400">
        Tailored to the indicators above. Apply them in order.
      </p>
      <ol className="mt-3 space-y-2">
        {result.recommendations.map((r, i) => {
          const Icon = ICONS[r.category];
          return (
            <li key={r.category} className="flex gap-3 rounded-lg border border-navy-700/60 bg-navy-800/30 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-300">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy-100">
                  <span className="text-navy-400">{i + 1}.</span> {r.title}
                </p>
                <p className="mt-0.5 text-xs text-navy-300">{r.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
