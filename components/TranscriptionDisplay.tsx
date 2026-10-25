import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Type, Copy, Check, Search, ChevronUp, ChevronDown, X, Download } from 'lucide-react';
import { parseTimestampToSeconds } from '../constants';
import { Match } from '../types';

interface TranscriptionDisplayProps {
  text: string;
  currentTime?: number;
  onTimestampClick?: (time: number) => void;
  fileName?: string;
}

const formatTimestampString = (rawTimestamp: string): string => {
  const clean = rawTimestamp.replace(/[\[\]()]/g, '').trim();
  return clean;
};

const getSpeakerBadgeStyle = (speakerTag: string): string => {
  const match = speakerTag.match(/\b(?:Speaker|Hablante|Person)?\s*(\d+)/i);
  if (match && match[1]) {
    const speakerNum = parseInt(match[1], 10);
    switch (speakerNum % 5) {
      case 1:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 2:
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 3:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 4:
        return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
      case 0:
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  }
  return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
};

// Regex to parse a line into rawTimestamp, speakerTag, and textContent
const lineStartRegex =
  /^(?:(\[\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*\]|\(\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*\))\s*)?((?:(?:Speaker|Hablante|Interlocuteur|Person)\s*\w*|[A-Z][a-zA-Z0-9_ -]{1,15}):\s*)?(.*)/i;

const parseLine = (line: string) => {
  const lineMatch = line.match(lineStartRegex);
  if (lineMatch) {
    return {
      rawTimestamp: lineMatch[1] || undefined,
      speakerTag: lineMatch[2] || undefined,
      textContent: lineMatch[3] || '',
    };
  }
  return { rawTimestamp: undefined, speakerTag: undefined, textContent: line };
};

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  text,
  currentTime = 0,
  onTimestampClick,
  fileName = 'transcription',
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(true);

  const activeMatchRef = useRef<HTMLSpanElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => text.split('\n'), [text]);

  // Check if text contains timestamps
  const hasTimestamps = useMemo(() => {
    return lines.some((line) => {
      const { rawTimestamp } = parseLine(line);
      return Boolean(rawTimestamp);
    });
  }, [lines]);

  // Word count for footer
  const wordCount = useMemo(() => {
    const cleanWords = lines
      .map((l) => parseLine(l).textContent.trim())
      .filter(Boolean)
      .join(' ')
      .split(/\s+/)
      .filter(Boolean);
    return cleanWords.length;
  }, [lines]);

  // Pre-calculate line start times for highlighting and seeking
  const lineStartTimes = useMemo(() => {
    return lines.map((line) => {
      const { rawTimestamp } = parseLine(line);
      return rawTimestamp ? parseTimestampToSeconds(rawTimestamp) : null;
    });
  }, [lines]);

  // Determine which timestamped line is currently "active" based on audio playback
  // Uses a 100ms speech-onset lead-in so whole-second or tenths timestamps highlight right on syllable onset
  const activeLineIndex = useMemo(() => {
    if (currentTime <= 0 || !hasTimestamps) return -1;
    const syncTime = currentTime + 0.1;

    let lastValidIndex = -1;
    for (let i = 0; i < lineStartTimes.length; i++) {
      const startTime = lineStartTimes[i];
      if (startTime !== null) {
        if (syncTime >= startTime) {
          lastValidIndex = i;
        } else {
          break;
        }
      }
    }
    return lastValidIndex;
  }, [currentTime, lineStartTimes, hasTimestamps]);

  // Smooth scroll into view when autoScroll is enabled
  useEffect(() => {
    if (autoScroll && activeLineRef.current && activeLineIndex !== -1) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, autoScroll]);

  // Search logic
  useEffect(() => {
    if (!searchQuery) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const newMatches: Match[] = [];
    const query = searchQuery.toLowerCase();
    lines.forEach((line, lineIndex) => {
      const { textContent } = parseLine(line);
      const lowerCaseContent = textContent.toLowerCase();
      let startIndex = 0;
      let index;
      while ((index = lowerCaseContent.indexOf(query, startIndex)) > -1) {
        newMatches.push({
          lineIndex,
          start: index,
          end: index + query.length,
        });
        startIndex = index + query.length;
      }
    });

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
  }, [searchQuery, lines]);

  useEffect(() => {
    if (activeMatchRef.current) {
      activeMatchRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentMatchIndex]);

  const handleCopy = useCallback(() => {
    if (text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    }
  }, [text]);

  const handleDownload = useCallback(() => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    a.download = `${baseName}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }, [text, fileName]);

  const handleNextMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prevIndex) => (prevIndex + 1) % matches.length);
    }
  };

  const handlePrevMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prevIndex) => (prevIndex - 1 + matches.length) % matches.length);
    }
  };

  const formattedText = useMemo(() => {
    let matchCounter = -1;
    return lines.map((line, lineIndex) => {
      if (line.trim() === '') {
        return <div key={`line-${lineIndex}`} className="h-3" aria-hidden="true" />;
      }

      const { rawTimestamp, speakerTag, textContent } = parseLine(line);
      const isActive = activeLineIndex === lineIndex;

      // Build text with search highlights
      const textFragments: (string | React.ReactElement)[] = [];
      const lineMatches = matches
        .filter((m) => m.lineIndex === lineIndex)
        .sort((a, b) => a.start - b.start);
      let lastIndex = 0;

      if (lineMatches.length > 0 && searchQuery) {
        lineMatches.forEach((match) => {
          if (match.start > lastIndex) {
            textFragments.push(textContent.substring(lastIndex, match.start));
          }
          matchCounter++;
          const isCurrent = matchCounter === currentMatchIndex;
          textFragments.push(
            <mark
              key={`match-${lineIndex}-${match.start}`}
              ref={isCurrent ? activeMatchRef : null}
              className={`rounded px-1 py-0.5 ${
                isCurrent
                  ? 'bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-200'
                  : 'bg-sky-500/35 text-white'
              }`}
            >
              {textContent.substring(match.start, match.end)}
            </mark>
          );
          lastIndex = match.end;
        });
      }

      if (lastIndex < textContent.length) {
        textFragments.push(textContent.substring(lastIndex));
      }

      // Clean mode layout (no timestamps)
      if (!hasTimestamps) {
        return (
          <div
            key={`line-${lineIndex}`}
            className="py-1.5 px-3 rounded-xl hover:bg-slate-800/40 transition-colors text-slate-200 leading-relaxed"
          >
            {speakerTag && (
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold border mr-2 ${getSpeakerBadgeStyle(
                  speakerTag
                )}`}
              >
                {speakerTag.replace(/:\s*$/, '')}
              </span>
            )}
            <span>
              {textFragments.map((part, partIndex) => (
                <React.Fragment key={partIndex}>{part}</React.Fragment>
              ))}
            </span>
          </div>
        );
      }

      // Standard mode structured dialogue layout
      const cleanedTimestamp = rawTimestamp ? formatTimestampString(rawTimestamp.trim()) : null;
      const seconds = rawTimestamp ? parseTimestampToSeconds(rawTimestamp) : 0;

      return (
        <div
          key={`line-${lineIndex}`}
          ref={isActive ? activeLineRef : null}
          className={`group flex items-start gap-3 px-3 py-2 rounded-xl transition-all duration-200 border-l-4 ${
            isActive
              ? 'bg-sky-500/15 border-sky-400 shadow-sm'
              : 'border-transparent hover:bg-slate-800/50'
          }`}
        >
          {/* Left Timestamp Gutter */}
          <div className="w-16 flex-shrink-0 pt-0.5">
            {cleanedTimestamp ? (
              <button
                type="button"
                onClick={() => onTimestampClick?.(seconds)}
                title={`Seek audio to ${cleanedTimestamp}`}
                className={`w-full px-2 py-0.5 rounded-md font-mono text-xs font-semibold text-center transition-all duration-150 border cursor-pointer outline-none focus:ring-2 focus:ring-sky-400 ${
                  isActive
                    ? 'bg-sky-400 text-slate-950 border-sky-300 shadow-md shadow-sky-400/25'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-sky-500 hover:text-slate-950 hover:border-sky-400'
                }`}
              >
                {cleanedTimestamp}
              </button>
            ) : (
              <span className="block w-full text-center text-slate-700 font-mono text-xs select-none">
                ·
              </span>
            )}
          </div>

          {/* Right Speaker & Utterance Column */}
          <div className="flex-1 min-w-0 leading-relaxed">
            {speakerTag && (
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold border mr-2 mb-0.5 align-baseline ${getSpeakerBadgeStyle(
                  speakerTag
                )}`}
              >
                {speakerTag.replace(/:\s*$/, '')}
              </span>
            )}
            <span className={isActive ? 'text-white font-medium' : 'text-slate-200'}>
              {textFragments.map((part, partIndex) => (
                <React.Fragment key={partIndex}>{part}</React.Fragment>
              ))}
            </span>
          </div>
        </div>
      );
    });
  }, [lines, matches, currentMatchIndex, searchQuery, activeLineIndex, onTimestampClick, hasTimestamps]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header & Uncrowded 2-Tier Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 space-y-3">
        {/* Top Row: Title + Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 flex-shrink-0">
              <Type size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
                {hasTimestamps ? 'Synchronized Transcript' : 'Clean Prose Transcript'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {hasTimestamps
                  ? 'Click any timestamp to jump audio playback'
                  : 'Continuous spoken text without labels'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Always fully visible, no clipping or scrollbars */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Auto-scroll Toggle */}
            {hasTimestamps && (
              <button
                type="button"
                onClick={() => setAutoScroll(!autoScroll)}
                title={
                  autoScroll
                    ? 'Auto-scroll is ON (click to pause)'
                    : 'Auto-scroll is OFF (click to follow audio)'
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 flex-shrink-0 select-none cursor-pointer ${
                  autoScroll
                    ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40'
                    : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    autoScroll ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>Auto-scroll</span>
              </button>
            )}

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              title={copied ? 'Copied to clipboard!' : 'Copy transcription'}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-sky-300 border border-slate-700/80 transition-colors inline-flex items-center gap-1.5 text-xs font-medium flex-shrink-0 cursor-pointer"
              aria-label="Copy transcription to clipboard"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              title="Download as .txt file"
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors inline-flex items-center gap-1.5 text-xs flex-shrink-0 cursor-pointer shadow-sm"
              aria-label="Download transcription as text file"
            >
              {downloaded ? <Check size={14} /> : <Download size={14} />}
              <span>{downloaded ? 'Saved' : 'Export .txt'}</span>
            </button>
          </div>
        </div>

        {/* Second Row: Dedicated Search Bar & Match Navigation */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Find word or phrase in transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {searchQuery ? (
            <div className="flex items-center text-xs font-mono text-slate-300 flex-shrink-0 gap-1 bg-slate-950/60 border border-slate-800 rounded-xl px-2 py-1">
              <span className="px-1">
                {matches.length > 0 ? currentMatchIndex + 1 : 0}/{matches.length}
              </span>
              <button
                type="button"
                onClick={handlePrevMatch}
                disabled={matches.length === 0}
                className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Previous match"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                disabled={matches.length === 0}
                className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Next match"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-mono text-slate-400 flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-950/50 border border-slate-800/80">
              {wordCount.toLocaleString()} words
            </span>
          )}
        </div>
      </div>

      {/* Transcript Body */}
      <div className="p-4 sm:p-5 max-h-[55vh] sm:max-h-[62vh] overflow-y-auto scroll-smooth space-y-1 text-sm sm:text-base">
        {formattedText}
      </div>

      {/* Footer Info Bar */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>
          {hasTimestamps
            ? 'Tip: Click any timestamp badge on the left to seek audio.'
            : 'Clean prose mode — ready to paste into documents or notes.'}
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          {wordCount.toLocaleString()} words
        </span>
      </div>
    </div>
  );
};
