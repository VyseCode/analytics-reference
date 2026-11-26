import { getSession } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  return ok({ user: session ? { id: session.userId, email: session.email } : null });
}
