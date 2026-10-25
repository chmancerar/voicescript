import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { AudioUploader } from './components/AudioUploader';
import { AudioPlayer } from './components/AudioPlayer';
import { Button } from './components/Button';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { FileInfo } from './components/FileInfo';
import { ApiKeyWarning } from './components/ApiKeyWarning';
import { TranscriptionModeSelector } from './components/TranscriptionModeSelector';
import { TranscriptionResults } from './components/TranscriptionResults';
import { useAudioTranscription } from './hooks/useAudioTranscription';
import { Key, X, Sparkles, CheckCircle2, StopCircle } from 'lucide-react';

const App: React.FC = () => {
  const {
    appState,
    loadingStep,
    currentFile,
    errorMessage,
    transcriptionText,
    transcriptCache,
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
    audioDurationSeconds,
    audioRef,
    handleAudioLoadedMetadata,
    handleFileSelect,
    handleClearFile,
    handleSeek,
    handleTranscribe,
    handleCancelTranscription,
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

  const isCompactHeader = appState !== 'IDLE' && appState !== 'API_KEY_MISSING';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-3 sm:px-6 py-4 selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      {/* Subtle Ambient Background Spotlights */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -15%, rgba(14, 165, 233, 0.14), rgba(99, 102, 241, 0.05) 55%, transparent 80%)',
        }}
      />

      <Header
        apiKeyAvailable={apiKeyAvailable}
        onManageKey={() => setShowKeyModal(true)}
        compact={isCompactHeader}
      />

      <main
        className={`container mx-auto mt-2 p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-3xl w-full transition-all duration-500 ${
          appState === 'TRANSCRIBED' ? 'max-w-6xl' : 'max-w-2xl'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={appState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
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
                durationFormatted={audioDurationFormatted}
                onClear={handleClearFile}
                disabled={appState === 'LOADING'}
              />
            )}

            {/* Pre-Transcription Audio Preview + Mode Selector + CTA */}
            {appState === 'FILE_SELECTED' && apiKeyAvailable && currentFile && (
              <div className="mt-4 flex flex-col gap-4">
                {audioSrc && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Audio Preview
                    </p>
                    <AudioPlayer
                      src={audioSrc}
                      fileName={currentFile.name}
                      compact
                      onLoadedMetadata={handleAudioLoadedMetadata}
                    />
                  </div>
                )}

                <TranscriptionModeSelector
                  mode={transcriptionMode}
                  onChange={setTranscriptionMode}
                  disabled={!currentFile}
                />

                <div className="flex justify-center pt-1">
                  <Button
                    type="button"
                    onClick={() => handleTranscribe()}
                    disabled={!currentFile}
                    className="w-full sm:w-auto text-base shadow-xl"
                  >
                    <Sparkles size={18} className="flex-shrink-0" />
                    <span>
                      {transcriptionMode === 'subtitles'
                        ? 'Generate Subtitles (.srt)'
                        : transcriptionMode === 'clean'
                        ? 'Generate Clean Transcript'
                        : 'Transcribe Audio with Timestamps'}
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {/* Loading & Real-Time Streaming View */}
            {appState === 'LOADING' && (
              <div className="flex flex-col items-center justify-center py-6">
                <LoadingSpinner />

                {/* 2-Step Progress Stepper */}
                <div className="mt-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-slate-950/70 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs">
                  {/* Step 1: Transcribing */}
                  <div
                    className={`flex items-center gap-2 font-semibold ${
                      loadingStep === 'transcribing' ? 'text-sky-300' : 'text-emerald-400'
                    }`}
                  >
                    {loadingStep === 'transcribing' ? (
                      <Sparkles size={15} className="text-sky-400 animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} className="text-emerald-400" />
                    )}
                    <span>1. Transcribing Audio</span>
                  </div>

                  <span className="hidden sm:inline text-slate-700">→</span>

                  {/* Step 2: Analyzing */}
                  <div
                    className={`flex items-center gap-2 font-semibold ${
                      loadingStep === 'analyzing' ? 'text-amber-300' : 'text-slate-500'
                    }`}
                  >
                    {loadingStep === 'analyzing' ? (
                      <Sparkles size={15} className="text-amber-400 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                    <span>2. CEFR &amp; Summary Intelligence</span>
                  </div>
                </div>

                {/* Live stream preview container if text has started arriving */}
                {transcriptionText && transcriptionText.trim().length > 0 && (
                  <div className="mt-5 w-full max-w-xl bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        Live Stream Preview
                      </p>
                      <span className="text-[11px] font-mono text-slate-500">
                        {transcriptionText.length.toLocaleString()} chars
                      </span>
                    </div>
                    <pre className="text-slate-300 text-xs sm:text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                      {transcriptionText}
                    </pre>
                  </div>
                )}

                {/* Cancel Button */}
                <div className="mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelTranscription}
                    className="!py-2 !px-4 text-xs !rounded-xl"
                  >
                    <StopCircle size={15} className="text-rose-400" />
                    <span>Cancel Processing</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Results View */}
            {appState === 'TRANSCRIBED' && (
              <TranscriptionResults
                audioSrc={audioSrc}
                currentFile={currentFile}
                transcriptionText={transcriptionText}
                transcriptionMode={transcriptionMode}
                transcriptCache={transcriptCache}
                audioCurrentTime={audioCurrentTime}
                audioSummary={audioSummary}
                audioDurationFormatted={audioDurationFormatted}
                audioDurationSeconds={audioDurationSeconds}
                audioCefrLevel={audioCefrLevel}
                audioCefrExplanation={audioCefrExplanation}
                audioRef={audioRef}
                setAudioCurrentTime={setAudioCurrentTime}
                handleAudioLoadedMetadata={handleAudioLoadedMetadata}
                handleSeek={handleSeek}
                handleTranscribeAnother={handleClearFile}
                handleReTranscribe={(mode, forceRefresh) => handleTranscribe(mode, forceRefresh)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close settings modal"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-amber-400">
              <Key size={22} />
              <h3 className="text-lg font-bold text-slate-100">Gemini API Key Settings</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Provide your Google Gemini API key from Google AI Studio. It is stored locally in your browser&apos;s storage and never sent anywhere except directly to Google&apos;s Gemini API.
            </p>

            <form onSubmit={onSaveKeyModal}>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={modalKeyInput}
                onChange={(e) => setModalKeyInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none mb-4 font-mono"
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
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    Clear Saved Key
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowKeyModal(false)}
                    className="!py-1.5 !px-3.5 text-xs !rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!modalKeyInput.trim()}
                    className="!py-1.5 !px-4 text-xs !rounded-xl"
                  >
                    Save Key
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="text-center py-6 mt-auto text-slate-500 text-xs">
        <p>
          <strong className="font-bold text-sky-400">Voice</strong>
          <strong className="font-bold text-amber-400">Script</strong> — Audio Transcription &amp; CEFR Intelligence powered by Gemini 3.8 &copy; {new Date().getFullYear()} · <strong className="font-semibold text-slate-400">Made by Shanliang</strong>
        </p>
      </footer>
    </div>
  );
};

export default App;
