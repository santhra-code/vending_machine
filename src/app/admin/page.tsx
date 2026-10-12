"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Stats = {
  totalUsersPurchased: number;
  totalVisitors: number;
  totalProductsSold: number;
  totalRevenue: number;
  totalSubscribers?: number;
  totalDispensedPads?: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats>({
    totalUsersPurchased: 0,
    totalVisitors: 0,
    totalProductsSold: 0,
    totalRevenue: 0,
    totalSubscribers: 0,
    totalDispensedPads: 0,
  });

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }),
    []
  );

  const fetchStats = async () => {
    setLoading(true);
    setErr(null);

    const res = await fetch("/api/admin/stats");
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(json?.error ?? `Failed to load stats (HTTP ${res.status})`);
      setLoading(false);
      return;
    }

    setStats({
      totalUsersPurchased: Number(json?.data?.totalUsersPurchased ?? 0),
      totalVisitors: Number(json?.data?.totalVisitors ?? 0),
      totalProductsSold: Number(json?.data?.totalProductsSold ?? 0),
      totalRevenue: Number(json?.data?.totalRevenue ?? 0),
      totalSubscribers: Number(json?.data?.totalSubscribers ?? 0),
      totalDispensedPads: Number(json?.data?.totalDispensedPads ?? 0),
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const logout = async () => {
    setBusy("logout");
    setErr(null);

    const res = await fetch("/api/admin/logout", { method: "POST" });
    setBusy(null);

    if (!res.ok) {
      setErr("Logout failed");
      return;
    }

    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-fuchsia-100 to-rose-200 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white/65 shadow-2xl backdrop-blur-xl border border-white/60 p-8 md:p-10">
          {/* Top bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/85 px-4 py-2 text-xs font-bold text-white shadow">
                ADMIN PANEL • DIGITAL VENDING
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-rose-700 bg-clip-text text-transparent">
                  Dashboard Overview
                </span>
              </h1>
              <p className="mt-2 text-slate-700">
                Sales, Annual Pass subscribers, coins, and motorized dispensing metrics
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/"
                className="rounded-2xl border border-white/70 bg-white/60 px-4 py-2 font-semibold text-slate-900 shadow-sm hover:bg-white/80 transition text-sm"
              >
                View Store
              </a>
              <a
                href="/kiosk"
                className="rounded-2xl bg-indigo-700 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-800 transition text-sm"
              >
                Open Kiosk Mode
              </a>
              <button
                disabled={busy === "logout"}
                onClick={logout}
                className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50 transition text-sm"
              >
                {busy === "logout" ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>

          {/* Errors */}
          {err && (
            <pre className="mt-6 whitespace-pre-wrap rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm overflow-auto">
              {err}
            </pre>
          )}

          {/* Stat cards */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard
              loading={loading}
              title="Total Users Purchased"
              value={stats.totalUsersPurchased}
              hint="Paid & QR pass transactions"
              accent="from-emerald-600 to-teal-600"
              bg="bg-white/75"
            />
            <StatCard
              loading={loading}
              title="Annual Pass Subscribers"
              value={stats.totalSubscribers ?? 0}
              hint="Active 1-Year Member QR Passes"
              accent="from-fuchsia-600 to-pink-600"
              bg="bg-white/75"
            />
            <StatCard
              loading={loading}
              title="Total Products Sold / Dispensed"
              value={stats.totalProductsSold}
              hint="Pads dispensed into tray"
              accent="from-rose-600 to-amber-600"
              bg="bg-white/75"
            />
            <StatCard
              loading={loading}
              title="Total Revenue (Cash/UPI)"
              value={money.format(stats.totalRevenue)}
              hint="Sum of online & coin payments"
              accent="from-amber-600 to-orange-600"
              bg="bg-white/75"
            />
            <StatCard
              loading={loading}
              title="Total Visitors"
              value={stats.totalVisitors}
              hint="Unique daily kiosk interactions"
              accent="from-indigo-600 to-fuchsia-600"
              bg="bg-white/75"
            />
            <StatCard
              loading={loading}
              title="Hardware Dispensing Cycles"
              value={stats.totalDispensedPads ?? 0}
              hint="Motor actuations logged"
              accent="from-cyan-600 to-blue-600"
              bg="bg-white/75"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              disabled={loading}
              onClick={fetchStats}
              className="rounded-2xl border border-white/70 bg-white/60 px-5 py-3 font-semibold text-slate-900 shadow-sm hover:bg-white/80 disabled:opacity-50 transition text-sm"
            >
              {loading ? "Loading..." : "Refresh Stats"}
            </button>

            <a
              href="/admin/products"
              className="rounded-2xl bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-rose-700 px-5 py-3 font-semibold text-white shadow hover:opacity-95 transition text-center text-sm"
            >
              Manage Products & Stock
            </a>

            <a
              href="/admin/subscriptions"
              className="rounded-2xl bg-fuchsia-700 px-5 py-3 font-semibold text-white shadow hover:bg-fuchsia-800 transition text-center text-sm"
            >
              Manage 1-Year Subscriptions & Passes
            </a>
          </div>

          <div className="mt-8 text-xs text-slate-600">
            Note: “Total Visitors” will remain 0 until you enable visitor tracking
            (see below).
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard(props: {
  title: string;
  value: number | string;
  hint: string;
  accent: string;
  bg: string;
  loading: boolean;
}) {
  return (
    <div className={`rounded-[1.5rem] ${props.bg} border border-white/60 shadow-xl backdrop-blur p-5`}>
      <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${props.accent}`} />
      <div className="mt-4 text-sm font-semibold text-slate-700">{props.title}</div>
      <div className="mt-2 text-3xl font-extrabold text-slate-900">
        {props.loading ? "…" : props.value}
      </div>
      <div className="mt-2 text-xs text-slate-600">{props.hint}</div>
    </div>
  );
}