"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get("orderId");

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-pink-200 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-3xl bg-white/70 shadow-xl backdrop-blur p-8 text-center">
        <h1 className="text-3xl font-extrabold text-pink-700">
          Payment Success
        </h1>
        <p className="mt-2 text-pink-800/70">
          Your order is confirmed.
        </p>
        {orderId && (
          <div className="mt-4 text-xs font-mono text-pink-900 break-all">
            {orderId}
          </div>
        )}
        <button
          onClick={() => router.push("/")}
          className="mt-8 w-full rounded-xl bg-pink-700 py-3 font-semibold text-white"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}