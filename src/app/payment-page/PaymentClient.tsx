"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get("orderId");

  const [busy, setBusy] = useState<null | "paid" | "cancelled">(null);
  const [err, setErr] = useState<string | null>(null);

  const setStatus = async (status: "paid" | "cancelled") => {
    if (!orderId) return;

    try {
      setBusy(status);
      setErr(null);

      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Something went wrong");
      }

      if (status === "paid") router.push(`/success?orderId=${orderId}`);
      else router.push(`/`);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-pink-200 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-3xl bg-white/70 shadow-xl backdrop-blur p-8">
        <h1 className="text-center text-3xl font-extrabold text-pink-700">
          Payment Page
        </h1>

        {!orderId ? (
          <div className="mt-8 text-center text-red-600 font-semibold">
            Missing orderId
          </div>
        ) : (
          <>
            {err && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700">
                {err}
              </div>
            )}

            <div className="mt-8 rounded-2xl bg-pink-50 border border-pink-200 p-6">
              <div className="text-sm text-pink-800/80">Order ID</div>
              <div className="mt-1 font-mono text-xs text-pink-900 break-all">
                {orderId}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  disabled={busy !== null}
                  onClick={() => setStatus("paid")}
                  className="w-full rounded-xl bg-pink-700 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy === "paid" ? "Marking paid..." : "I Have Paid"}
                </button>

                <button
                  disabled={busy !== null}
                  onClick={() => setStatus("cancelled")}
                  className="w-full rounded-xl border border-pink-300 py-3 font-semibold text-pink-800 disabled:opacity-50"
                >
                  {busy === "cancelled" ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
