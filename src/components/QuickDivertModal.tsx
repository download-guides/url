import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  History, 
  ShieldCheck 
} from 'lucide-react';
import { RedirectLink } from '../types/redirect';
import { validateUrl } from '../utils/routingEngine';

interface QuickDivertModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: RedirectLink | null;
  onSaveQuickDivert: (linkId: string, newUrl: string, reason: string) => Promise<void>;
}

export const QuickDivertModal: React.FC<QuickDivertModalProps> = ({
  isOpen,
  onClose,
  link,
  onSaveQuickDivert,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (link) {
      setNewUrl(link.primaryUrl);
      setReason('');
      setError(null);
      setSuccessMessage(null);
    }
  }, [link]);

  if (!isOpen || !link) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateUrl(newUrl);
    if (!validation.valid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    if (newUrl.trim() === link.primaryUrl.trim()) {
      setError('The new destination URL is identical to the current one. Please enter a different URL to divert traffic.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveQuickDivert(link.id, newUrl.trim(), reason.trim() || 'Instant destination URL update');
      setSuccessMessage('Traffic successfully diverted! All future incoming ad clicks will land on the new URL immediately.');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to update URL');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-divert-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 id="quick-divert-title" className="text-lg font-bold text-white">Instant Traffic Divert</h2>
            <p className="text-xs text-slate-400">
              Change destination URL for <span className="text-cyan-300 font-mono">/r/{link.slug}</span> with 0s latency
            </p>
          </div>
        </div>

        {/* Current Path Illustration */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 mb-5 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Current Traffic Flow</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Ad link stays unchanged
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 font-mono">
            <div className="bg-slate-800 px-2.5 py-1.5 rounded text-blue-300 truncate max-w-xs" title={`/r/${link.slug}`}>
              /r/{link.slug}
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded text-slate-300 truncate flex-1" title={link.primaryUrl}>
              {link.primaryUrl}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="divert-new-url" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              New Destination URL <span className="text-rose-400">*</span>
            </label>
            <input
              id="divert-new-url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example-cab.com/new-offer"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Example: Enter your new landing page, checkout, or affiliate link (e.g. cab.com)
            </p>
          </div>

          <div>
            <label htmlFor="divert-reason" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Change Reason / Note (Optional)
            </label>
            <input
              id="divert-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Switched ad traffic to new high-converting summer offer"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Recent Divert History */}
          {link.urlHistory && link.urlHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <History className="w-3.5 h-3.5" />
                <span>Recent URL Divert Log for this link ({link.urlHistory.length})</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1.5 text-[11px]">
                {link.urlHistory.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-2 rounded border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-300 truncate max-w-[280px]" title={item.newUrl}>{item.newUrl}</span>
                    <span className="text-slate-500 shrink-0 text-[10px] ml-2">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isSubmitting ? 'Diverting Traffic...' : 'Apply & Divert Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
