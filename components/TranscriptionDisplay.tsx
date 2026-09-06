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
  if (rawTimestamp.startsWith('(')) return `(${clean})`;
  return `[${clean}]`;
};

const getSpeakerColorClass = (speakerTag: string): string => {
  const match = speakerTag.match(/\b(?:Speaker|Hablante|Person)?\s*(\d+)\s*:/i);
  if (match && match[1]) {
    const speakerNum = parseInt(match[1], 10);
    switch (speakerNum % 5) {
      case 1: return 'text-sky-300';
      case 2: return 'text-yellow-400';
      case 3: return 'text-emerald-400';
      case 4: return 'text-pink-400';
      case 0: return 'text-purple-400';
      default: return 'text-sky-300';
    }
  }
  return 'text-sky-300';
};

// Regex to parse a line into rawTimestamp, speakerTag, and textContent
const lineStartRegex = /^(?:(\[\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*\]|\(\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*\))\s*)?((?:(?:Speaker|Hablante|Interlocuteur|Person)\s*\w*|[A-Z][a-zA-Z0-9_ -]{1,15}):\s*)?(.*)/i;

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
  fileName = 'transcription'
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
    return lines.some(line => {
      const { rawTimestamp } = parseLine(line);
      return Boolean(rawTimestamp);
    });
  }, [lines]);

  // Pre-calculate line start times for highlighting and seeking
  const lineStartTimes = useMemo(() => {
    return lines.map(line => {
      const { rawTimestamp } = parseLine(line);
      return rawTimestamp ? parseTimestampToSeconds(rawTimestamp) : null;
    });
  }, [lines]);

  // Determine which line is currently "active" based on audio playback
  const activeLineIndex = useMemo(() => {
    if (currentTime === 0 || !hasTimestamps) return -1;

    let lastValidIndex = -1;
    for (let i = 0; i < lineStartTimes.length; i++) {
      const startTime = lineStartTimes[i];
      if (startTime !== null) {
        if (currentTime >= startTime) {
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
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
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
      if (line.trim() === "") {
        return <div key={`line-${lineIndex}`} style={{ minHeight: '1.2em' }} aria-hidden="true" />;
      }

      const parts: (string | React.ReactElement)[] = [];
      const { rawTimestamp, speakerTag, textContent } = parseLine(line);
      const isActive = activeLineIndex === lineIndex;

      if (rawTimestamp) {
        const cleanedTimestamp = formatTimestampString(rawTimestamp.trim());
        const seconds = parseTimestampToSeconds(rawTimestamp);

        parts.push(
          <button
            key={`leadts-${lineIndex}`}
            type="button"
            onClick={() => onTimestampClick?.(seconds)}
            title={`Jump to ${cleanedTimestamp}`}
            className={`px-1.5 py-0.5 rounded-md font-mono text-xs font-semibold mx-0.5 transition-all duration-200 border border-transparent hover:border-sky-300 hover:scale-105 active:scale-95 flex-shrink-0 outline-none focus:ring-2 focus:ring-sky-400 ${
              isActive
                ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-400/30'
                : 'text-neutral-300 bg-black/40 hover:bg-sky-500 hover:text-white'
            }`}
          >
            {cleanedTimestamp}
          </button>
        );
      }

      if (speakerTag) {
        const speakerColorClass = getSpeakerColorClass(speakerTag);
        parts.push(
          <strong
            key={`spk-${lineIndex}`}
            className={`font-semibold mr-1.5 transition-opacity duration-300 ${speakerColorClass} ${isActive ? 'opacity-100' : 'opacity-85'}`}
          >
            {speakerTag}
          </strong>
        );
      }

      const lineMatches = matches.filter(m => m.lineIndex === lineIndex).sort((a, b) => a.start - b.start);
      let lastIndex = 0;

      if (lineMatches.length > 0 && searchQuery) {
        lineMatches.forEach(match => {
          if (match.start > lastIndex) {
            parts.push(textContent.substring(lastIndex, match.start));
          }
          matchCounter++;
          const isCurrent = matchCounter === currentMatchIndex;
          parts.push(
            <mark
              key={`match-${lineIndex}-${match.start}`}
              ref={isCurrent ? activeMatchRef : null}
              className={`rounded px-0.5 py-0 ${
                isCurrent ? 'bg-yellow-400 text-black font-bold ring-2 ring-yellow-200' : 'bg-sky-500/40 text-white'
              }`}
            >
              {textContent.substring(match.start, match.end)}
            </mark>
          );
          lastIndex = match.end;
        });
      }

      if (lastIndex < textContent.length) {
        parts.push(textContent.substring(lastIndex));
      }

      return (
        <div
          key={`line-${lineIndex}`}
          ref={isActive ? activeLineRef : null}
          className={`min-h-[1.2em] transition-all duration-200 rounded-lg px-2 py-1 -mx-1 group flex items-start flex-wrap gap-1 ${
            isActive
              ? 'bg-sky-500/15 border-l-4 border-sky-400 shadow-sm'
              : 'border-l-4 border-transparent hover:bg-slate-800/50'
          }`}
        >
          {parts.map((part, partIndex) => (
            <React.Fragment key={partIndex}>{part}</React.Fragment>
          ))}
        </div>
      );
    });
  }, [lines, matches, currentMatchIndex, searchQuery, activeLineIndex, onTimestampClick]);

  return (
    <div className="lg:mt-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
        <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
          <Type size={28} className="mr-3" />
          Transcription
        </h2>

        {/* Toolbar: Search, Auto-scroll, Copy, Download */}
        <div className="w-full sm:w-auto flex items-center gap-2 bg-slate-700/50 rounded-lg p-1.5 flex-nowrap overflow-x-auto">
          <div className="relative flex-1 min-w-[110px] max-w-[180px]">
            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-md pl-8 pr-7 py-1 text-sm text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="flex items-center text-xs text-slate-300 flex-shrink-0">
              <span>{matches.length > 0 ? currentMatchIndex + 1 : 0}/{matches.length}</span>
              <button
                type="button"
                onClick={handlePrevMatch}
                disabled={matches.length === 0}
                className="p-1 rounded hover:bg-slate-600 disabled:opacity-50"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                disabled={matches.length === 0}
                className="p-1 rounded hover:bg-slate-600 disabled:opacity-50"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          {/* Auto-scroll Toggle */}
          {hasTimestamps && (
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              title={autoScroll ? "Auto-scroll is ON (click to pause)" : "Auto-scroll is OFF (click to follow audio)"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex-shrink-0 select-none ${
                autoScroll
                  ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${autoScroll ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Auto-scroll</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied to clipboard!" : "Copy transcription"}
            className="p-1.5 rounded-md hover:bg-slate-600 text-slate-300 hover:text-sky-300 transition-colors flex items-center gap-1 text-xs font-medium flex-shrink-0"
            aria-label="Copy transcription to clipboard"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download as .txt file"
            className="p-1.5 rounded-md hover:bg-slate-600 text-slate-300 hover:text-sky-300 transition-colors flex items-center gap-1 text-xs font-medium flex-shrink-0"
            aria-label="Download transcription as text file"
          >
            {downloaded ? <Check size={16} className="text-emerald-400" /> : <Download size={16} />}
            <span className="hidden md:inline">{downloaded ? 'Saved' : 'Download'}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 sm:p-6 rounded-xl shadow-inner max-h-[50vh] sm:max-h-[60vh] overflow-y-auto scroll-smooth border border-slate-700/50">
        <div className="text-slate-300 text-sm sm:text-base leading-relaxed break-words selection:bg-sky-500 selection:text-white">
          {formattedText}
        </div>
      </div>

      {hasTimestamps && (
        <p className="text-xs text-slate-500 mt-2 italic px-1">
          * Click any timestamp button to jump directly to that moment in the audio player.
        </p>
      )}
    </div>
  );
};
