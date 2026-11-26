"use client";

import { useState } from "react";

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `evt-${Date.now()}-${Math.random()}`;
}

export function TestEventPanel({ trackingId }: { trackingId: string }) {
  const [name, setName] = useState("pageview");
  const [url, setUrl] = useState("/test-page");
  const [eventId, setEventId] = useState(randomId);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setError("");
    setResult("");
    setBusy(true);
    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: trackingId,
          name,
          visitorId: `test-visitor-${randomId().slice(0, 8)}`,
          eventId,
          url,
          referrer: "https://example.com",
          device: { browser: "Chrome", os: "Linux", type: "desktop" },
        }),
      });
      const data = (await response.json()) as { duplicate?: boolean; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not send event");
        return;
      }
      setResult(
        data.duplicate
          ? "Duplicate event — ignored (idempotent)."
          : "Event accepted. Click again to test idempotency.",
      );
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Send a test event</h2>
      <p className="mt-1 text-sm text-slate-500">
        Verify your collection pipeline without leaving this page.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="test-name" className="mb-1 block text-sm font-medium text-slate-700">
            Event name
          </label>
          <input
            id="test-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="test-url" className="mb-1 block text-sm font-medium text-slate-700">
            URL
          </label>
          <input
            id="test-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="test-event-id" className="mb-1 block text-sm font-medium text-slate-700">
            Event ID
          </label>
          <input
            id="test-event-id"
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
        >
          {busy ? "Sending..." : "Send event"}
        </button>
        <button
          type="button"
          onClick={() => setEventId(randomId())}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          New event ID
        </button>
      </div>
      {result && (
        <p role="status" className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {result}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
