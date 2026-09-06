
import React from 'react';
import { FileAudio, XCircle } from 'lucide-react';

interface FileInfoProps {
  fileName: string;
  fileSize: number;
  onClear: () => void;
}

export const FileInfo = ({ fileName, fileSize, onClear }: FileInfoProps) => { // Removed React.FC, typed props
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-2 mb-6 p-4 bg-slate-700 rounded-lg shadow flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <FileAudio className="w-8 h-8 text-sky-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-slate-100 truncate max-w-xs sm:max-w-sm md:max-w-md" title={fileName}>
            {fileName}
          </p>
          <p className="text-xs text-slate-400">{formatFileSize(fileSize)}</p>
        </div>
      </div>
      <button
        onClick={onClear}
        title="Clear selection"
        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-slate-600"
      >
        <XCircle size={22} />
      </button>
    </div>
  );
};