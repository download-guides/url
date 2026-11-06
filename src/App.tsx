import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitFork, 
  Search, 
  Plus, 
  RefreshCw, 
  Filter, 
  ExternalLink, 
  Layers, 
  Sparkles,
  Zap,
  Globe,
  Shuffle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { RedirectLink, ClickLogEntry } from './types/redirect';
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Fetch all links
  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch('/api/links');
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        setLinks(data.links);
      }
    } catch (err: any) {
      console.error('Error fetching links:', err);
      setError('Failed loading routing links. Please check server connection.');
    }
  }, []);

  // Fetch all logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchLinks(), fetchLogs()]).finally(() => {
      setLoading(false);
    });
  }, [fetchLinks, fetchLogs]);

  // Handler: 1-Click Quick Divert Target URL
  const handleSaveQuickDivert = async (linkId: string, newUrl: string, reason: string) => {
    const res = await fetch(`/api/links/${linkId}/quick-target`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUrl, reason }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update URL');
    }
    // Update local state immediately
    setLinks((prev) => prev.map((l) => (l.id === linkId ? data.link : l)));
  };

  // Handler: Save Full Link (Create or Update)
  const handleSaveLink = async (linkData: Partial<RedirectLink>) => {
    if (editLink) {
      // Update existing
      const res = await fetch(`/api/links/${editLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update link');
      }
      setLinks((prev) => prev.map((l) => (l.id === editLink.id ? data.link : l)));
    } else {
      // Create new
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create link');
      }
      setLinks((prev) => [data.link, ...prev]);
    }
  };

  // Handler: Update link directly (from Funnel Visualizer)
  const handleDirectUpdateLink = async (updatedLink: RedirectLink) => {
    const res = await fetch(`/api/links/${updatedLink.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedLink),
    });
    const data = await res.json();
    if (data.success && data.link) {
      setLinks((prev) => prev.map((l) => (l.id === updatedLink.id ? data.link : l)));
    }
  };

  // Handler: Toggle Link Status (Active vs Paused)
  const handleToggleStatus = async (link: RedirectLink) => {
    const newStatus = link.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.link) {
        setLinks((prev) => prev.map((l) => (l.id === link.id ? data.link : l)));
      }
    } catch (err) {
      console.error('Failed toggling status:', err);
    }
  };

  // Handler: Delete Link
  const handleDeleteLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
    } catch (err) {
      console.error('Failed deleting link:', err);
    }
  };

  // Trigger quick divert modal
  const handleOpenQuickDivert = (link: RedirectLink) => {
    setQuickDivertLink(link);
    setIsQuickDivertOpen(true);
  };

  // Trigger full edit modal
  const handleOpenEditModal = (link: RedirectLink) => {
    setEditLink(link);
    setIsEditModalOpen(true);
  };

  // Trigger create modal
  const handleOpenCreateModal = () => {
    setEditLink(null);
    setIsEditModalOpen(true);
  };

  // Trigger QR modal
  const handleOpenQrModal = (link: RedirectLink) => {
    setQrLink(link);
    setIsQrModalOpen(true);
  };

  // Trigger simulator with specific link pre-filled
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
              {/* Search input */}
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
