import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Site } from "@/models/Site";
import type { SiteDTO } from "@/lib/types";

export type LeanSite = {
  _id: Types.ObjectId;
  name: string;
  domain: string;
  trackingId: string;
  createdAt: Date;
};

export async function ownedSite(
  userId: string,
  siteId: string,
): Promise<LeanSite | null> {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(siteId)) {
    return null;
  }
  await connectDB();
  const site = await Site.findOne({ _id: siteId, owner: userId })
    .select("name domain trackingId createdAt")
    .lean();
  return (site as unknown as LeanSite) ?? null;
}

export function toSiteDTO(site: LeanSite): SiteDTO {
  return {
    id: site._id.toString(),
    name: site.name,
    domain: site.domain,
    trackingId: site.trackingId,
    createdAt: site.createdAt.toISOString(),
  };
}
