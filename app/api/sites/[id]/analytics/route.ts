import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { ownedSite } from "@/lib/access";
import { getAnalytics } from "@/lib/analytics";

const querySchema = z.coerce.number().int().min(1).max(90).default(30);

export async function GET(
  request: Request,
  context: RouteContext<"/api/sites/[id]/analytics">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = await context.params;
    if (!(await ownedSite(session.userId, id))) return fail("Site not found", 404);

    const raw = new URL(request.url).searchParams.get("days") ?? undefined;
    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) return fail("Invalid days parameter", 400);

    return ok(await getAnalytics(id, parsed.data));
  } catch (error) {
    return handleError(error);
  }
}
