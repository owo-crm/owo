"use client";

import {
  Activity,
  Bell,
  Clock,
  DollarSign,
  Megaphone,
  MessageSquare,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client-session";
import type { FinanceKpiSnapshot, LeadOutcomePoint } from "@/lib/types/domain";

const baseMetricsData = [
  {
    title: "Active Leads",
    value: "156",
    change: "+12.5% from last week",
    icon: Users,
  },
  {
    title: "Leads Conversion",
    value: "28.4%",
    change: "+3.1% from last week",
    icon: Target,
  },
  {
    title: "Response Lag",
    value: "2.4h",
    change: "+6.0% from last week",
    icon: Clock,
  },
];

const quickActions = [
  { label: "Add Lead", icon: Plus, color: "bg-blue-100 text-blue-600" },
  { label: "Create Task", icon: Activity, color: "bg-green-100 text-green-600" },
  { label: "Assign Owner", icon: Users, color: "bg-purple-100 text-purple-600" },
  { label: "Alerts", icon: Bell, color: "bg-amber-100 text-amber-600" },
];

const activityTimeline = [
  {
    id: "SJ",
    user: "Sarah Johnson",
    action: "moved lead to Qualified",
    target: "Acme Corp",
    time: "2 hours ago",
  },
  {
    id: "MC",
    user: "Mike Chen",
    action: "created task for",
    target: "Tech Solutions",
    time: "4 hours ago",
  },
  {
    id: "EW",
    user: "Emma Wilson",
    action: "marked task done for",
    target: "Global Enterprises",
    time: "6 hours ago",
  },
  {
    id: "DB",
    user: "David Brown",
    action: "added note to",
    target: "Innovation Labs",
    time: "1 day ago",
  },
];

const notifications = [
  {
    title: "Follow-up Required",
    subtitle: "Acme Corp - no contact for 3 days",
    time: "1 hour ago",
    tone: "high" as const,
  },
  {
    title: "Task Overdue",
    subtitle: "Call Tech Solutions - deadline passed",
    time: "2 hours ago",
    tone: "high" as const,
  },
  {
    title: "New Lead Assigned",
    subtitle: "You've been assigned Global Enterprises",
    time: "4 hours ago",
    tone: "normal" as const,
  },
  {
    title: "Stage Updated",
    subtitle: "Innovation Labs moved to Won",
    time: "1 day ago",
    tone: "normal" as const,
  },
];

export function DashboardPage() {
  const [range, setRange] = useState<"weekly" | "monthly">("monthly");
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [financeKpis, setFinanceKpis] = useState<FinanceKpiSnapshot>({
    revenue: 0,
    expenses: 0,
    net: 0,
    outstanding: 0,
  });
  const [outcomesData, setOutcomesData] = useState<Array<{ period: string; won: number; lost: number }>>([]);

  const metricsData = useMemo(
    () => [
      {
        title: "Total Revenue (period)",
        value: `$${financeKpis.revenue.toLocaleString()}`,
        change: `${range === "weekly" ? "This week" : "This month"} finance data`,
        icon: DollarSign,
      },
      ...baseMetricsData,
    ],
    [financeKpis.revenue, range],
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [financeResponse, outcomesResponse] = await Promise.all([
          apiFetch(`/api/v1/finance/summary?period=${range}`),
          apiFetch(`/api/v1/leads/outcomes?period=${range}`),
        ]);

        const financePayload = (await financeResponse.json()) as {
          ok: boolean;
          kpis: FinanceKpiSnapshot;
        };
        const outcomesPayload = (await outcomesResponse.json()) as {
          ok: boolean;
          series: LeadOutcomePoint[];
        };

        if (financePayload.ok) {
          setFinanceKpis(financePayload.kpis);
        }
        if (outcomesPayload.ok) {
          setOutcomesData(
            outcomesPayload.series.map((point) => ({
              period: point.period,
              won: point.won,
              lost: point.lost,
            })),
          );
        } else {
          setOutcomesData([]);
        }
      } catch (error) {
        console.error("Failed to load dashboard summary", error);
        setOutcomesData([]);
      }
    };

    void loadDashboardData();
  }, [range]);

  const chartData = useMemo(() => {
    if (outcomesData.length > 0) {
      return outcomesData;
    }
    return [
      { period: "No data", won: 0, lost: 0 },
    ];
  }, [outcomesData]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivityModalOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--app-text)]">Welcome back</h1>
        <p className="mt-1 text-[var(--app-muted)]">Operational snapshot.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricsData.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--app-muted)]">{metric.title}</p>
                  <p className="mt-1 text-2xl font-bold text-[var(--app-text)]">{metric.value}</p>
                </div>
                <div className="rounded-lg bg-[#2D5CFE]/10 p-2 text-[#2D5CFE]">
                  <Icon size={18} />
                </div>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                <TrendingUp size={14} />
                <span>{metric.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[var(--app-text)]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="group rounded-xl border border-[var(--app-border)] bg-[var(--app-muted-surface)] px-4 py-4 text-sm font-medium text-[var(--app-text)] transition hover:brightness-95"
              >
                <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${action.color} transition group-hover:scale-105`}>
                  <Icon size={18} />
                </div>
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">Recent Activity</h2>
            <button
              className="text-xs font-semibold text-[#2D5CFE] hover:underline"
              onClick={() => setActivityModalOpen(true)}
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {activityTimeline.slice(0, 3).map((item, index) => (
              <div
                key={`${item.id}-${item.target}`}
                className={`flex items-start gap-4 py-3 ${index !== activityTimeline.length - 1 ? "border-b border-[var(--app-border)]" : ""}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2D5CFE] text-base font-bold text-white">
                  {item.id}
                </div>
                <div className="min-w-0">
                  <p className="text-sm leading-tight text-[var(--app-text)]">
                    <span className="font-semibold">{item.user}</span>{" "}
                    <span className="text-[var(--app-muted)]">{item.action}</span>{" "}
                    <span className="font-semibold">{item.target}</span>
                  </p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--app-text)]">Notifications</h2>
          <div className="space-y-3">
            {notifications.map((item) => {
              const toneStyles =
                item.tone === "high"
                  ? "border-red-300 bg-[var(--app-notification-high-bg)]"
                  : "border-blue-300 bg-[var(--app-notification-normal-bg)]";
              const Icon = item.tone === "high" ? Megaphone : MessageSquare;
              return (
                <div key={item.title} className={`rounded-2xl border-l-4 p-4 ${toneStyles}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <Icon size={16} className={item.tone === "high" ? "text-red-500" : "text-blue-500"} />
                    <p className="text-base font-semibold text-[var(--app-text)]">{item.title}</p>
                  </div>
                  <p className="text-sm text-[var(--app-notification-text)]">{item.subtitle}</p>
                  <p className="mt-1 text-xs text-[var(--app-notification-text)]">{item.time}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--app-text)]">Won vs Lost Leads</h2>
            <p className="text-xs text-[var(--app-muted)]">Outcome trend by {range === "weekly" ? "week" : "month"}</p>
          </div>
          <div className="inline-flex rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-surface)] p-1">
            <button
              onClick={() => setRange("weekly")}
              className={`rounded-md px-3 py-1.5 text-sm ${range === "weekly" ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm" : "text-[var(--app-muted)]"}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setRange("monthly")}
              className={`rounded-md px-3 py-1.5 text-sm ${range === "monthly" ? "bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm" : "text-[var(--app-muted)]"}`}
            >
              Monthly
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" stroke="#64748b" />
            <YAxis allowDecimals={false} stroke="#64748b" />
            <Tooltip formatter={(value, name) => [Number(value ?? 0), name === "won" ? "Won" : "Lost"]} />
            <Bar dataKey="won" name="Won" fill="#22c55e" radius={[8, 8, 0, 0]} />
            <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {activityModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setActivityModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--app-text)]">All Recent Activity</h3>
              <button
              className="text-xs font-semibold text-[#2D5CFE] hover:underline"
              onClick={() => setActivityModalOpen(false)}
            >
              Close
            </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {activityTimeline.map((item, index) => (
                <div
                  key={`${item.id}-${item.target}-modal`}
                  className={`flex items-start gap-3 py-2 ${index !== activityTimeline.length - 1 ? "border-b border-[var(--app-border)]" : ""}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2D5CFE] text-xs font-bold text-white">
                    {item.id}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-tight text-[var(--app-text)]">
                      <span className="font-semibold">{item.user}</span>{" "}
                      <span className="text-[var(--app-muted)]">{item.action}</span>{" "}
                      <span className="font-semibold">{item.target}</span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
