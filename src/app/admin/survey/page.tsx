"use client";

import { useEffect, useMemo, useState } from "react";

type StatsResponse = {
  ok: boolean;
  totals?: {
    submissions: number;
    withTelegram: number;
    preferredTelegram: number;
    preferredEmail: number;
  };
  breakdowns?: Record<string, Record<string, number>>;
  recent?: Array<{
    contact: {
      id: string;
      name: string;
      email: string;
      telegram: string;
      preferredContact: string;
      language: string;
      createdAt: string;
    };
    survey: {
      businessType: string;
      teamSize: string;
      preferredWorkspace: string;
      willingnessToPay: string;
      earlyAccessInterest: string;
    } | null;
  }>;
  error?: string;
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function BreakdownTable({
  title,
  values,
}: {
  title: string;
  values: Record<string, number> | undefined;
}) {
  const items = useMemo(() => {
    if (!values) {
      return [];
    }

    return Object.entries(values).sort((a, b) => b[1] - a[1]);
  }, [values]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/70">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-white/50">No data</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map(([label, count]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <p className="truncate text-sm text-white/75">{label}</p>
              <p className="text-sm font-semibold text-white">{count}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SurveyAdminPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(window.location.href);
        const token = url.searchParams.get("token");
        const endpoint = token
          ? `/api/early-access/stats?token=${encodeURIComponent(token)}`
          : "/api/early-access/stats";

        const response = await fetch(endpoint, { cache: "no-store" });
        const json = (await response.json()) as StatsResponse;

        if (!response.ok || !json.ok) {
          throw new Error(json.error ?? "Failed to load stats");
        }

        setData(json);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#090b12] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            OWO CRM
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Early Access Stats</h1>
        </div>

        {loading ? <p className="text-white/70">Loading...</p> : null}
        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && data?.totals ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">
                  Total submissions
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.totals.submissions}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">
                  With Telegram
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.totals.withTelegram}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">
                  Preferred Telegram
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.totals.preferredTelegram}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">
                  Preferred Email
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.totals.preferredEmail}</p>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <BreakdownTable title="Language" values={data.breakdowns?.language} />
              <BreakdownTable title="Business type" values={data.breakdowns?.businessType} />
              <BreakdownTable title="Team size" values={data.breakdowns?.teamSize} />
              <BreakdownTable
                title="Preferred workspace"
                values={data.breakdowns?.preferredWorkspace}
              />
              <BreakdownTable
                title="Willingness to pay"
                values={data.breakdowns?.willingnessToPay}
              />
              <BreakdownTable
                title="Early access interest"
                values={data.breakdowns?.earlyAccessInterest}
              />
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/70">
                Recent submissions
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-white/50">
                    <tr className="border-b border-white/10">
                      <th className="px-2 py-2 font-medium">Date</th>
                      <th className="px-2 py-2 font-medium">Name</th>
                      <th className="px-2 py-2 font-medium">Email</th>
                      <th className="px-2 py-2 font-medium">Telegram</th>
                      <th className="px-2 py-2 font-medium">Business type</th>
                      <th className="px-2 py-2 font-medium">Team</th>
                      <th className="px-2 py-2 font-medium">Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.recent ?? []).map((row) => (
                      <tr key={row.contact.id} className="border-b border-white/6">
                        <td className="px-2 py-2 text-white/70">
                          {formatDate(row.contact.createdAt)}
                        </td>
                        <td className="px-2 py-2">{row.contact.name}</td>
                        <td className="px-2 py-2">{row.contact.email}</td>
                        <td className="px-2 py-2">{row.contact.telegram || "-"}</td>
                        <td className="px-2 py-2">{row.survey?.businessType ?? "-"}</td>
                        <td className="px-2 py-2">{row.survey?.teamSize ?? "-"}</td>
                        <td className="px-2 py-2">{row.survey?.willingnessToPay ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

