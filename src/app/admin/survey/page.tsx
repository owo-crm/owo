"use client";

import { useEffect, useMemo, useState } from "react";
import { formatSurveyValue } from "@/config/survey-value-labels";

type StatsResponse = {
  ok: boolean;
  totals?: {
    submissions: number;
    withTelegram: number;
    preferredTelegram: number;
    preferredEmail: number;
  };
  breakdowns?: Record<string, Record<string, number>>;
  comparisons?: Array<{
    fieldKey: string;
    sampleSize: number;
    winner: {
      value: string;
      votes: number;
      share: number;
    } | null;
    runnerUp: {
      value: string;
      votes: number;
      share: number;
    } | null;
    marginVotes: number;
    marginShare: number;
  }>;
  questionBreakdowns?: Record<string, Record<string, number>>;
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

const QUESTION_TITLES: Record<string, string> = {
  businessType: "Business type",
  teamSize: "Team size",
  mainPain: "Main pain",
  currentToolStack: "Current tool stack",
  primaryPriority: "Primary priority",
  preferredWorkspace: "Preferred workspace",
  preferredStyle: "Preferred style",
  willingnessToPay: "Willingness to pay",
  earlyAccessInterest: "Early access interest",
  acquisitionChannel: "Acquisition source",
  preferredContact: "Preferred contact",
  featurePriorities: "Feature priorities (multi)",
};

function BreakdownTable({
  title,
  fieldKey,
  values,
}: {
  title: string;
  fieldKey: string;
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
              <p className="truncate text-sm text-white/75">{formatSurveyValue(fieldKey, label)}</p>
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

  const recentSorted = useMemo(() => {
    const rows = [...(data?.recent ?? [])];
    rows.sort(
      (a, b) => new Date(b.contact.createdAt).getTime() - new Date(a.contact.createdAt).getTime(),
    );
    return rows;
  }, [data?.recent]);

  const comparisonRows = useMemo(() => {
    const direct = data?.comparisons ?? [];
    if (direct.length > 0) {
      return direct.map((item) => ({
        ...item,
        title: QUESTION_TITLES[item.fieldKey] ?? item.fieldKey,
      }));
    }

    // Backward-compatible fallback if the API doesn't include comparisons yet.
    return Object.entries(data?.questionBreakdowns ?? {})
      .map(([fieldKey, values]) => {
        const ranked = Object.entries(values).sort((a, b) => b[1] - a[1]);
        const sampleSize = ranked.reduce((acc, [, count]) => acc + count, 0);
        const winner = ranked[0];
        const runnerUp = ranked[1];
        const winnerVotes = winner?.[1] ?? 0;
        const runnerUpVotes = runnerUp?.[1] ?? 0;
        const winnerShare = sampleSize > 0 ? Math.round((winnerVotes / sampleSize) * 100) : 0;
        const runnerUpShare = sampleSize > 0 ? Math.round((runnerUpVotes / sampleSize) * 100) : 0;
        return {
          fieldKey,
          title: QUESTION_TITLES[fieldKey] ?? fieldKey,
          sampleSize,
          winner: winner
            ? {
                value: winner[0],
                votes: winnerVotes,
                share: winnerShare,
              }
            : null,
          runnerUp: runnerUp
            ? {
                value: runnerUp[0],
                votes: runnerUpVotes,
                share: runnerUpShare,
              }
            : null,
          marginVotes: Math.max(0, winnerVotes - runnerUpVotes),
          marginShare: Math.max(0, winnerShare - runnerUpShare),
        };
      })
      .sort((a, b) => b.marginVotes - a.marginVotes);
  }, [data?.comparisons, data?.questionBreakdowns]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070910] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(58% 45% at 8% 7%, rgba(255,95,102,0.18) 0%, transparent 70%), radial-gradient(48% 40% at 94% 3%, rgba(107,127,240,0.24) 0%, transparent 74%)",
        }}
      />
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="app-fade-up">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9db0ff]">
            OWO CRM
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:mt-2 sm:text-3xl">Early Access Stats</h1>
        </div>

        {loading ? <p className="text-white/70">Loading...</p> : null}
        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error && data?.totals ? (
          <>
            <section className="app-fade-up grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
              <div className="rounded-2xl border border-white/12 bg-[linear-gradient(140deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] p-3.5 sm:p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">
                  Total submissions
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.totals.submissions}</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-[linear-gradient(140deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] p-3.5 sm:p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">
                  With Telegram
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.totals.withTelegram}</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-[linear-gradient(140deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] p-3.5 sm:p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">
                  Preferred Telegram
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.totals.preferredTelegram}</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-[linear-gradient(140deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] p-3.5 sm:p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">
                  Preferred Email
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.totals.preferredEmail}</p>
              </div>
            </section>

            <section className="app-fade-up rounded-2xl border border-white/12 bg-[linear-gradient(140deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] p-3.5 sm:p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/70">
                Majority vote by question
              </h2>
              <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {comparisonRows.map((row) => (
                  <article
                    key={row.fieldKey}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <p className="text-xs uppercase tracking-[0.12em] text-white/50">{row.title}</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatSurveyValue(row.fieldKey, row.winner?.value ?? "-")}
                    </p>
                    <p className="text-xs text-[#a8b6ff]">{row.winner?.votes ?? 0} votes</p>
                    <p className="mt-1 text-xs text-white/60">
                      Share: {row.winner?.share ?? 0}% | Margin: {row.marginVotes} votes ({row.marginShare}%)
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      Runner-up:{" "}
                      {row.runnerUp
                        ? `${formatSurveyValue(row.fieldKey, row.runnerUp.value)} (${row.runnerUp.votes})`
                        : "-"}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ff5f66] to-[#6b7ff0]"
                        style={{ width: `${Math.min(Math.max(row.winner?.share ?? 0, 0), 100)}%` }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="app-fade-up grid gap-2.5 md:grid-cols-2 xl:grid-cols-3 sm:gap-3">
              <BreakdownTable title="Language" fieldKey="language" values={data.breakdowns?.language} />
              <BreakdownTable title="Business type" fieldKey="businessType" values={data.breakdowns?.businessType} />
              <BreakdownTable title="Team size" fieldKey="teamSize" values={data.breakdowns?.teamSize} />
              <BreakdownTable
                title="Preferred workspace"
                fieldKey="preferredWorkspace"
                values={data.breakdowns?.preferredWorkspace}
              />
              <BreakdownTable
                title="Willingness to pay"
                fieldKey="willingnessToPay"
                values={data.breakdowns?.willingnessToPay}
              />
              <BreakdownTable
                title="Early access interest"
                fieldKey="earlyAccessInterest"
                values={data.breakdowns?.earlyAccessInterest}
              />
            </section>

            <section className="app-fade-up grid gap-2.5 md:grid-cols-2 xl:grid-cols-3 sm:gap-3">
              {Object.entries(data.questionBreakdowns ?? {}).map(([key, values]) => (
                <BreakdownTable
                  key={key}
                  title={QUESTION_TITLES[key] ?? key}
                  fieldKey={key}
                  values={values}
                />
              ))}
            </section>

            <section className="app-fade-up rounded-2xl border border-white/12 bg-[linear-gradient(140deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%)] p-3.5 sm:p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/70">
                Recent submissions
              </h2>
              <div className="mt-3 space-y-2.5 md:hidden">
                {recentSorted.map((row) => (
                  <article key={row.contact.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-white/55">{formatDate(row.contact.createdAt)}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{row.contact.name}</p>
                    <p className="text-sm text-white/80">{row.contact.email}</p>
                    <p className="mt-2 text-xs text-white/65">
                      Telegram: {row.contact.telegram || "-"} | Team: {row.survey?.teamSize ?? "-"}
                    </p>
                  </article>
                ))}
              </div>
              <div className="mt-4 hidden overflow-x-auto md:block">
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
                    {recentSorted.map((row) => (
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

