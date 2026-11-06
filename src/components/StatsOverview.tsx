import React from 'react';
import { MousePointerClick, ShieldCheck, Zap, Globe, Smartphone, Monitor, Tablet } from 'lucide-react';
import { RedirectLink } from '../types/redirect';

interface StatsOverviewProps {
  links: RedirectLink[];
  baseUrl: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ links, baseUrl }) => {
  const totalClicks = links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);
  const activeCount = links.filter((l) => l.status === 'active').length;
  const pausedCount = links.filter((l) => l.status === 'paused').length;
  
  // Total URL changes logged
  const totalDiverts = links.reduce((sum, l) => sum + (l.urlHistory?.length || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Clicks Diverted */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ad Clicks Routed</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <MousePointerClick className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{totalClicks.toLocaleString()}</span>
          <span className="text-xs text-emerald-400 font-medium">100% 302 Redirection</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Live incoming clicks forwarded with UTM preservation</p>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-60" />
      </div>

      {/* Active Campaign Links */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Routing Links</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{activeCount}</span>
          <span className="text-xs text-slate-400">/ {links.length} total</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>{activeCount} live</span>
          {pausedCount > 0 && (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-1" />
              <span>{pausedCount} paused (safely diverted)</span>
            </>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60" />
      </div>

      {/* Instant Zero-Downtime Diverts */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Zero-Delay Diverts</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{totalDiverts}</span>
          <span className="text-xs text-cyan-400 font-medium">0ms switch latency</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Any URL can be swapped instantly without modifying ads</p>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-60" />
      </div>

      {/* Traffic Preservation & Smart Routing */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Smart Distribution</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-300">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Mobile
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-300">
            <Monitor className="w-3.5 h-3.5 text-indigo-400" /> Desktop
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-300">
            <Tablet className="w-3.5 h-3.5 text-purple-400" /> Tablet
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">Auto UTM forwarding & split rotators active</p>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-60" />
      </div>
    </div>
  );
};
