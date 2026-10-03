"use client";

import AuthGuard from "./components/AuthGuard";
import { useEffect, useState } from "react";

type DashboardData = {
  tickets: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    breached: number;
  };
  priority: {
    urgent: number;
    high: number;
    normal: number;
  };
  csat: {
    average: number;
    total_ratings: number;
  };
};

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);

      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load dashboard");
      }

      setDashboard(data.dashboard);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <AuthGuard allowedRoles={["ADMIN"]}>
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold">Support Helpdesk</div>
          <p className="mt-2 text-slate-400">Loading dashboard...</p>
        </div>
      </main>
      </AuthGuard>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h1 className="text-xl font-semibold">Dashboard Error</h1>
          <p className="mt-2 text-slate-400">{error}</p>

          <button
            onClick={loadDashboard}
            className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const statCards = [
    {
      title: "Total Tickets",
      value: dashboard.tickets.total,
      description: "All support tickets",
    },
    {
      title: "Open",
      value: dashboard.tickets.open,
      description: "Waiting for action",
    },
    {
      title: "In Progress",
      value: dashboard.tickets.in_progress,
      description: "Currently being handled",
    },
    {
      title: "Resolved",
      value: dashboard.tickets.resolved,
      description: "Resolved tickets",
    },
    {
      title: "Closed",
      value: dashboard.tickets.closed,
      description: "Completed tickets",
    },
    {
      title: "SLA Breached",
      value: dashboard.tickets.breached,
      description: "Past their SLA deadline",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Support Helpdesk
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Ticket management & SLA monitoring
            </p>
          </div>

          <div className="flex items-center gap-3">
  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
    System Online
  </span>

  <a
    href="/tickets"
    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
  >
    Agent Console
  </a>

  <a
    href="/portal"
    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
  >
    Customer Portal
  </a>

  <button
    onClick={loadDashboard}
    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
  >
    Refresh
  </button>
</div>
        </div>
      </header>

      {/* Dashboard */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-400">
            Overview of support activity and service levels
          </p>
        </div>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{card.title}</p>

              <p className="mt-3 text-4xl font-bold">{card.value}</p>

              <p className="mt-2 text-xs text-slate-500">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        {/* Priority + CSAT */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Priority */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold">Priority Breakdown</h3>

            <div className="mt-6 space-y-5">
              <PriorityRow
                label="Urgent"
                value={dashboard.priority.urgent}
                total={dashboard.tickets.total}
              />

              <PriorityRow
                label="High"
                value={dashboard.priority.high}
                total={dashboard.tickets.total}
              />

              <PriorityRow
                label="Normal"
                value={dashboard.priority.normal}
                total={dashboard.tickets.total}
              />
            </div>
          </div>

          {/* CSAT */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold">Customer Satisfaction</h3>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-5xl font-bold">
                  {dashboard.csat.average.toFixed(1)}
                  <span className="text-2xl text-slate-500">/5</span>
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Average CSAT score
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-semibold">
                  {dashboard.csat.total_ratings}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Ratings received
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-sm text-slate-400">
                Customer feedback collected after ticket resolution.
              </p>
            </div>
          </div>
        </section>

        {/* SLA Alert */}
        <section
  className={`mt-6 rounded-2xl border p-6 ${
    dashboard.tickets.breached > 0
      ? "border-red-500/20 bg-red-500/5"
      : "border-emerald-500/20 bg-emerald-500/5"
  }`}
>
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <h3
        className={`text-lg font-semibold ${
          dashboard.tickets.breached > 0
            ? "text-red-300"
            : "text-emerald-300"
        }`}
      >
        {dashboard.tickets.breached > 0
          ? "SLA Attention Required"
          : "All SLAs On Track"}
      </h3>

      <p className="mt-1 text-sm text-slate-400">
        {dashboard.tickets.breached > 0
          ? "These tickets have passed their SLA deadline."
          : "There are currently no breached tickets."}
      </p>
    </div>

    <div
      className={`rounded-xl border px-5 py-3 text-center ${
        dashboard.tickets.breached > 0
          ? "border-red-500/20 bg-red-500/10"
          : "border-emerald-500/20 bg-emerald-500/10"
      }`}
    >
      <p
        className={`text-3xl font-bold ${
          dashboard.tickets.breached > 0
            ? "text-red-300"
            : "text-emerald-300"
        }`}
      >
        {dashboard.tickets.breached}
      </p>

      <p
        className={`text-xs ${
          dashboard.tickets.breached > 0
            ? "text-red-200/70"
            : "text-emerald-200/70"
        }`}
      >
        Breached tickets
      </p>
    </div>
  </div>
</section>
      </div>
    </main>
  );
}

function PriorityRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>

        <span className="text-sm font-semibold">
          {value}{" "}
          <span className="font-normal text-slate-500">
            ({percentage}%)
          </span>
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-slate-300 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}