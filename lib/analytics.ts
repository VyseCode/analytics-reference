import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import type { FunnelResultDTO, FunnelStepResult } from "@/lib/types";

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
