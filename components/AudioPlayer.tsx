
import React, { forwardRef } from 'react';
import { PlayCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({ src, onTimeUpdate, onLoadedMetadata }, ref) => {
  if (!src) return null;

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (onTimeUpdate) {
      onTimeUpdate(e.currentTarget.currentTime);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (onLoadedMetadata) {
      onLoadedMetadata(e.currentTarget.duration);
    }
  };

  return (
    <div className="mt-8" aria-label="Audio Playback Controls">
      <h3 className="text-xl font-semibold mb-3 text-sky-400 flex items-center">
        <PlayCircle size={24} className="mr-2 flex-shrink-0" />
        Audio Playback
      </h3>
      <div className="bg-slate-900 p-3 sm:p-4 rounded-lg shadow-inner border border-slate-700/50">
        <audio
          ref={ref}
          controls
          src={src}
          className="w-full"
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';
