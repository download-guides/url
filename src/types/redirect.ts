export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'other';

export interface TrafficSplit {
  id: string;
  url: string;
  weight: number; // percentage, e.g. 50
  name: string;
}

export interface ConditionalRule {
  id: string;
  name: string;
  type: 'device' | 'country' | 'query_param';
  operator: 'equals' | 'contains';
  value: string;
  targetUrl: string;
  active: boolean;
}

export interface FunnelHop {
  id: string;
  label: string;
  role: 'ad_source' | 'router' | 'intermediate_bridge' | 'final_destination';
  url: string;
  description?: string;
}

export interface ClickLogEntry {
  id: string;
  linkId: string;
  slug: string;
  timestamp: string;
  ip: string;
  country: string;
  device: DeviceType;
  browser: string;
  referrer: string;
  incomingQuery: Record<string, string>;
  destinationUrl: string;
  ruleMatched?: string;
  statusCode: number;
}

export interface UrlChangeHistory {
  timestamp: string;
  previousUrl: string;
  newUrl: string;
  note?: string;
}

export interface RedirectLink {
  id: string;
  slug: string;
  title: string;
  primaryUrl: string;
  fallbackUrl?: string;
  status: 'active' | 'paused';
  redirectType: 301 | 302 | 307;
  preserveQueryParams: boolean;
  notes?: string;
  tags?: string[];
  enableRotator: boolean;
  trafficSplits: TrafficSplit[];
  conditionalRules: ConditionalRule[];
  funnelHops: FunnelHop[];
  urlHistory: UrlChangeHistory[];
  totalClicks: number;
  uniqueClicks: number;
  lastClickedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestContext {
  userAgent?: string;
  device?: DeviceType;
  country?: string;
  ip?: string;
  referrer?: string;
  queryParams?: Record<string, string>;
  randomSeed?: number; // 0.0 - 1.0 for deterministic rotator testing
}

export interface RoutingResult {
  destinationUrl: string;
  statusCode: number;
  matchedRuleName: string;
  reason: string;
  preservedParamsCount: number;
}
