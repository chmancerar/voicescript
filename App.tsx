import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { AudioUploader } from './components/AudioUploader';
import { Button } from './components/Button';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { FileInfo } from './components/FileInfo';
import { ApiKeyWarning } from './components/ApiKeyWarning';
import { TranscriptionModeSelector } from './components/TranscriptionModeSelector';
import { TranscriptionResults } from './components/TranscriptionResults';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_AUDIO_EXTENSIONS_DISPLAY, formatBytes } from './constants';
import { useAudioTranscription } from './hooks/useAudioTranscription';
import { Key, X, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const {
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
  } = useAudioTranscription();

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [modalKeyInput, setModalKeyInput] = useState('');

  const onSaveKeyModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalKeyInput.trim()) {
      handleSaveApiKey(modalKeyInput.trim());
      setModalKeyInput('');
      setShowKeyModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white">
      <Header
        apiKeyAvailable={apiKeyAvailable}
        onManageKey={() => setShowKeyModal(true)}
      />

      <main
        className={`container mx-auto mt-4 p-6 bg-slate-800/90 backdrop-blur border border-slate-700/50 shadow-2xl rounded-2xl w-full transition-all duration-500 ${
          appState === 'TRANSCRIBED' ? 'max-w-6xl' : 'max-w-2xl'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={appState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* API Key Missing Warning */}
            {appState === 'API_KEY_MISSING' && (
              <ApiKeyWarning onSaveKey={handleSaveApiKey} />
            )}

            {/* Upload Area when not transcribed or loading */}
            {(appState === 'IDLE' || appState === 'FILE_SELECTED' || appState === 'ERROR') && (
              <AudioUploader
                onFileSelect={handleFileSelect}
                disabled={!apiKeyAvailable}
                currentFile={currentFile}
              />
            )}

            {/* Error Message with Retry */}
            {appState === 'ERROR' && errorMessage && (
              <ErrorMessage message={errorMessage} onRetry={handleRetry} />
            )}

            {/* File Info Bar */}
            {currentFile && (appState === 'FILE_SELECTED' || appState === 'LOADING' || appState === 'ERROR') && (
              <FileInfo
                fileName={currentFile.name}
                fileSize={currentFile.size}
                onClear={handleClearFile}
              />
            )}

            {/* Mode Selector and Action Button */}
            {appState === 'FILE_SELECTED' && apiKeyAvailable && (
              <div className="mt-6 flex flex-col items-center">
                <TranscriptionModeSelector
                  mode={transcriptionMode}
                  onChange={setTranscriptionMode}
                  disabled={!currentFile}
                />

                <Button
                  type="button"
                  onClick={() => handleTranscribe()}
                  disabled={!currentFile}
                  className="w-full sm:w-auto text-base shadow-xl"
                >
                  {transcriptionMode === 'subtitles'
                    ? 'Generate Subtitles (.srt)'
                    : transcriptionMode === 'clean'
                    ? 'Generate Clean Transcript'
                    : 'Transcribe Audio with Timestamps'}
                </Button>
              </div>
            )}

            {/* Loading & Real-Time Streaming View */}
            {appState === 'LOADING' && (
              <div className="flex flex-col items-center justify-center py-8">
                <LoadingSpinner />
                <div className="flex items-center gap-2 mt-4 text-slate-300">
                  <Sparkles size={18} className="text-sky-400 animate-spin" />
                  <p className="font-medium animate-pulse">
                    Processing audio with Gemini 3.8 Flash...
                  </p>
                </div>

                {/* Live stream preview container if text has started arriving */}
                {transcriptionText && transcriptionText.trim().length > 0 && (
                  <div className="mt-6 w-full max-w-xl bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-left shadow-inner">
                    <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Live Stream Preview
                    </p>
                    <pre className="text-slate-300 text-xs sm:text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                      {transcriptionText}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Results View */}
            {appState === 'TRANSCRIBED' && (
              <TranscriptionResults
                audioSrc={audioSrc}
                currentFile={currentFile}
                transcriptionText={transcriptionText}
                transcriptionMode={transcriptionMode}
                audioCurrentTime={audioCurrentTime}
                audioSummary={audioSummary}
                audioDurationFormatted={audioDurationFormatted}
                audioCefrLevel={audioCefrLevel}
                audioCefrExplanation={audioCefrExplanation}
                audioRef={audioRef}
                setAudioCurrentTime={setAudioCurrentTime}
                handleAudioLoadedMetadata={handleAudioLoadedMetadata}
                handleSeek={handleSeek}
                handleTranscribeAnother={handleClearFile}
                handleReTranscribe={(mode) => handleTranscribe(mode)}
              />
            )}

            {/* Initial Idle Guidance */}
            {appState === 'IDLE' && apiKeyAvailable && !errorMessage && (
              <div className="text-center py-8 text-slate-400">
                <p className="text-base font-medium text-slate-300">Upload an audio file to begin</p>
                <p className="text-xs mt-1.5 text-slate-400">
                  Supported formats: {SUPPORTED_AUDIO_EXTENSIONS_DISPLAY} (Max size: {formatBytes(MAX_FILE_SIZE_BYTES)})
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-yellow-400">
              <Key size={22} />
              <h3 className="text-lg font-bold text-slate-100">Gemini API Key Settings</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              You can provide your own Google Gemini API key from Google AI Studio. It will be stored locally in your browser.
            </p>

            <form onSubmit={onSaveKeyModal}>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={modalKeyInput}
                onChange={(e) => setModalKeyInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none mb-4"
                autoComplete="off"
              />

              <div className="flex items-center justify-between gap-3">
                {apiKeyAvailable && (
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveApiKey();
                      setShowKeyModal(false);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline"
                  >
                    Clear Saved Key
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowKeyModal(false)}
                    className="!py-1.5 !px-3 text-xs !rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!modalKeyInput.trim()}
                    className="!py-1.5 !px-4 text-xs !rounded-lg"
                  >
                    Save Key
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="text-center py-8 text-slate-400 text-sm">
        <p>
          <strong className="font-bold text-sky-400">Voice</strong>
          <strong className="font-bold text-yellow-400">Script</strong> - Audio transcription tool powered by Gemini 3.8 &copy; {new Date().getFullYear()} | <strong className="font-bold">Made by Shanliang.</strong>
        </p>
      </footer>
    </div>
  );
};

export default App;
