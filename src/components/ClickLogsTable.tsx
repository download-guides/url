import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Search, 
  Smartphone, 
  Monitor, 
  Tablet, 
  ExternalLink, 
  Globe, 
  Filter,
  ArrowRight
} from 'lucide-react';
import { ClickLogEntry, RedirectLink } from '../types/redirect';

interface ClickLogsTableProps {
  logs: ClickLogEntry[];
  links: RedirectLink[];
  onRefreshLogs: () => Promise<void>;
}

export const ClickLogsTable: React.FC<ClickLogsTableProps> = ({
  logs,
  links,
  onRefreshLogs,
}) => {
  const [filterLinkId, setFilterLinkId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        onRefreshLogs();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, onRefreshLogs]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshLogs();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLinkId !== 'all' && log.linkId !== filterLinkId && log.slug !== filterLinkId) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchSlug = log.slug?.toLowerCase().includes(q);
      const matchDest = log.destinationUrl?.toLowerCase().includes(q);
      const matchIp = log.ip?.toLowerCase().includes(q);
      const matchCountry = log.country?.toLowerCase().includes(q);
      const matchQuery = Object.entries(log.incomingQuery || {}).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
      );
      return matchSlug || matchDest || matchIp || matchCountry || matchQuery;
    }
    return true;
  });

  const getDeviceIcon = (device?: string) => {
    if (device === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
    if (device === 'tablet') return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
    return <Monitor className="w-3.5 h-3.5 text-slate-300" />;
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Live Redirection Traffic Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time log of every ad click routed through DivertFlow, with preserved UTM tracking tags and exact landing destinations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Auto-Refresh (5s)</span>
          </label>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterLinkId}
            onChange={(e) => setFilterLinkId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-64"
          >
            <option value="all">All Campaign Links ({logs.length} clicks)</option>
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                /r/{link.slug} — {link.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search UTM, IP, slug, or target..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Campaign Link</th>
                <th className="py-3 px-4">Device & Geo</th>
                <th className="py-3 px-4">Forwarded Ad UTMs</th>
                <th className="py-3 px-4">Diverted Destination</th>
                <th className="py-3 px-4 text-right">HTTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const queryKeys = Object.keys(log.incomingQuery || {});
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Time */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="block text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Slug / Link */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded text-[11px]">
                          /r/{log.slug}
                        </span>
                        {log.ruleMatched && (
                          <span className="block text-[10px] text-slate-400 mt-1 truncate max-w-[150px]" title={log.ruleMatched}>
                            {log.ruleMatched}
                          </span>
                        )}
                      </td>

                      {/* Device & Country */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(log.device)}
                          <span className="capitalize">{log.device}</span>
                          <span className="text-slate-500">•</span>
                          <span className="font-mono text-slate-400">{log.country}</span>
                        </div>
                        <span className="block text-[10px] text-slate-500 mt-0.5 font-mono">
                          {log.ip}
                        </span>
                      </td>

                      {/* Preserved UTMs */}
                      <td className="py-3 px-4">
                        {queryKeys.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {queryKeys.slice(0, 3).map((k) => (
                              <span key={k} className="bg-slate-800 text-[10px] text-slate-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[140px]" title={`${k}=${log.incomingQuery[k]}`}>
                                {k}={log.incomingQuery[k]}
                              </span>
                            ))}
                            {queryKeys.length > 3 && (
                              <span className="text-[10px] text-cyan-400 font-mono">+{queryKeys.length - 3} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">None (Direct)</span>
                        )}
                      </td>

                      {/* Diverted Target */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-300 truncate" title={log.destinationUrl}>
                          <span className="truncate">{log.destinationUrl}</span>
                          <a
                            href={log.destinationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-emerald-400 shrink-0 ml-1"
                            title="Visit Destination"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          {log.statusCode || 302}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                    No clicks match the current filter. Try clicking one of your links to record traffic!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
