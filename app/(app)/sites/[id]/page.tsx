import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ownedSite, toSiteDTO } from "@/lib/access";
import { getAnalytics } from "@/lib/analytics";
import { SiteTabs } from "@/components/SiteTabs";
import { BarChart, LineChart } from "@/components/Charts";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { BreakdownItem, SiteDTO } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

function BreakdownTable({
  title,
  items,
  emptyLabel = "No data",
}: {
  title: string;
  items: BreakdownItem[];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-slate-700" title={item.label}>
                  {item.label}
                </span>
                <span className="font-medium text-slate-900">{item.value.toLocaleString()}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function SiteData({ site, days }: { site: SiteDTO; days: number }) {
  const analytics = await getAnalytics(site.id, days);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Visitors" value={analytics.totals.visitors} />
        <StatCard label="Pageviews" value={analytics.totals.pageviews} />
        <StatCard label="Events" value={analytics.totals.events} />
      </div>

      {analytics.totals.events === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">No events in this range</p>
          <p className="mt-1 text-sm text-slate-500">
            Install the tracking snippet or send a test event from Settings.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Pageviews over time</h3>
              <div className="mt-4">
                <BarChart
                  data={analytics.series.map((point) => ({
                    label: point.label,
                    value: point.pageviews,
                  }))}
                  ariaLabel="Bar chart of daily pageviews"
                />
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Visitors over time</h3>
              <div className="mt-4">
                <LineChart
                  data={analytics.series.map((point) => ({
                    label: point.label,
                    value: point.visitors,
                  }))}
                  ariaLabel="Line chart of daily visitors"
                />
              </div>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <BreakdownTable title="Top pages" items={analytics.topPages} />
            <BreakdownTable title="Top referrers" items={analytics.topReferrers} />
            <BreakdownTable title="Devices" items={analytics.devices} />
          </div>
        </>
      )}
    </>
  );
}

export default async function SiteDashboardPage({
  params,
  searchParams,
}: PageProps<"/sites/[id]">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const site = await ownedSite(session.userId, id);
  if (!site) notFound();

  const query = await searchParams;
  const rawDays = Number(Array.isArray(query.days) ? query.days[0] : query.days ?? 30);
  const days = Number.isFinite(rawDays) ? Math.min(Math.max(rawDays, 1), 90) : 30;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{site.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{site.domain}</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1" aria-label="Date range">
          {[7, 30].map((value) => (
            <Link
              key={value}
              href={`/sites/${id}?days=${value}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                days === value
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {value} days
            </Link>
          ))}
        </div>
      </div>

      <SiteTabs siteId={id} />
      <Suspense fallback={<LoadingSkeleton />}>
        <SiteData site={toSiteDTO(site)} days={days} />
      </Suspense>
    </div>
  );
}
