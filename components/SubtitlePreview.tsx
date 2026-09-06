import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Download, Check, FileCode, Copy, Play } from 'lucide-react';
import { Button } from './Button';
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
  const activeBlockRef = useRef<HTMLDivElement>(null);

  const srtBlocks = useMemo(() => {
    const blocks: SrtBlock[] = [];
    const rawBlocks = srtContent.trim().split(/\n\s*\n/);

    rawBlocks.forEach((block) => {
      const lines = block.split('\n');
      if (lines.length >= 2) {
        const id = lines[0].trim();
        const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2}[,. ]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,. ]\d{3})/);
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

  const activeBlockId = useMemo(() => {
    const active = srtBlocks.find((b) => currentTime >= b.startTime && currentTime <= b.endTime);
    return active ? active.id : null;
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
      navigator.clipboard.writeText(srtContent).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy SRT: ', err);
      });
    }
  }, [srtContent]);

  return (
    <div className="lg:mt-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
        <h2 className="text-2xl font-semibold text-yellow-400 flex items-center">
          <FileCode size={28} className="mr-3" />
          Subtitle Preview
        </h2>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Auto-scroll toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? "Auto-scroll is ON (click to pause)" : "Auto-scroll is OFF (click to follow audio)"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex-shrink-0 select-none ${
              autoScroll
                ? 'bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30 border border-yellow-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${autoScroll ? 'bg-yellow-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Auto-scroll</span>
          </button>

          {/* Copy SRT */}
          <Button
            type="button"
            onClick={handleCopy}
            variant="secondary"
            className="!py-2 !px-3 text-xs flex items-center gap-1.5 !rounded-lg"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy SRT'}
          </Button>

          {/* Download SRT */}
          <Button
            type="button"
            onClick={handleDownload}
            className="!bg-yellow-500 hover:!bg-yellow-400 focus:!ring-yellow-400 !py-2 !px-3 text-xs flex items-center gap-1.5 text-slate-900 font-bold !rounded-lg"
          >
            {downloaded ? <Check size={16} /> : <Download size={16} />}
            {downloaded ? 'Downloaded' : 'Download .srt'}
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl shadow-inner border border-slate-700/60 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto scroll-smooth">
        <div className="space-y-3">
          {srtBlocks.map((block) => {
            const isActive = activeBlockId === block.id;
            return (
              <div
                key={block.id}
                ref={isActive ? activeBlockRef : null}
                onClick={() => onTimestampClick?.(block.startTime)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onTimestampClick?.(block.startTime);
                  }
                }}
                title="Click to jump audio to this subtitle"
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer outline-none ${
                  isActive
                    ? 'bg-yellow-400/20 border-l-4 border-yellow-400 shadow-lg shadow-yellow-500/10 scale-[1.005]'
                    : 'bg-slate-800/40 border-l-4 border-transparent hover:bg-slate-800/80 hover:border-yellow-400/40'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5 text-xs text-slate-400">
                  <span className="font-mono font-semibold">#{block.id}</span>
                  <div className="flex items-center gap-1">
                    <span className={`font-mono ${isActive ? 'text-yellow-300 font-bold' : ''}`}>
                      {block.raw.split('\n')[1]}
                    </span>
                    <Play size={12} className={`ml-1 ${isActive ? 'text-yellow-400 fill-yellow-400' : 'opacity-40'}`} />
                  </div>
                </div>
                <div className={`whitespace-pre-wrap text-sm sm:text-base transition-colors ${isActive ? 'text-white font-medium' : 'text-slate-300'}`}>
                  {block.text}
                </div>
              </div>
            );
          })}

          {srtBlocks.length === 0 && (
            <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap p-2">
              {srtContent}
            </pre>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2 italic px-1">
        * Click any subtitle block to jump directly to that position in the audio player.
      </p>
    </div>
  );
};
