import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, FileAudio } from 'lucide-react';
import {
  SUPPORTED_AUDIO_TYPES,
  SUPPORTED_AUDIO_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  formatBytes
} from '../constants';

interface AudioUploaderProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  currentFile: File | null;
}

const FORMAT_BADGES = ['MP3', 'WAV', 'M4A', 'FLAC', 'OGG', 'AAC'];

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelect, disabled, currentFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileSelect(file);
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (disabled) return;

    const file = event.dataTransfer.files?.[0] || null;
    onFileSelect(file);
  }, [onFileSelect, disabled]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLLabelElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const acceptAttribute = [...SUPPORTED_AUDIO_TYPES, ...SUPPORTED_AUDIO_EXTENSIONS].join(',');

  // Compact replace-file bar when a file is already selected
  if (currentFile) {
    return (
      <div className="mb-4">
        <label
          htmlFor="audio-upload"
          tabIndex={disabled ? -1 : 0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed rounded-xl text-xs font-medium transition-all cursor-pointer ${
            dragOver
              ? 'border-sky-400 bg-sky-500/10 text-sky-300'
              : 'border-slate-700/80 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          <UploadCloud size={15} className="text-sky-400" />
          <span>Click or drop another audio file to replace</span>
          <input
            ref={fileInputRef}
            id="audio-upload"
            type="file"
            accept={acceptAttribute}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label
        htmlFor="audio-upload"
        tabIndex={disabled ? -1 : 0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        className={`
          group relative flex flex-col items-center justify-center w-full py-10 px-6 
          border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-300 ease-out outline-none overflow-hidden
          focus:ring-2 focus:ring-sky-400 focus:border-sky-400
          ${
            disabled
              ? 'bg-slate-900/40 opacity-50 cursor-not-allowed border-slate-800'
              : dragOver
              ? 'border-sky-400 bg-sky-500/10 scale-[1.01] shadow-xl shadow-sky-500/10'
              : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-700/80 hover:border-sky-500/60'
          }
        `}
      >
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div
            className={`p-4 rounded-2xl mb-4 transition-all duration-300 border ${
              dragOver && !disabled
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 scale-110'
                : 'bg-slate-800/90 border-slate-700/80 text-sky-400 group-hover:scale-105 group-hover:border-sky-500/40 group-hover:bg-sky-500/15'
            }`}
          >
            {dragOver ? <FileAudio className="w-9 h-9" /> : <UploadCloud className="w-9 h-9" />}
          </div>

          <p className="text-base sm:text-lg font-semibold text-slate-100">
            <span className="text-sky-400 group-hover:underline">Choose an audio file</span> or drag &amp; drop here
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Maximum file size: <span className="font-mono text-slate-300">{formatBytes(MAX_FILE_SIZE_BYTES)}</span>
          </p>

          {/* Supported Format Pills */}
          <div className="mt-4 flex items-center justify-center flex-wrap gap-1.5">
            {FORMAT_BADGES.map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/70 text-[11px] font-mono text-slate-300"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>

        <input
          ref={fileInputRef}
          id="audio-upload"
          type="file"
          accept={acceptAttribute}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </label>
    </div>
  );
};
