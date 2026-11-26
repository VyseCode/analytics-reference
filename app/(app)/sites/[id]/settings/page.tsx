import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ownedSite, toSiteDTO } from "@/lib/access";
import { buildSnippet } from "@/lib/snippet";
import { SiteSettings } from "@/components/SiteSettings";

export default async function SiteSettingsPage({
  params,
}: PageProps<"/sites/[id]/settings">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const site = await ownedSite(session.userId, id);
  if (!site) notFound();

  const dto = toSiteDTO(site);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage {site.name}.</p>
      </div>
      <SiteSettings site={dto} snippet={buildSnippet(dto.trackingId)} />
    </div>
  );
}
