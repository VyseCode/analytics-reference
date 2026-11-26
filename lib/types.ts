export type SiteDTO = {
  id: string;
  name: string;
  domain: string;
  trackingId: string;
  createdAt: string;
};

export type EventDTO = {
  id: string;
  name: string;
  visitorId: string;
  url: string;
  referrer: string;
  device: { browser: string; os: string; type: string };
  createdAt: string;
};

export type FunnelStepResult = {
  name: string;
  events: number;
  visitors: number;
  conversionFromPrevious: number;
  conversionFromFirst: number;
};

export type FunnelResultDTO = {
  id: string;
  name: string;
  steps: FunnelStepResult[];
  overallConversion: number;
  createdAt: string;
};

export type AnalyticsRange = {
  from: string;
  to: string;
  days: number;
};

export type SeriesPoint = {
  date: string;
  label: string;
  visitors: number;
  pageviews: number;
  events: number;
};

export type BreakdownItem = {
  label: string;
  value: number;
};

export type AnalyticsDTO = {
  range: AnalyticsRange;
  totals: { visitors: number; pageviews: number; events: number };
  series: SeriesPoint[];
  topPages: BreakdownItem[];
  topReferrers: BreakdownItem[];
  devices: BreakdownItem[];
};
