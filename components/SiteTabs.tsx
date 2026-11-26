"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteTabs({ siteId }: { siteId: string }) {
  const pathname = usePathname();
  const base = `/sites/${siteId}`;
  const tabs = [
    { href: base, label: "Dashboard", exact: true },
    { href: `${base}/events`, label: "Events", exact: false },
    { href: `${base}/funnels`, label: "Funnels", exact: false },
    { href: `${base}/settings`, label: "Settings", exact: false },
  ];

  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200" aria-label="Site sections">
      {tabs.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
