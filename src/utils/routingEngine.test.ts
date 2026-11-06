import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDevice,
  validateSlug,
  validateUrl,
  mergeQueryParams,
  resolveDestination,
} from './routingEngine';
import { RedirectLink } from '../types/redirect';

test('detectDevice accurately categorizes User Agents', () => {
  const iphoneUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
  const desktopMacUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const ipadUa = 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';

  assert.equal(detectDevice(iphoneUa), 'mobile');
  assert.equal(detectDevice(desktopMacUa), 'desktop');
  assert.equal(detectDevice(ipadUa), 'tablet');
  assert.equal(detectDevice('unknown-bot'), 'other');
});

test('validateSlug catches invalid characters, short, and long slugs', () => {
  assert.equal(validateSlug('ad-campaign-2026').valid, true);
  assert.equal(validateSlug('promo_deal').valid, true);
  assert.equal(validateSlug('a').valid, false);
  assert.equal(validateSlug('ad campaign').valid, false); // spaces disallowed
  assert.equal(validateSlug('deal@special!').valid, false); // special chars disallowed
});

test('validateUrl validates valid http/https URLs', () => {
  assert.equal(validateUrl('https://example.com/shop').valid, true);
  assert.equal(validateUrl('http://landing.bca.com?utm=test').valid, true);
  assert.equal(validateUrl('invalid-url-string').valid, false);
  assert.equal(validateUrl('ftp://example.com').valid, false);
});

test('mergeQueryParams merges incoming ad parameters into target URL seamlessly', () => {
  const target = 'https://cab.com/product?existing=1';
  const incoming = {
    utm_source: 'facebook_ads',
    utm_campaign: 'summer_sale',
    gclid: 'xyz123',
  };

  const merged = mergeQueryParams(target, incoming);
  const parsed = new URL(merged);

  assert.equal(parsed.searchParams.get('existing'), '1');
  assert.equal(parsed.searchParams.get('utm_source'), 'facebook_ads');
  assert.equal(parsed.searchParams.get('utm_campaign'), 'summer_sale');
  assert.equal(parsed.searchParams.get('gclid'), 'xyz123');
});

test('resolveDestination routes to primary URL when active and preserves parameters', () => {
  const mockLink: RedirectLink = {
    id: 'link-1',
    slug: 'promo-1',
    title: 'Ad Redirect Test',
    primaryUrl: 'https://bca.com/landing',
    fallbackUrl: 'https://bca.com/fallback',
    status: 'active',
    redirectType: 302,
    preserveQueryParams: true,
    enableRotator: false,
    trafficSplits: [],
    conditionalRules: [],
    funnelHops: [],
    urlHistory: [],
    totalClicks: 0,
    uniqueClicks: 0,
    lastClickedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = resolveDestination(mockLink, {
    device: 'desktop',
    queryParams: { utm_source: 'google' },
  });

  assert.equal(result.statusCode, 302);
  assert.equal(result.destinationUrl, 'https://bca.com/landing?utm_source=google');
  assert.equal(result.matchedRuleName, 'Primary Destination');
});

test('resolveDestination respects instant URL change', () => {
  const mockLink: RedirectLink = {
    id: 'link-1',
    slug: 'promo-1',
    title: 'Ad Redirect Test',
    primaryUrl: 'https://cab.com/new-offer', // Changed dynamically!
    status: 'active',
    redirectType: 302,
    preserveQueryParams: true,
    enableRotator: false,
    trafficSplits: [],
    conditionalRules: [],
    funnelHops: [],
    urlHistory: [],
    totalClicks: 0,
    uniqueClicks: 0,
    lastClickedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = resolveDestination(mockLink, {
    queryParams: { click_id: 'abc99' },
  });

  assert.equal(result.destinationUrl, 'https://cab.com/new-offer?click_id=abc99');
});

test('resolveDestination diverts to fallback when paused', () => {
  const mockLink: RedirectLink = {
    id: 'link-paused',
    slug: 'paused-link',
    title: 'Paused Campaign',
    primaryUrl: 'https://bca.com/landing',
    fallbackUrl: 'https://company.com/safe-pause',
    status: 'paused',
    redirectType: 302,
    preserveQueryParams: true,
    enableRotator: false,
    trafficSplits: [],
    conditionalRules: [],
    funnelHops: [],
    urlHistory: [],
    totalClicks: 0,
    uniqueClicks: 0,
    lastClickedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = resolveDestination(mockLink, {
    queryParams: { ref: 'ad1' },
  });

  assert.equal(result.destinationUrl, 'https://company.com/safe-pause?ref=ad1');
  assert.equal(result.matchedRuleName, 'Campaign Paused (Fallback Reroute)');
});

test('resolveDestination matches device targeting rule (mobile override)', () => {
  const mockLink: RedirectLink = {
    id: 'link-device',
    slug: 'device-test',
    title: 'Device Split',
    primaryUrl: 'https://desktop-site.com',
    status: 'active',
    redirectType: 302,
    preserveQueryParams: false,
    enableRotator: false,
    trafficSplits: [],
    conditionalRules: [
      {
        id: 'r1',
        name: 'Mobile App Store',
        type: 'device',
        operator: 'equals',
        value: 'mobile',
        targetUrl: 'https://mobile-app.com/download',
        active: true,
      },
    ],
    funnelHops: [],
    urlHistory: [],
    totalClicks: 0,
    uniqueClicks: 0,
    lastClickedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Test mobile user
  const mobileResult = resolveDestination(mockLink, { device: 'mobile' });
  assert.equal(mobileResult.destinationUrl, 'https://mobile-app.com/download');

  // Test desktop user
  const desktopResult = resolveDestination(mockLink, { device: 'desktop' });
  assert.equal(desktopResult.destinationUrl, 'https://desktop-site.com');
});

test('resolveDestination splits traffic accurately using rotator weights', () => {
  const mockLink: RedirectLink = {
    id: 'link-rotator',
    slug: 'rotator-test',
    title: 'A/B Split Test',
    primaryUrl: 'https://default.com',
    status: 'active',
    redirectType: 302,
    preserveQueryParams: false,
    enableRotator: true,
    trafficSplits: [
      { id: 's1', name: 'Variant A', url: 'https://variant-a.com', weight: 50 },
      { id: 's2', name: 'Variant B', url: 'https://variant-b.com', weight: 50 },
    ],
    conditionalRules: [],
    funnelHops: [],
    urlHistory: [],
    totalClicks: 0,
    uniqueClicks: 0,
    lastClickedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // seed 0.2 falls in Variant A (0 to 50)
  const resultA = resolveDestination(mockLink, { randomSeed: 0.2 });
  assert.equal(resultA.destinationUrl, 'https://variant-a.com');

  // seed 0.8 falls in Variant B (50 to 100)
  const resultB = resolveDestination(mockLink, { randomSeed: 0.8 });
  assert.equal(resultB.destinationUrl, 'https://variant-b.com');
});
