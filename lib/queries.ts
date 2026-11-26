import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import type { EventDTO } from "@/lib/types";

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
