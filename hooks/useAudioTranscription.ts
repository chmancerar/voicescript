import { useState, useCallback, useRef, useEffect } from 'react';
import { TranscriptionMode, AppState } from '../types';
import {
  MAX_FILE_SIZE_BYTES,
  formatBytes,
  formatDuration,
  isAudioFileSupported,
  SUPPORTED_AUDIO_EXTENSIONS_DISPLAY
} from '../constants';
import {
  transcribeAudioWithGemini,
  analyzeAudioContent,
  getActiveApiKey,
  saveApiKeyToStorage,
  clearApiKeyFromStorage
} from '../services/geminiService';

export const useAudioTranscription = () => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(true);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>('standard');
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);

  const [audioSummary, setAudioSummary] = useState<string | null>(null);
  const [audioCefrLevel, setAudioCefrLevel] = useState<string | null>(null);
  const [audioCefrExplanation, setAudioCefrExplanation] = useState<string | null>(null);
  const [audioDurationFormatted, setAudioDurationFormatted] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Check API key availability on mount and when changed
  const checkApiKey = useCallback(() => {
    const key = getActiveApiKey();
    const available = Boolean(key && key.trim().length > 0);
    setApiKeyAvailable(available);
    if (!available) {
      setAppState('API_KEY_MISSING');
    } else {
      setAppState((prev) => (prev === 'API_KEY_MISSING' ? 'IDLE' : prev));
    }
    return available;
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // Cleanup object URL when unmounting or changing source
  useEffect(() => {
    const currentAudioSrc = audioSrc;
    return () => {
      if (currentAudioSrc) {
        URL.revokeObjectURL(currentAudioSrc);
      }
    };
  }, [audioSrc]);

  // Handle user-provided API key from UI
  const handleSaveApiKey = useCallback((newKey: string) => {
    saveApiKeyToStorage(newKey);
    const available = Boolean(newKey && newKey.trim().length > 0);
    setApiKeyAvailable(available);
    if (available) {
      setErrorMessage(null);
      setAppState((prev) => (prev === 'API_KEY_MISSING' ? 'IDLE' : prev));
    } else {
      setAppState('API_KEY_MISSING');
    }
  }, []);

  const handleRemoveApiKey = useCallback(() => {
    clearApiKeyFromStorage();
    checkApiKey();
  }, [checkApiKey]);

  const handleAudioLoadedMetadata = useCallback((duration: number) => {
    if (!isNaN(duration) && duration > 0 && duration !== Infinity) {
      setAudioDurationFormatted(formatDuration(duration));
    }
  }, []);

  const clearAnalysisData = () => {
    setAudioSummary(null);
    setAudioCefrLevel(null);
    setAudioCefrExplanation(null);
    setAudioDurationFormatted(null);
    setAudioCurrentTime(0);
  };

  const handleClearFile = useCallback(() => {
    if (audioSrc) {
      URL.revokeObjectURL(audioSrc);
      setAudioSrc(null);
    }
    setCurrentFile(null);
    setErrorMessage(null);
    setTranscriptionText(null);
    clearAnalysisData();
    setAppState(getActiveApiKey() ? 'IDLE' : 'API_KEY_MISSING');
    const fileInput = document.getElementById('audio-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [audioSrc]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (audioSrc) {
      URL.revokeObjectURL(audioSrc);
      setAudioSrc(null);
    }

    setCurrentFile(null);
    setErrorMessage(null);
    setTranscriptionText(null);
    clearAnalysisData();

    const hasKey = Boolean(getActiveApiKey());
    setAppState(hasKey ? 'IDLE' : 'API_KEY_MISSING');

    if (!file) return;

    if (!hasKey) {
      setAppState('API_KEY_MISSING');
      return;
    }

    if (!isAudioFileSupported(file)) {
      setErrorMessage(`Unsupported file format: ${file.name || 'unknown'}. Please upload ${SUPPORTED_AUDIO_EXTENSIONS_DISPLAY}.`);
      setAppState('ERROR');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File is too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(MAX_FILE_SIZE_BYTES)}.`);
      setAppState('ERROR');
      return;
    }

    setCurrentFile(file);
    const newAudioSrc = URL.createObjectURL(file);
    setAudioSrc(newAudioSrc);
    setAppState('FILE_SELECTED');

    // Pre-calculate audio duration immediately
    try {
      const audioProbe = new Audio();
      audioProbe.src = newAudioSrc;
      audioProbe.onloadedmetadata = () => {
        if (!isNaN(audioProbe.duration) && audioProbe.duration > 0 && audioProbe.duration !== Infinity) {
          setAudioDurationFormatted(formatDuration(audioProbe.duration));
        }
      };
    } catch {
      // Non-blocking probe
    }
  }, [audioSrc]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play().catch((e) => console.warn("Auto-play blocked after seek:", e));
    }
  }, []);

  const handleTranscribe = async (modeOverride?: TranscriptionMode) => {
    const activeMode = modeOverride || transcriptionMode;
    if (modeOverride) {
      setTranscriptionMode(modeOverride);
    }

    if (!currentFile) {
      setErrorMessage("No file selected for transcription.");
      setAppState('ERROR');
      return;
    }

    if (!getActiveApiKey()) {
      setApiKeyAvailable(false);
      setAppState('API_KEY_MISSING');
      setErrorMessage("Cannot transcribe: Google Gemini API Key is missing. Please configure it to proceed.");
      return;
    }

    setAppState('LOADING');
    setErrorMessage(null);
    setTranscriptionText("");
    setAudioSummary(null);
    setAudioCefrLevel(null);
    setAudioCefrExplanation(null);
    setAudioCurrentTime(0);

    try {
      const text = await transcribeAudioWithGemini(
        currentFile,
        activeMode,
        (_chunk, fullText) => {
          setTranscriptionText(fullText);
        }
      );
      setTranscriptionText(text);

      if (text && text.trim() !== "") {
        try {
          const analysisResult = await analyzeAudioContent(text);
          setAudioSummary(analysisResult.summary);
          setAudioCefrLevel(analysisResult.cefrLevel);
          setAudioCefrExplanation(analysisResult.cefrExplanation || null);
        } catch (analysisError: any) {
          console.error("Audio content analysis failed:", analysisError);
          setAudioSummary("Could not retrieve summary.");
          setAudioCefrLevel("N/A");
          setAudioCefrExplanation(null);
        }
      } else {
        setAudioSummary("Transcription was empty, no analysis performed.");
        setAudioCefrLevel("N/A");
      }
      setAppState('TRANSCRIBED');
    } catch (error: any) {
      console.error("Transcription error in hook:", error);
      if (error.message === "API_KEY_MISSING") {
        setApiKeyAvailable(false);
        setAppState('API_KEY_MISSING');
        setErrorMessage("Gemini API Key is invalid or not configured. Please enter a valid key.");
      } else {
        setErrorMessage(error.message || "An unknown error occurred during transcription.");
        setAppState('ERROR');
      }
      // Note: We deliberately PRESERVE currentFile and audioSrc so user can retry without re-uploading
    }
  };

  const handleRetry = () => {
    if (currentFile) {
      handleTranscribe();
    } else {
      handleClearFile();
    }
  };

  return {
    appState,
    currentFile,
    errorMessage,
    transcriptionText,
    apiKeyAvailable,
    audioSrc,
    transcriptionMode,
    setTranscriptionMode,
    audioCurrentTime,
    setAudioCurrentTime,
    audioSummary,
    audioCefrLevel,
    audioCefrExplanation,
    audioDurationFormatted,
    audioRef,
    handleAudioLoadedMetadata,
    handleFileSelect,
    handleClearFile,
    handleSeek,
    handleTranscribe,
    handleRetry,
    handleSaveApiKey,
    handleRemoveApiKey,
  };
};
