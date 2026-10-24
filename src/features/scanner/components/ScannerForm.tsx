import { useRef, useState } from 'react';
import { Mail, MessageSquare, Link as LinkIcon, Image as ImageIcon, Sparkles, ChevronDown, AlertCircle, Upload, X } from 'lucide-react';
import type { InputMode } from '@/features/scanner/types';
import { SAMPLE_CASES } from '../samples';
import { cn } from '@/lib/cn';

interface ScannerFormProps {
  mode: InputMode;
  setMode: (m: InputMode) => void;
  content: string;
  setContent: (c: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
}

const MODES: { id: InputMode; label: string; icon: typeof Mail; placeholder: string }[] = [
  { id: 'email', label: 'Email', icon: Mail, placeholder: 'Paste the full email including headers and body…' },
  { id: 'sms', label: 'SMS / Text', icon: MessageSquare, placeholder: 'Paste the SMS or chat message text…' },
  { id: 'url', label: 'URL', icon: LinkIcon, placeholder: 'https://example.com/some-path' },
  { id: 'screenshot', label: 'Screenshot', icon: ImageIcon, placeholder: 'Transcribe the visible text from your screenshot…' },
];

const MAX_FILE_BYTES = 2_000_000;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function ScannerForm({ mode, setMode, content, setContent, onAnalyze, analyzing }: ScannerFormProps) {
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = MODES.find((m) => m.id === mode)!;
  const canAnalyze = content.trim().length > 0 && !analyzing;

  function loadSample(id: string) {
    const s = SAMPLE_CASES.find((c) => c.id === id);
    if (!s) return;
    setMode(s.mode);
    setContent(s.content);
    setSamplesOpen(false);
    setFileName(null);
    setFileError(null);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Please upload a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('Image is larger than 2 MB. Please use a smaller image.');
      return;
    }
    setFileName(file.name);
    // Note: we do not perform automated OCR. User transcribes via the text area.
  }

  return (
    <div className="card p-5 sm:p-6">
      {/* Mode segmented control */}
      <div role="tablist" aria-label="Input type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = m.id === mode;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setMode(m.id)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'border-teal-500 bg-teal-500/10 text-teal-200'
                  : 'border-navy-700 bg-navy-800/40 text-navy-200 hover:border-navy-600 hover:bg-navy-800/70',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sm:hidden">{m.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Samples */}
      <div className="relative mt-4">
        <button
          type="button"
          onClick={() => setSamplesOpen((v) => !v)}
          className="btn-ghost text-xs"
          aria-expanded={samplesOpen}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Try a sample
          <ChevronDown className={cn('h-3.5 w-3.5 transition', samplesOpen && 'rotate-180')} />
        </button>
        {samplesOpen && (
          <div className="absolute z-20 mt-2 w-full max-w-md rounded-lg border border-navy-700 bg-navy-900 p-2 shadow-xl">
            {SAMPLE_CASES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSample(s.id)}
                className="block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-navy-800"
              >
                <span className="font-medium text-navy-100">{s.label}</span>
                <span className="mt-0.5 block text-xs text-navy-400">{s.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Screenshot upload (only in screenshot mode) */}
      {mode === 'screenshot' && (
        <div className="mt-4 rounded-lg border border-navy-700 bg-navy-800/40 p-3">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost text-xs">
              <Upload className="h-3.5 w-3.5" />
              {fileName ? 'Choose a different image' : 'Upload screenshot (PNG/JPG/WebP, ≤2MB)'}
            </button>
            {fileName && (
              <span className="flex items-center gap-2 text-xs text-navy-300">
                <span className="truncate max-w-[160px]">{fileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  aria-label="Remove image"
                  className="text-navy-400 hover:text-navy-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-navy-400">
            Automated OCR is not available. Upload the image for reference, then type the visible text into the field below so the detection pipeline can inspect it.
          </p>
          {fileError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
              <AlertCircle className="h-3.5 w-3.5" />
              {fileError}
            </p>
          )}
        </div>
      )}

      {/* Text area */}
      <div className="mt-4">
        <label htmlFor="scanner-input" className="mb-2 block text-sm font-medium text-navy-200">
          {mode === 'url' ? 'URL to inspect' : mode === 'screenshot' ? 'Transcribed screenshot text' : 'Message content'}
        </label>
        <textarea
          id="scanner-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={active.placeholder}
          rows={mode === 'url' ? 3 : 7}
          className="input font-mono text-sm leading-relaxed"
          spellCheck={false}
        />
        <div className="mt-1 flex items-center justify-between text-xs text-navy-400">
          <span>{content.length.toLocaleString()} characters</span>
          {content && (
            <button type="button" onClick={() => setContent('')} className="hover:text-navy-100">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-navy-400">
          Analysis runs entirely in your browser. No content is sent to any server.
        </p>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="btn-primary"
        >
          {analyzing ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
    </div>
  );
}
