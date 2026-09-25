import { InputSection } from '@/components/InputSection';
import { ResultsSection } from '@/components/ResultsSection';
import { Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-2 shadow-sm">
            <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bulk URL Reachability Checker
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Quickly verify the status of multiple links simultaneously. Handles redirects, identifies broken URLs, and supports Basic or Bearer authentication securely.
          </p>
        </div>

        {/* Interactive Sections */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <InputSection />
          <ResultsSection />
        </div>

      </div>
    </main>
  );
}
