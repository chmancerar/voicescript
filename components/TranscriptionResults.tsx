import React from 'react';
import { TranscriptionMode } from '../types';
import { SubtitlePreview } from './SubtitlePreview';
import { TranscriptionDisplay } from './TranscriptionDisplay';
import { AudioPlayer } from './AudioPlayer';
import { AudioAnalysisDisplay } from './AudioAnalysisDisplay';
import { Button } from './Button';
import { RefreshCw, PlusCircle, Subtitles, FileText, AlignLeft } from 'lucide-react';

interface TranscriptionResultsProps {
  audioSrc: string | null;
  currentFile: File | null;
  transcriptionText: string | null;
  transcriptionMode: TranscriptionMode;
  audioCurrentTime: number;
  audioSummary: string | null;
  audioDurationFormatted: string | null;
  audioCefrLevel: string | null;
  audioCefrExplanation?: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  setAudioCurrentTime: (time: number) => void;
  handleAudioLoadedMetadata: (duration: number) => void;
  handleSeek: (time: number) => void;
  handleTranscribeAnother: () => void;
  handleReTranscribe?: (mode: TranscriptionMode) => void;
}

export const TranscriptionResults: React.FC<TranscriptionResultsProps> = ({
  audioSrc,
  currentFile,
  transcriptionText,
  transcriptionMode,
  audioCurrentTime,
  audioSummary,
  audioDurationFormatted,
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
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left Column: Audio Player, Transcription, and Quick Controls */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        {audioSrc && (
          <AudioPlayer
            ref={audioRef}
            src={audioSrc}
            onTimeUpdate={setAudioCurrentTime}
            onLoadedMetadata={handleAudioLoadedMetadata}
          />
        )}

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

        {/* Bottom Actions Bar */}
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
          <Button
            type="button"
            onClick={handleTranscribeAnother}
            variant="secondary"
            className="w-full sm:w-auto !py-2.5 !px-5 text-sm flex-shrink-0"
          >
            <PlusCircle size={18} className="flex-shrink-0" />
            <span>Transcribe Another File</span>
          </Button>

          {/* Quick Re-transcribe in other modes */}
          {handleReTranscribe && (
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end text-xs text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <RefreshCw size={14} /> Re-run as:
              </span>
              {transcriptionMode !== 'standard' && (
                <button
                  type="button"
                  onClick={() => handleReTranscribe('standard')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-sky-600 hover:text-white rounded-md text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <FileText size={12} /> Standard
                </button>
              )}
              {transcriptionMode !== 'subtitles' && (
                <button
                  type="button"
                  onClick={() => handleReTranscribe('subtitles')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-yellow-500 hover:text-slate-900 rounded-md text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Subtitles size={12} /> Subtitles (.srt)
                </button>
              )}
              {transcriptionMode !== 'clean' && (
                <button
                  type="button"
                  onClick={() => handleReTranscribe('clean')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-md text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <AlignLeft size={12} /> Clean Text
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Audio Analysis Panel */}
      <div className="w-full lg:w-1/3 lg:sticky lg:top-8">
        <AudioAnalysisDisplay
          summary={audioSummary}
          audioDuration={audioDurationFormatted}
          cefrLevel={audioCefrLevel}
          cefrExplanation={audioCefrExplanation}
        />
      </div>
    </div>
  );
};
