import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";
import { resolveAudioMimeType, isAudioFileSupported } from '../constants';
import { TranscriptionMode, AudioAnalysisResult } from '../types';
import { PROMPTS } from './prompts';

export const API_KEY_STORAGE_KEY = 'VOICESCRIPT_GEMINI_API_KEY';

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
  customApiKey?: string | null
): Promise<string> {
  try {
    const client = getAiClient(customApiKey);
    const audioPart = await fileToGenerativePart(audioFile);

    const promptText = PROMPTS.transcription[mode];
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
          onChunk?.(chunk.text, accumulatedText);
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
      if (accumulatedText && onChunk) {
        onChunk(accumulatedText, accumulatedText);
      }
    }

    // Strip markdown code fences if model enclosed output in ```srt or ```text
    let cleanedTranscription = accumulatedText
      .replace(/^```[a-z0-9_-]*\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    if (!cleanedTranscription || cleanedTranscription === "undefined") {
      throw new Error("The model returned an empty transcription. The audio might be silent, too quiet, or corrupted.");
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
