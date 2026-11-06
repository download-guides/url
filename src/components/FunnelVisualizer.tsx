import React, { useState } from 'react';
import { 
  ArrowRight, 
  Shuffle, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Edit3, 
  Globe, 
  ShieldCheck, 
  Plus, 
  Trash2,
  Play
} from 'lucide-react';
import { RedirectLink, FunnelHop } from '../types/redirect';
import { validateUrl } from '../utils/routingEngine';

interface FunnelVisualizerProps {
  links: RedirectLink[];
  baseUrl: string;
  onUpdateLink: (link: RedirectLink) => Promise<void>;
  onOpenQuickDivert: (link: RedirectLink) => void;
  onOpenSimulator: (link: RedirectLink) => void;
}

export const FunnelVisualizer: React.FC<FunnelVisualizerProps> = ({
  links,
  baseUrl,
  onUpdateLink,
  onOpenQuickDivert,
  onOpenSimulator,
}) => {
  const [selectedLinkId, setSelectedLinkId] = useState<string>(links[0]?.id || '');
  const selectedLink = links.find((l) => l.id === selectedLinkId) || links[0];

  const [editingHopIndex, setEditingHopIndex] = useState<number | null>(null);
  const [hopUrlInput, setHopUrlInput] = useState('');
  const [hopLabelInput, setHopLabelInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!selectedLink) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No links available to visualize. Create a dynamic link first.
      </div>
    );
  }

  // Ensure default funnel hops exist if not defined
  const hops: FunnelHop[] = selectedLink.funnelHops && selectedLink.funnelHops.length > 0
    ? selectedLink.funnelHops
    : [
        {
          id: 'h1',
          label: 'Ad Platform (e.g. abc.com)',
          role: 'ad_source',
          url: 'https://ads.abc.com/campaign-id',
          description: 'Ad Network where the campaign is running',
        },
        {
          id: 'h2',
          label: 'DivertFlow Router',
          role: 'router',
          url: `${baseUrl}/r/${selectedLink.slug}`,
          description: 'Dynamic immortal redirect link in ad',
        },
        {
          id: 'h3',
          label: 'Intermediate Bridge (e.g. bca.com)',
          role: 'intermediate_bridge',
          url: 'https://example-bca.com/landing',
          description: 'Pre-lander or review page',
        },
        {
          id: 'h4',
          label: 'Final Target Offer (e.g. cab.com)',
          role: 'final_destination',
          url: selectedLink.primaryUrl,
          description: 'Current live destination',
        },
      ];

  const handleStartEditHop = (index: number) => {
    setEditingHopIndex(index);
    setHopUrlInput(hops[index].url);
    setHopLabelInput(hops[index].label);
  };

  const handleSaveHop = async () => {
    if (editingHopIndex === null) return;

    const updatedHops = [...hops];
    updatedHops[editingHopIndex] = {
      ...updatedHops[editingHopIndex],
      label: hopLabelInput.trim() || updatedHops[editingHopIndex].label,
      url: hopUrlInput.trim(),
    };

    // If we changed the final destination hop, update selectedLink.primaryUrl as well!
    const isFinal = updatedHops[editingHopIndex].role === 'final_destination';

    const updatedLink: RedirectLink = {
      ...selectedLink,
      funnelHops: updatedHops,
      primaryUrl: isFinal ? hopUrlInput.trim() : selectedLink.primaryUrl,
    };

    await onUpdateLink(updatedLink);
    setEditingHopIndex(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-cyan-400" />
            <span>Interactive Multi-Hop Funnel Visualizer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize the exact flow you described: <span className="text-cyan-300 font-mono">abc.com (Ads) ➔ /r/{selectedLink.slug} ➔ bca.com (Bridge) ➔ cab.com (Target)</span>
          </p>
        </div>

        {/* Campaign Link Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="funnel-select" className="text-xs text-slate-400 font-medium">Select Link:</label>
          <select
            id="funnel-select"
            value={selectedLinkId}
            onChange={(e) => setSelectedLinkId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                {link.title} (/r/{link.slug})
              </option>
            ))}
          </select>

          <button
            onClick={() => onOpenQuickDivert(selectedLink)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Divert Target</span>
          </button>
        </div>
      </div>

      {/* Visual Chain Nodes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Campaign Traffic Route</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-cyan-400 border border-blue-500/30">
              4-Stage Funnel
            </span>
          </div>
          <button
            onClick={() => onOpenSimulator(selectedLink)}
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Test Redirection Chain in Simulator</span>
          </button>
        </div>

        {/* Nodes Grid / Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {hops.map((hop, idx) => {
            const isEditing = editingHopIndex === idx;
            const isAdSource = hop.role === 'ad_source';
            const isRouter = hop.role === 'router';
            const isBridge = hop.role === 'intermediate_bridge';
            const isDestination = hop.role === 'final_destination';

            return (
              <div
                key={hop.id || idx}
                className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  isDestination
                    ? 'bg-gradient-to-b from-emerald-950/30 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                    : isRouter
                    ? 'bg-gradient-to-b from-blue-950/30 to-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                    : isBridge
                    ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Step badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isDestination
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isRouter
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    Hop {idx + 1}: {isAdSource ? 'Source' : isRouter ? 'Dynamic Router' : isBridge ? 'Bridge' : 'Target'}
                  </span>

                  {!isRouter && !isEditing && (
                    <button
                      onClick={() => handleStartEditHop(idx)}
                      title="Edit this node URL"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      aria-label={`Edit ${hop.label}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Node Title & Description */}
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-white">{hop.label}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{hop.description}</p>
                </div>

                {/* Node URL display or edit */}
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      value={hopLabelInput}
                      onChange={(e) => setHopLabelInput(e.target.value)}
                      placeholder="Node label"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={hopUrlInput}
                      onChange={(e) => setHopUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveHop}
                        className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingHopIndex(null)}
                        className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto pt-2">
                    <div className={`p-2 rounded text-xs font-mono break-all ${
                      isRouter ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40' : 'bg-slate-950 text-slate-300 border border-slate-800'
                    }`}>
                      {hop.url}
                    </div>
                  </div>
                )}

                {/* Indicator icon at bottom */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  {isRouter && (
                    <span className="text-cyan-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Never breaks in Ads
                    </span>
                  )}
                  {isDestination && (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Live Divert Target
                    </span>
                  )}
                  {isBridge && (
                    <span className="text-slate-400">
                      Can be edited or bypassed
                    </span>
                  )}
                  {isAdSource && (
                    <span className="text-slate-400">
                      Ad clicks enter here
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Success toast */}
        {saveSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Funnel chain node updated successfully!</span>
          </div>
        )}

        {/* Explanation Card */}
        <div className="mt-6 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>How This Solves Your Use Case:</span>
          </div>
          <p>
            1. <strong>Ad Campaign (abc.com)</strong>: In Google Ads, Meta Ads, or TikTok, you enter the DivertFlow Tracking URL (<code className="text-cyan-300">{baseUrl}/r/{selectedLink.slug}</code>).
          </p>
          <p>
            2. <strong>Original Bridge (bca.com)</strong>: Visitors used to be sent to your intermediate article or bridge page.
          </p>
          <p>
            3. <strong>Instant Divert to New Offer (cab.com)</strong>: Whenever you want to switch campaigns, test a new product, or replace an expired offer, you simply click <strong>"Quick Divert"</strong> and paste <code className="text-emerald-300 font-mono">https://cab.com</code>.
          </p>
          <p>
            4. <strong>Result</strong>: Your ad campaign continues running without pause, <strong>no ad re-approval delay</strong>, and all traffic instantly lands on your new destination URL with all UTM tags safely forwarded!
          </p>
        </div>
      </div>
    </div>
  );
};
