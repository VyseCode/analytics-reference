import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Site } from "@/models/Site";
import { toSiteDTO, type LeanSite } from "@/lib/access";
import type { EventDTO, SiteDTO } from "@/lib/types";

type LeanEvent = {
  _id: Types.ObjectId;
  name: string;
  visitorId: string;
  url: string;
  referrer: string;
  device: { browser: string; os: string; type: string };
  createdAt: Date;
};

function toEventDTO(event: LeanEvent): EventDTO {
  return {
    id: event._id.toString(),
    name: event.name,
    visitorId: event.visitorId,
    url: event.url,
    referrer: event.referrer,
    device: {
      browser: event.device?.browser ?? "",
      os: event.device?.os ?? "",
      type: event.device?.type ?? "desktop",
    },
    createdAt: event.createdAt.toISOString(),
  };
}

export type EventQuery = {
  limit: number;
  offset: number;
  name?: string;
  visitorId?: string;
  sort: "asc" | "desc";
};

export type EventResult = {
  events: EventDTO[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

export async function getEvents(
  siteId: string,
  query: EventQuery,
): Promise<EventResult> {
  await connectDB();

  const limit = Math.min(Math.max(query.limit, 1), 100);
  const offset = Math.max(query.offset, 0);
  const filter: Record<string, unknown> = {
    site: new Types.ObjectId(siteId),
  };
  if (query.name) filter.name = query.name;
  if (query.visitorId) filter.visitorId = query.visitorId;

  const direction = query.sort === "asc" ? 1 : -1;
  const [docs, total] = await Promise.all([
    Event.find(filter)
      .select("name visitorId url referrer device createdAt")
      .sort({ createdAt: direction, _id: direction })
      .skip(offset)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter),
  ]);

  const events = (docs as unknown as LeanEvent[]).map(toEventDTO);
  return {
    events,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + events.length < total,
    },
  };
}

type LeanOverviewEvent = {
  site: Types.ObjectId;
  name: string;
  visitorId: string;
};

export type OverviewResult = {
  sites: Array<SiteDTO & { events: number; visitors: number }>;
  totals: { sites: number; events: number; visitors: number; pageviews: number };
};

export async function getOverview(userId: string): Promise<OverviewResult> {
  await connectDB();

  const siteDocs = (await Site.find({ owner: new Types.ObjectId(userId) })
    .select("name domain trackingId createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()) as unknown as LeanSite[];

  const siteIds = siteDocs.map((site) => site._id);
  const events =
    siteIds.length > 0
      ? ((await Event.find({
          site: { $in: siteIds },
          createdAt: { $gte: new Date(Date.now() - 30 * 86_400_000) },
        })
          .select("site name visitorId")
          .lean()) as unknown as LeanOverviewEvent[])
      : [];

  const counts = new Map<string, { events: number; visitors: Set<string> }>();
  for (const site of siteDocs) {
    counts.set(site._id.toString(), { events: 0, visitors: new Set<string>() });
  }
  const allVisitors = new Set<string>();
  let pageviews = 0;

  for (const event of events) {
    const siteId = event.site.toString();
    const count = counts.get(siteId);
    if (count) {
      count.events += 1;
      count.visitors.add(event.visitorId);
    }
    allVisitors.add(event.visitorId);
    if (event.name === "pageview") pageviews += 1;
  }

  return {
    sites: siteDocs.map((site) => {
      const count = counts.get(site._id.toString());
      return {
        ...toSiteDTO(site),
        events: count?.events ?? 0,
        visitors: count?.visitors.size ?? 0,
      };
    }),
    totals: {
      sites: siteDocs.length,
      events: events.length,
      visitors: allVisitors.size,
      pageviews,
    },
  };
}
