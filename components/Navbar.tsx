"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavbarProps = { user: { name: string; email: string } };

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/sites", label: "Sites" },
];

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-base font-bold text-white">
            P
          </span>
          <span className="hidden text-sm font-semibold text-slate-800 sm:inline">
            Pulse Analytics
          </span>
        </Link>

        <nav className="ml-4 flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:inline">{user.email}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
