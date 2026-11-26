import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, isDuplicateKey, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Site } from "@/models/Site";
import { toSiteDTO, type LeanSite } from "@/lib/access";
import { buildSnippet } from "@/lib/snippet";

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Enter a valid domain")
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/, "Enter a valid domain"),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    await connectDB();
    const sites = (await Site.find({ owner: session.userId })
      .select("name domain trackingId createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()) as unknown as LeanSite[];

    return ok({ sites: sites.map(toSiteDTO) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const body = createSchema.parse(await readJson(request));
    await connectDB();

    let created: LeanSite | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const trackingId = `trk_${randomBytes(12).toString("hex")}`;
      try {
        const site = await Site.create({
          owner: session.userId,
          name: body.name,
          domain: body.domain,
          trackingId,
        });
        created = site as unknown as LeanSite;
        break;
      } catch (error) {
        if (isDuplicateKey(error) && attempt < 2) continue;
        throw error;
      }
    }

    if (!created) return fail("Could not create site", 500);

    const site = toSiteDTO(created);
    return ok({ site, snippet: buildSnippet(site.trackingId) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
