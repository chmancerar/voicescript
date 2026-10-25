import React, { useMemo, useState } from 'react';
import { BookText, Clock, BarChart3, Sparkles, Copy, Check, Hash, Gauge, Info, X } from 'lucide-react';

interface AudioAnalysisDisplayProps {
  summary: string | null;
  audioDuration: string | null;
  audioDurationSeconds?: number | null;
  cefrLevel: string | null;
  cefrExplanation?: string | null;
  transcriptionText?: string | null;
}

const CEFR_LEVELS = [
  { code: 'A1', label: 'Beginner', color: 'emerald' },
  { code: 'A2', label: 'Elementary', color: 'emerald' },
  { code: 'B1', label: 'Intermediate', color: 'sky' },
  { code: 'B2', label: 'Upper Intermediate', color: 'sky' },
  { code: 'C1', label: 'Advanced', color: 'purple' },
  { code: 'C2', label: 'Mastery', color: 'purple' },
] as const;

interface PaceBracket {
  id: 'slow' | 'moderate' | 'conversational' | 'fast' | 'very_fast';
  label: string;
  range: string;
  min: number;
  max: number;
  description: string;
  badgeClass: string;
  dotClass: string;
}

// International Speech Rate Benchmarks (NCVS / Tauroza & Allison / CEFR Listening Standards)
const PACE_BRACKETS: PaceBracket[] = [
  {
    id: 'slow',
    label: 'Slow',
    range: '< 110 wpm',
    min: 0,
    max: 109,
    description: 'Deliberate articulation, typical of A1–A2 learner audio or dictation',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dotClass: 'bg-cyan-400',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    range: '110–129 wpm',
    min: 110,
    max: 129,
    description: 'Clear presentation, audiobook, or B1 instructional pace',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotClass: 'bg-sky-400',
  },
  {
    id: 'conversational',
    label: 'Average',
    range: '130–160 wpm',
    min: 130,
    max: 160,
    description: 'Standard natural conversation & broadcast news (B2 benchmark)',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'fast',
    label: 'Fast',
    range: '161–185 wpm',
    min: 161,
    max: 185,
    description: 'Brisk native dialogue, energetic podcasts, or C1 discussion',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  {
    id: 'very_fast',
    label: 'Very Fast',
    range: '> 185 wpm',
    min: 186,
    max: Infinity,
    description: 'Rapid-fire commentary, debate, or high-speed C2 speech',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
];

const getPaceBracket = (wpm: number | null): PaceBracket | null => {
  if (wpm === null || wpm <= 0) return null;
  return (
    PACE_BRACKETS.find((b) => wpm >= b.min && wpm <= b.max) ||
    PACE_BRACKETS[PACE_BRACKETS.length - 1]
  );
};

const extractDetectedCefrCode = (rawLevel: string | null): string | null => {
  if (!rawLevel) return null;
  const match = rawLevel.toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
  return match ? match[1] : null;
};

const countCleanWords = (rawText: string | null | undefined): number => {
  if (!rawText) return 0;
  const cleaned = rawText
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (/^\d+$/.test(trimmed)) return '';
      if (/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(trimmed)) return '';
      return trimmed
        .replace(/^(\[\s*\d{1,2}:\d{2}(?::\d{2})?\s*\]|\(\s*\d{1,2}:\d{2}(?::\d{2})?\s*\))\s*/i, '')
        .replace(/^(?:Speaker|Hablante|Person)\s*\w*:\s*/i, '');
    })
    .filter(Boolean)
    .join(' ');

  const words = cleaned.trim().split(/\s+/).filter(Boolean);
  return words.length;
};

