import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, Key, Check } from 'lucide-react';
import { Button } from './Button';

interface ApiKeyWarningProps {
  onSaveKey?: (key: string) => void;
}

export const ApiKeyWarning: React.FC<ApiKeyWarningProps> = ({ onSaveKey }) => {
  const [inputKey, setInputKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim() && onSaveKey) {
      onSaveKey(inputKey.trim());
      setSaved(true);
    }
  };

  return (
    <div className="mt-4 p-6 bg-slate-900/90 border border-yellow-500/60 text-yellow-200 rounded-xl shadow-xl flex flex-col items-center text-center">
      <div className="p-3 bg-yellow-500/20 rounded-full mb-3 text-yellow-400">
        <AlertTriangle className="w-10 h-10" />
      </div>

      <h3 className="text-xl font-bold text-yellow-100 mb-2">
        Gemini API Key Required
      </h3>

      <p className="text-sm text-slate-300 max-w-lg mb-4 leading-relaxed">
        VoiceScript uses Google Gemini 3.8 to transcribe audio and evaluate language proficiency.
        Enter your Gemini API key below to start using the app, or set <code className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded font-mono text-xs">GEMINI_API_KEY</code> in your <code className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> file.
      </p>

      {/* Inline Key Input Form */}
      {onSaveKey && (
        <form onSubmit={handleSave} className="w-full max-w-md mb-5">
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="relative w-full">
              <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Paste AI Studio API Key (AIzaSy...)"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={!inputKey.trim()}
              className="w-full sm:w-auto !py-2 !px-5 text-sm !rounded-lg whitespace-nowrap !bg-yellow-400 hover:!bg-yellow-300 text-slate-900 font-bold"
            >
              {saved ? <Check size={18} className="inline mr-1" /> : null}
              {saved ? 'Saved' : 'Save Key'}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-left">
            Your key is stored only in your local browser storage and sent directly to Google Gemini API.
          </p>
        </form>
      )}

      <a
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline"
      >
        Get a free API Key at Google AI Studio <ExternalLink size={14} className="ml-1" />
      </a>
    </div>
  );
};