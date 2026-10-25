import React, { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Gauge } from 'lucide-react';
import { formatDuration } from '../constants';

interface AudioPlayerProps {
  src: string;
  fileName?: string;
  compact?: boolean;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ src, fileName, compact = false, onTimeUpdate, onLoadedMetadata }, forwardedRef) => {
    const internalAudioRef = useRef<HTMLAudioElement>(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    // Expose the underlying HTMLAudioElement to parent ref
    useImperativeHandle(forwardedRef, () => internalAudioRef.current as HTMLAudioElement);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    // Reset state when src changes
    useEffect(() => {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setPlaybackRate(1);
    }, [src]);

    // High-precision playhead synchronization (~30fps via requestAnimationFrame while playing)
    // Native HTML5 timeupdate only fires every ~250-300ms, causing noticeable highlight lag.
    useEffect(() => {
      if (!isPlaying) return;

      let animationFrameId: number;
      let lastReportedTime = -1;

      const tick = () => {
        const audio = internalAudioRef.current;
        if (audio && !audio.paused) {
          const now = audio.currentTime;
          // Update when playhead advances by >= 30ms for smooth, low-overhead sync
          if (Math.abs(now - lastReportedTime) >= 0.03) {
            lastReportedTime = now;
            setCurrentTime(now);
            onTimeUpdateRef.current?.(now);
          }
          animationFrameId = requestAnimationFrame(tick);
        }
      };

      animationFrameId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, [isPlaying]);

    if (!src) return null;

    const togglePlay = () => {
      const audio = internalAudioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio.play().catch((err) => console.warn('Playback failed:', err));
      } else {
        audio.pause();
      }
    };

    const skipBy = (deltaSeconds: number) => {
      const audio = internalAudioRef.current;
      if (!audio) return;
      const nextTime = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + deltaSeconds));
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
      onTimeUpdate?.(nextTime);
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value);
      const audio = internalAudioRef.current;
      if (audio && !isNaN(newTime)) {
        audio.currentTime = newTime;
      }
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    };

    const cyclePlaybackRate = () => {
      const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
      const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
      setPlaybackRate(nextRate);
      if (internalAudioRef.current) {
        internalAudioRef.current.playbackRate = nextRate;
      }
    };

    const toggleMute = () => {
      const audio = internalAudioRef.current;
      if (!audio) return;
      audio.muted = !audio.muted;
      setIsMuted(audio.muted);
    };

    const handleTimeUpdateInternal = (e: React.SyntheticEvent<HTMLAudioElement>) => {
      // Fallback for seeks or when paused
      if (!isPlaying) {
        const time = e.currentTarget.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    };

    const handleLoadedMetadataInternal = (e: React.SyntheticEvent<HTMLAudioElement>) => {
      const dur = e.currentTarget.duration;
      if (!isNaN(dur) && dur > 0 && dur !== Infinity) {
        setDuration(dur);
        onLoadedMetadata?.(dur);
      }
    };

    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
      <div
        className={`w-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl shadow-xl transition-all ${
          compact ? 'p-3' : 'p-4'
        }`}
        aria-label="Audio Playback Controls"
      >
        {/* Hidden native audio element driving playback */}
        <audio
          ref={internalAudioRef}
          src={src}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdateInternal}
          onLoadedMetadata={handleLoadedMetadataInternal}
        />

        <div className="flex flex-col gap-2.5">
          {/* Top Row: Controls + Scrubber + Speed/Mute */}
          <div className="flex items-center gap-3">
            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 transition-all transform active:scale-95 flex-shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
            </button>

            {/* Skip -5s / +5s */}
            <div className="hidden xs:flex sm:flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => skipBy(-5)}
                title="Rewind 5 seconds"
                aria-label="Rewind 5 seconds"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => skipBy(5)}
                title="Forward 5 seconds"
                aria-label="Forward 5 seconds"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCw size={16} />
              </button>
            </div>

            {/* Scrubber & Timestamps */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 px-0.5">
                <span className="text-sky-300 font-semibold">{formatDuration(currentTime)}</span>
                {fileName && !compact && (
                  <span className="truncate max-w-[180px] sm:max-w-[260px] text-slate-400 font-sans text-xs">
                    {fileName}
                  </span>
                )}
                <span>{duration > 0 ? formatDuration(duration) : '--:--'}</span>
              </div>

              <div className="relative w-full h-2 flex items-center group">
                {/* Track background */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {/* Range Input Overlay */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.05}
                  value={currentTime}
                  onChange={handleSeekChange}
                  aria-label="Seek audio position"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Playback Speed & Mute */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={cyclePlaybackRate}
                title="Change playback speed"
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                  playbackRate !== 1
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Gauge size={13} className="hidden sm:inline text-sky-400" />
                <span>{playbackRate}x</span>
              </button>

              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX size={17} className="text-rose-400" /> : <Volume2 size={17} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';
