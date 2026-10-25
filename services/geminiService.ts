import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";
import { resolveAudioMimeType, isAudioFileSupported, parseTimestampToSeconds } from '../constants';
import { TranscriptionMode, AudioAnalysisResult } from '../types';
import { PROMPTS, buildTranscriptionPrompt } from './prompts';

export const API_KEY_STORAGE_KEY = 'VOICESCRIPT_GEMINI_API_KEY';

/**
 * Formats seconds into SubRip (SRT) timestamp: HH:MM:SS,mmm
 */
function formatSecondsToSrtTime(totalSeconds: number): string {
  const safeSecs = Math.max(0, totalSeconds);
  const totalMs = Math.round(safeSecs * 1000);
  const hours = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${hours.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms
    .toString()
    .padStart(3, '0')}`;
}

/**
 * Wraps a subtitle cue string into at most 2 balanced lines (<= 42 chars per line where possible).
 */
function wrapSubtitleCueText(text: string, maxLineLength = 42): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLineLength) return clean;

  // Find the space closest to the midpoint
  const mid = Math.floor(clean.length / 2);
  let bestSplit = -1;
  let minDistance = Infinity;

  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === ' ') {
      const dist = Math.abs(i - mid);
      if (dist < minDistance) {
        minDistance = dist;
        bestSplit = i;
      }
    }
  }

  if (bestSplit > 0) {
    return `${clean.slice(0, bestSplit).trim()}\n${clean.slice(bestSplit + 1).trim()}`;
  }
  return clean;
}

/**
 * Splits a long spoken utterance (> 84 chars) into subtitle-sized clauses (<= 84 chars each).
 */
function splitLongUtteranceIntoCueTexts(text: string, maxCueChars = 84): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxCueChars) return [clean];

  const words = clean.split(' ');
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCueChars && current) {
      chunks.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

/**
 * Converts [MM:SS] audio-clock-grounded lines from Gemini into strict SubRip (.srt) format.
 * Because Gemini's native audio encoder grounds [MM:SS] timestamps directly to audio frames,
 * this prevents cumulative subtitle drift while producing broadcast-compliant SRT cues.
 */
export function convertTimestampedLinesToSrt(
  rawText: string,
  audioDurationSeconds?: number | null
): string {
  const trimmed = rawText.trim();
  if (!trimmed) return '';

  // If the text is already formatted with SRT "-->" arrows, return as-is
  if (/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(trimmed)) {
    return trimmed;
  }

  const rawLines = trimmed.split('\n');
  const anchorGroups: { startTime: number; cueTexts: string[] }[] = [];

  const lineRegex =
    /^(?:(\[\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*\]|\(\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*\))\s*)?(?:(?:Speaker|Hablante|Interlocuteur|Person)\s*\w*:\s*)?(.*)/i;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(lineRegex);
    if (!match) continue;

    const rawTs = match[1];
    const content = (match[2] || '').trim();
    if (!content) continue;

    const cueParts = splitLongUtteranceIntoCueTexts(content, 84);
    if (cueParts.length === 0) continue;

    if (rawTs) {
      const startSec = parseTimestampToSeconds(rawTs);
      const lastGroup = anchorGroups[anchorGroups.length - 1];
      if (lastGroup && Math.abs(lastGroup.startTime - startSec) < 0.05) {
        lastGroup.cueTexts.push(...cueParts);
      } else {
        // Ensure monotonic start times
        const safeStart =
          lastGroup && startSec < lastGroup.startTime ? lastGroup.startTime + 0.5 : startSec;
        anchorGroups.push({ startTime: safeStart, cueTexts: [...cueParts] });
      }
    } else if (anchorGroups.length > 0) {
      anchorGroups[anchorGroups.length - 1].cueTexts.push(...cueParts);
    } else {
      anchorGroups.push({ startTime: 0, cueTexts: [...cueParts] });
    }
  }

  if (anchorGroups.length === 0) {
    return trimmed;
  }

  const srtBlocks: string[] = [];
  let sequenceNum = 1;

  for (let gIdx = 0; gIdx < anchorGroups.length; gIdx++) {
    const group = anchorGroups[gIdx];
    const nextGroup = anchorGroups[gIdx + 1];

    const groupStart = group.startTime;
    const totalWords = group.cueTexts
      .join(' ')
      .split(/\s+/)
      .filter(Boolean).length;

    // Natural speaking duration estimate (~0.43s per word + 0.6s phrase resonance)
    const estimatedSpeechDuration = Math.max(
      1.4 * group.cueTexts.length,
      totalWords * 0.43 + 0.6
    );

    let maxWindowEnd: number;
    if (nextGroup) {
      maxWindowEnd = Math.max(groupStart + 0.4, nextGroup.startTime - 0.06);
    } else if (
      typeof audioDurationSeconds === 'number' &&
      !isNaN(audioDurationSeconds) &&
      audioDurationSeconds > groupStart
    ) {
      maxWindowEnd = audioDurationSeconds;
    } else {
      maxWindowEnd = groupStart + estimatedSpeechDuration;
    }

    const availableWindow = Math.max(0.4, maxWindowEnd - groupStart);
    const activeGroupDuration = Math.min(availableWindow, estimatedSpeechDuration);

    // Distribute activeGroupDuration across cues in this group proportionally by character length
    const totalChars = group.cueTexts.reduce((acc, t) => acc + Math.max(1, t.length), 0);
    let cursorTime = groupStart;

    for (let cIdx = 0; cIdx < group.cueTexts.length; cIdx++) {
      const cueText = group.cueTexts[cIdx];
      const weight = Math.max(1, cueText.length) / totalChars;
      const rawSlice = activeGroupDuration * weight;
      const isLastInGroup = cIdx === group.cueTexts.length - 1;

      const cueStart = cursorTime;
      const interCueGap = isLastInGroup ? 0 : Math.min(0.05, rawSlice * 0.08);
      const cueEnd = Math.max(
        cueStart + 0.25,
        Math.min(maxWindowEnd, cueStart + rawSlice - interCueGap)
      );

      const formattedLines = wrapSubtitleCueText(cueText, 42);
      srtBlocks.push(
        `${sequenceNum}\n${formatSecondsToSrtTime(cueStart)} --> ${formatSecondsToSrtTime(
          cueEnd
        )}\n${formattedLines}`
      );

      sequenceNum++;
      cursorTime = cueEnd + interCueGap;
    }
  }

  return srtBlocks.join('\n\n');
}

/**
 * Retrieves the currently active Gemini API key from explicit parameter,
 * browser localStorage, or environment variables.
 */
export function getActiveApiKey(customKey?: string | null): string {
  if (customKey && customKey.trim()) {
    return customKey.trim();
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    } catch {
      // Ignore localStorage access errors (e.g., private browsing)
    }
  }
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  return '';
}

/**
 * Saves a user-provided API key to localStorage.
 */
export function saveApiKeyToStorage(key: string): void {
  if (typeof window !== 'undefined') {
    if (!key || !key.trim()) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    }
  }
}

/**
 * Removes the stored API key from localStorage.
 */
export function clearApiKeyFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

/**
 * Creates a GoogleGenAI client with the resolved API key.
 */
export function getAiClient(customApiKey?: string | null): GoogleGenAI {
  const apiKey = getActiveApiKey(customApiKey);
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Converts a browser File object to a Gemini inline Data Part.
 */
async function fileToGenerativePart(file: File): Promise<Part> {
  if (!isAudioFileSupported(file)) {
    throw new Error(`Unsupported audio file format: ${file.name}. Please upload MP3, WAV, FLAC, OGG, AAC, or M4A.`);
  }

  const mimeType = resolveAudioMimeType(file);

  const base64EncodedString = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      mimeType,
      data: base64EncodedString,
    },
  };
}

/**
 * Transcribes audio using Gemini 3.8 Flash.
 * Supports streaming updates via onChunk callback and falls back gracefully.
 */
export async function transcribeAudioWithGemini(
  audioFile: File,
  mode: TranscriptionMode = 'standard',
  onChunk?: (chunk: string, currentFullText: string) => void,
  customApiKey?: string | null,
  audioDurationSeconds?: number | null
): Promise<string> {
  try {
    const client = getAiClient(customApiKey);
    const audioPart = await fileToGenerativePart(audioFile);

    const promptText = buildTranscriptionPrompt(mode, {
      durationSeconds: audioDurationSeconds,
    });
    const textPromptPart: Part = { text: promptText };
    const contents = { parts: [audioPart, textPromptPart] };

    console.log(`Sending transcription request to Gemini API with model gemini-3.8-flash (Mode: ${mode})`);

    let accumulatedText = "";
    let streamSucceeded = false;

    try {
      const responseStream = await client.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          accumulatedText += chunk.text;
          const previewText =
            mode === 'subtitles'
              ? convertTimestampedLinesToSrt(accumulatedText, audioDurationSeconds)
              : accumulatedText;
          onChunk?.(chunk.text, previewText);
        }
      }
      streamSucceeded = true;
    } catch (streamError) {
      console.warn("Streaming transcription encountered an issue, falling back to direct generateContent:", streamError);
      // Reset text so we don't end up with partial/corrupt transcription
      accumulatedText = "";
    }

    if (!streamSucceeded || !accumulatedText.trim()) {
      const directResponse = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
      });
      accumulatedText = directResponse.text || "";
    }

    // Strip markdown code fences if model enclosed output in ```srt or ```text
    let cleanedTranscription = accumulatedText
      .replace(/^```[a-z0-9_-]*\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    if (!cleanedTranscription || cleanedTranscription === "undefined") {
      throw new Error("The model returned an empty transcription. The audio might be silent, too quiet, or corrupted.");
    }

    if (mode === 'subtitles') {
      cleanedTranscription = convertTimestampedLinesToSrt(
        cleanedTranscription,
        audioDurationSeconds
      );
      onChunk?.('', cleanedTranscription);
    }

    return cleanedTranscription;
  } catch (error: any) {
    console.error("Error transcribing audio with Gemini:", error);
    const msg = error.message || "";
    if (
      msg === "API_KEY_MISSING" ||
      msg.includes("API_KEY_INVALID") ||
      msg.includes("API key not valid") ||
      msg.includes("API_KEY_ACCESS_ERROR")
    ) {
      throw new Error("API_KEY_MISSING");
    }
    if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Transcription failed due to API quota limits. Please check your Gemini API billing and usage.");
    }
    if (msg.includes("deadline exceeded") || msg.includes("unavailable") || msg.includes("timed out")) {
      throw new Error("The transcription service timed out or is temporarily unavailable. Please try again.");
    }
    throw new Error(msg || "An unknown error occurred during transcription.");
  }
}

