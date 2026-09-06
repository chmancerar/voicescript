// Constants and shared utilities for VoiceScript

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',  // MP3
  'audio/mp3',   // MP3 alias
  'audio/wav',   // WAV
  'audio/x-wav', // WAV alias
  'audio/wave',  // WAV alias
  'audio/flac',  // FLAC
  'audio/x-flac',// FLAC alias
  'audio/ogg',   // OGG
  'audio/aac',   // AAC
  'audio/x-aac', // AAC alias
  'audio/mp4',   // M4A / MP4 audio
  'audio/x-m4a', // M4A
  'audio/m4a',   // M4A
  'audio/webm',  // WebM
  'audio/opus',  // Opus
];

export const SUPPORTED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.flac',
  '.ogg',
  '.aac',
  '.m4a',
  '.mp4',
  '.webm',
  '.opus',
];

export const SUPPORTED_AUDIO_EXTENSIONS_DISPLAY = "MP3, WAV, FLAC, OGG, AAC, M4A";

/**
 * Checks if a file is a supported audio type by MIME type or file extension.
 */
export const isAudioFileSupported = (file: File): boolean => {
  if (!file) return false;
  const mime = file.type ? file.type.toLowerCase() : '';
  if (mime && SUPPORTED_AUDIO_TYPES.includes(mime)) {
    return true;
  }
  const name = file.name ? file.name.toLowerCase() : '';
  return SUPPORTED_AUDIO_EXTENSIONS.some(ext => name.endsWith(ext));
};

/**
 * Resolves a valid Gemini-compatible MIME type for an audio file.
 */
export const resolveAudioMimeType = (file: File): string => {
  const mime = file.type ? file.type.toLowerCase() : '';
  if (mime === 'audio/mpeg' || mime === 'audio/mp3') return 'audio/mp3';
  if (mime.includes('wav')) return 'audio/wav';
  if (mime.includes('flac')) return 'audio/flac';
  if (mime.includes('ogg')) return 'audio/ogg';
  if (mime.includes('aac')) return 'audio/aac';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'audio/mp4';
  if (mime.includes('webm')) return 'audio/webm';
  if (mime.includes('opus')) return 'audio/opus';

  // Fallback by extension
  const name = file.name ? file.name.toLowerCase() : '';
  if (name.endsWith('.mp3')) return 'audio/mp3';
  if (name.endsWith('.wav')) return 'audio/wav';
  if (name.endsWith('.flac')) return 'audio/flac';
  if (name.endsWith('.ogg')) return 'audio/ogg';
  if (name.endsWith('.aac')) return 'audio/aac';
  if (name.endsWith('.m4a') || name.endsWith('.mp4')) return 'audio/mp4';
  if (name.endsWith('.webm')) return 'audio/webm';
  if (name.endsWith('.opus')) return 'audio/opus';

  return file.type || 'audio/mp3';
};

/**
 * Formats bytes into human-readable string.
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formats duration in seconds to standard string (MM:SS or HH:MM:SS).
 */
export const formatDuration = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds <= 0 || totalSeconds === Infinity) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parses timestamps in various formats (HH:MM:SS, MM:SS, SS, with optional ms) into seconds.
 */
export const parseTimestampToSeconds = (timestampStr: string): number => {
  if (!timestampStr) return 0;
  // Remove enclosing brackets, parentheses, and outer spaces
  const clean = timestampStr.replace(/[\[\]()]/g, '').trim();
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2].replace(',', '.'));
    if (isNaN(hours) || isNaN(mins) || isNaN(secs)) return 0;
    return hours * 3600 + mins * 60 + secs;
  } else if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1].replace(',', '.'));
    if (isNaN(mins) || isNaN(secs)) return 0;
    return mins * 60 + secs;
  } else if (parts.length === 1) {
    const secs = parseFloat(parts[0].replace(',', '.'));
    return isNaN(secs) ? 0 : secs;
  }
  return 0;
};
