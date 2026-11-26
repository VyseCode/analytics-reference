"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteDTO } from "@/lib/types";

type Props = { site: SiteDTO; snippet: string };

export function SiteSettings({ site, snippet }: Props) {
  const router = useRouter();
  const [name, setName] = useState(site.name);
  const [domain, setDomain] = useState(site.domain);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save changes");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access was blocked. Select the snippet manually.");
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${site.name}" and all of its data? This cannot be undone.`)) {
      return;
    }
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not delete site");
        return;
      }
      router.push("/sites");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href={`/sites/${site.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to dashboard
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Site details</h2>
        <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-name" className="mb-1 block text-sm font-medium text-slate-700">
              Site name
            </label>
            <input
              id="settings-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="settings-domain" className="mb-1 block text-sm font-medium text-slate-700">
              Domain
            </label>
            <input
              id="settings-domain"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              required
              minLength={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          {error && (
            <p role="alert" className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="sm:col-span-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Changes saved.
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tracking snippet</h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste this into the <code className="rounded bg-slate-100 px-1">&lt;head&gt;</code> of your site.
          Replace <code className="rounded bg-slate-100 px-1">YOUR_HOST</code> with your server URL.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <code className="flex-1 truncate rounded-md bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
            {site.trackingId}
          </code>
          <button
            type="button"
            onClick={copy}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            {copied ? "Copied!" : "Copy snippet"}
          </button>
        </div>
        <pre className="mt-3 max-h-64 overflow-auto rounded-md bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
          {snippet}
        </pre>
      </section>

      <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-700">Danger zone</h2>
        <p className="mt-1 text-sm text-slate-500">
          Deleting a site permanently removes its events and funnels.
        </p>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-60"
        >
          Delete site
        </button>
      </section>
    </div>
  );
}
