import { TranscriptionMode } from '../types';

export const PROMPTS = {
  transcription: {
    subtitles: `Generate subtitles for the audio in SubRip Subtitle (SRT) format.
Rules:
1. Format must be strictly SRT (Sequence number, Timecode --> Timecode, Text).
2. Timecodes must be in HH:MM:SS,mmm format.
3. CRITICAL: Prevent timestamp overlap. The Start Time of a subtitle must be strictly greater than the End Time of the preceding subtitle. Leave a small gap (e.g., 50ms) between subtitles to ensure players like YouTube accept them.
4. Ensure extremely precise synchronization with the audio speech.
5. Limit line length to 42 characters max.
6. Max 2 lines per subtitle block.
7. Split sentences naturally at pauses or logical grammatical points. Avoid "orphans" (single words on a line) where possible.
8. Do not include speaker labels unless absolutely necessary for clarity (e.g. multiple off-screen speakers).
9. Output ONLY the raw SRT content. Do not include markdown code blocks, explanations, or any preamble.
10. Ensure each subtitle block is separated by exactly one blank line.
11. Use plain text only and standard UTF-8 friendly punctuation.`,

    clean: `Transcribe the audio cleanly.
Rules:
1. Do NOT include any timestamps.
2. Do NOT include any speaker labels (like "Speaker 1:").
3. Output only the spoken text.
4. Whenever a new speaker starts talking, start a new line.
5. Provide the transcribed text in plain text format without markdown fences or extraneous commentary.`,

    standard: `Transcribe the audio. For each speaker's utterance:
1. Start every new speaker turn OR any significant new sentence/phrase with a timestamp in [MM:SS] (or [HH:MM:SS] for longer audio) format (e.g., [00:23]).
2. If it's a new speaker, follow the timestamp with a speaker label in the format "Speaker N:" (e.g., "Speaker 1:", "Speaker 2:") or the speaker's name if clearly identified.
3. For long utterances by the same speaker, insert a fresh timestamp every 10-15 seconds at the start of the next sentence to facilitate audio synchronization.
4. Provide the transcribed text for that specific segment.
Example:
[00:00] Speaker 1: Good morning everyone.
[00:05] Today we will discuss the future of AI.
[00:12] Speaker 2: That sounds like a fascinating topic.
Prioritize content accuracy and frequent timestamping. Ensure the output is plain text and well-formatted without markdown backticks.`,
  } as Record<TranscriptionMode, string>,

  analysis: (transcriptionText: string) => `Analyze the following audio transcription. Provide:
1. A concise summary of the content (2-3 sentences).
2. An estimated CEFR level (A1, A2, B1, B2, C1, or C2) based on language complexity, vocabulary, and grammar.
3. A concise 1-2 sentence explanation justifying why this CEFR level was selected (highlighting vocabulary or grammatical characteristics).

Transcription:
---
${transcriptionText}
---`
};
