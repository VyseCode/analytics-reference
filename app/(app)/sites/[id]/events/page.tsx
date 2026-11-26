import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ownedSite } from "@/lib/access";
import { getEvents } from "@/lib/queries";
import { SiteTabs } from "@/components/SiteTabs";
import { EventsExplorer } from "@/components/EventsExplorer";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EventsPage({
  params,
  searchParams,
}: PageProps<"/sites/[id]/events">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const site = await ownedSite(session.userId, id);
  if (!site) notFound();

  const query = await searchParams;
  const rawLimit = Number(first(query.limit) ?? 20);
  const rawOffset = Number(first(query.offset) ?? 0);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
  const name = first(query.name) ?? "";
  const visitorId = first(query.visitorId) ?? "";
  const sort = first(query.sort) === "asc" ? "asc" : "desc";

  const data = await getEvents(id, { limit, offset, name, visitorId, sort });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse raw events collected for {site.name}.
        </p>
      </div>
      <SiteTabs siteId={id} />
      <EventsExplorer
        siteId={id}
        data={data}
        params={{ limit, offset, name, visitorId, sort }}
      />
    </div>
  );
}
