import type { DetectorId, DetectorResult, DetectionFinding, ExtractedEntities, NormalizedInput } from '../types';
import { detectUrgency } from '../detectors/languageSignals';
import { detectCredentials } from '../detectors/credentialRequests';
import { detectFinancial } from '../detectors/financialFraud';
import { detectImpersonation } from '../detectors/impersonation';
import { detectUrlStructure } from '../detectors/urlStructure';
import { detectContextual } from '../detectors/contextualSignals';

export interface DetectorContext {
  input: NormalizedInput;
  entities: ExtractedEntities;
}

export type Detector = (ctx: DetectorContext) => DetectorResult;

interface DetectorEntry {
  id: DetectorId;
  run: Detector;
}

// Central registry. Adding a detector only requires appending here.
export const DETECTORS: DetectorEntry[] = [
  { id: 'urgency', run: detectUrgency },
  { id: 'credentials', run: detectCredentials },
  { id: 'financial', run: detectFinancial },
  { id: 'impersonation', run: detectImpersonation },
  { id: 'urlStructure', run: detectUrlStructure },
  { id: 'contextual', run: detectContextual },
];

export function runDetectors(ctx: DetectorContext): DetectorResult[] {
  const results: DetectorResult[] = [];
  for (const d of DETECTORS) {
    try {
      results.push(d.run(ctx));
    } catch (e) {
      results.push({
        detector: d.id,
        findings: [],
        notes: `Detector failed: ${e instanceof Error ? e.message : 'unknown error'}`,
      });
    }
  }
  return results;
}

let findingSeq = 0;
export function makeFindingId(detector: DetectorId): string {
  findingSeq += 1;
  return `${detector}-${findingSeq.toString(36).padStart(3, '0')}`;
}

/** Deduplicate findings that share the same evidence snippet (normalized). */
export function dedupeFindings(findings: DetectionFinding[]): DetectionFinding[] {
  const out: DetectionFinding[] = [];
  const keys = new Set<string>();
  for (const f of findings) {
    // Phrase-based detectors often match several overlapping snippets for the
    // same signal. Keep one finding per detector/title; URL-structure findings
    // retain evidence in the key so separate suspicious URLs remain distinct.
    const key = f.detector === 'urlStructure'
      ? `${f.detector}|${f.title.trim().toLowerCase()}|${f.evidence.trim().toLowerCase()}`
      : `${f.detector}|${f.title.trim().toLowerCase()}`;
    if (keys.has(key)) continue;
    keys.add(key);
    out.push(f);
  }
  return out;
}
