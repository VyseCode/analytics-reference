import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOverview } from "@/lib/queries";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

async function OverviewSection({ userId }: { userId: string }) {
  const overview = await getOverview(userId);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sites" value={overview.totals.sites} />
        <StatCard label="Events" value={overview.totals.events} />
        <StatCard label="Visitors" value={overview.totals.visitors} />
        <StatCard label="Pageviews" value={overview.totals.pageviews} />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Your sites</h2>
        {overview.sites.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-700">No sites yet</p>
            <p className="mt-1 text-sm text-slate-500">
              <Link href="/sites" className="font-medium text-indigo-600 hover:underline">
                Add a site
              </Link>{" "}
              to start collecting analytics.
            </p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.sites.map((site) => (
              <li key={site.id}>
                <Link
                  href={`/sites/${site.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <p className="font-semibold text-slate-900">{site.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{site.domain}</p>
                  <div className="mt-4 flex gap-4 text-xs text-slate-600">
                    <span>{site.events.toLocaleString()} events</span>
                    <span>{site.visitors.toLocaleString()} visitors</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            A snapshot of your sites over the last 30 days.
          </p>
        </div>
        <Link
          href="/sites"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          Manage sites
        </Link>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <OverviewSection userId={session.userId} />
      </Suspense>
    </div>
  );
}
