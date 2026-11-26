import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Site } from "@/models/Site";
import { SitesClient } from "@/components/SitesClient";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { toSiteDTO, type LeanSite } from "@/lib/access";

async function SitesSection({ userId }: { userId: string }) {
  await connectDB();
  const sites = (await Site.find({ owner: userId })
    .select("name domain trackingId createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()) as unknown as LeanSite[];

  return <SitesClient sites={sites.map(toSiteDTO)} />;
}

export default async function SitesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Sites</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the properties you track with Pulse.
        </p>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <SitesSection userId={session.userId} />
      </Suspense>
    </div>
  );
}
