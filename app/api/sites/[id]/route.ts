import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Site } from "@/models/Site";
import { Event } from "@/models/Event";
import { Funnel } from "@/models/Funnel";
import { ownedSite, toSiteDTO } from "@/lib/access";
import { buildSnippet } from "@/lib/snippet";

const updateSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
    domain: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Enter a valid domain")
      .max(253)
      .regex(/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/, "Enter a valid domain")
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No fields to update");

export async function GET(
  _request: Request,
  context: RouteContext<"/api/sites/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = await context.params;
    const site = await ownedSite(session.userId, id);
    if (!site) return fail("Site not found", 404);

    const dto = toSiteDTO(site);
    return ok({ site: dto, snippet: buildSnippet(dto.trackingId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/sites/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = await context.params;
    const existing = await ownedSite(session.userId, id);
    if (!existing) return fail("Site not found", 404);

    const body = updateSchema.parse(await readJson(request));
    await connectDB();
    await Site.updateOne({ _id: id, owner: session.userId }, { $set: body });

    const updated = await ownedSite(session.userId, id);
    if (!updated) return fail("Site not found", 404);
    const dto = toSiteDTO(updated);
    return ok({ site: dto, snippet: buildSnippet(dto.trackingId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/sites/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = await context.params;
    const existing = await ownedSite(session.userId, id);
    if (!existing) return fail("Site not found", 404);

    await connectDB();
    await Site.deleteOne({ _id: id, owner: session.userId });
    await Event.deleteMany({ site: id });
    await Funnel.deleteMany({ site: id });

    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
