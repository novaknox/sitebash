'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Play, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InputSection() {
  const store = useAppStore();
  const [duplicateUrls, setDuplicateUrls] = React.useState<string[]>([]);
  const [showDuplicates, setShowDuplicates] = React.useState(false);

  const handleFindDuplicates = () => {
    const urls = store.urlsInput.split('\n').map(u => u.trim()).filter(Boolean);
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    
    urls.forEach(url => {
      if (seen.has(url)) {
        duplicates.add(url);
      } else {
        seen.add(url);
      }
    });
    
    setDuplicateUrls(Array.from(duplicates));
    setShowDuplicates(true);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Optionally we can sanitize or parse paste, but the raw input is fine.
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 md:p-8 w-full transition-all duration-300">
      <div className="mb-6">
        <label htmlFor="urls" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Enter URLs (one per line)
        </label>
        <textarea
          id="urls"
          className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all duration-200 text-sm font-mono text-slate-800 dark:text-slate-200"
          placeholder="https://example.com&#10;https://google.com"
          value={store.urlsInput}
          onChange={(e) => {
            store.setUrlsInput(e.target.value);
            if (showDuplicates) setShowDuplicates(false);
          }}
          disabled={store.isChecking}
        />
        <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{store.urlsInput.split('\n').filter(u => u.trim()).length} URLs</span>
          <button 
            type="button" 
            onClick={handleFindDuplicates}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Find Duplicates
          </button>
        </div>

        {showDuplicates && duplicateUrls.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-400 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="font-semibold mb-2 flex items-center justify-between">
              <span>Found {duplicateUrls.length} duplicate URL(s):</span>
              <button onClick={() => setShowDuplicates(false)} className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 transition-colors">Dismiss</button>
            </div>
            <ul className="list-disc pl-5 max-h-32 overflow-y-auto space-y-1">
              {duplicateUrls.map((url, i) => (
                <li key={i} className="truncate" title={url}>{url}</li>
              ))}
            </ul>
          </div>
        )}
        
        {showDuplicates && duplicateUrls.length === 0 && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-800 dark:text-emerald-400 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-200">
            <span>No duplicate URLs found!</span>
            <button onClick={() => setShowDuplicates(false)} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Dismiss</button>
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Authentication (Optional)</h3>
        </div>
        
        <div className="flex gap-4 mb-4">
          {['none', 'basic', 'bearer'].map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="authType"
                value={type}
                checked={store.authType === type}
                onChange={() => store.setAuthType(type as any)}
                disabled={store.isChecking}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{type}</span>
            </label>
          ))}
        </div>

        {store.authType === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <input
              type="text"
              placeholder="Username"
              value={store.basicUsername}
              onChange={(e) => store.setBasicUsername(e.target.value)}
              disabled={store.isChecking}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
            <input
              type="password"
              placeholder="Password"
              value={store.basicPassword}
              onChange={(e) => store.setBasicPassword(e.target.value)}
              disabled={store.isChecking}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
        )}

        {store.authType === 'bearer' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <input
              type="text"
              placeholder="Bearer Token / API Key"
              value={store.bearerToken}
              onChange={(e) => store.setBearerToken(e.target.value)}
              disabled={store.isChecking}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          </div>
        )}
      </div>

      <div className="mb-8 flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={store.checkSeo}
            onChange={(e) => store.setCheckSeo(e.target.checked)}
            disabled={store.isChecking}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Check Basic SEO Score (Slower)
          </span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={store.checkResponsive}
            onChange={(e) => store.setCheckResponsive(e.target.checked)}
            disabled={store.isChecking}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Check Responsiveness Score (Mobile-Friendly Heuristics)
          </span>
        </label>
      </div>

      {store.globalError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={18} />
          <span>{store.globalError}</span>
        </div>
      )}

      <button
        onClick={store.checkUrls}
        disabled={store.isChecking || !store.urlsInput.trim()}
        className={cn(
          "w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
          store.isChecking && "animate-pulse"
        )}
      >
        {store.isChecking ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking URLs...
          </>
        ) : (
          <>
            <Play size={18} />
            Check Reachability
          </>
        )}
      </button>
    </div>
  );
}
