import React from 'react';
import { FileText, Subtitles, AlignLeft, CheckCircle2 } from 'lucide-react';
import { TranscriptionMode } from '../types';

export type { TranscriptionMode };

interface TranscriptionModeSelectorProps {
  mode: TranscriptionMode;
  onChange: (mode: TranscriptionMode) => void;
  disabled?: boolean;
}

interface ModeOption {
  id: TranscriptionMode;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  activeBorder: string;
  activeBg: string;
  activeIconBg: string;
  activeBadge: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'standard',
    title: 'Standard Transcript',
    subtitle: 'Speaker labels & clickable timestamps',
    badge: 'Diarized + [MM:SS]',
    icon: FileText,
    activeBorder: 'border-sky-500/80 shadow-lg shadow-sky-500/15',
    activeBg: 'bg-gradient-to-b from-sky-500/15 to-slate-900/90',
    activeIconBg: 'bg-sky-500 text-slate-950',
    activeBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  {
    id: 'subtitles',
    title: 'Subtitles (.SRT)',
    subtitle: 'Time-synced cues ready for video players',
    badge: 'HH:MM:SS,mmm',
    icon: Subtitles,
    activeBorder: 'border-amber-400/80 shadow-lg shadow-amber-500/15',
    activeBg: 'bg-gradient-to-b from-amber-500/15 to-slate-900/90',
    activeIconBg: 'bg-amber-400 text-slate-950',
    activeBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'clean',
    title: 'Clean Prose',
    subtitle: 'Pure spoken text without timestamps or tags',
    badge: 'Plain Text',
    icon: AlignLeft,
    activeBorder: 'border-emerald-500/80 shadow-lg shadow-emerald-500/15',
    activeBg: 'bg-gradient-to-b from-emerald-500/15 to-slate-900/90',
    activeIconBg: 'bg-emerald-400 text-slate-950',
    activeBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
];

export const TranscriptionModeSelector: React.FC<TranscriptionModeSelectorProps> = ({
  mode,
  onChange,
  disabled,
}) => {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select Output Format
        </span>
        <span className="text-xs text-slate-400">
          You can switch modes anytime after transcribing
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
        {MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = mode === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              disabled={disabled}
              className={`
                relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-200 outline-none
                focus:ring-2 focus:ring-sky-400
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}
                ${
                  isSelected
                    ? `${opt.activeBg} ${opt.activeBorder}`
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                }
              `}
            >
              {/* Top Row: Icon & Checkmark */}
              <div className="w-full flex items-center justify-between mb-3">
                <div
                  className={`p-2.5 rounded-xl transition-colors ${
                    isSelected ? opt.activeIconBg : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>

                {isSelected ? (
                  <CheckCircle2 size={18} className="text-sky-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-700" />
                )}
              </div>

              <span className="font-bold text-sm sm:text-base text-slate-100">
                {opt.title}
              </span>

              <span className="text-xs text-slate-400 mt-1 leading-relaxed">
                {opt.subtitle}
              </span>

              <span
                className={`mt-3 inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                  isSelected
                    ? opt.activeBadge
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                }`}
              >
                {opt.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
