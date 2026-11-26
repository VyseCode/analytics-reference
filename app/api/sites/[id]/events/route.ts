import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { ownedSite } from "@/lib/access";
import { getEvents } from "@/lib/queries";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  name: z.string().trim().max(120).optional(),
  visitorId: z.string().trim().max(200).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(
  request: Request,
  context: RouteContext<"/api/sites/[id]/events">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = await context.params;
    const site = await ownedSite(session.userId, id);
    if (!site) return fail("Site not found", 404);

    const raw = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid query", 400);
    }

    return ok(await getEvents(id, parsed.data));
  } catch (error) {
    return handleError(error);
  }
}
