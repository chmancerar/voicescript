import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Download, Check, FileCode, Copy, Play, Search, X } from 'lucide-react';
import { SrtBlock } from '../types';
import { parseTimestampToSeconds } from '../constants';

interface SubtitlePreviewProps {
  srtContent: string;
  fileName: string;
  currentTime?: number;
  onTimestampClick?: (time: number) => void;
}

const parseSrtTimestamp = (timestamp: string): number => {
  const match = timestamp.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return parseTimestampToSeconds(timestamp);
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const secs = parseInt(match[3], 10);
  const msecs = parseInt(match[4], 10);
  return hours * 3600 + mins * 60 + secs + msecs / 1000;
};

export const SubtitlePreview: React.FC<SubtitlePreviewProps> = ({
  srtContent,
  fileName,
  currentTime = 0,
  onTimestampClick,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const activeBlockRef = useRef<HTMLDivElement>(null);

  const srtBlocks = useMemo(() => {
    const blocks: SrtBlock[] = [];
    const rawBlocks = srtContent.trim().split(/\n\s*\n/);

    rawBlocks.forEach((block) => {
      const lines = block.split('\n');
      if (lines.length >= 2) {
        const id = lines[0].trim();
        const timeMatch = lines[1].match(
          /(\d{2}:\d{2}:\d{2}[,. ]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,. ]\d{3})/
        );
        if (timeMatch) {
          const startTime = parseSrtTimestamp(timeMatch[1]);
          const endTime = parseSrtTimestamp(timeMatch[2]);
          const text = lines.slice(2).join('\n');
          blocks.push({ id, startTime, endTime, text, raw: block });
        }
      }
    });
    return blocks;
  }, [srtContent]);

  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return srtBlocks;
    const q = searchQuery.toLowerCase();
    return srtBlocks.filter(
      (b) => b.text.toLowerCase().includes(q) || b.raw.toLowerCase().includes(q)
    );
  }, [srtBlocks, searchQuery]);

  // Determine active subtitle cue with a 80ms speech-onset lead-in and tiny-gap bridging
  const activeBlockId = useMemo(() => {
    if (currentTime <= 0 || srtBlocks.length === 0) return null;
    const syncTime = currentTime + 0.08;

    for (let i = 0; i < srtBlocks.length; i++) {
      const block = srtBlocks[i];
      const nextBlock = srtBlocks[i + 1];
      // Bridge micro-gaps (< 250ms) between consecutive cues so highlight doesn't flicker
      const effectiveEnd =
        nextBlock && nextBlock.startTime - block.endTime <= 0.25
          ? nextBlock.startTime
          : block.endTime;

      if (syncTime >= block.startTime && syncTime <= effectiveEnd) {
        return block.id;
      }
    }
    return null;
  }, [currentTime, srtBlocks]);

  useEffect(() => {
    if (autoScroll && activeBlockRef.current && activeBlockId !== null) {
      activeBlockRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeBlockId, autoScroll]);

  const handleDownload = () => {
    const contentToSave = srtContent.trim() + '\n\n';
    const blob = new Blob([contentToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    a.download = `${baseName}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleCopy = useCallback(() => {
    if (srtContent) {
      navigator.clipboard
        .writeText(srtContent)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy SRT: ', err);
        });
    }
  }, [srtContent]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header & Uncrowded 2-Tier Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 space-y-3">
        {/* Top Row: Title + Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 flex-shrink-0">
              <FileCode size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
                SubRip (.SRT) Subtitle Timeline
              </h2>
              <p className="text-[11px] text-slate-400">
                Click any subtitle cue card to seek audio
              </p>
            </div>
          </div>

          {/* Action Buttons: Always fully visible, no clipping or scrollbars */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Auto-scroll toggle */}
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
                  ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-500/40'
                  : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  autoScroll ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span>Auto-scroll</span>
            </button>

            {/* Copy SRT */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy raw SRT content"
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-amber-300 border border-slate-700/80 transition-colors inline-flex items-center gap-1.5 text-xs font-medium flex-shrink-0 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download SRT */}
            <button
              type="button"
              onClick={handleDownload}
              title="Download .srt subtitle file"
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors inline-flex items-center gap-1.5 text-xs flex-shrink-0 cursor-pointer shadow-sm"
            >
              {downloaded ? <Check size={14} /> : <Download size={14} />}
              <span>{downloaded ? 'Saved' : 'Download .srt'}</span>
            </button>
          </div>
        </div>

        {/* Second Row: Dedicated Filter Input & Cue Counter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Filter subtitle cues by keyword or timecode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Clear filter"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400 flex-shrink-0 px-2 py-1 rounded-lg bg-slate-950/50 border border-slate-800/80">
            {searchQuery
              ? `${filteredBlocks.length} / ${srtBlocks.length} cues`
              : `${srtBlocks.length} ${srtBlocks.length === 1 ? 'cue' : 'cues'}`}
          </span>
        </div>
      </div>

      {/* Subtitle Cues List */}
      <div className="p-4 sm:p-5 max-h-[55vh] sm:max-h-[62vh] overflow-y-auto scroll-smooth space-y-2.5">
        {filteredBlocks.map((block) => {
          const isActive = activeBlockId === block.id;
          const cueDuration = Math.max(0.1, block.endTime - block.startTime).toFixed(1);

          return (
            <div
              key={block.id}
              ref={isActive ? activeBlockRef : null}
              onClick={() => onTimestampClick?.(block.startTime)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTimestampClick?.(block.startTime);
                }
              }}
              title="Click to jump audio to this subtitle cue"
              className={`group p-3.5 rounded-xl transition-all duration-200 cursor-pointer outline-none border ${
                isActive
                  ? 'bg-amber-400/15 border-amber-400/80 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    #{block.id}
                  </span>
                  <span
                    className={`font-mono text-xs ${
                      isActive ? 'text-amber-300 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {block.raw.split('\n')[1]}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>{cueDuration}s</span>
                  <Play
                    size={12}
                    className={`transition-transform group-hover:scale-110 ${
                      isActive ? 'text-amber-400 fill-amber-400' : 'opacity-40 group-hover:opacity-90'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed transition-colors ${
                  isActive ? 'text-white font-medium' : 'text-slate-200'
                }`}
              >
                {block.text}
              </div>
            </div>
          );
        })}

        {srtBlocks.length > 0 && filteredBlocks.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No subtitle cues match &ldquo;{searchQuery}&rdquo;.
          </div>
        )}

        {srtBlocks.length === 0 && (
          <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap p-2">
            {srtContent}
          </pre>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>SubRip (.srt) standard format</span>
        <span className="font-mono text-[11px] text-slate-400">
          {filteredBlocks.length} {filteredBlocks.length === 1 ? 'cue' : 'cues'}
        </span>
      </div>
    </div>
  );
};
