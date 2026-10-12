"use client";

import { useEffect, useState } from "react";
import type { Subscription } from "@/lib/types";

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // New Pass Form
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [planName, setPlanName] = useState("1-Year Student Annual Hygiene Pass");
  const [busy, setBusy] = useState(false);

  const fetchSubs = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/subscription/create");
      const json = await res.json().catch(() => null);
      if (json?.data) {
        setSubs(json.data);
      }
    } catch (e: any) {
      setErr(e.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleIssuePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !userPhone.trim()) {
      setErr("Please fill in all fields.");
      return;
    }

    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
          plan_name: planName,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || json?.error) {
        throw new Error(json?.error || "Failed to issue pass");
      }

      setOkMsg(`Pass issued successfully! Member Code: ${json.data.card_code}`);
      setUserName("");
      setUserEmail("");
      setUserPhone("");
      fetchSubs();
    } catch (e: any) {
      setErr(e.message || "Error issuing pass");
    } finally {
      setBusy(false);
    }
  };

  const filtered = subs.filter((s) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      s.user_name.toLowerCase().includes(needle) ||
      s.user_email.toLowerCase().includes(needle) ||
      s.card_code.toLowerCase().includes(needle) ||
      s.user_phone.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-fuchsia-100 to-rose-200 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white/70 shadow-2xl backdrop-blur-xl border border-white/60 p-6 md:p-10">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pink-200/60 pb-6 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/85 px-4 py-1.5 text-xs font-bold text-white shadow">
                ADMINISTRATION • ANNUAL SUBSCRIPTIONS
              </div>
              <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900">
                1-Year Member Pass Management
              </h1>
              <p className="text-xs md:text-sm text-slate-600">
                Issue passes, inspect QR tokens, and monitor monthly and annual pad quotas
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/admin"
                className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-2 font-semibold text-slate-800 text-xs shadow-sm hover:bg-white transition"
              >
                ← Back to Dashboard
              </a>
              <a
                href="/subscription"
                className="rounded-2xl bg-fuchsia-700 px-4 py-2 font-semibold text-white text-xs shadow hover:bg-fuchsia-800 transition"
              >
                Open Member Portal
              </a>
            </div>
          </div>

          {err && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-xs font-semibold">
              {err}
            </div>
          )}

          {okMsg && (
            <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs font-bold">
              {okMsg}
            </div>
          )}

          {/* Issue Pass Form */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-200/80 p-5">
            <h2 className="text-base font-extrabold text-fuchsia-950 mb-3 flex items-center gap-1.5">
              <span>🎟️</span> Issue New 1-Year Pass
            </h2>

            <form onSubmit={handleIssuePass} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="User Full Name"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="rounded-xl border border-pink-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="rounded-xl border border-pink-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
              <input
                type="tel"
                placeholder="Mobile / WhatsApp"
                required
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="rounded-xl border border-pink-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-gradient-to-r from-fuchsia-700 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-50 transition"
              >
                {busy ? "Issuing..." : "Issue & Generate Pass"}
              </button>
            </form>
          </div>

          {/* Filter & Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <input
              type="text"
              placeholder="Search by name, email, or card code..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400"
            />
            <div className="text-xs font-semibold text-slate-600">
              Showing {filtered.length} of {subs.length} active subscribers
            </div>
          </div>

          {/* Subscribers Table */}
          {loading ? (
            <div className="text-center py-16 text-slate-600 font-semibold text-sm">
              Loading subscribers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-600 font-semibold text-sm">
              No matching subscribers found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-pink-200/80 bg-white/80">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-fuchsia-50 text-fuchsia-950 font-bold uppercase text-[10px] tracking-wider border-b border-pink-200">
                  <tr>
                    <th className="px-4 py-3">Member Code</th>
                    <th className="px-4 py-3">Subscriber</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Quota (Remaining / Total)</th>
                    <th className="px-4 py-3">Valid Until</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100">
                  {filtered.map((s) => {
                    const remaining = Math.max(0, s.annual_quota - s.used_quota);
                    return (
                      <tr key={s.id} className="hover:bg-fuchsia-50/40 transition">
                        <td className="px-4 py-3 font-mono font-bold text-fuchsia-900">
                          {s.card_code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{s.user_name}</div>
                          <div className="text-slate-500 text-[11px]">{s.user_email} • {s.user_phone}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{s.plan_name}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-fuchsia-900">{remaining}</span> / {s.annual_quota} pads
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{s.valid_until}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
