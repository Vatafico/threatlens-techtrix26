import type { NormalizedInput, InputMode, PipelineStageStatus } from '../types';

export const MAX_INPUT_CHARS = 20000;

export interface ValidationOutcome {
  ok: boolean;
  error?: string;
  mode: InputMode;
  raw: string;
}

export function validateInput(raw: string, mode: InputMode): ValidationOutcome {
  const trimmed = raw ?? '';
  if (trimmed.length === 0) {
    return { ok: false, error: 'No content provided. Paste a message, URL, or transcribed text to analyse.', mode, raw: trimmed };
  }
  if (trimmed.length > MAX_INPUT_CHARS) {
    return {
      ok: false,
      error: `Input is too large (${trimmed.length.toLocaleString()} characters). Limit is ${MAX_INPUT_CHARS.toLocaleString()}.`,
      mode,
      raw: trimmed,
    };
  }
  if (mode === 'url') {
    const candidate = trimmed.split(/\s+/)[0];
    if (!candidate || candidate.length < 3) {
      return { ok: false, error: 'Enter a URL beginning with http:// or https://, or a bare domain.', mode, raw: trimmed };
    }
  }
  return { ok: true, mode, raw: trimmed };
}

/**
 * Normalizes whitespace and unicode while preserving the original for evidence.
 * Does NOT strip diacritics (they can be deceptive); keeps meaningful punctuation.
 */
export function normalize(raw: string): NormalizedInput {
  const text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    raw,
    text,
    lengthChars: text.length,
  };
}

export function stage(stage: 'validate' | 'normalize', status: PipelineStageStatus['status'], detail?: string): PipelineStageStatus {
  return { stage, status, detail };
}
