import { useState } from 'react';
import { RotateCcw, FileWarning, ShieldHalf, Search } from 'lucide-react';
import type { AnalysisResult, InputMode } from '@/features/scanner/types';
import { analyzeInput } from '@/features/scanner/pipeline/analyzeInput';
import { ScannerForm } from './components/ScannerForm';
import { RiskSummary } from './components/RiskSummary';
import { EvidenceList } from './components/EvidenceList';
import { Recommendations } from './components/Recommendations';
import {
  ExtractedEntitiesPanel,
  PipelinePanel,
  WarningsPanel,
} from './components/AnalysisPanels';

const DISCLAIMER =
  'ThreatLens provides automated guidance, not a guarantee. A low-risk result does not establish that a message or URL is safe, and a high-risk result does not independently prove fraud.';

interface ScannerPageProps {
  onReportFromScan: (summary: string, suspectedUrl?: string) => void;
}

export function ScannerPage({ onReportFromScan }: ScannerPageProps) {
  const [mode, setMode] = useState<InputMode>('email');
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  function handleAnalyze() {
    if (!content.trim()) return;
    setAnalyzing(true);
    // Defer to next tick so the UI shows the "analyzing" state.
    setTimeout(() => {
      const r = analyzeInput({ raw: content, mode });
      setResult(r);
      setAnalyzing(false);
    }, 80);
  }

  function handleAnalyzeAnother() {
    setResult(null);
    setContent('');
  }

  function handleReport() {
    if (!result) return;
    onReportFromScan(
      `${result.risk.label} — ${result.findings.length} indicator(s) detected`,
      result.entities.urls[0]?.raw,
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-500/30">
            <ShieldHalf className="h-5 w-5 text-teal-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Threat Scanner</h1>
            <p className="text-sm text-navy-400">Analyse suspicious emails, SMS, URLs, and screenshot text.</p>
          </div>
        </div>
      </div>

      {!result && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-navy-700/50 bg-navy-900/40 p-4 text-sm">
          <Search className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
          <div className="text-navy-300">
            <p className="text-navy-200">How it works</p>
            <p className="mt-1 text-xs">
              Paste a suspicious message or URL. ThreatLens runs a modular detection pipeline — extracting URLs, identities and signals — and returns an explainable risk score with tailored recommendations. Nothing is uploaded.
            </p>
          </div>
        </div>
      )}

      <ScannerForm
        mode={mode}
        setMode={setMode}
        content={content}
        setContent={setContent}
        onAnalyze={handleAnalyze}
        analyzing={analyzing}
      />

      {result && (
        <div className="mt-6 space-y-5">
          <RiskSummary result={result} />
          <EvidenceList result={result} />
          <Recommendations result={result} />
          <ExtractedEntitiesPanel result={result} />
          <details className="card p-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-navy-100">
              Technical details & limitations
              <span className="ml-2 text-xs font-normal text-navy-400">Pipeline stages and unchecked capabilities</span>
            </summary>
            <div className="mt-4 space-y-4">
              <PipelinePanel result={result} />
              <WarningsPanel result={result} />
            </div>
          </details>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleReport} className="btn-primary">
              <FileWarning className="h-4 w-4" />
              Report this incident
            </button>
            <button onClick={handleAnalyzeAnother} className="btn-ghost">
              <RotateCcw className="h-4 w-4" />
              Analyse another item
            </button>
          </div>

          <p className="rounded-lg border border-navy-700/60 bg-navy-900/40 px-4 py-3 text-xs text-navy-400">
            {DISCLAIMER}
          </p>
        </div>
      )}
    </div>
  );
}
