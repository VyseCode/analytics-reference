import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ownedSite } from "@/lib/access";
import { Funnel } from "@/models/Funnel";
import { computeFunnels, type LeanFunnel } from "@/lib/analytics";
import { SiteTabs } from "@/components/SiteTabs";
import { FunnelsClient } from "@/components/FunnelsClient";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

async function FunnelsSection({ siteId, days }: { siteId: string; days: number }) {
  const funnels = (await Funnel.find({ site: siteId })
    .select("name steps createdAt")
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanFunnel[];

  return (
    <FunnelsClient
      siteId={siteId}
      funnels={await computeFunnels(siteId, funnels, days)}
      days={days}
    />
  );
}

export default async function FunnelsPage({
  params,
  searchParams,
}: PageProps<"/sites/[id]/funnels">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const site = await ownedSite(session.userId, id);
  if (!site) notFound();

  const query = await searchParams;
  const rawDays = Number(Array.isArray(query.days) ? query.days[0] : query.days ?? 30);
  const days = Number.isFinite(rawDays)
    ? Math.min(Math.max(rawDays, 1), 90)
    : 30;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Funnels</h1>
        <p className="mt-1 text-sm text-slate-500">
          Measure conversion across ordered event steps for {site.name}.
        </p>
      </div>
      <SiteTabs siteId={id} />
      <Suspense fallback={<LoadingSkeleton />}>
        <FunnelsSection siteId={id} days={days} />
      </Suspense>
    </div>
  );
}
