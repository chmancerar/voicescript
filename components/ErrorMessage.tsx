import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="mt-4 p-4 bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-100 text-sm">Transcription Error</h3>
          <p className="text-xs text-red-300 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <Button
          type="button"
          onClick={onRetry}
          variant="secondary"
          className="w-full sm:w-auto !py-1.5 !px-4 text-xs flex items-center justify-center gap-1.5 whitespace-nowrap !rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-100 border-red-700/50"
        >
          <RotateCcw size={14} />
          Retry
        </Button>
      )}
    </div>
  );
};