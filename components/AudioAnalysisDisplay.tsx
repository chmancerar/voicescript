import React from 'react';
import { BookText, Clock, BarChart3, Info, Sparkles } from 'lucide-react';

interface AudioAnalysisDisplayProps {
  summary: string | null;
  audioDuration: string | null;
  cefrLevel: string | null;
  cefrExplanation?: string | null;
}

const getCefrBadgeStyle = (level: string | null): string => {
  if (!level) return 'bg-slate-700 text-slate-300';
  const clean = level.toUpperCase().trim();
  if (clean.includes('A1') || clean.includes('A2')) {
    return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
  }
  if (clean.includes('B1') || clean.includes('B2')) {
    return 'bg-sky-500/20 text-sky-300 border border-sky-500/40';
  }
  if (clean.includes('C1') || clean.includes('C2')) {
    return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
  }
  return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
};

export const AudioAnalysisDisplay: React.FC<AudioAnalysisDisplayProps> = ({
  summary,
  audioDuration,
  cefrLevel,
  cefrExplanation,
}) => {
  return (
    <div className="lg:mt-0 mt-4 mb-6" aria-labelledby="audio-analysis-heading">
      <h2 id="audio-analysis-heading" className="text-2xl font-semibold mb-4 text-sky-400 flex items-center">
        <Info size={28} className="mr-3 flex-shrink-0" />
        Audio Analysis
      </h2>

      <div className="bg-slate-900 p-5 rounded-xl shadow-inner border border-slate-700/60 space-y-4">
        {/* Summary */}
        <div className="flex items-start">
          <BookText size={20} className="text-sky-400 mr-3 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-300 text-sm mb-1">Summary:</h4>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {summary || <span className="text-slate-500 italic">Analysis in progress...</span>}
            </p>
          </div>
        </div>

        {/* Audio Duration */}
        <div className="flex items-start border-t border-slate-800 pt-3">
          <Clock size={20} className="text-sky-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-300 text-sm mb-1">Audio Length:</h4>
            <p className="text-slate-200 text-sm font-mono">
              {audioDuration || <span className="text-slate-500 italic">Calculating...</span>}
            </p>
          </div>
        </div>

        {/* CEFR Level */}
        <div className="flex items-start border-t border-slate-800 pt-3">
          <BarChart3 size={20} className="text-sky-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-300 text-sm mb-1">Estimated CEFR Level:</h4>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getCefrBadgeStyle(cefrLevel)}`}>
                {cefrLevel || 'Pending'}
              </span>
            </div>
            {cefrExplanation && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
                <Sparkles size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{cefrExplanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
