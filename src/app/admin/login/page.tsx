"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(json?.error ?? `Login failed (HTTP ${res.status})`);
        setBusy(false);
        return;
      }

      setBusy(false);
      // Hard navigation ensures cookies are recognized by middleware immediately
      window.location.href = "/admin";
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message ?? "Network error");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-pink-300 bg-white/80 px-4 py-3 " +
    "text-pink-900 placeholder:text-pink-400 " +
    "outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500";

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-pink-200 px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white/70 shadow-xl backdrop-blur p-8">
        <h1 className="text-center text-3xl font-extrabold text-pink-700">
          Admin Login
        </h1>

        {err && (
          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            {err}
          </pre>
        )}

        <div className="mt-8 space-y-3">
          <input
            className={inputClass}
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className={inputClass}
            placeholder="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={busy}
            onClick={submit}
            className="w-full rounded-xl bg-pink-700 py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Login"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl border border-pink-300 py-3 font-semibold text-pink-800"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}