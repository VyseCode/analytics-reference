import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import type {
  AnalyticsDTO,
  BreakdownItem,
  FunnelResultDTO,
  FunnelStepResult,
  SeriesPoint,
} from "@/lib/types";

export type LeanFunnel = {
  _id: Types.ObjectId;
  name: string;
  steps: string[];
  createdAt: Date;
};

type LeanEventName = { name: string; visitorId: string };

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function daysToCutoff(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

export async function computeFunnels(
  siteId: string,
  funnels: LeanFunnel[],
  days: number,
): Promise<FunnelResultDTO[]> {
  if (funnels.length === 0) return [];

  await connectDB();
  const docs = (await Event.find({
    site: new Types.ObjectId(siteId),
    createdAt: { $gte: daysToCutoff(days) },
  })
    .select("name visitorId")
    .lean()) as unknown as LeanEventName[];

  const visitorsByName = new Map<string, Set<string>>();
  for (const doc of docs) {
    let visitors = visitorsByName.get(doc.name);
    if (!visitors) {
      visitors = new Set<string>();
      visitorsByName.set(doc.name, visitors);
    }
    visitors.add(doc.visitorId);
  }

  return funnels.map((funnel) => {
    let cumulative: Set<string> | null = null;
    const counts = funnel.steps.map((name) => {
      const stepVisitors = visitorsByName.get(name) ?? new Set<string>();
      cumulative =
        cumulative === null
          ? new Set(stepVisitors)
          : new Set([...cumulative].filter((visitor) => stepVisitors.has(visitor)));
      const completed = cumulative;
      const events = docs.filter(
        (doc) => doc.name === name && completed.has(doc.visitorId),
      ).length;
      return { name, events, visitors: completed.size };
    });

    const steps: FunnelStepResult[] = counts.map((count, index) => {
      const previous = index > 0 ? counts[index - 1].visitors : 0;
      return {
        ...count,
        conversionFromPrevious:
          index === 0 ? 100 : previous > 0 ? round((count.visitors / previous) * 100) : 0,
        conversionFromFirst:
          counts[0].visitors > 0
            ? round((count.visitors / counts[0].visitors) * 100)
            : 0,
      };
    });

    const first = counts[0].visitors;
    const last = counts[counts.length - 1].visitors;

    return {
      id: funnel._id.toString(),
      name: funnel.name,
      steps,
      overallConversion: first > 0 ? round((last / first) * 100) : 0,
      createdAt: funnel.createdAt.toISOString(),
    };
  });
}

type LeanAggregateEvent = {
  name: string;
  visitorId: string;
  url: string;
  referrer: string;
  device?: { type?: string };
  createdAt: Date;
};

export async function getAnalytics(
  siteId: string,
  days: number,
): Promise<AnalyticsDTO> {
  await connectDB();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayKeys: string[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    dayKeys.push(new Date(today.getTime() - index * 86_400_000).toISOString().slice(0, 10));
  }
  const cutoff = new Date(`${dayKeys[0]}T00:00:00.000Z`);

  const docs = (await Event.find({
    site: new Types.ObjectId(siteId),
    createdAt: { $gte: cutoff },
  })
    .select("name visitorId url referrer device createdAt")
    .sort({ createdAt: 1 })
    .lean()) as unknown as LeanAggregateEvent[];

  const perDay = new Map<string, { visitors: Set<string>; pageviews: number; events: number }>();
  for (const key of dayKeys) {
    perDay.set(key, { visitors: new Set<string>(), pageviews: 0, events: 0 });
  }
  const allVisitors = new Set<string>();
  const pages = new Map<string, number>();
  const referrers = new Map<string, number>();
  const devices = new Map<string, number>();

  for (const doc of docs) {
    const key = doc.createdAt.toISOString().slice(0, 10);
    const bucket = perDay.get(key);
    if (bucket) {
      bucket.visitors.add(doc.visitorId);
      bucket.events += 1;
      if (doc.name === "pageview") bucket.pageviews += 1;
    }
    allVisitors.add(doc.visitorId);
    pages.set(doc.url, (pages.get(doc.url) ?? 0) + 1);
    const referrer = doc.referrer || "direct";
    referrers.set(referrer, (referrers.get(referrer) ?? 0) + 1);
    const device = doc.device?.type || "desktop";
    devices.set(device, (devices.get(device) ?? 0) + 1);
  }

  const series: SeriesPoint[] = dayKeys.map((key) => {
    const bucket = perDay.get(key)!;
    return {
      date: key,
      label: new Date(`${key}T00:00:00.000Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      visitors: bucket.visitors.size,
      pageviews: bucket.pageviews,
      events: bucket.events,
    };
  });

  function top(map: Map<string, number>, limit = 10): BreakdownItem[] {
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  return {
    range: {
      from: dayKeys[0],
      to: dayKeys[dayKeys.length - 1],
      days,
    },
    totals: {
      visitors: allVisitors.size,
      pageviews: docs.filter((doc) => doc.name === "pageview").length,
      events: docs.length,
    },
    series,
    topPages: top(pages),
    topReferrers: top(referrers),
    devices: top(devices),
  };
}
