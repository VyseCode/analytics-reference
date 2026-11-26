import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ownedSite } from "@/lib/access";
import { Funnel } from "@/models/Funnel";
import { computeFunnels, type LeanFunnel } from "@/lib/analytics";

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  steps: z
    .array(z.string().trim().min(1, "Steps cannot be empty").max(120))
    .min(1, "Add at least one step")
    .max(10, "A funnel can have at most 10 steps"),
});

const daysSchema = z.coerce.number().int().min(1).max(90).default(30);

export async function GET(
  request: Request,
  context: RouteContext<"/api/sites/[id]/funnels">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = await context.params;
    if (!(await ownedSite(session.userId, id))) return fail("Site not found", 404);

    const rawDays = new URL(request.url).searchParams.get("days") ?? undefined;
    const parsedDays = daysSchema.safeParse(rawDays);
    if (!parsedDays.success) return fail("Invalid days parameter", 400);

    await connectDB();
    const funnels = (await Funnel.find({ site: id })
      .select("name steps createdAt")
      .sort({ createdAt: -1 })
      .lean()) as unknown as LeanFunnel[];

    return ok({
      days: parsedDays.data,
      funnels: await computeFunnels(id, funnels, parsedDays.data),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/sites/[id]/funnels">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = await context.params;
    if (!(await ownedSite(session.userId, id))) return fail("Site not found", 404);

    const body = createSchema.parse(await readJson(request));
    await connectDB();
    const funnel = await Funnel.create({
      site: id,
      name: body.name,
      steps: body.steps,
      createdBy: session.userId,
    });

    const [result] = await computeFunnels(
      id,
      [funnel as unknown as LeanFunnel],
      30,
    );
    return ok({ funnel: result }, 201);
  } catch (error) {
    return handleError(error);
  }
}
