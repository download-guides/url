import { RedirectLink, RequestContext, RoutingResult, DeviceType } from '../types/redirect';

/**
 * Detect device type from User Agent string
 */
export function detectDevice(userAgent: string = ''): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  if (/mobi|android|touch|mini|windows ce|palm|smartphone|iemobile|iphone|ipod/i.test(ua)) {
    return 'mobile';
  }
  if (/windows|macintosh|linux|cros/i.test(ua)) {
    return 'desktop';
  }
  return 'other';
}

/**
 * Validates a custom or generated slug
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.trim() === '') {
    return { valid: false, error: 'Slug cannot be empty' };
  }
  const clean = slug.trim();
  if (clean.length < 2) {
    return { valid: false, error: 'Slug must be at least 2 characters long' };
  }
  if (clean.length > 64) {
    return { valid: false, error: 'Slug must not exceed 64 characters' };
  }
  const slugRegex = /^[a-zA-Z0-9_-]+$/;
  if (!slugRegex.test(clean)) {
    return { valid: false, error: 'Slug can only contain letters, numbers, hyphens (-), and underscores (_)' };
  }
  return { valid: true };
}

/**
 * Validates a web URL
 */
export function validateUrl(urlStr: string): { valid: boolean; error?: string } {
  if (!urlStr || urlStr.trim() === '') {
    return { valid: false, error: 'URL cannot be empty' };
  }
  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid URL (e.g. https://example.com)' };
  }
}

/**
 * Merges query parameters from incoming request into target URL
 */
export function mergeQueryParams(targetUrl: string, incomingParams?: Record<string, string>): string {
  if (!incomingParams || Object.keys(incomingParams).length === 0) {
    return targetUrl;
  }

  try {
    const url = new URL(targetUrl);
    for (const [key, value] of Object.entries(incomingParams)) {
      if (value !== undefined && value !== null && key.trim() !== '') {
        // If target doesn't already have this param, or overwrite with current incoming param
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  } catch {
    // Fallback if URL parsing failed
    const hasQuery = targetUrl.includes('?');
    const queryString = new URLSearchParams(incomingParams).toString();
    if (!queryString) return targetUrl;
    return `${targetUrl}${hasQuery ? '&' : '?'}${queryString}`;
  }
}

/**
 * Resolves destination URL based on Link configuration and incoming RequestContext
 */
export function resolveDestination(link: RedirectLink, context: RequestContext): RoutingResult {
  const effectiveDevice: DeviceType = context.device || detectDevice(context.userAgent || '');
  const effectiveCountry = (context.country || 'UNKNOWN').toUpperCase();
  const queryParams = context.queryParams || {};

  // 1. Check if link is paused / disabled
  if (link.status === 'paused') {
    if (link.fallbackUrl && link.fallbackUrl.trim() !== '') {
      const finalUrl = link.preserveQueryParams 
        ? mergeQueryParams(link.fallbackUrl, queryParams)
        : link.fallbackUrl;
      return {
        destinationUrl: finalUrl,
        statusCode: link.redirectType || 302,
        matchedRuleName: 'Campaign Paused (Fallback Reroute)',
        reason: 'Link is paused. Traffic diverted to safety fallback URL.',
        preservedParamsCount: Object.keys(queryParams).length,
      };
    }
    return {
      destinationUrl: 'about:blank',
      statusCode: 503,
      matchedRuleName: 'Campaign Paused',
      reason: 'Link is currently paused by administrator with no fallback URL specified.',
      preservedParamsCount: 0,
    };
  }

  // 2. Check conditional rules (device, country, query parameters)
  if (link.conditionalRules && link.conditionalRules.length > 0) {
    for (const rule of link.conditionalRules) {
      if (!rule.active) continue;

      let matched = false;

      if (rule.type === 'device') {
        matched = rule.operator === 'equals' 
          ? effectiveDevice === rule.value.toLowerCase()
          : effectiveDevice.includes(rule.value.toLowerCase());
      } else if (rule.type === 'country') {
        const val = rule.value.toUpperCase();
        matched = rule.operator === 'equals'
          ? effectiveCountry === val
          : effectiveCountry.includes(val);
      } else if (rule.type === 'query_param') {
        const [paramKey, expectedVal] = rule.value.split('=');
        if (paramKey) {
          const actualVal = queryParams[paramKey.trim()];
          if (actualVal !== undefined) {
            if (!expectedVal) {
              matched = true; // param presence check
            } else {
              matched = rule.operator === 'equals'
                ? actualVal === expectedVal.trim()
                : actualVal.includes(expectedVal.trim());
            }
          }
        }
      }

      if (matched && rule.targetUrl) {
        const finalUrl = link.preserveQueryParams
          ? mergeQueryParams(rule.targetUrl, queryParams)
          : rule.targetUrl;

        return {
          destinationUrl: finalUrl,
          statusCode: link.redirectType || 302,
          matchedRuleName: `Rule: ${rule.name}`,
          reason: `Matched condition [${rule.type} ${rule.operator} ${rule.value}]`,
          preservedParamsCount: Object.keys(queryParams).length,
        };
      }
    }
  }

  // 3. Check Rotator / Split Test
  if (link.enableRotator && link.trafficSplits && link.trafficSplits.length > 0) {
    const activeSplits = link.trafficSplits.filter(s => s.weight > 0 && s.url);
    const totalWeight = activeSplits.reduce((sum, s) => sum + s.weight, 0);

    if (totalWeight > 0) {
      const rand = context.randomSeed !== undefined ? context.randomSeed : Math.random();
      let threshold = 0;
      const targetRoll = rand * totalWeight;

      for (const split of activeSplits) {
        threshold += split.weight;
        if (targetRoll <= threshold) {
          const finalUrl = link.preserveQueryParams
            ? mergeQueryParams(split.url, queryParams)
            : split.url;

          return {
            destinationUrl: finalUrl,
            statusCode: link.redirectType || 302,
            matchedRuleName: `Split: ${split.name} (${split.weight}%)`,
            reason: `Rotator selected split variation '${split.name}' based on weight allocation.`,
            preservedParamsCount: Object.keys(queryParams).length,
          };
        }
      }
    }
  }

  // 4. Default: Primary URL
  const baseTarget = link.primaryUrl || link.fallbackUrl || 'https://example.com';
  const finalUrl = link.preserveQueryParams
    ? mergeQueryParams(baseTarget, queryParams)
    : baseTarget;

  return {
    destinationUrl: finalUrl,
    statusCode: link.redirectType || 302,
    matchedRuleName: 'Primary Destination',
    reason: 'Routed directly to current primary target URL.',
    preservedParamsCount: Object.keys(queryParams).length,
  };
}
