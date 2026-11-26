import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Site } from "@/models/Site";
import { Event } from "@/models/Event";
import { fail, handleError, isDuplicateKey, ok, readJson } from "@/lib/api";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const collectSchema = z.object({
  siteId: z.string().trim().min(1, "A site ID is required").max(200),
  name: z.string().trim().min(1, "An event name is required").max(120),
  visitorId: z.string().trim().min(1, "A visitor ID is required").max(200),
  eventId: z.string().trim().min(1, "An event ID is required").max(200),
  url: z
    .string()
    .trim()
    .min(1, "A URL is required")
    .max(2048)
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
      "Enter a valid URL",
    ),
  referrer: z.string().trim().max(2048).default(""),
  device: z
    .object({
      browser: z.string().trim().max(120).default(""),
      os: z.string().trim().max(120).default(""),
      type: z.enum(["desktop", "mobile", "tablet"]).default("desktop"),
    })
    .default({ browser: "", os: "", type: "desktop" }),
});

function withCors(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  return withCors(new Response(null, { status: 204 }));
}

export async function POST(request: Request) {
  try {
    const body = collectSchema.parse(await readJson(request));

    const limit = rateLimit(clientKey(request));
    if (!limit.allowed) {
      const response = fail("Too many events. Please slow down.", 429);
      response.headers.set("Retry-After", String(limit.retryAfter));
      return withCors(response);
    }

    await connectDB();

    let site: { _id: Types.ObjectId } | null = null;
    if (Types.ObjectId.isValid(body.siteId)) {
      site = await Site.findOne({ _id: body.siteId })
        .select("_id")
        .lean<{ _id: Types.ObjectId }>();
    }
    if (!site) {
      site = await Site.findOne({ trackingId: body.siteId })
        .select("_id")
        .lean<{ _id: Types.ObjectId }>();
    }
    if (!site) return withCors(fail("Unknown site", 404));

    try {
      await Event.create({
        site: site._id,
        name: body.name,
        visitorId: body.visitorId,
        eventId: body.eventId,
        url: body.url,
        referrer: body.referrer,
        device: body.device,
      });
      return withCors(ok({ ok: true, duplicate: false }, 202));
    } catch (error) {
      if (isDuplicateKey(error)) {
        return withCors(ok({ ok: true, duplicate: true }));
      }
      throw error;
    }
  } catch (error) {
    return withCors(handleError(error));
  }
}
