"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.order) setOrderDetails(data.order);
      })
      .catch(() => null);
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-pink-200 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white/70 p-8 shadow-xl backdrop-blur">
        <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl mb-4 text-emerald-700">
          ✓
        </div>

        <h1 className="text-center text-3xl font-extrabold text-pink-700">
          Payment & Dispense Confirmed
        </h1>

        <div className="mt-6 rounded-2xl border border-pink-200 bg-pink-50 p-5 text-center">
          <p className="text-lg font-bold text-pink-900">
            Thank you! Your sanitary hygiene product has been dispensed.
          </p>

          {/* Collection Tray Alert */}
          <div className="mt-4 rounded-xl bg-emerald-100/70 border border-emerald-300 p-3 text-xs text-emerald-900 font-semibold text-left">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <span>📦</span> Collection Tray Unlocked:
            </div>
            <div>Please push the acrylic flap at the bottom of the vending machine and retrieve your sanitary napkin package.</div>
          </div>

          {orderId && (
            <div className="mt-4 text-left border-t border-pink-200 pt-3 text-xs text-pink-900">
              <div className="flex justify-between py-1">
                <span className="text-pink-700 font-medium">Order ID:</span>
                <span className="font-mono text-[11px] font-bold">{orderId}</span>
              </div>
              {orderDetails?.products?.name && (
                <div className="flex justify-between py-1">
                  <span className="text-pink-700 font-medium">Item:</span>
                  <span className="font-bold">{orderDetails.products.name} (Qty: {orderDetails.qty})</span>
                </div>
              )}
              {orderDetails?.payment_method && (
                <div className="flex justify-between py-1">
                  <span className="text-pink-700 font-medium">Method:</span>
                  <span className="font-bold capitalize">{orderDetails.payment_method.replace("_", " ")}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/subscription"
            className="block w-full rounded-xl bg-gradient-to-r from-fuchsia-700 to-rose-600 py-3 text-center font-bold text-white shadow text-sm hover:opacity-90 transition"
          >
            💳 View My Annual Pass
          </Link>
          <Link
            href="/"
            className="block w-full rounded-xl border border-pink-300 bg-white/80 py-3 text-center font-bold text-pink-800 text-sm hover:bg-white transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 font-semibold text-pink-800">Loading receipt...</div>}>
      <SuccessContent />
    </Suspense>
  );
}