export const AudioAnalysisDisplay: React.FC<AudioAnalysisDisplayProps> = ({
  summary,
  audioDuration,
  audioDurationSeconds,
  cefrLevel,
  cefrExplanation,
  transcriptionText,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showPaceLegend, setShowPaceLegend] = useState(false);

  const detectedCode = useMemo(() => extractDetectedCefrCode(cefrLevel), [cefrLevel]);
  const activeCefrMeta = useMemo(
    () => CEFR_LEVELS.find((l) => l.code === detectedCode) || null,
    [detectedCode]
  );

  const wordCount = useMemo(() => countCleanWords(transcriptionText), [transcriptionText]);

  const speakingRateWpm = useMemo(() => {
    if (!audioDurationSeconds || audioDurationSeconds < 3 || wordCount === 0) return null;
    return Math.round((wordCount / audioDurationSeconds) * 60);
  }, [audioDurationSeconds, wordCount]);

  const activePaceBracket = useMemo(() => getPaceBracket(speakingRateWpm), [speakingRateWpm]);

  const handleCopySummary = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  };

  return (
    <div className="space-y-4" aria-labelledby="audio-analysis-heading">
      {/* Main Intelligence Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400">
            <BarChart3 size={18} />
          </div>
          <div>
            <h2 id="audio-analysis-heading" className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
              Audio Intelligence
            </h2>
            <p className="text-[11px] text-slate-400">
              Summary, metrics &amp; CEFR linguistic profile
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* 3-Column Metrics Grid + Speaking Pace Tooltip/Legend */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-2.5">
              {/* Duration */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock size={12} className="text-sky-400" />
                  Length
                </span>
                <span className="mt-1.5 text-sm sm:text-base font-mono font-bold text-slate-100">
                  {audioDuration || '--:--'}
                </span>
              </div>

              {/* Word Count */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Hash size={12} className="text-indigo-400" />
                  Words
                </span>
                <span className="mt-1.5 text-sm sm:text-base font-mono font-bold text-slate-100">
                  {wordCount > 0 ? wordCount.toLocaleString() : '--'}
                </span>
              </div>

              {/* Speaking Pace (WPM) with Classification Badge & Legend Trigger */}
              <div
                onMouseEnter={() => setShowPaceLegend(true)}
                onMouseLeave={() => setShowPaceLegend(false)}
                onClick={() => setShowPaceLegend((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowPaceLegend((prev) => !prev);
                  }
                }}
                aria-expanded={showPaceLegend}
                title="Hover or click to view international WPM speaking speed standards"
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col justify-between cursor-pointer select-none"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Gauge size={12} className="text-emerald-400" />
                    Pace
                  </span>
                  <Info
                    size={12}
                    className={`transition-colors ${
                      showPaceLegend ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  />
                </div>

                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-1">
                  <span className="text-sm sm:text-base font-mono font-bold text-slate-100 leading-none">
                    {speakingRateWpm ? `${speakingRateWpm}` : '--'}
                    {speakingRateWpm && (
                      <span className="text-[10px] font-normal text-slate-400 ml-0.5">wpm</span>
                    )}
                  </span>

                  {activePaceBracket && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border leading-none ${activePaceBracket.badgeClass}`}
                    >
                      {activePaceBracket.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Non-disruptive Popover Legend for International WPM Standards */}
            {showPaceLegend && (
              <div
                onMouseEnter={() => setShowPaceLegend(true)}
                onMouseLeave={() => setShowPaceLegend(false)}
                className="mt-2 p-3.5 rounded-xl bg-slate-950/95 border border-slate-700/90 shadow-2xl text-xs space-y-2 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Gauge size={13} className="text-emerald-400" />
                    International Speech Rate Scale (WPM)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPaceLegend(false);
                    }}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Close pace legend"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {PACE_BRACKETS.map((bracket) => {
                    const isCurrent = activePaceBracket?.id === bracket.id;
                    return (
                      <div
                        key={bracket.id}
                        className={`flex items-start justify-between gap-2 p-1.5 rounded-lg border transition-colors ${
                          isCurrent
                            ? 'bg-slate-900 border-slate-700 text-slate-100'
                            : 'border-transparent text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`w-2 h-2 rounded-full ${bracket.dotClass}`} />
                          <span className={`font-semibold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                            {bracket.label}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            ({bracket.range})
                          </span>
                        </div>
                        <span className="text-[11px] text-right text-slate-400 leading-snug">
                          {bracket.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CEFR Proficiency Section */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                CEFR Proficiency
              </span>
              {activeCefrMeta ? (
                <span className="text-xs font-semibold text-sky-300">
                  {activeCefrMeta.code} · {activeCefrMeta.label}
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-400">
                  {cefrLevel || 'Pending'}
                </span>
              )}
            </div>

            {/* 6-Step Visual Spectrum */}
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {CEFR_LEVELS.map((lvl) => {
                const isCurrent = detectedCode === lvl.code;
                let activeClass = 'bg-slate-800/70 text-slate-500 border-slate-800';
                if (isCurrent) {
                  if (lvl.color === 'emerald') {
                    activeClass =
                      'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/25 scale-105';
                  } else if (lvl.color === 'sky') {
                    activeClass =
                      'bg-sky-400 text-slate-950 border-sky-300 shadow-lg shadow-sky-400/25 scale-105';
                  } else {
                    activeClass =
                      'bg-purple-400 text-slate-950 border-purple-300 shadow-lg shadow-purple-400/25 scale-105';
                  }
                }

                return (
                  <div
                    key={lvl.code}
                    title={`${lvl.code}: ${lvl.label}`}
                    className={`py-1.5 rounded-lg text-center font-mono text-xs font-bold border transition-all ${activeClass}`}
                  >
                    {lvl.code}
                  </div>
                );
              })}
            </div>

            {/* Linguistic Explanation */}
            {cefrExplanation && (
              <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <Sparkles size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{cefrExplanation}</p>
              </div>
            )}
          </div>

          {/* Executive Summary Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookText size={14} className="text-sky-400" />
                Executive Summary
              </h3>
              {summary && (
                <button
                  type="button"
                  onClick={handleCopySummary}
                  title="Copy summary"
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {summary || (
                <span className="text-slate-500 italic">Generating executive summary...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
