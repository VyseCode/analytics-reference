"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EventResult } from "@/lib/queries";

type Params = {
  limit: number;
  offset: number;
  name: string;
  visitorId: string;
  sort: "asc" | "desc";
};

type Props = { siteId: string; data: EventResult; params: Params };

export function EventsExplorer({ siteId, data, params }: Props) {
  const router = useRouter();
  const [name, setName] = useState(params.name);
  const [visitorId, setVisitorId] = useState(params.visitorId);
  const [sort, setSort] = useState(params.sort);
  const [limit, setLimit] = useState(params.limit);

  function navigate(next: Partial<Params>) {
    const merged: Params = {
      limit: next.limit ?? limit,
      offset: next.offset ?? 0,
      name: next.name ?? name,
      visitorId: next.visitorId ?? visitorId,
      sort: next.sort ?? sort,
    };
    const query = new URLSearchParams();
    query.set("limit", String(merged.limit));
    query.set("offset", String(merged.offset));
    if (merged.name) query.set("name", merged.name);
    if (merged.visitorId) query.set("visitorId", merged.visitorId);
    query.set("sort", merged.sort);
    router.push(`/sites/${siteId}/events?${query.toString()}`);
  }

  const { events, pagination } = data;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({});
        }}
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-5"
      >
        <div className="sm:col-span-2">
          <label htmlFor="filter-name" className="mb-1 block text-xs font-medium text-slate-600">
            Event name
          </label>
          <input
            id="filter-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. pageview"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="filter-visitor" className="mb-1 block text-xs font-medium text-slate-600">
            Visitor ID
          </label>
          <input
            id="filter-visitor"
            value={visitorId}
            onChange={(event) => setVisitorId(event.target.value)}
            placeholder="e.g. visitor-blog-1"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="filter-sort" className="mb-1 block text-xs font-medium text-slate-600">
            Sort
          </label>
          <select
            id="filter-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as "asc" | "desc")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          Apply filters
        </button>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {events.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700">No events found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try widening the filters or collecting some events.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Visitor</th>
                  <th className="px-4 py-3">URL</th>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{event.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{event.visitorId}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">{event.url}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                      {event.referrer || "direct"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.device.type}
                      {event.device.browser ? ` · ${event.device.browser}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          {pagination.total} total · showing {events.length} (offset {pagination.offset})
        </span>
        <div className="flex items-center gap-2">
          <label htmlFor="page-limit" className="text-xs">
            Per page
          </label>
          <select
            id="page-limit"
            value={limit}
            onChange={(event) => navigate({ limit: Number(event.target.value) })}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {[10, 20, 50, 100].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pagination.offset === 0}
            onClick={() => navigate({ offset: Math.max(0, pagination.offset - pagination.limit) })}
            className="rounded-md border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!pagination.hasMore}
            onClick={() => navigate({ offset: pagination.offset + pagination.limit })}
            className="rounded-md border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
