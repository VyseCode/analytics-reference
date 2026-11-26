import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || !Types.ObjectId.isValid(session.userId)) redirect("/login");

  await connectDB();
  const user = await User.findById(session.userId)
    .select("name email")
    .lean();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={{ name: user.name, email: user.email }} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
