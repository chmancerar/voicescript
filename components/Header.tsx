import React from 'react';
import { AudioWaveform, BookOpenText, BarChart3, FileText, KeyRound, Sparkles } from 'lucide-react';

interface HeaderProps {
  apiKeyAvailable?: boolean;
  onManageKey?: () => void;
  compact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  apiKeyAvailable,
  onManageKey,
  compact = false,
}) => {
  return (
    <header className="w-full max-w-6xl mx-auto pt-2 pb-4">
      {/* Sleek Top Navigation Bar */}
      <nav className="flex items-center justify-between py-3 px-4 sm:px-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-lg">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-amber-500/10 border border-sky-500/30 shadow-inner">
            <AudioWaveform size={26} className="text-sky-400" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-none">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300">
                  Voice
                </span>
                <span className="text-amber-400">Script</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                <Sparkles size={11} className="text-sky-400" />
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
              Audio Transcription &amp; CEFR Linguistic Intelligence
            </p>
          </div>
        </div>

        {/* Right Controls: API Key Status Pill */}
        {onManageKey && (
          <button
            type="button"
            onClick={onManageKey}
            title={
              apiKeyAvailable
                ? 'Gemini API Key is active (Click to manage)'
                : 'Configure Gemini API Key'
            }
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
              apiKeyAvailable
                ? 'bg-slate-800/90 text-slate-200 border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                apiKeyAvailable ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <KeyRound size={14} className={apiKeyAvailable ? 'text-emerald-400' : 'text-amber-400'} />
            <span>{apiKeyAvailable ? 'API Key Ready' : 'Set API Key'}</span>
          </button>
        )}
      </nav>

      {/* Collapsible Hero & Feature Highlights (Shown in landing/idle state) */}
      {!compact && (
        <div className="mt-6 text-center max-w-3xl mx-auto px-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Studio-grade transcription &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-amber-300">
              language proficiency analysis
            </span>
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Upload any audio recording to generate speaker-diarized transcripts, synchronized SubRip (`.srt`) subtitles, or clean prose alongside an instant CEFR assessment.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {/* Feature 1 */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-xl hover:border-sky-500/30 transition-colors">
              <div className="p-2 bg-sky-500/15 rounded-lg text-sky-400 flex-shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs sm:text-sm">3 Output Modes</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                  Standard timestamps, `.SRT` subtitles, or clean text
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-xl hover:border-amber-500/30 transition-colors">
              <div className="p-2 bg-amber-500/15 rounded-lg text-amber-400 flex-shrink-0">
                <BarChart3 size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs sm:text-sm">CEFR Proficiency</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                  A1–C2 rating with linguistic rationale &amp; WPM pace
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-xl hover:border-emerald-500/30 transition-colors">
              <div className="p-2 bg-emerald-500/15 rounded-lg text-emerald-400 flex-shrink-0">
                <BookOpenText size={18} />
              </div>
              <div>
                <p className="font-semibold text-slate-200 text-xs sm:text-sm">Executive Summary</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                  Concise overview &amp; synchronized audio playback
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
