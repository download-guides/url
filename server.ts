import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { RedirectLink, ClickLogEntry, RequestContext } from './src/types/redirect';
import { resolveDestination, detectDevice } from './src/utils/routingEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample links demonstrating the user's exact scenario:
// "abc.com (ads) -> bca.com -> cab.com"
const INITIAL_LINKS: RedirectLink[] = [
  {
    id: 'link-campaign-1',
    slug: 'ad-summer-promo',
    title: 'Ad Campaign Traffic Router (abc -> bca -> cab)',
    primaryUrl: 'https://example-cab.com/summer-special',
    fallbackUrl: 'https://example-bca.com/main-landing',
    status: 'active',
    redirectType: 302,
    preserveQueryParams: true,
    notes: 'Live ad campaign running on Google/Meta. Traffic currently diverted to new cab.com launch page.',
    tags: ['Google Ads', 'Funnel', 'Hot Offer'],
    enableRotator: false,
    trafficSplits: [],
    conditionalRules: [
      {
        id: 'rule-mobile',
        name: 'Mobile Special Offer',
        type: 'device',
        operator: 'equals',
        value: 'mobile',
        targetUrl: 'https://example-cab.com/mobile-checkout',
        active: false,
      },
    ],
    funnelHops: [
      {
        id: 'hop-1',
        label: 'Ad Platform (Traffic Source)',
        role: 'ad_source',
        url: 'https://ads.abc.com/campaign/promo-2026',
        description: 'Google Ads & Meta Ads campaign displaying banner ads',
      },
      {
        id: 'hop-2',
        label: 'DivertFlow Tracking Link',
        role: 'router',
        url: '/r/ad-summer-promo',
        description: 'Central dynamic router link placed inside ad creative',
      },
      {
        id: 'hop-3',
        label: 'Previous Pre-lander (Bridge)',
        role: 'intermediate_bridge',
        url: 'https://example-bca.com/review-article',
        description: 'Original intermediate content / review article page',
      },
      {
        id: 'hop-4',
        label: 'Current Live Destination',
        role: 'final_destination',
        url: 'https://example-cab.com/summer-special',
        description: 'Diverted direct conversion & checkout destination',
      },
    ],
    urlHistory: [
      {
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        previousUrl: 'https://example-bca.com/initial-test',
        newUrl: 'https://example-bca.com/review-article',
        note: 'Switched to bridge pre-lander',
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        previousUrl: 'https://example-bca.com/review-article',
        newUrl: 'https://example-cab.com/summer-special',
        note: 'Diverted direct to high-converting cab.com offer',
      },
    ],
    totalClicks: 1420,
    uniqueClicks: 1184,
    lastClickedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'link-campaign-2',
    slug: 'ecommerce-split',
    title: '50/50 A/B Rotator (Checkout V1 vs V2)',
    primaryUrl: 'https://shop.example.com/checkout-v1',
    fallbackUrl: 'https://shop.example.com/home',
    status: 'active',
    redirectType: 302,
    preserveQueryParams: true,
    notes: 'Split test to determine which checkout converts higher before scaling ads budget.',
    tags: ['A/B Testing', 'E-Commerce'],
    enableRotator: true,
    trafficSplits: [
      { id: 'split-1', name: 'Variant A (1-Page Checkout)', url: 'https://shop.example.com/checkout-v1', weight: 50 },
      { id: 'split-2', name: 'Variant B (Express Pay Modal)', url: 'https://shop.example.com/checkout-v2', weight: 50 },
    ],
    conditionalRules: [],
    funnelHops: [
      {
        id: 'hop-2-1',
        label: 'Facebook Ads',
        role: 'ad_source',
        url: 'https://facebook.com/ads/manager',
        description: 'Dynamic Product Ads targeting cart abandoners',
      },
      {
        id: 'hop-2-2',
        label: 'Dynamic Rotator',
        role: 'router',
        url: '/r/ecommerce-split',
        description: 'Distributes traffic evenly between checkout versions',
      },
      {
        id: 'hop-2-3',
        label: 'Checkout Split Variants',
        role: 'final_destination',
        url: 'https://shop.example.com/checkout-v1 | v2',
        description: 'Tracking conversion rates per variant',
      },
    ],
    urlHistory: [],
    totalClicks: 840,
    uniqueClicks: 760,
    lastClickedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'link-campaign-3',
    slug: 'mobile-app-download',
    title: 'Smart Device Router (iOS vs Android Store)',
    primaryUrl: 'https://mybrand.com/app-web-overview',
    fallbackUrl: 'https://mybrand.com/app-web-overview',
    status: 'active',
    redirectType: 302,
    preserveQueryParams: true,
    notes: 'One single QR code / bio link that opens Apple App Store on iPhones and Google Play on Android.',
    tags: ['Smart Device', 'App Install'],
    enableRotator: false,
    trafficSplits: [],
    conditionalRules: [
      {
        id: 'rule-ios',
        name: 'Apple App Store',
        type: 'device',
        operator: 'equals',
        value: 'mobile',
        targetUrl: 'https://apps.apple.com/app/my-awesome-app/id123456789',
        active: true,
      },
      {
        id: 'rule-tablet',
        name: 'iPad / Tablet Experience',
        type: 'device',
        operator: 'equals',
        value: 'tablet',
        targetUrl: 'https://apps.apple.com/app/my-awesome-app/id123456789',
        active: true,
      },
    ],
    funnelHops: [
      {
        id: 'hop-3-1',
        label: 'Instagram Bio & QR Stickers',
        role: 'ad_source',
        url: 'https://instagram.com/mybrand',
        description: 'Organic profile & printed event posters',
      },
      {
        id: 'hop-3-2',
        label: 'Smart Device Redirector',
        role: 'router',
        url: '/r/mobile-app-download',
        description: 'Inspects user-agent and sends to device store',
      },
      {
        id: 'hop-3-3',
        label: 'Native App Store Listing',
        role: 'final_destination',
        url: 'https://apps.apple.com or https://play.google.com',
        description: 'Direct 1-tap app install',
      },
    ],
    urlHistory: [],
    totalClicks: 2150,
    uniqueClicks: 1980,
    lastClickedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const INITIAL_LOGS: ClickLogEntry[] = [
  {
    id: 'log-1',
    linkId: 'link-campaign-1',
    slug: 'ad-summer-promo',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    ip: '49.36.128.4',
    country: 'IN',
    device: 'mobile',
    browser: 'Chrome Mobile',
    referrer: 'https://www.google.com/search?q=deals',
    incomingQuery: { utm_source: 'google_ads', utm_campaign: 'summer_promo', gclid: 'EAIaIQobChMI...' },
    destinationUrl: 'https://example-cab.com/summer-special?utm_source=google_ads&utm_campaign=summer_promo&gclid=EAIaIQobChMI...',
    ruleMatched: 'Primary Destination (Diverted to cab.com)',
    statusCode: 302,
  },
  {
    id: 'log-2',
    linkId: 'link-campaign-1',
    slug: 'ad-summer-promo',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    ip: '103.21.124.9',
    country: 'IN',
    device: 'desktop',
    browser: 'Chrome 122',
    referrer: 'https://www.facebook.com/',
    incomingQuery: { utm_source: 'meta_ads', fbclid: 'IwAR2k...' },
    destinationUrl: 'https://example-cab.com/summer-special?utm_source=meta_ads&fbclid=IwAR2k...',
    ruleMatched: 'Primary Destination',
    statusCode: 302,
  },
  {
    id: 'log-3',
    linkId: 'link-campaign-2',
    slug: 'ecommerce-split',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    ip: '172.56.21.90',
    country: 'US',
    device: 'mobile',
    browser: 'Safari',
    referrer: 'https://instagram.com/',
    incomingQuery: { utm_source: 'ig_reels', utm_medium: 'paid_ad' },
    destinationUrl: 'https://shop.example.com/checkout-v2?utm_source=ig_reels&utm_medium=paid_ad',
    ruleMatched: 'Split: Variant B (Express Pay Modal) (50%)',
    statusCode: 302,
  },
  {
    id: 'log-4',
    linkId: 'link-campaign-3',
    slug: 'mobile-app-download',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    ip: '198.51.100.42',
    country: 'US',
    device: 'mobile',
    browser: 'Mobile Safari',
    referrer: 'https://instagram.com/stories',
    incomingQuery: { ref: 'qr_sticker_mumbai' },
    destinationUrl: 'https://apps.apple.com/app/my-awesome-app/id123456789?ref=qr_sticker_mumbai',
    ruleMatched: 'Rule: Apple App Store',
    statusCode: 302,
  },
];

// Helper functions for persistent data
function loadLinks(): RedirectLink[] {
  try {
    if (fs.existsSync(LINKS_FILE)) {
      const data = fs.readFileSync(LINKS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed reading links file, using initial data:', err);
  }
  saveLinks(INITIAL_LINKS);
  return INITIAL_LINKS;
}

function saveLinks(links: RedirectLink[]): void {
  try {
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving links file:', err);
  }
}

function loadLogs(): ClickLogEntry[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed reading logs file, using initial logs:', err);
  }
  saveLogs(INITIAL_LOGS);
  return INITIAL_LOGS;
}

function saveLogs(logs: ClickLogEntry[]): void {
  try {
    // Keep max 500 recent logs to save memory/disk
    const trimmed = logs.slice(0, 500);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving logs file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // -------------------------------------------------------------
  // Dynamic Link Redirection Route: /r/:slug
  // -------------------------------------------------------------
  app.get('/r/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const links = loadLinks();
    const link = links.find((l) => l.slug.toLowerCase() === slug.toLowerCase());

    if (!link) {
      // Return a clean branded 404 landing
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Link Not Found | DivertFlow</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
              .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
              .icon { font-size: 48px; margin-bottom: 16px; }
              h1 { font-size: 24px; margin: 0 0 8px 0; color: #f1f5f9; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; }
              .code { background: #0f172a; padding: 8px 12px; border-radius: 8px; font-family: monospace; color: #38bdf8; display: inline-block; margin-bottom: 24px; }
              a { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">🔗</div>
              <h1>Router Link Not Found</h1>
              <p>The tracking redirect link you requested does not exist or has been retired by the campaign manager.</p>
              <div class="code">/r/${slug}</div>
              <div><a href="/">Go to DivertFlow Dashboard</a></div>
            </div>
          </body>
        </html>
      `);
    }

    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    
    // Extract query params from incoming URL
    const queryParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        queryParams[key] = value;
      }
    }

    const device = detectDevice(userAgent);

    const context: RequestContext = {
      userAgent,
      device,
      country: (req.headers['cf-ipcountry'] as string) || (req.headers['x-country-code'] as string) || 'IN',
      ip,
      referrer: Array.isArray(referrer) ? referrer[0] : referrer,
      queryParams,
    };

    const routing = resolveDestination(link, context);

    // Update link analytics
    link.totalClicks = (link.totalClicks || 0) + 1;
    link.lastClickedAt = new Date().toISOString();
    saveLinks(links);

    // Log the click
    const logs = loadLogs();
    const newLog: ClickLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      linkId: link.id,
      slug: link.slug,
      timestamp: new Date().toISOString(),
      ip,
      country: context.country || 'GLOBAL',
      device,
      browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Safari') ? 'Safari' : userAgent.includes('Firefox') ? 'Firefox' : 'Browser',
      referrer: context.referrer || 'Direct / Ad Click',
      incomingQuery: queryParams,
      destinationUrl: routing.destinationUrl,
      ruleMatched: routing.matchedRuleName,
      statusCode: routing.statusCode,
    };
    logs.unshift(newLog);
    saveLogs(logs);

    // Check if link is paused without fallback
    if (routing.statusCode === 503) {
      return res.status(503).send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white;">
            <h2>Campaign Currently Paused</h2>
            <p>This dynamic redirect link is temporarily paused by the advertiser.</p>
          </body>
        </html>
      `);
    }

    // Set cache control headers to prevent intermediate browser/ISP caching of 302 redirects!
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Perform real HTTP redirect
    return res.redirect(routing.statusCode, routing.destinationUrl);
  });

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------
  
  // GET all links
  app.get('/api/links', (_req: Request, res: Response) => {
    const links = loadLinks();
    return res.json({ success: true, links });
  });

  // GET single link
  app.get('/api/links/:id', (req: Request, res: Response) => {
    const links = loadLinks();
    const link = links.find((l) => l.id === req.params.id);
    if (!link) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }
    return res.json({ success: true, link });
  });

  // CREATE new link
  app.post('/api/links', (req: Request, res: Response) => {
    const payload = req.body as Partial<RedirectLink>;
    if (!payload.slug || !payload.primaryUrl) {
      return res.status(400).json({ success: false, error: 'Slug and Primary Destination URL are required' });
    }

    const links = loadLinks();
    const cleanSlug = payload.slug.trim().toLowerCase();

    if (links.some((l) => l.slug.toLowerCase() === cleanSlug)) {
      return res.status(409).json({ success: false, error: `Slug '/r/${cleanSlug}' already exists. Please choose a different slug.` });
    }

    const newLink: RedirectLink = {
      id: `link-${Date.now()}`,
      slug: cleanSlug,
      title: payload.title?.trim() || `Router for ${cleanSlug}`,
      primaryUrl: payload.primaryUrl.trim(),
      fallbackUrl: payload.fallbackUrl?.trim() || '',
      status: payload.status || 'active',
      redirectType: payload.redirectType || 302,
      preserveQueryParams: payload.preserveQueryParams !== undefined ? payload.preserveQueryParams : true,
      notes: payload.notes || '',
      tags: payload.tags || ['Custom'],
      enableRotator: !!payload.enableRotator,
      trafficSplits: payload.trafficSplits || [],
      conditionalRules: payload.conditionalRules || [],
      funnelHops: payload.funnelHops || [
        {
          id: `hop-${Date.now()}-1`,
          label: 'Ad Source / Traffic Entry',
          role: 'ad_source',
          url: 'Ad Network / Creative',
          description: 'Where users click the link',
        },
        {
          id: `hop-${Date.now()}-2`,
          label: 'Tracking Link',
          role: 'router',
          url: `/r/${cleanSlug}`,
          description: 'DivertFlow dynamic router',
        },
        {
          id: `hop-${Date.now()}-3`,
          label: 'Target Destination',
          role: 'final_destination',
          url: payload.primaryUrl.trim(),
          description: 'Destination users are sent to',
        },
      ],
      urlHistory: [
        {
          timestamp: new Date().toISOString(),
          previousUrl: '',
          newUrl: payload.primaryUrl.trim(),
          note: 'Initial URL configured',
        },
      ],
      totalClicks: 0,
      uniqueClicks: 0,
      lastClickedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    links.unshift(newLink);
    saveLinks(links);

    return res.status(201).json({ success: true, link: newLink });
  });

  // UPDATE link (full)
  app.put('/api/links/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body as Partial<RedirectLink>;
    const links = loadLinks();
    const index = links.findIndex((l) => l.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    const current = links[index];

    // Check slug collision if slug changed
    if (updates.slug && updates.slug.toLowerCase() !== current.slug.toLowerCase()) {
      const slugExists = links.some((l) => l.id !== id && l.slug.toLowerCase() === updates.slug!.toLowerCase());
      if (slugExists) {
        return res.status(409).json({ success: false, error: `Slug '/r/${updates.slug}' is already taken.` });
      }
    }

    // Record URL change history if primaryUrl changed
    const history = [...(current.urlHistory || [])];
    if (updates.primaryUrl && updates.primaryUrl !== current.primaryUrl) {
      history.unshift({
        timestamp: new Date().toISOString(),
        previousUrl: current.primaryUrl,
        newUrl: updates.primaryUrl,
        note: updates.notes || 'Instant destination URL update',
      });
    }

    const updatedLink: RedirectLink = {
      ...current,
      ...updates,
      urlHistory: history,
      updatedAt: new Date().toISOString(),
    };

    links[index] = updatedLink;
    saveLinks(links);

    return res.json({ success: true, link: updatedLink });
  });

  // QUICK UPDATE TARGET URL (1-click immediate destination update!)
  app.patch('/api/links/:id/quick-target', (req: Request, res: Response) => {
    const { id } = req.params;
    const { newUrl, reason } = req.body;

    if (!newUrl || typeof newUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'newUrl is required' });
    }

    const links = loadLinks();
    const link = links.find((l) => l.id === id);
    if (!link) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    const previousUrl = link.primaryUrl;
    link.primaryUrl = newUrl.trim();
    link.updatedAt = new Date().toISOString();

    if (!link.urlHistory) link.urlHistory = [];
    link.urlHistory.unshift({
      timestamp: new Date().toISOString(),
      previousUrl,
      newUrl: link.primaryUrl,
      note: reason || 'Instant 1-click URL divert',
    });

    // Also update final funnel hop URL if exists
    if (link.funnelHops) {
      const finalHop = link.funnelHops.find((h) => h.role === 'final_destination');
      if (finalHop) {
        finalHop.url = link.primaryUrl;
      }
    }

    saveLinks(links);
    return res.json({ success: true, link, previousUrl, newUrl: link.primaryUrl });
  });

  // DELETE link
  app.delete('/api/links/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const links = loadLinks();
    const filtered = links.filter((l) => l.id !== id);

    if (filtered.length === links.length) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    saveLinks(filtered);
    return res.json({ success: true, message: 'Link deleted successfully' });
  });

  // GET logs
  app.get('/api/logs', (req: Request, res: Response) => {
    const logs = loadLogs();
    const linkId = req.query.linkId as string | undefined;
    if (linkId) {
      return res.json({ success: true, logs: logs.filter((l) => l.linkId === linkId) });
    }
    return res.json({ success: true, logs });
  });

  // SIMULATE routing without actually performing a 302 redirect
  app.post('/api/simulate', (req: Request, res: Response) => {
    const { slug, userAgent, device, queryParams, country, testUrlOverride } = req.body;
    const links = loadLinks();
    const link = links.find((l) => l.slug.toLowerCase() === (slug || '').toLowerCase());

    if (!link) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    const simulatedLink: RedirectLink = testUrlOverride 
      ? { ...link, primaryUrl: testUrlOverride }
      : link;

    const context: RequestContext = {
      userAgent: userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      device: device || (userAgent ? detectDevice(userAgent) : 'desktop'),
      country: country || 'US',
      queryParams: queryParams || {},
    };

    const result = resolveDestination(simulatedLink, context);

    return res.json({
      success: true,
      simulation: {
        linkSlug: link.slug,
        linkTitle: link.title,
        linkStatus: link.status,
        result,
        context,
      },
    });
  });

  // Global aggregate stats
  app.get('/api/stats', (_req: Request, res: Response) => {
    const links = loadLinks();
    const logs = loadLogs();

    const totalClicks = links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);
    const activeLinksCount = links.filter((l) => l.status === 'active').length;
    const pausedLinksCount = links.filter((l) => l.status === 'paused').length;

    // Device breakdown
    const devices: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0, other: 0 };
    logs.forEach((log) => {
      const d = log.device || 'other';
      devices[d] = (devices[d] || 0) + 1;
    });

    return res.json({
      success: true,
      stats: {
        totalLinks: links.length,
        activeLinks: activeLinksCount,
        pausedLinks: pausedLinksCount,
        totalClicks,
        recentLogsCount: logs.length,
        deviceBreakdown: devices,
      },
    });
  });

  // -------------------------------------------------------------
  // Vite Integration (Dev middleware or static serve)
  // -------------------------------------------------------------
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DivertFlow server is running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DivertFlow server:', err);
  process.exit(1);
});
