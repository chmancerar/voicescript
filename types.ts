// Global and shared TypeScript types for VoiceScript

export type TranscriptionMode = 'standard' | 'subtitles' | 'clean';

export type AppState = 'IDLE' | 'API_KEY_MISSING' | 'FILE_SELECTED' | 'LOADING' | 'TRANSCRIBED' | 'ERROR';

export interface AudioAnalysisResult {
  summary: string;
  cefrLevel: string;
  cefrExplanation?: string;
}

export interface SrtBlock {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  raw: string;
}

export interface Match {
  lineIndex: number;
  start: number;
  end: number;
}

export interface ParsedLine {
  rawTimestamp?: string;
  speakerTag?: string;
  textContent: string;
}
