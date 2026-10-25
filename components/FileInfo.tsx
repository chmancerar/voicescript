import React from 'react';
import { FileAudio, X, Clock, HardDrive } from 'lucide-react';
import { formatBytes } from '../constants';

interface FileInfoProps {
  fileName: string;
  fileSize: number;
  durationFormatted?: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export const FileInfo: React.FC<FileInfoProps> = ({
  fileName,
  fileSize,
  durationFormatted,
  onClear,
  disabled = false,
}) => {
  return (
    <div className="my-3 p-3.5 sm:p-4 bg-slate-900/80 border border-slate-700/70 rounded-2xl shadow-lg flex items-center justify-between gap-3">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex-shrink-0">
          <FileAudio className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold text-slate-100 truncate max-w-[220px] sm:max-w-md"
            title={fileName}
          >
            {fileName}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
            <span className="inline-flex items-center gap-1">
              <HardDrive size={12} className="text-slate-500" />
              {formatBytes(fileSize)}
            </span>
            {durationFormatted && (
              <span className="inline-flex items-center gap-1 text-sky-300">
                <Clock size={12} className="text-sky-400" />
                {durationFormatted}
              </span>
            )}
          </div>
        </div>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={onClear}
          title="Remove audio file"
          aria-label="Remove audio file"
          className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 cursor-pointer flex-shrink-0"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};
