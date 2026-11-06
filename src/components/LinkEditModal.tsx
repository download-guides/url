import React, { useState, useEffect } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  ShieldCheck, 
  Shuffle, 
  Smartphone, 
  Globe, 
  Plus, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { RedirectLink, TrafficSplit, ConditionalRule } from '../types/redirect';
import { validateSlug, validateUrl } from '../utils/routingEngine';

interface LinkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkToEdit: RedirectLink | null;
  onSave: (linkData: Partial<RedirectLink>) => Promise<void>;
  baseUrl: string;
}

export const LinkEditModal: React.FC<LinkEditModalProps> = ({
  isOpen,
  onClose,
  linkToEdit,
  onSave,
  baseUrl,
}) => {
  const isEditing = !!linkToEdit;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryUrl, setPrimaryUrl] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [redirectType, setRedirectType] = useState<301 | 302 | 307>(302);
  const [preserveQueryParams, setPreserveQueryParams] = useState(true);
  const [notes, setNotes] = useState('');
  const [enableRotator, setEnableRotator] = useState(false);
  const [splits, setSplits] = useState<TrafficSplit[]>([]);
  const [rules, setRules] = useState<ConditionalRule[]>([]);
  const [status, setStatus] = useState<'active' | 'paused'>('active');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (linkToEdit) {
      setTitle(linkToEdit.title);
      setSlug(linkToEdit.slug);
      setPrimaryUrl(linkToEdit.primaryUrl);
      setFallbackUrl(linkToEdit.fallbackUrl || '');
      setRedirectType(linkToEdit.redirectType || 302);
      setPreserveQueryParams(linkToEdit.preserveQueryParams !== undefined ? linkToEdit.preserveQueryParams : true);
      setNotes(linkToEdit.notes || '');
      setEnableRotator(linkToEdit.enableRotator || false);
      setSplits(linkToEdit.trafficSplits || []);
      setRules(linkToEdit.conditionalRules || []);
      setStatus(linkToEdit.status || 'active');
      setError(null);
    } else {
      // Defaults for brand new link
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      setTitle('');
      setSlug(`promo-${randomSuffix}`);
      setPrimaryUrl('');
      setFallbackUrl('');
      setRedirectType(302);
      setPreserveQueryParams(true);
      setNotes('');
      setEnableRotator(false);
      setSplits([]);
      setRules([]);
      setStatus('active');
      setError(null);
    }
  }, [linkToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSplit = () => {
    setSplits([
      ...splits,
      {
        id: `split-${Date.now()}`,
        name: `Variant ${String.fromCharCode(65 + splits.length)}`,
        url: '',
        weight: 50,
      },
    ]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleUpdateSplit = (index: number, key: keyof TrafficSplit, val: any) => {
    const updated = [...splits];
    updated[index] = { ...updated[index], [key]: val };
    setSplits(updated);
  };

  const handleAddRule = () => {
    setRules([
      ...rules,
      {
        id: `rule-${Date.now()}`,
        name: 'Mobile Traffic Route',
        type: 'device',
        operator: 'equals',
        value: 'mobile',
        targetUrl: '',
        active: true,
      },
    ]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (index: number, key: keyof ConditionalRule, val: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [key]: val };
    setRules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate slug
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      setError(slugValidation.error || 'Invalid slug');
      return;
    }

    // Validate primary URL
    const urlValidation = validateUrl(primaryUrl);
    if (!urlValidation.valid) {
      setError(`Primary Destination URL: ${urlValidation.error}`);
      return;
    }

    // Validate fallback URL if provided
    if (fallbackUrl && fallbackUrl.trim() !== '') {
      const fbValidation = validateUrl(fallbackUrl);
      if (!fbValidation.valid) {
        setError(`Fallback URL: ${fbValidation.error}`);
        return;
      }
    }

    // Validate splits if rotator is enabled
    if (enableRotator && splits.length > 0) {
      for (const s of splits) {
        if (!s.url || !validateUrl(s.url).valid) {
          setError(`Split variant '${s.name}' requires a valid URL.`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      await onSave({
        title: title.trim() || `Campaign /r/${slug}`,
        slug: slug.trim().toLowerCase(),
        primaryUrl: primaryUrl.trim(),
        fallbackUrl: fallbackUrl.trim(),
        redirectType,
        preserveQueryParams,
        notes: notes.trim(),
        enableRotator,
        trafficSplits: splits,
        conditionalRules: rules,
        status,
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error saving link');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 id="modal-headline" className="text-lg font-bold text-white">
              {isEditing ? 'Configure Dynamic Router Link' : 'Create New Dynamic Router Link'}
            </h2>
            <p className="text-xs text-slate-400">
              The short tracking URL you give to ad platforms, which you can redirect anywhere anytime.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Campaign Title */}
          <div>
            <label htmlFor="link-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Campaign / Link Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="link-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google Ads - Summer Sale Funnel"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Router Slug (The public URL) */}
          <div>
            <label htmlFor="link-slug" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Custom URL Slug <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center">
              <span className="bg-slate-800 border border-r-0 border-slate-700 rounded-l-lg px-3 py-2 text-xs text-slate-400 font-mono">
                {baseUrl}/r/
              </span>
              <input
                id="link-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="summer-deal"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-r-lg px-3 py-2 text-sm text-cyan-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Paste this URL into Facebook Ads, Google Ads, SMS, or Telegram.
            </p>
          </div>

          {/* Primary Destination URL */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <label htmlFor="link-primary-url" className="block text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Primary Destination URL (Target URL) <span className="text-rose-400">*</span>
            </label>
            <input
              id="link-primary-url"
              type="url"
              value={primaryUrl}
              onChange={(e) => setPrimaryUrl(e.target.value)}
              placeholder="https://example-bca.com/landing or https://example-cab.com/offer"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              Where traffic is immediately diverted to right now. You can change this anytime with 1 click in the dashboard!
            </p>
          </div>

          {/* Fallback URL & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="link-fallback" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Emergency Fallback URL (Optional)
              </label>
              <input
                id="link-fallback"
                type="url"
                value={fallbackUrl}
                onChange={(e) => setFallbackUrl(e.target.value)}
                placeholder="https://mywebsite.com/safe-page"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Used if campaign is paused</p>
            </div>

            <div>
              <label htmlFor="link-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Campaign Status
              </label>
              <select
                id="link-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'paused')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active (Traffic Diverting Live)</option>
                <option value="paused">Paused (Divert to Fallback)</option>
              </select>
            </div>
          </div>

          {/* Advanced Ad Options: UTM forwarding & 302 code */}
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={preserveQueryParams}
                onChange={(e) => setPreserveQueryParams(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Preserve & Forward Ad UTM Tracking Parameters (Recommended)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Automatically passes <code className="text-cyan-300 font-mono">utm_source, utm_medium, gclid, fbclid, click_id</code> to the new destination URL seamlessly.
                </span>
              </div>
            </label>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-300">HTTP Redirect Type:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRedirectType(302)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium border ${
                    redirectType === 302
                      ? 'bg-blue-600/30 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  302 Temporary (Best for dynamic ads)
                </button>
                <button
                  type="button"
                  onClick={() => setRedirectType(307)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium border ${
                    redirectType === 307
                      ? 'bg-blue-600/30 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  307 Temporary
                </button>
              </div>
            </div>
          </div>

          {/* Rotator / A-B Split testing section */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Traffic Rotator & Split Testing (A/B Test)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableRotator}
                  onChange={(e) => setEnableRotator(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {enableRotator && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <p className="text-[11px] text-slate-400">
                  Distribute incoming ad traffic across multiple destination URLs based on percentage weights.
                </p>

                {splits.map((split, index) => (
                  <div key={split.id || index} className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <input
                      type="text"
                      value={split.name}
                      onChange={(e) => handleUpdateSplit(index, 'name', e.target.value)}
                      placeholder="Variant Name"
                      className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="url"
                      value={split.url}
                      onChange={(e) => handleUpdateSplit(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={split.weight}
                        onChange={(e) => handleUpdateSplit(index, 'weight', parseInt(e.target.value) || 0)}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(index)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSplit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Split Variation</span>
                </button>
              </div>
            )}
          </div>

          {/* Conditional Device Routing Rules */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Smart Device Rules (e.g. Mobile Override)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddRule}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                <Plus className="w-3 h-3" /> Add Rule
              </button>
            </div>

            {rules.length > 0 ? (
              <div className="space-y-2 mt-2">
                {rules.map((rule, idx) => (
                  <div key={rule.id || idx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => handleUpdateRule(idx, 'name', e.target.value)}
                        placeholder="Rule Name"
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">If Device =</span>
                      <select
                        value={rule.value}
                        onChange={(e) => handleUpdateRule(idx, 'value', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="mobile">Mobile (iPhone/Android)</option>
                        <option value="desktop">Desktop (Mac/PC)</option>
                        <option value="tablet">Tablet (iPad)</option>
                      </select>
                      <span className="text-xs text-slate-400">route to:</span>
                      <input
                        type="url"
                        value={rule.targetUrl}
                        onChange={(e) => handleUpdateRule(idx, 'targetUrl', e.target.value)}
                        placeholder="https://mobile-landing.com"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Optional: Send mobile visitors to an app store or mobile-first page, and desktop users to your main website.
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Dynamic Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
