"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FunnelResultDTO } from "@/lib/types";

type Props = { siteId: string; funnels: FunnelResultDTO[]; days: number };

export function FunnelsClient({ siteId, funnels, days }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [steps, setSteps] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/funnels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          steps: steps
            .split(",")
            .map((step) => step.trim())
            .filter(Boolean),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not create funnel");
        return;
      }
      setName("");
      setSteps("");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, funnelName: string) {
    if (!window.confirm(`Delete funnel "${funnelName}"?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/sites/${siteId}/funnels/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not delete funnel");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <label htmlFor="funnel-days" className="text-sm font-medium text-slate-600">
          Date range
        </label>
        <select
          id="funnel-days"
          value={days}
          onChange={(event) =>
            router.push(`/sites/${siteId}/funnels?days=${event.target.value}`)
          }
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">New funnel</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter ordered event names separated by commas. A single step is allowed.
        </p>
        <form onSubmit={create} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="funnel-name" className="mb-1 block text-sm font-medium text-slate-700">
              Funnel name
            </label>
            <input
              id="funnel-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              placeholder="Onboarding"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="funnel-steps" className="mb-1 block text-sm font-medium text-slate-700">
              Steps
            </label>
            <input
              id="funnel-steps"
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              required
              placeholder="pageview, signup, purchase"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create funnel"}
            </button>
          </div>
        </form>
      </section>

      {funnels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No funnels yet</p>
          <p className="mt-1 text-sm text-slate-500">Create one above to track conversions.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {funnels.map((funnel) => (
            <section
              key={funnel.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{funnel.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Overall conversion: {funnel.overallConversion}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(funnel.id, funnel.name)}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  Delete
                </button>
              </div>
              <ol className="mt-4 space-y-3">
                {funnel.steps.map((step, index) => (
                  <li key={`${step.name}-${index}`}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {index + 1}. {step.name}
                      </span>
                      <span className="text-slate-500">
                        {step.visitors} visitors · {step.conversionFromPrevious}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.max(2, step.conversionFromFirst)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
