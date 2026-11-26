import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ownedSite } from "@/lib/access";
import { Funnel } from "@/models/Funnel";
import { computeFunnels, type LeanFunnel } from "@/lib/analytics";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/sites/[id]/funnels/[fid]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id, fid } = await context.params;
    if (!(await ownedSite(session.userId, id))) return fail("Site not found", 404);

    await connectDB();
    const funnel = await Funnel.findOne({ _id: fid, site: id })
      .select("name steps createdAt")
      .lean();
    if (!funnel) return fail("Funnel not found", 404);

    const [result] = await computeFunnels(
      id,
      [funnel as unknown as LeanFunnel],
      30,
    );
    return ok({ funnel: result });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/sites/[id]/funnels/[fid]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id, fid } = await context.params;
    if (!(await ownedSite(session.userId, id))) return fail("Site not found", 404);

    await connectDB();
    const deleted = await Funnel.deleteOne({ _id: fid, site: id });
    if (deleted.deletedCount === 0) return fail("Funnel not found", 404);

    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
