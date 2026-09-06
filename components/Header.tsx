import React from 'react';
import { AudioWaveform, BookOpenText, BarChart3, FileText, KeyRound } from 'lucide-react';

interface HeaderProps {
  apiKeyAvailable?: boolean;
  onManageKey?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiKeyAvailable, onManageKey }) => {
  return (
    <header className="w-full max-w-4xl py-6 text-center relative">
      {/* Top Key Management Bar */}
      {onManageKey && (
        <div className="absolute right-0 top-2 sm:top-4">
          <button
            type="button"
            onClick={onManageKey}
            title={apiKeyAvailable ? "Gemini API Key is active (Click to change)" : "Configure Gemini API Key"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
              apiKeyAvailable
                ? 'bg-slate-800/80 text-emerald-400 border-emerald-500/30 hover:bg-slate-800 hover:border-emerald-500/60'
                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30'
            }`}
          >
            <KeyRound size={14} className={apiKeyAvailable ? 'text-emerald-400' : 'text-yellow-400'} />
            <span className="hidden sm:inline">{apiKeyAvailable ? 'Key Configured' : 'Set API Key'}</span>
          </button>
        </div>
      )}

      {/* Main Logo & Title */}
      <div className="flex items-center justify-center space-x-3">
        <AudioWaveform size={40} className="text-sky-400" />
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Voice</span>
          <span className="text-yellow-400">Script</span>
        </h1>
      </div>

      <p className="mt-2 text-sm text-slate-400 font-medium">
        Multimodal Audio Transcription & CEFR Linguistic Analysis powered by Google Gemini 3.8
      </p>

      {/* Feature Cards Section */}
      <div className="mt-8 w-full max-w-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {/* Item 1: Audio Summary & Length */}
          <div className="flex flex-col items-center text-center p-4 bg-slate-800/70 shadow-lg rounded-xl border border-slate-700 hover:border-sky-500/50 hover:bg-slate-700/60 transition-all duration-200">
            <div className="p-3 bg-sky-500/20 rounded-full mb-2.5 text-sky-400" aria-hidden="true">
              <BookOpenText size={22} />
            </div>
            <p className="font-semibold text-slate-200 text-xs sm:text-sm">Summary & Length</p>
            <p className="text-slate-400 text-xs mt-1">Instant overview</p>
          </div>

          {/* Item 2: CEFR Level */}
          <div className="flex flex-col items-center text-center p-4 bg-slate-800/70 shadow-lg rounded-xl border border-slate-700 hover:border-sky-500/50 hover:bg-slate-700/60 transition-all duration-200">
            <div className="p-3 bg-sky-500/20 rounded-full mb-2.5 text-sky-400" aria-hidden="true">
              <BarChart3 size={22} />
            </div>
            <p className="font-semibold text-slate-200 text-xs sm:text-sm">Estimated CEFR Level</p>
            <p className="text-slate-400 text-xs mt-1">A1 to C2 breakdown</p>
          </div>

          {/* Item 3: Transcription */}
          <div className="flex flex-col items-center text-center p-4 bg-slate-800/70 shadow-lg rounded-xl border border-slate-700 hover:border-sky-500/50 hover:bg-slate-700/60 transition-all duration-200">
            <div className="p-3 bg-sky-500/20 rounded-full mb-2.5 text-sky-400" aria-hidden="true">
              <FileText size={22} />
            </div>
            <p className="font-semibold text-slate-200 text-xs sm:text-sm">Transcript & Subtitles</p>
            <p className="text-slate-400 text-xs mt-1">Standard, .SRT, or Clean</p>
          </div>
        </div>
      </div>
    </header>
  );
};