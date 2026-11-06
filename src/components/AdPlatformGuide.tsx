import React from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Globe, 
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';

export const AdPlatformGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <span>Dynamic Ad Redirection & Traffic Routing Guide</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Master the exact strategy you described: run ads on Google/Meta, use an immortal tracking link, and divert traffic between intermediate pre-landers and final offers with zero ad disapproval risks.
        </p>
      </div>

      {/* The 4-Step Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-4">
          How Your Dynamic Redirection Architecture Works:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="font-bold text-cyan-400 text-sm block mb-1">Step 1: Ad Network</span>
            <p className="text-slate-300 font-semibold mb-1">abc.com Ad Campaign</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              You setup ads on Google Ads, Meta, TikTok, or Twitter. The URL you input in the ad is your DivertFlow Router link.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-cyan-800/60 bg-cyan-950/20">
            <span className="font-bold text-cyan-300 text-sm block mb-1">Step 2: DivertFlow</span>
            <p className="text-cyan-200 font-semibold mb-1">/r/your-campaign</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Incoming click hits this server in 15ms. It evaluates device, logs click, and forwards all UTM tags.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="font-bold text-slate-400 text-sm block mb-1">Step 3: Original Route</span>
            <p className="text-slate-300 font-semibold mb-1">bca.com (Pre-lander)</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Previously, traffic flowed to your bridge page, content article, or quiz pre-lander.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-emerald-800/60 bg-emerald-950/20">
            <span className="font-bold text-emerald-400 text-sm block mb-1">Step 4: Instant Divert</span>
            <p className="text-emerald-300 font-semibold mb-1">cab.com (Target Offer)</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              When you click <strong>"Quick Divert"</strong> in DivertFlow, traffic immediately routes directly to your new product or checkout!
            </p>
          </div>
        </div>
      </div>

      {/* Crucial Technical Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Why HTTP 302 vs 301 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Why 302 Temporary Redirect is Essential</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            A <strong>301 Permanent Redirect</strong> is cached aggressively by Chrome, Safari, and telecom ISPs for weeks. If you change a 301 URL, returning visitors might still go to the old URL because of browser cache!
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            DivertFlow automatically serves <strong>HTTP 302 with Cache-Control: no-store</strong>. This ensures that the exact millisecond you update a URL in your dashboard, the very next click goes to the brand new destination.
          </p>
        </div>

        {/* UTM Forwarding */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Lossless UTM & Ad Tracking Preservation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            When you run ads, ad platforms append critical attribution query parameters such as <code className="text-cyan-300 font-mono">?gclid=...</code> (Google Click ID) and <code className="text-cyan-300 font-mono">?fbclid=...</code> (Meta Click ID).
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            DivertFlow’s routing engine automatically extracts all incoming parameters and attaches them cleanly onto your diverted destination URL, ensuring your conversion tracking and pixels never miss a sale.
          </p>
        </div>
      </div>

      {/* Platform Setup Guidelines */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">How to Set Up on Major Ad Networks</h3>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-semibold text-white mb-1">Google Ads (Search & Performance Max)</div>
            <p className="text-slate-400 leading-relaxed">
              In Google Ads campaign settings, set the <strong>Tracking Template</strong> to <code className="text-cyan-300 font-mono">{'{lpurl}'}</code> or your DivertFlow redirect link with parameter suffix <code className="text-cyan-300 font-mono">{'{_custom}'}</code>. Or place the DivertFlow link directly into Final URL if using 302 temporary redirects.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-semibold text-white mb-1">Meta Ads (Facebook & Instagram)</div>
            <p className="text-slate-400 leading-relaxed">
              In Ads Manager, place your DivertFlow URL in the <strong>Website URL</strong> field. Whenever you switch the destination from <code className="text-slate-300 font-mono">bca.com</code> to <code className="text-emerald-300 font-mono">cab.com</code>, your Meta ad does <em>not</em> enter the 24-hour review process again because the ad URL itself never changed!
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-semibold text-white mb-1">Influencer / Telegram / SMS Broadcasts</div>
            <p className="text-slate-400 leading-relaxed">
              Never send raw affiliate or product links in broadcast messages. Distribute your DivertFlow link. If an affiliate offer goes out of stock or pauses, simply open DivertFlow and swap to a new offer in 2 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
