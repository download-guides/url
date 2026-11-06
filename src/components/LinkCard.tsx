import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Zap, 
  Settings2, 
  Trash2, 
  QrCode, 
  Terminal, 
  Globe, 
  Smartphone, 
  Shuffle, 
  Layers, 
  Clock, 
  MousePointerClick,
  ArrowRight
} from 'lucide-react';
import { RedirectLink } from '../types/redirect';

interface LinkCardProps {
  link: RedirectLink;
  baseUrl: string;
  onOpenQuickDivert: (link: RedirectLink) => void;
  onOpenEditModal: (link: RedirectLink) => void;
  onOpenQrModal: (link: RedirectLink) => void;
  onOpenSimulator: (link: RedirectLink) => void;
  onToggleStatus: (link: RedirectLink) => void;
  onDeleteLink: (linkId: string) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  baseUrl,
  onOpenQuickDivert,
  onOpenEditModal,
  onOpenQrModal,
  onOpenSimulator,
  onToggleStatus,
  onDeleteLink,
}) => {
  const [copied, setCopied] = useState(false);
  const routerUrl = `${baseUrl}/r/${link.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(routerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = link.status === 'active';

  return (
    <div className={`bg-slate-900 border rounded-xl p-5 transition-all shadow-sm ${
      isActive ? 'border-slate-800 hover:border-slate-700' : 'border-amber-900/40 bg-slate-900/70'
    }`}>
      {/* Top row: Status toggle, Title, Tags, Menu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Status Toggle Button */}
          <button
            onClick={() => onToggleStatus(link)}
            title={isActive ? 'Click to Pause (diverts to fallback)' : 'Click to Activate link'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isActive ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            aria-label={`Toggle active status for ${link.title}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-base leading-snug">{link.title}</h3>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {isActive ? 'Active (Live 302)' : 'Paused'}
              </span>

              {link.enableRotator && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Shuffle className="w-3 h-3" /> Rotator
                </span>
              )}

              {link.conditionalRules && link.conditionalRules.length > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> {link.conditionalRules.length} Rule{link.conditionalRules.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {link.notes && <p className="text-xs text-slate-400 mt-0.5">{link.notes}</p>}
          </div>
        </div>

        {/* Right side stats */}
        <div className="flex items-center gap-3 text-xs text-slate-400 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <MousePointerClick className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">{link.totalClicks || 0}</span>
            <span className="text-slate-500">clicks</span>
          </div>
          {link.lastClickedAt && (
            <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(link.lastClickedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Middle row: The Router URL & The Instant Target URL */}
      <div className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Router Link (The URL you give to Ads / Affiliates) */}
        <div className="lg:col-span-5 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Ad / Campaign Tracking Link
            </span>
            <span className="text-[10px] text-slate-500">Put in Ads Manager</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={routerUrl}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-cyan-300 font-mono w-full focus:outline-none"
            />
            <button
              onClick={handleCopy}
              title="Copy tracking link"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
              aria-label={`Copy link for ${link.title}`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onOpenQrModal(link)}
              title="Generate QR code"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
              aria-label={`QR Code for ${link.title}`}
            >
              <QrCode className="w-4 h-4" />
            </button>
            <a
              href={routerUrl}
              target="_blank"
              rel="noreferrer"
              title="Test real redirect in new tab"
              className="p-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors shrink-0"
              aria-label={`Open redirect for ${link.title}`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Dynamic Divert Arrow Indicator */}
        <div className="hidden lg:flex lg:col-span-1 justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Instant Target Destination URL */}
        <div className="lg:col-span-6 bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Current Destination (Diverted Target)
            </span>
            <span className="text-[10px] text-slate-500">
              {link.urlHistory?.length ? `${link.urlHistory.length} diverts on record` : 'Original target'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono w-full truncate" title={link.primaryUrl}>
              {link.primaryUrl}
            </div>
            
            {/* The 1-Click Quick Divert Button */}
            <button
              onClick={() => onOpenQuickDivert(link)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium text-xs whitespace-nowrap transition-all shrink-0 hover:border-cyan-400"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Divert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Funnel chain mini preview if available */}
      {link.funnelHops && link.funnelHops.length > 2 && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400 scrollbar-none">
          <span className="text-slate-500 text-[10px] uppercase font-semibold shrink-0">Chain Flow:</span>
          {link.funnelHops.map((hop, index) => (
            <React.Fragment key={hop.id || index}>
              <span className={`px-2 py-0.5 rounded truncate max-w-[160px] font-mono text-[10px] ${
                hop.role === 'final_destination' 
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 font-semibold'
                  : hop.role === 'router'
                  ? 'bg-blue-950/40 text-cyan-300 border border-blue-800/60'
                  : 'bg-slate-800/60 text-slate-300'
              }`} title={`${hop.label}: ${hop.url}`}>
                {hop.label}
              </span>
              {index < link.funnelHops.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Card Footer Actions */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-slate-500">
            HTTP Code: <span className="font-mono text-slate-300">{link.redirectType || 302} (Temporary)</span>
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-slate-500 hidden sm:inline">
            UTM Forwarding: <span className="text-emerald-400 font-medium">{link.preserveQueryParams ? 'Preserved' : 'Off'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSimulator(link)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test / Simulate</span>
          </button>

          <button
            onClick={() => onOpenEditModal(link)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Rules & Splits</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete the router link /r/${link.slug}?`)) {
                onDeleteLink(link.id);
              }
            }}
            aria-label={`Delete router link /r/${link.slug}`}
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
