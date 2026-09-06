import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import {
  SUPPORTED_AUDIO_TYPES,
  SUPPORTED_AUDIO_EXTENSIONS,
  SUPPORTED_AUDIO_EXTENSIONS_DISPLAY,
  MAX_FILE_SIZE_BYTES,
  formatBytes
} from '../constants';

interface AudioUploaderProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  currentFile: File | null;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelect, disabled }) => {
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

  return (
    <div className="mb-6">
      <label
        htmlFor="audio-upload"
        tabIndex={disabled ? -1 : 0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        className={`
          flex flex-col items-center justify-center w-full h-48 px-4 
          border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-200 ease-in-out outline-none
          focus:ring-2 focus:ring-sky-400 focus:border-sky-400
          ${disabled ? 'bg-slate-800/50 opacity-50 cursor-not-allowed border-slate-700' : 'bg-slate-700/60 hover:bg-slate-700 hover:border-sky-400'}
          ${dragOver && !disabled ? 'border-sky-400 bg-slate-600/80 scale-[1.01]' : 'border-slate-600'}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadCloud className={`w-12 h-12 mb-3 transition-colors duration-200 ${dragOver && !disabled ? 'text-sky-300' : 'text-sky-400'}`} />
          <p className={`mb-2 text-sm md:text-base font-medium ${dragOver && !disabled ? 'text-sky-200' : 'text-slate-200'}`}>
            <span className="font-semibold text-sky-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-400">
            {SUPPORTED_AUDIO_EXTENSIONS_DISPLAY} (Max. {formatBytes(MAX_FILE_SIZE_BYTES)})
          </p>
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
