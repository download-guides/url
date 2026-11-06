import React, { useState } from 'react';
import { 
  GitFork, 
  ExternalLink, 
  Plus, 
  Activity, 
  Copy, 
  Check, 
  Shuffle, 
  Terminal, 
  HelpCircle,
  Radio
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'links' | 'funnel' | 'simulator' | 'analytics' | 'guide';
  setActiveTab: (tab: 'links' | 'funnel' | 'simulator' | 'analytics' | 'guide') => void;
  onOpenCreateModal: () => void;
  baseUrl: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  baseUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyBase = () => {
    navigator.clipboard.writeText(`${baseUrl}/r/`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GitFork className="w-5 h-5 rotate-90 transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Divert<span className="text-cyan-400">Flow</span></span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Engine Live
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Dynamic URL Redirection & Traffic Routing</p>
            </div>
          </div>

          {/* Router Base URL chip */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">Router Endpoint:</span>
            <code className="text-cyan-300 font-mono font-medium">{baseUrl}/r/:slug</code>
            <button
              onClick={handleCopyBase}
              title="Copy base router link prefix"
              className="ml-1 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Dynamic Link</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800/60 py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('links')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'links'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Campaign Links & Targets</span>
          </button>

          <button
            onClick={() => setActiveTab('funnel')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'funnel'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>Multi-Hop Chain (abc ➔ bca ➔ cab)</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Redirect Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Click Stream & Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ad Platforms Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
