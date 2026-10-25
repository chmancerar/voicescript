import React from 'react';
import { TranscriptionMode, TranscriptCache } from '../types';
import { SubtitlePreview } from './SubtitlePreview';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { AudioPlayer } from './AudioPlayer';
import { AudioAnalysisDisplay } from './AudioAnalysisDisplay';
import { Button } from './Button';
import { PlusCircle, Subtitles, FileText, AlignLeft, Sparkles, RefreshCw } from 'lucide-react';

interface TranscriptionResultsProps {
  audioSrc: string | null;
  currentFile: File | null;
  transcriptionText: string | null;
  transcriptionMode: TranscriptionMode;
  transcriptCache?: TranscriptCache;
  audioCurrentTime: number;
  audioSummary: string | null;
  audioDurationFormatted: string | null;
  audioDurationSeconds?: number | null;
  audioCefrLevel: string | null;
  audioCefrExplanation?: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setAudioCurrentTime: (time: number) => void;
  handleAudioLoadedMetadata: (duration: number) => void;
  handleSeek: (time: number) => void;
  handleTranscribeAnother: () => void;
  handleReTranscribe?: (mode: TranscriptionMode, forceRefresh?: boolean) => void;
}

const MODE_TABS: {
  id: TranscriptionMode;
  label: string;
  shortLabel: string;
  icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { id: 'standard', label: 'Standard Transcript', shortLabel: 'Standard', icon: FileText },
  { id: 'subtitles', label: 'Subtitles (.SRT)', shortLabel: 'Subtitles', icon: Subtitles },
  { id: 'clean', label: 'Clean Text', shortLabel: 'Clean', icon: AlignLeft },
];

export const TranscriptionResults: React.FC<TranscriptionResultsProps> = ({
  audioSrc,
  currentFile,
  transcriptionText,
  transcriptionMode,
  transcriptCache,
  audioCurrentTime,
  audioSummary,
  audioDurationFormatted,
  audioDurationSeconds,
  audioCefrLevel,
  audioCefrExplanation,
  audioRef,
  setAudioCurrentTime,
  handleAudioLoadedMetadata,
  handleSeek,
  handleTranscribeAnother,
  handleReTranscribe,
}) => {
  const fileName = currentFile ? currentFile.name : 'audio';

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Column: Sticky Audio Player, Mode Switcher Tabs, and Transcript */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        {/* Sticky Custom Studio Audio Player */}
        {audioSrc && (
          <div className="sticky top-3 z-20">
            <AudioPlayer
              ref={audioRef}
              src={audioSrc}
              fileName={fileName}
              onTimeUpdate={setAudioCurrentTime}
              onLoadedMetadata={handleAudioLoadedMetadata}
            />
          </div>
        )}

        {/* Segmented Mode Switcher Bar + New File Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/70 backdrop-blur-xl p-2 rounded-2xl border border-slate-800">
          {handleReTranscribe && (
            <div
              className="grid grid-cols-3 gap-1.5 flex-1"
              role="tablist"
              aria-label="Transcription format modes"
            >
              {MODE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = transcriptionMode === tab.id;
                const isCached = Boolean(transcriptCache?.[tab.id]);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      if (!isActive) {
                        handleReTranscribe(tab.id);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-sky-500/20 text-sky-200 border-sky-500/40 shadow-sm'
                        : 'bg-slate-950/40 text-slate-400 border-transparent hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>

                    {/* Status dot / indicator */}
                    {isCached ? (
                      <span
                        title="Cached — switches instantaneously"
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isActive ? 'bg-sky-400' : 'bg-emerald-400'
                        }`}
                      />
                    ) : (
                      <span
                        title="Click to generate this format with Gemini"
                        className="hidden md:inline-flex items-center text-[10px] font-normal text-slate-500"
                      >
                        <Sparkles size={10} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            {handleReTranscribe && (
              <button
                type="button"
                onClick={() => handleReTranscribe(transcriptionMode, true)}
                title="Regenerate current mode from scratch"
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className="text-sky-400" />
                <span>Regenerate</span>
              </button>
            )}

            <Button
              type="button"
              onClick={handleTranscribeAnother}
              variant="secondary"
              className="!py-2 !px-3.5 text-xs !rounded-xl flex-shrink-0"
            >
              <PlusCircle size={15} className="flex-shrink-0 text-sky-400" />
              <span>New File</span>
            </Button>
          </div>
        </div>

        {/* Active Transcription Display */}
        {transcriptionText && (
          transcriptionMode === 'subtitles' ? (
            <SubtitlePreview
              srtContent={transcriptionText}
              fileName={fileName}
              currentTime={audioCurrentTime}
              onTimestampClick={handleSeek}
            />
          ) : (
            <TranscriptionDisplay
              text={transcriptionText}
              currentTime={audioCurrentTime}
              onTimestampClick={handleSeek}
              fileName={fileName}
            />
          )
        )}

        {/* Bottom Footer Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-900/50 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
          <span>
            Want to process another recording? Upload a new file at any time.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {handleReTranscribe && (
              <button
                type="button"
                onClick={() => handleReTranscribe(transcriptionMode, true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/70 transition-colors cursor-pointer"
                title="Regenerate current mode from scratch"
              >
                <RefreshCw size={13} />
                <span>Regenerate {transcriptionMode}</span>
              </button>
            )}
            <Button
              type="button"
              onClick={handleTranscribeAnother}
              variant="secondary"
              className="!py-1.5 !px-3.5 text-xs !rounded-xl"
            >
              <PlusCircle size={14} className="flex-shrink-0" />
              <span>Transcribe Another File</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Audio Intelligence Panel */}
      <div className="w-full lg:w-1/3 lg:sticky lg:top-3">
        <AudioAnalysisDisplay
          summary={audioSummary}
          audioDuration={audioDurationFormatted}
          audioDurationSeconds={audioDurationSeconds}
          cefrLevel={audioCefrLevel}
          cefrExplanation={audioCefrExplanation}
          transcriptionText={transcriptionText}
        />
      </div>
    </div>
  );
};
