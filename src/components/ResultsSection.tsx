'use client';

import React, { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Copy, Download, CheckCircle2, XCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResultsSection() {
  const { results, isChecking } = useAppStore();

  const summary = useMemo(() => {
    const total = results.length;
    const reachable = results.filter(r => r.category === 'Reachable').length;
    const redirects = results.filter(r => r.category === 'Redirect').length;
    const clientErrors = results.filter(r => r.category === 'Client Error').length;
    const serverErrors = results.filter(r => r.category === 'Server Error').length;
    const unreachable = results.filter(r => r.category === 'Unreachable' || r.category === 'Invalid Format').length;
    const errors = clientErrors + serverErrors + unreachable;

    return { total, reachable, redirects, errors };
  }, [results]);

  if (results.length === 0 && !isChecking) return null;

  const handleCopyFailed = () => {
    const failedUrls = results
      .filter(r => r.category !== 'Reachable' && r.category !== 'Redirect')
      .map(r => r.url)
      .join('\n');
    
    if (failedUrls) {
      navigator.clipboard.writeText(failedUrls);
      // Optional: show a toast here
    }
  };

  const handleExportCsv = () => {
    if (results.length === 0) return;
    
    const headers = ['URL', 'Status Code', 'Category', 'Response Time (ms)', 'Error/Destination'];
    const csvContent = [
      headers.join(','),
      ...results.map(r => {
        const extra = r.destination ? r.destination : (r.error || '');
        // Escape quotes and wrap in quotes for CSV safety
        return `"${r.url}","${r.status}","${r.category}","${r.duration}","${extra.replace(/"/g, '""')}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `url_check_results_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'Reachable': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'Redirect': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'Client Error': 
      case 'Server Error': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getStatusIcon = (category: string) => {
    switch (category) {
      case 'Reachable': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'Redirect': return <ArrowRight size={16} className="text-blue-500" />;
      case 'Client Error':
      case 'Server Error': return <XCircle size={16} className="text-red-500" />;
      default: return <AlertTriangle size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total</span>
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.total}</span>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 flex flex-col items-center justify-center">
          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Reachable</span>
          <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{summary.reachable}</span>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/50 flex flex-col items-center justify-center">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Redirects</span>
          <span className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{summary.redirects}</span>
        </div>
        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50 flex flex-col items-center justify-center">
          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Errors / Unreachable</span>
          <span className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{summary.errors}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleCopyFailed}
          disabled={summary.errors === 0}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Copy size={16} />
          Copy Failed URLs
        </button>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Download size={16} />
          Export to CSV
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/2">URL</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((result, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs md:max-w-md lg:max-w-xl" title={result.url}>
                        {result.url}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.category)}
                      <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", getBadgeColor(result.category))}>
                        {result.status > 0 ? result.status : 'ERR'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock size={14} />
                      <span>{result.duration}ms</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {result.destination && (
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-400">Redirects to:</span>
                        <span className="text-blue-600 dark:text-blue-400 truncate max-w-[150px] md:max-w-xs" title={result.destination}>
                          {result.destination}
                        </span>
                      </div>
                    )}
                    {result.error && (
                      <span className="text-red-500" title={result.error}>
                        {result.error}
                      </span>
                    )}
                    {!result.destination && !result.error && (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
