"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteDTO } from "@/lib/types";

export function SitesClient({ sites }: { sites: SiteDTO[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      });
      const data = (await response.json()) as { error?: string; site?: SiteDTO };
      if (!response.ok || !data.site) {
        setError(data.error ?? "Could not create site");
        return;
      }
      setName("");
      setDomain("");
      router.push(`/sites/${data.site.id}`);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Your sites</h2>
        {sites.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-700">No sites yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first site below to start collecting analytics.
            </p>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {sites.map((site) => (
              <li key={site.id}>
                <Link
                  href={`/sites/${site.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <p className="font-semibold text-slate-900">{site.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{site.domain}</p>
                  <p className="mt-3 truncate font-mono text-xs text-indigo-600">
                    {site.trackingId}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add a site</h2>
        <p className="mt-1 text-sm text-slate-500">
          We will generate a tracking ID and snippet for you.
        </p>
        <form onSubmit={create} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="site-name" className="mb-1 block text-sm font-medium text-slate-700">
              Site name
            </label>
            <input
              id="site-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              placeholder="My Blog"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="site-domain" className="mb-1 block text-sm font-medium text-slate-700">
              Domain
            </label>
            <input
              id="site-domain"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              required
              minLength={3}
              placeholder="blog.example.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          {error && (
            <p role="alert" className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create site"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
