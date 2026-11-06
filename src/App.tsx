import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitFork, 
  Search, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { RedirectLink, ClickLogEntry, RequestContext } from './types/redirect';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { LinkCard } from './components/LinkCard';
import { QuickDivertModal } from './components/QuickDivertModal';
import { LinkEditModal } from './components/LinkEditModal';
import { QrCodeModal } from './components/QrCodeModal';
import { FunnelVisualizer } from './components/FunnelVisualizer';
import { RedirectSimulator } from './components/RedirectSimulator';
import { ClickLogsTable } from './components/ClickLogsTable';
import { AdPlatformGuide } from './components/AdPlatformGuide';
import { 
  getLocalLinks, 
  setLocalLinks, 
  getLocalLogs, 
  addLocalLog, 
  DEFAULT_LINKS 
} from './utils/storage';
import { resolveDestination, detectDevice } from './utils/routingEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'links' | 'funnel' | 'simulator' | 'analytics' | 'guide'>('links');
  const [links, setLinks] = useState<RedirectLink[]>([]);
  const [logs, setLogs] = useState<ClickLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Modals state
  const [quickDivertLink, setQuickDivertLink] = useState<RedirectLink | null>(null);
  const [isQuickDivertOpen, setIsQuickDivertOpen] = useState(false);

  const [editLink, setEditLink] = useState<RedirectLink | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [qrLink, setQrLink] = useState<RedirectLink | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [simulatorInitialLink, setSimulatorInitialLink] = useState<RedirectLink | null>(null);

  // Dynamic Base URL
  const [baseUrl, setBaseUrl] = useState('');

  // Client-side redirection state (for GitHub Pages static hosting where /r/:slug loads the SPA)
  const [clientRedirectState, setClientRedirectState] = useState<{
    isRedirecting: boolean;
    slug: string;
    destinationUrl: string;
    countdown: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      // If deployed on GitHub Pages subfolder like /repo-name/
      const subpath = pathname.split('/r/')[0].replace(/\/$/, '');
      setBaseUrl(`${origin}${subpath}`);
    }
  }, []);

  // Fetch all links (Backend API with automatic localStorage fallback for GitHub Pages)
  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/links');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.links)) {
          setLinks(data.links);
          setLocalLinks(data.links);
          return data.links;
        }
      }
      throw new Error('API not available, using local cache');
    } catch {
      // Fallback for static hosting like GitHub Pages
      const local = getLocalLinks();
      setLinks(local);
      return local;
    }
  }, []);

  // Fetch all logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
          return;
        }
      }
      throw new Error('API not available, using local cache');
    } catch {
      const local = getLocalLogs();
      setLogs(local);
    }
  }, []);

  // Check for Client-Side Redirect on mount (Handles GitHub Pages /r/:slug or ?r=:slug)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetSlug: string | null = null;
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get('r')) {
      targetSlug = searchParams.get('r');
    } else if (path.includes('/r/')) {
      const parts = path.split('/r/');
      if (parts[1]) {
        targetSlug = parts[1].split('/')[0].split('?')[0];
      }
    } else if (window.location.hash.includes('/r/')) {
      const hashParts = window.location.hash.split('/r/');
      if (hashParts[1]) {
        targetSlug = hashParts[1].split('?')[0];
      }
    }

    if (targetSlug) {
      const currentLinks = getLocalLinks();
      const matched = currentLinks.find((l) => l.slug.toLowerCase() === targetSlug!.toLowerCase());

      if (matched) {
        // Collect incoming query params
        const incomingQuery: Record<string, string> = {};
        searchParams.forEach((val, key) => {
          if (key !== 'r') incomingQuery[key] = val;
        });

        const context: RequestContext = {
          userAgent: navigator.userAgent,
          device: detectDevice(navigator.userAgent),
          queryParams: incomingQuery,
          referrer: document.referrer || 'Direct / Ad click',
        };

        const result = resolveDestination(matched, context);

        // Update local stats
        matched.totalClicks = (matched.totalClicks || 0) + 1;
        matched.lastClickedAt = new Date().toISOString();
        const updated = currentLinks.map((l) => (l.id === matched.id ? matched : l));
        setLocalLinks(updated);

        // Log click
        addLocalLog({
          id: `log-${Date.now()}`,
          linkId: matched.id,
          slug: matched.slug,
          timestamp: new Date().toISOString(),
          ip: 'Client Browser',
          country: 'Local',
          device: context.device || 'desktop',
          browser: 'Browser',
          referrer: context.referrer || 'Direct',
          incomingQuery,
          destinationUrl: result.destinationUrl,
          ruleMatched: result.matchedRuleName,
          statusCode: result.statusCode,
        });

        setClientRedirectState({
          isRedirecting: true,
          slug: matched.slug,
          destinationUrl: result.destinationUrl,
          countdown: 1,
        });

        // Instant or 500ms redirect
        const timer = setTimeout(() => {
          window.location.replace(result.destinationUrl);
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchLinks(), fetchLogs()]).finally(() => {
      setLoading(false);
    });
  }, [fetchLinks, fetchLogs]);

  // Handler: 1-Click Quick Divert Target URL
  const handleSaveQuickDivert = async (linkId: string, newUrl: string, reason: string) => {
    try {
      const res = await fetch(`/api/links/${linkId}/quick-target`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUrl, reason }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.link) {
          setLinks((prev) => {
            const next = prev.map((l) => (l.id === linkId ? data.link : l));
            setLocalLinks(next);
            return next;
          });
          return;
        }
      }
    } catch {
      // Fallback for GitHub Pages static host
    }

    // LocalStorage fallback update
    setLinks((prev) => {
      const next = prev.map((l) => {
        if (l.id === linkId) {
          const previousUrl = l.primaryUrl;
          const history = l.urlHistory || [];
          history.unshift({
            timestamp: new Date().toISOString(),
            previousUrl,
            newUrl: newUrl.trim(),
            note: reason,
          });
          const updated = {
            ...l,
            primaryUrl: newUrl.trim(),
            urlHistory: history,
            updatedAt: new Date().toISOString(),
          };
          if (updated.funnelHops) {
            const finalHop = updated.funnelHops.find((h) => h.role === 'final_destination');
            if (finalHop) finalHop.url = newUrl.trim();
          }
          return updated;
        }
        return l;
      });
      setLocalLinks(next);
      return next;
    });
  };

  // Handler: Save Full Link (Create or Update)
  const handleSaveLink = async (linkData: Partial<RedirectLink>) => {
    try {
      if (editLink) {
        const res = await fetch(`/api/links/${editLink.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(linkData),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLinks((prev) => {
              const next = prev.map((l) => (l.id === editLink.id ? data.link : l));
              setLocalLinks(next);
              return next;
            });
            return;
          }
        }
      } else {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(linkData),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLinks((prev) => {
              const next = [data.link, ...prev];
              setLocalLinks(next);
              return next;
            });
            return;
          }
        }
      }
    } catch {
      // Fallback for static host
    }

    // LocalStorage update
    if (editLink) {
      setLinks((prev) => {
        const next = prev.map((l) => (l.id === editLink.id ? { ...l, ...linkData, updatedAt: new Date().toISOString() } as RedirectLink : l));
        setLocalLinks(next);
        return next;
      });
    } else {
      const newLink: RedirectLink = {
        id: `link-${Date.now()}`,
        slug: (linkData.slug || `link-${Date.now()}`).toLowerCase(),
        title: linkData.title || 'Dynamic Link',
        primaryUrl: linkData.primaryUrl || 'https://example.com',
        fallbackUrl: linkData.fallbackUrl || '',
        status: linkData.status || 'active',
        redirectType: linkData.redirectType || 302,
        preserveQueryParams: linkData.preserveQueryParams !== undefined ? linkData.preserveQueryParams : true,
        notes: linkData.notes || '',
        tags: linkData.tags || ['Custom'],
        enableRotator: !!linkData.enableRotator,
        trafficSplits: linkData.trafficSplits || [],
        conditionalRules: linkData.conditionalRules || [],
        funnelHops: linkData.funnelHops || [
          {
            id: `h1-${Date.now()}`,
            label: 'Ad Source',
            role: 'ad_source',
            url: 'Ad Network',
          },
          {
            id: `h2-${Date.now()}`,
            label: 'Tracking Link',
            role: 'router',
            url: `/r/${linkData.slug}`,
          },
          {
            id: `h3-${Date.now()}`,
            label: 'Target Destination',
            role: 'final_destination',
            url: linkData.primaryUrl || '',
          },
        ],
        urlHistory: [
          {
            timestamp: new Date().toISOString(),
            previousUrl: '',
            newUrl: linkData.primaryUrl || '',
            note: 'Initial URL configured',
          },
        ],
        totalClicks: 0,
        uniqueClicks: 0,
        lastClickedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLinks((prev) => {
        const next = [newLink, ...prev];
        setLocalLinks(next);
        return next;
      });
    }
  };

  // Handler: Update link directly (from Funnel Visualizer)
  const handleDirectUpdateLink = async (updatedLink: RedirectLink) => {
    try {
      fetch(`/api/links/${updatedLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLink),
      });
    } catch {
      // Ignored on static host
    }
    setLinks((prev) => {
      const next = prev.map((l) => (l.id === updatedLink.id ? updatedLink : l));
      setLocalLinks(next);
      return next;
    });
  };

  // Handler: Toggle Link Status
  const handleToggleStatus = async (link: RedirectLink) => {
    const newStatus: 'active' | 'paused' = link.status === 'active' ? 'paused' : 'active';
    try {
      fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Ignored
    }
    setLinks((prev) => {
      const next = prev.map((l) => (l.id === link.id ? { ...l, status: newStatus } : l));
      setLocalLinks(next);
      return next;
    });
  };

  // Handler: Delete Link
  const handleDeleteLink = async (linkId: string) => {
    try {
      fetch(`/api/links/${linkId}`, { method: 'DELETE' });
    } catch {
      // Ignored
    }
    setLinks((prev) => {
      const next = prev.filter((l) => l.id !== linkId);
      setLocalLinks(next);
      return next;
    });
  };

  // Modals helpers
  const handleOpenQuickDivert = (link: RedirectLink) => {
    setQuickDivertLink(link);
    setIsQuickDivertOpen(true);
  };
  const handleOpenEditModal = (link: RedirectLink) => {
    setEditLink(link);
    setIsEditModalOpen(true);
  };
  const handleOpenCreateModal = () => {
    setEditLink(null);
    setIsEditModalOpen(true);
  };
  const handleOpenQrModal = (link: RedirectLink) => {
    setQrLink(link);
    setIsQrModalOpen(true);
  };
  const handleOpenSimulator = (link: RedirectLink) => {
    setSimulatorInitialLink(link);
    setActiveTab('simulator');
  };

  // Filter links
  const filteredLinks = links.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title?.toLowerCase().includes(q);
      const matchSlug = l.slug?.toLowerCase().includes(q);
      const matchPrimary = l.primaryUrl?.toLowerCase().includes(q);
      const matchNotes = l.notes?.toLowerCase().includes(q);
      return matchTitle || matchSlug || matchPrimary || matchNotes;
    }
    return true;
  });

  // If currently handling client-side redirect on GitHub Pages
  if (clientRedirectState && clientRedirectState.isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-4 animate-bounce">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Diverting Traffic...</h2>
          <p className="text-xs text-slate-400 mb-4">
            Campaign link <span className="text-cyan-300 font-mono">/r/{clientRedirectState.slug}</span> is redirecting you to:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 break-all mb-5">
            {clientRedirectState.destinationUrl}
          </div>
          <a
            href={clientRedirectState.destinationUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20"
          >
            <span>Click here if not redirected automatically</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={handleOpenCreateModal}
        baseUrl={baseUrl}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification if any */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Stats Overview */}
        <StatsOverview links={links} baseUrl={baseUrl} />

        {/* TAB 1: Links & Redirections Manager (Default) */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            {/* Action & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by slug, title, or destination URL..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({links.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      statusFilter === 'active'
                        ? 'bg-emerald-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Active ({links.filter((l) => l.status === 'active').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('paused')}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      statusFilter === 'paused'
                        ? 'bg-amber-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paused ({links.filter((l) => l.status === 'paused').length})
                  </button>
                </div>

                <button
                  onClick={fetchLinks}
                  title="Refresh links"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Link Cards List */}
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                Loading dynamic routing links...
              </div>
            ) : filteredLinks.length > 0 ? (
              <div className="space-y-3">
                {filteredLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    baseUrl={baseUrl}
                    onOpenQuickDivert={handleOpenQuickDivert}
                    onOpenEditModal={handleOpenEditModal}
                    onOpenQrModal={handleOpenQrModal}
                    onOpenSimulator={handleOpenSimulator}
                    onToggleStatus={handleToggleStatus}
                    onDeleteLink={handleDeleteLink}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
                <GitFork className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No Dynamic Links Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                  {searchQuery ? 'No links match your search query.' : 'Create your first dynamic redirect link to start routing ad traffic.'}
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Dynamic Link</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Multi-Hop Funnel Visualizer */}
        {activeTab === 'funnel' && (
          <FunnelVisualizer
            links={links}
            baseUrl={baseUrl}
            onUpdateLink={handleDirectUpdateLink}
            onOpenQuickDivert={handleOpenQuickDivert}
            onOpenSimulator={handleOpenSimulator}
          />
        )}

        {/* TAB 3: Redirect Simulator */}
        {activeTab === 'simulator' && (
          <RedirectSimulator
            links={links}
            baseUrl={baseUrl}
            initialLink={simulatorInitialLink}
          />
        )}

        {/* TAB 4: Live Analytics & Click Logs */}
        {activeTab === 'analytics' && (
          <ClickLogsTable
            logs={logs}
            links={links}
            onRefreshLogs={fetchLogs}
          />
        )}

        {/* TAB 5: Ad Platform Guide */}
        {activeTab === 'guide' && <AdPlatformGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">DivertFlow</span>
            <span>• Zero-Downtime Dynamic Traffic Redirection Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>HTTP 302 Temporary (Uncached)</span>
            <span>Lossless UTM Forwarding</span>
            <span>Device-Adaptive</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <QuickDivertModal
        isOpen={isQuickDivertOpen}
        onClose={() => setIsQuickDivertOpen(false)}
        link={quickDivertLink}
        onSaveQuickDivert={handleSaveQuickDivert}
      />

      <LinkEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        linkToEdit={editLink}
        onSave={handleSaveLink}
        baseUrl={baseUrl}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        link={qrLink}
        baseUrl={baseUrl}
      />
    </div>
  );
}