/**
 * Strips subtitle headers and timecodes from text to produce clean prose for analysis.
 */
function extractCleanTextForAnalysis(rawText: string): string {
  // Check if it's SRT format: lines with "-->"
  if (rawText.includes('-->')) {
    return rawText
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Remove sequence number digits
        if (/^\d+$/.test(trimmed)) return false;
        // Remove timecode lines
        if (/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(trimmed)) return false;
        return trimmed.length > 0;
      })
      .join(' ');
  }
  return rawText;
}

/**
 * Analyzes audio transcription to extract a concise summary, CEFR level, and explanation.
 */
export async function analyzeAudioContent(
  transcriptionText: string,
  customApiKey?: string | null
): Promise<AudioAnalysisResult> {
  try {
    const client = getAiClient(customApiKey);
    const cleanText = extractCleanTextForAnalysis(transcriptionText);
    const analysisPrompt = PROMPTS.analysis(cleanText);

    console.log("Sending analysis request to Gemini API with model gemini-3.8-flash");

    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A concise summary of the content (2-3 sentences).',
            },
            cefrLevel: {
              type: Type.STRING,
              description: 'An estimated CEFR level (e.g., A1, A2, B1, B2, C1, C2) based on language complexity, vocabulary, and grammar.',
            },
            cefrExplanation: {
              type: Type.STRING,
              description: 'A 1-2 sentence rationale explaining why this CEFR level was chosen.',
            },
          },
          required: ["summary", "cefrLevel"],
        },
      },
    });

    const rawText = (response.text || "").trim();
    // Clean potential markdown wrap
    const jsonStr = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    try {
      const parsedData = JSON.parse(jsonStr) as Partial<AudioAnalysisResult>;
      if (typeof parsedData.summary === 'string' && typeof parsedData.cefrLevel === 'string') {
        return {
          summary: parsedData.summary,
          cefrLevel: parsedData.cefrLevel,
          cefrExplanation: parsedData.cefrExplanation || undefined,
        };
      } else {
        throw new Error("Analysis response missing required fields.");
      }
    } catch (e) {
      console.error("Failed to parse JSON analysis response:", e, "Raw response:", rawText);
      throw new Error("Failed to parse analysis data from the model.");
    }
  } catch (error: any) {
    console.error("Error analyzing audio content with Gemini:", error);
    const msg = error.message || "";
    if (
      msg === "API_KEY_MISSING" ||
      msg.includes("API key not valid") ||
      msg.includes("API_KEY_ACCESS_ERROR")
    ) {
      throw new Error("API_KEY_MISSING");
    }
    if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Audio analysis failed due to API quota limits.");
    }
    if (msg.includes("deadline exceeded") || msg.includes("unavailable")) {
      throw new Error("The analysis service is temporarily unavailable.");
    }
    throw new Error(`Audio analysis failed: ${msg}`);
  }
}
