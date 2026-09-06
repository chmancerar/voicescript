import React from 'react';
import { FileText, Subtitles, AlignLeft } from 'lucide-react';
import { TranscriptionMode } from '../types';

export type { TranscriptionMode };

interface TranscriptionModeSelectorProps {
  mode: TranscriptionMode;
  onChange: (mode: TranscriptionMode) => void;
  disabled?: boolean;
}

export const TranscriptionModeSelector: React.FC<TranscriptionModeSelectorProps> = ({
  mode,
  onChange,
  disabled
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full mb-6">
      <button
        type="button"
        onClick={() => onChange('standard')}
        disabled={disabled}
        className={`
          relative flex-1 flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-200 outline-none
          group overflow-hidden
          focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}
          ${
            mode === 'standard'
              ? 'bg-sky-600 border-sky-500 shadow-lg shadow-sky-900/50 z-10'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
          }
        `}
      >
        <div className={`
          p-3 rounded-full mb-3 transition-colors
          ${mode === 'standard' ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400 group-hover:text-sky-400'}
        `}>
          <FileText size={28} strokeWidth={2} />
        </div>
        <span className={`font-bold text-lg transition-colors ${mode === 'standard' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
          Standard Transcription
        </span>
        <span className={`text-xs mt-1 text-center transition-colors ${mode === 'standard' ? 'text-sky-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
          Speaker identification & timestamps
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('subtitles')}
        disabled={disabled}
        className={`
          relative flex-1 flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-200 outline-none
          group overflow-hidden
          focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}
          ${
            mode === 'subtitles'
              ? 'bg-yellow-500 border-yellow-400 shadow-lg shadow-yellow-900/50 z-10'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
          }
        `}
      >
        <div className={`
          p-3 rounded-full mb-3 transition-colors
          ${mode === 'subtitles' ? 'bg-slate-900/20 text-slate-900' : 'bg-slate-900 text-slate-400 group-hover:text-yellow-400'}
        `}>
          <Subtitles size={28} strokeWidth={2} />
        </div>
        <span className={`font-bold text-lg transition-colors ${mode === 'subtitles' ? 'text-slate-900' : 'text-slate-300 group-hover:text-white'}`}>
          Subtitle Generation
        </span>
        <span className={`text-xs mt-1 text-center transition-colors ${mode === 'subtitles' ? 'text-slate-900/80 font-medium' : 'text-slate-500 group-hover:text-slate-400'}`}>
          Exportable .srt format
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('clean')}
        disabled={disabled}
        className={`
          relative flex-1 flex flex-col items-center p-5 rounded-xl border-2 transition-all duration-200 outline-none
          group overflow-hidden
          focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}
          ${
            mode === 'clean'
              ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-900/50 z-10'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
          }
        `}
      >
        <div className={`
          p-3 rounded-full mb-3 transition-colors
          ${mode === 'clean' ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400 group-hover:text-emerald-400'}
        `}>
          <AlignLeft size={28} strokeWidth={2} />
        </div>
        <span className={`font-bold text-lg transition-colors ${mode === 'clean' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
          Clean Transcription
        </span>
        <span className={`text-xs mt-1 text-center transition-colors ${mode === 'clean' ? 'text-emerald-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
          No timestamps or labels
        </span>
      </button>
    </div>
  );
};