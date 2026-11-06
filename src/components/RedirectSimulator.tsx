import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Smartphone, 
  Monitor, 
  Tablet, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { RedirectLink, DeviceType } from '../types/redirect';
import { resolveDestination, detectDevice } from '../utils/routingEngine';

interface RedirectSimulatorProps {
  links: RedirectLink[];
  baseUrl: string;
  initialLink?: RedirectLink | null;
}

export const RedirectSimulator: React.FC<RedirectSimulatorProps> = ({
  links,
  baseUrl,
  initialLink,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialLink?.slug || links[0]?.slug || 'ad-summer-promo'
  );
  const [device, setDevice] = useState<DeviceType>('mobile');
  const [country, setCountry] = useState<string>('IN');
  const [queryParamsText, setQueryParamsText] = useState<string>(
    'utm_source=google_ads\nutm_medium=cpc\nutm_campaign=summer_sale_2026\ngclid=EAIaIQobChMI96mO...'
  );
  const [referrer, setReferrer] = useState<string>('https://google.com/search?q=hot+deals');
  const [copied, setCopied] = useState(false);

  // Result state
  const [simResult, setSimResult] = useState<{
    destinationUrl: string;
    statusCode: number;
    ruleMatched: string;
    reason: string;
    fullIncomingUrl: string;
    preservedParams: Record<string, string>;
  } | null>(null);

  const selectedLink = links.find((l) => l.slug.toLowerCase() === selectedSlug.toLowerCase()) || links[0];

  const handleSimulate = () => {
    if (!selectedLink) return;

    // Parse query params text
    const queryParams: Record<string, string> = {};
    queryParamsText.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) {
        const [k, ...rest] = trimmed.split('=');
        if (k) {
          queryParams[k.trim()] = rest.join('=').trim();
        }
      }
    });

    const searchStr = new URLSearchParams(queryParams).toString();
    const fullIncomingUrl = `${baseUrl}/r/${selectedLink.slug}${searchStr ? `?${searchStr}` : ''}`;

    const routing = resolveDestination(selectedLink, {
      device,
      country,
      queryParams,
      referrer,
      userAgent: device === 'mobile' 
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        : device === 'tablet'
        ? 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
    });

    setSimResult({
      destinationUrl: routing.destinationUrl,
      statusCode: routing.statusCode,
      ruleMatched: routing.matchedRuleName,
      reason: routing.reason,
      fullIncomingUrl,
      preservedParams: queryParams,
    });
  };

  const handleCopyDest = () => {
    if (simResult?.destinationUrl) {
      navigator.clipboard.writeText(simResult.destinationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span>Live Redirect & Traffic Divert Simulator</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Test how incoming ad clicks from Google/Meta are routed, verify UTM parameter forwarding, and inspect the final destination URL before scaling ad budgets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Configuration Panel (Left) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
            Simulated Visitor Request
          </h3>

          {/* Select Link */}
          <div>
            <label htmlFor="sim-select-link" className="block text-xs font-semibold text-slate-300 mb-1">
              Select Router Campaign Link
            </label>
            <select
              id="sim-select-link"
              value={selectedSlug}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setSimResult(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {links.map((link) => (
                <option key={link.id} value={link.slug}>
                  /r/{link.slug} — {link.title} ({link.status})
                </option>
              ))}
            </select>
            {selectedLink && (
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                Target: <span className="font-mono text-cyan-300">{selectedLink.primaryUrl}</span>
              </p>
            )}
          </div>

          {/* Device Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Simulated Device
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                  device === 'mobile'
                    ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                  device === 'desktop'
                    ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setDevice('tablet')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                  device === 'tablet'
                    ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" /> Tablet
              </button>
            </div>
          </div>

          {/* Country Selection */}
          <div>
            <label htmlFor="sim-country" className="block text-xs font-semibold text-slate-300 mb-1">
              Simulated Geo Location (Country IP)
            </label>
            <select
              id="sim-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="IN">🇮🇳 India (IN)</option>
              <option value="US">🇺🇸 United States (US)</option>
              <option value="GB">🇬🇧 United Kingdom (GB)</option>
              <option value="CA">🇨🇦 Canada (CA)</option>
              <option value="AU">🇦🇺 Australia (AU)</option>
              <option value="GLOBAL">🌐 Global Default</option>
            </select>
          </div>

          {/* Ad Query Parameters */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="sim-query-params" className="text-xs font-semibold text-slate-300">
                Incoming Ad Query Params (key=value)
              </label>
              <button
                type="button"
                onClick={() => setQueryParamsText('utm_source=meta_ads\nutm_medium=reels\nfbclid=IwAR998822')}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Load Meta sample
              </button>
            </div>
            <textarea
              id="sim-query-params"
              rows={4}
              value={queryParamsText}
              onChange={(e) => setQueryParamsText(e.target.value)}
              placeholder="utm_source=google&#10;utm_campaign=summer_sale"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Action */}
          <button
            onClick={handleSimulate}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-cyan-500/10 transition-all active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Simulate Redirection Route</span>
          </button>
        </div>

        {/* Output & Trace Panel (Right) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Routing Engine Execution Trace
              </h3>
              {simResult && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Status HTTP {simResult.statusCode}
                </span>
              )}
            </div>

            {simResult ? (
              <div className="space-y-4">
                {/* Step 1: Incoming Ad Hit */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold text-cyan-400">1. Visitor Clicks Ad (Entry URL)</span>
                    <span className="text-[10px] text-slate-500">{device.toUpperCase()} • {country}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                    {simResult.fullIncomingUrl}
                  </div>
                </div>

                {/* Step 2: Evaluation */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="text-[11px] font-semibold text-cyan-400 mb-1">
                    2. Router Rule Decision
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 text-[11px] font-medium border border-blue-500/30">
                      {simResult.ruleMatched}
                    </span>
                    <span className="text-xs text-slate-400">{simResult.reason}</span>
                  </div>
                </div>

                {/* Step 3: Destination URL Output */}
                <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 p-4 rounded-xl border border-emerald-500/40 shadow-sm">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <CheckCircle2 className="w-4 h-4" /> 3. Final Diverted Destination URL
                    </span>
                    <span className="text-[11px] text-slate-400">
                      HTTP {simResult.statusCode} Temporary Redirect
                    </span>
                  </div>

                  <div className="text-sm font-mono text-emerald-300 break-all bg-slate-900 p-3 rounded-lg border border-emerald-900/40 mb-3">
                    {simResult.destinationUrl}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyDest}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Destination URL'}</span>
                    </button>

                    <a
                      href={simResult.destinationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Destination</span>
                    </a>

                    <a
                      href={simResult.fullIncomingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 text-xs border border-blue-500/30 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Real 302 Hit</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm text-slate-300 font-medium">No Simulation Run Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select your campaign link on the left, tweak device/query parameters, and click "Simulate Redirection Route".
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Cache-Control: <code className="text-slate-400">no-store, no-cache</code></span>
            <span>UTM Forwarding: <code className="text-cyan-400">lossless param merge</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
