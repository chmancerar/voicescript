import { TranscriptionMode } from '../types';
import { formatDuration } from '../constants';

export interface TranscriptionPromptOptions {
  durationSeconds?: number | null;
}

export const buildTranscriptionPrompt = (
  mode: TranscriptionMode,
  options?: TranscriptionPromptOptions
): string => {
  const durationSec = options?.durationSeconds;
  const hasValidDuration =
    typeof durationSec === 'number' && !isNaN(durationSec) && durationSec > 0 && durationSec !== Infinity;

  const durationHeader = hasValidDuration
    ? `\nAudio Metadata: The total duration of this audio recording is ${formatDuration(
        durationSec
      )} (${durationSec.toFixed(1)} seconds).\n`
    : '';

  if (mode === 'subtitles') {
    return `Transcribe the audio into timestamped subtitle lines.${durationHeader}
For maximum timing accuracy with the audio clock, follow these exact rules:
1. Start EVERY subtitle line with its exact onset timestamp in [MM:SS] (or [HH:MM:SS] for longer audio) format (e.g., [00:00], [00:05], [00:12]) anchored to the exact second the speaker begins saying those words.
2. Break speech into concise, natural subtitle-sized clauses or short sentences (ideally 5 to 14 words / up to ~75 characters per line).
3. For continuous speech by the same speaker, start a new [MM:SS] line every 3 to 5 seconds at natural clause or sentence boundaries so subtitles stay tightly synchronized with the voice.
4. Preserve all pauses and silences naturally — always report the true [MM:SS] audio timestamp when the next phrase actually begins.
5. Do NOT include speaker labels (like "Speaker 1:") and do NOT output SRT sequence numbers or "-->" arrows; output ONLY the [MM:SS] timestamp followed by the spoken text on each line.
Example:
[00:00] File 9, Listening 2.
[00:05] Good morning, and welcome to today's program.
[00:09] Today we are talking about sustainable urban transport.
Ensure the output is plain text without markdown code fences.`;
  }

  if (mode === 'clean') {
    return `Transcribe the audio cleanly.
Rules:
1. Do NOT include any timestamps.
2. Do NOT include any speaker labels (like "Speaker 1:").
3. Output only the spoken text.
4. Whenever a new speaker starts talking, start a new line.
5. Provide the transcribed text in plain text format without markdown fences or extraneous commentary.`;
  }

  // Standard mode
  return `Transcribe the audio.${durationHeader}
For each speaker's utterance:
1. Start every new speaker turn OR any significant new sentence/phrase with a timestamp in [MM:SS] (or [HH:MM:SS] for longer audio) format (e.g., [00:23]) anchored at the exact onset of the first spoken word of that line.
2. If it's a new speaker, follow the timestamp with a speaker label in the format "Speaker N:" (e.g., "Speaker 1:", "Speaker 2:") or the speaker's name if clearly identified.
3. For long utterances by the same speaker, insert a fresh timestamp every 8-12 seconds at the start of the next sentence or clause to facilitate accurate audio synchronization.
4. Provide the transcribed text for that specific segment.
Example:
[00:00] Speaker 1: Good morning everyone.
[00:05] Today we will discuss the future of AI.
[00:12] Speaker 2: That sounds like a fascinating topic.
Prioritize content accuracy and frequent, speech-onset-aligned timestamping. Ensure the output is plain text and well-formatted without markdown backticks.`;
};

export const PROMPTS = {
  transcription: {
    subtitles: buildTranscriptionPrompt('subtitles'),
    clean: buildTranscriptionPrompt('clean'),
    standard: buildTranscriptionPrompt('standard'),
  } as Record<TranscriptionMode, string>,

  analysis: (transcriptionText: string) => `Analyze the following audio transcription. Provide:
1. A concise summary of the content (2-3 sentences).
2. An estimated CEFR level (A1, A2, B1, B2, C1, or C2) based on language complexity, vocabulary, and grammar.
3. A concise 1-2 sentence explanation justifying why this CEFR level was selected (highlighting vocabulary or grammatical characteristics).

Transcription:
---
${transcriptionText}
---`,
};
