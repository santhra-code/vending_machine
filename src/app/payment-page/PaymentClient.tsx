"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type PaymentMethod =
  | "qr"
  | "debit"
  | "cash"
  | "subscription_qr"
  | "coin"
  | "google_pay"
  | "razorpay";

export default function PaymentPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const rawOrderId = sp.get("orderId");
  const orderId = rawOrderId || "ord-demo-vending-6db8";

  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState(false);
  const [qrPaid, setQrPaid] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Order Details
  const [orderAmount, setOrderAmount] = useState<number>(35);
  const [productName, setProductName] = useState<string>("Sanitary Napkin Pack");
  const [orderQty, setOrderQty] = useState<number>(1);
  const [productId, setProductId] = useState<string>("prod-001");

  // Subscription QR State
  const [memberCode, setMemberCode] = useState<string>("SAN-2025-PRIYA");
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [subRemainingQuota, setSubRemainingQuota] = useState<number | null>(null);

  // Coin System State
  const [coinsInserted, setCoinsInserted] = useState<number>(0);
  const [coinChange, setCoinChange] = useState<number>(0);
  const [coinHistory, setCoinHistory] = useState<number[]>([]);

  // Google Pay State
  const [upiQrUrl, setUpiQrUrl] = useState<string | null>(null);
  const [upiIntentUri, setUpiIntentUri] = useState<string | null>(null);
  const [gpayLoading, setGpayLoading] = useState(false);

  // Dispensing State
  const [dispensingStage, setDispensingStage] = useState<
    "idle" | "verifying" | "actuating" | "dispensed"
  >("idle");

  // Fetch Order Details
  useEffect(() => {
    if (!rawOrderId) return;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${rawOrderId}/status`);
        const json = await res.json().catch(() => null);
        if (json?.order) {
          setOrderAmount(Number(json.order.amount ?? 35));
          setOrderQty(Number(json.order.qty ?? 1));
          setProductId(json.order.product_id ?? "prod-001");
          if (json.order.products?.name) {
            setProductName(json.order.products.name);
          }
        }
      } catch {
        // Fallback default values
      }
    })();
  }, [rawOrderId]);

  // Load UPI QR Code for Google Pay when selected
  useEffect(() => {
    if (selected === "google_pay" && !upiQrUrl) {
      setGpayLoading(true);
      fetch(`/api/payment/upi-qr?amount=${orderAmount}&orderId=${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.qrDataUrl) {
            setUpiQrUrl(data.qrDataUrl);
            setUpiIntentUri(data.gpayUri);
          }
        })
        .catch(() => null)
        .finally(() => setGpayLoading(false));
    }
  }, [selected, orderAmount, orderId, upiQrUrl]);

  // Handle Coin Insertion
  const handleInsertCoin = async (coinVal: number) => {
    setErr(null);
    try {
      const res = await fetch("/api/payment/coin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          coin: coinVal,
          amountRequired: orderAmount,
        }),
      });
      const json = await res.json().catch(() => null);
      if (json?.data) {
        setCoinsInserted(json.data.coins_inserted);
        setCoinChange(json.data.change_returned);
        setCoinHistory((prev) => [...prev, coinVal]);

        if (json.completed) {
          triggerDispenseCycle("coin");
        }
      }
    } catch (e: any) {
      setErr(e.message || "Failed to process coin");
    }
  };

  // Handle Coin Eject / Refund
  const handleEjectCoins = async () => {
    try {
      const res = await fetch("/api/payment/coin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "eject" }),
      });
      const json = await res.json().catch(() => null);
      if (json?.ok) {
        setCoinsInserted(0);
        setCoinHistory([]);
        setErr(`Coins returned: ₹${json.session.change_returned} returned to coin reject tray.`);
      }
    } catch {
      setCoinsInserted(0);
      setCoinHistory([]);
    }
  };

  // Handle Subscription QR Redemption
  const handleVerifySubscription = async () => {
    if (!memberCode.trim()) {
      setErr("Please enter or scan your Member Card QR Code.");
      return;
    }
    setBusy(true);
    setErr(null);

    try {
      const res = await fetch("/api/subscription/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_data: memberCode.trim(),
          product_id: productId,
          qty: orderQty,
          order_id: orderId,
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || json?.error) {
        throw new Error(json?.error || "Subscription verification failed");
      }

      setSubStatus(`Verified: ${json.user_name} (${json.plan_name})`);
      setSubRemainingQuota(json.remaining_quota);
      triggerDispenseCycle("subscription_qr");
    } catch (e: any) {
      setErr(e.message || "Failed to redeem subscription");
    } finally {
      setBusy(false);
    }
  };

  // Handle Razorpay Checkout
  const handleRazorpayPayment = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/payment/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: orderAmount,
          orderId,
        }),
      });
      const orderData = await res.json().catch(() => null);

      if (!res.ok || !orderData?.ok) {
        throw new Error(orderData?.error || "Failed to initialize Razorpay");
      }

      // Check if window.Razorpay SDK is loaded, otherwise run verified checkout
      const hasRazorpayWindow = typeof window !== "undefined" && (window as any).Razorpay;

      if (hasRazorpayWindow && !orderData.isSandbox) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Santra Digital Vending Machine",
          description: `Sanitary Napkins Order: ${orderId}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            await fetch("/api/payment/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              }),
            });
            triggerDispenseCycle("razorpay");
          },
          theme: { color: "#be185d" },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Sandbox Verified Test Flow
        await fetch("/api/payment/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `rzp_test_${Date.now()}`,
            razorpay_signature: "sandbox_simulated_sig",
            orderId,
          }),
        });
        triggerDispenseCycle("razorpay");
      }
    } catch (e: any) {
      setErr(e.message || "Razorpay error");
    } finally {
      setBusy(false);
    }
  };

  // Dispense cycle animation
  const triggerDispenseCycle = async (method: PaymentMethod) => {
    setDispensingStage("verifying");
    setCompleted(true);

    // Call order status API to record payment
    await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", payment_method: method }),
    }).catch(() => null);

    // Call hardware dispense trigger
    await fetch("/api/hardware/dispense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        orderId,
        method,
        slot: "Tray-A1",
        qty: orderQty,
      }),
    }).catch(() => null);

    setTimeout(() => {
      setDispensingStage("actuating");
    }, 1200);

    setTimeout(() => {
      setDispensingStage("dispensed");
    }, 2800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected === "cash") {
      setCashReceived(true);
      triggerDispenseCycle("cash");
    } else if (selected === "qr" && qrPaid) {
      triggerDispenseCycle("qr");
    } else if (selected === "debit") {
      triggerDispenseCycle("debit");
    } else if (selected === "google_pay") {
      triggerDispenseCycle("google_pay");
    } else if (selected === "subscription_qr") {
      handleVerifySubscription();
    } else if (selected === "razorpay") {
      handleRazorpayPayment();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-pink-200 flex flex-col items-center pt-8 pb-16 px-4">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <a
          href="/"
          className="text-sm font-semibold text-pink-800 hover:text-pink-900 flex items-center gap-1"
        >
          ← Back to Products
        </a>
        <a
          href="/subscription"
          className="text-xs bg-white/80 border border-pink-300 text-pink-800 font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-white"
        >
          💳 My Annual Pass
        </a>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-pink-700 text-center">
        Payment & Dispense
      </h1>

      <div className="bg-white/75 rounded-3xl shadow-xl backdrop-blur p-6 md:p-8 w-full max-w-lg border border-pink-200">
        {/* Order Summary Header */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 p-4">
          <div className="flex justify-between items-center text-xs text-pink-700 font-bold uppercase tracking-wider">
            <span>Order Summary</span>
            <span className="font-mono">{orderId.slice(0, 14)}...</span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <div>
              <div className="font-extrabold text-pink-950 text-base">{productName}</div>
              <div className="text-xs text-pink-800/80">Qty: {orderQty} • Slot: Tray-A1</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Amount Due</div>
              <div className="text-2xl font-black text-pink-700">₹{orderAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm font-medium">
            {err}
          </div>
        )}

        {!completed ? (
          <form onSubmit={handleSubmit}>
            <label className="block mb-3 font-bold text-base text-pink-900">
              Select Payment / Access Method:
            </label>

            {/* Methods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 text-slate-800">
              {/* Option 1: Personal Member QR (Annual Subscription) */}
              <label
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                  selected === "subscription_qr"
                    ? "bg-fuchsia-50 border-fuchsia-500 ring-2 ring-fuchsia-400"
                    : "bg-white/80 border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="subscription_qr"
                  checked={selected === "subscription_qr"}
                  onChange={() => setSelected("subscription_qr")}
                  className="mt-1 accent-fuchsia-600"
                />
                <div>
                  <div className="font-bold text-sm text-fuchsia-900 flex items-center gap-1">
                    <span>🎟️</span> Member QR Pass
                  </div>
                  <div className="text-xs text-fuchsia-700">1-Year Subscription (Free Quota)</div>
                </div>
              </label>

              {/* Option 2: Coin Acceptor System */}
              <label
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                  selected === "coin"
                    ? "bg-amber-50 border-amber-500 ring-2 ring-amber-400"
                    : "bg-white/80 border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="coin"
                  checked={selected === "coin"}
                  onChange={() => setSelected("coin")}
                  className="mt-1 accent-amber-600"
                />
                <div>
                  <div className="font-bold text-sm text-amber-950 flex items-center gap-1">
                    <span>🪙</span> Coin Machine
                  </div>
                  <div className="text-xs text-amber-700">Accepts ₹1, ₹2, ₹5, ₹10</div>
                </div>
              </label>

              {/* Option 3: Google Pay (UPI QR) */}
              <label
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                  selected === "google_pay"
                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-400"
                    : "bg-white/80 border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="google_pay"
                  checked={selected === "google_pay"}
                  onChange={() => setSelected("google_pay")}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <div className="font-bold text-sm text-blue-950 flex items-center gap-1">
                    <span>📱</span> Google Pay
                  </div>
                  <div className="text-xs text-blue-700">Dynamic UPI QR & GPay</div>
                </div>
              </label>

              {/* Option 4: Razorpay */}
              <label
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                  selected === "razorpay"
                    ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400"
                    : "bg-white/80 border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={selected === "razorpay"}
                  onChange={() => setSelected("razorpay")}
                  className="mt-1 accent-indigo-600"
                />
                <div>
                  <div className="font-bold text-sm text-indigo-950 flex items-center gap-1">
                    <span>⚡</span> Razorpay
                  </div>
                  <div className="text-xs text-indigo-700">Card, NetBanking & UPI</div>
                </div>
              </label>

              {/* Option 5: Standard QR Scanner (Preserved) */}
              <label
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                  selected === "qr"
                    ? "bg-pink-50 border-pink-500 ring-2 ring-pink-400"
                    : "bg-white/80 border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="qr"
                  checked={selected === "qr"}
                  onChange={() => setSelected("qr")}
                  className="mt-1 accent-pink-600"
                />
                <div>
                  <div className="font-bold text-sm text-pink-900">Vending Machine QR</div>
                  <div className="text-xs text-pink-700">Scan static dispenser QR</div>
                </div>
              </label>

              {/* Option 6: Debit Card (Preserved) */}
              <label
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition ${
                  selected === "debit"
                    ? "bg-pink-50 border-pink-500 ring-2 ring-pink-400"
                    : "bg-white/80 border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="debit"
                  checked={selected === "debit"}
                  onChange={() => setSelected("debit")}
                  className="mt-1 accent-pink-600"
                />
                <div>
                  <div className="font-bold text-sm text-pink-900">Debit Card</div>
                  <div className="text-xs text-pink-700">Insert card into slot</div>
                </div>
              </label>

              {/* Option 7: Cash Note (Preserved) */}
              <label
                className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition sm:col-span-2 ${
                  selected === "cash"
                    ? "bg-pink-50 border-pink-500 ring-2 ring-pink-400"
                    : "bg-white/80 border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={selected === "cash"}
                  onChange={() => setSelected("cash")}
                  className="mt-1 accent-pink-600"
                />
                <div>
                  <div className="font-bold text-sm text-pink-900">Cash Note Reader</div>
                  <div className="text-xs text-pink-700">Insert paper currency into bill validator</div>
                </div>
              </label>
            </div>

            {/* 1. PERSONAL MEMBER QR PANEL */}
            {selected === "subscription_qr" && (
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-fuchsia-50 to-pink-50 border border-fuchsia-200 p-5">
                <div className="text-sm font-extrabold text-fuchsia-900 flex items-center gap-1.5">
                  <span>🎟️</span> Scan or Enter Personal Member QR Code
                </div>
                <p className="mt-1 text-xs text-fuchsia-800/80">
                  Hold your personal QR card to the scanner, or enter your member code below:
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    placeholder="e.g. SAN-2025-PRIYA"
                    className="w-full rounded-xl border border-fuchsia-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono shadow-sm outline-none focus:ring-2 focus:ring-fuchsia-400"
                  />
                  <button
                    type="button"
                    onClick={handleVerifySubscription}
                    disabled={busy}
                    className="whitespace-nowrap rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? "Validating..." : "Verify & Dispense"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-fuchsia-800 font-semibold">Quick Demo Passes:</span>
                  <button
                    type="button"
                    onClick={() => setMemberCode("SAN-2025-PRIYA")}
                    className="text-xs font-mono bg-fuchsia-100 border border-fuchsia-200 px-2 py-0.5 rounded text-fuchsia-900 hover:bg-fuchsia-200"
                  >
                    SAN-2025-PRIYA
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberCode("SAN-2025-ANANYA")}
                    className="text-xs font-mono bg-fuchsia-100 border border-fuchsia-200 px-2 py-0.5 rounded text-fuchsia-900 hover:bg-fuchsia-200"
                  >
                    SAN-2025-ANANYA
                  </button>
                </div>

                {subStatus && (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold">
                    ✓ {subStatus} • Remaining Quota: {subRemainingQuota} pads
                  </div>
                )}
              </div>
            )}

            {/* 2. COIN SYSTEM PANEL */}
            {selected === "coin" && (
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                    <span>🪙</span> Coin Insertion Slot
                  </div>
                  <div className="text-xs font-mono bg-amber-200/60 px-2 py-0.5 rounded text-amber-900 font-bold">
                    Hardware Pulse Bridge Ready
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/80 p-2 border border-amber-200">
                    <div className="text-xs text-slate-500">Required</div>
                    <div className="text-lg font-black text-slate-800">₹{orderAmount}</div>
                  </div>
                  <div className="rounded-xl bg-amber-100/80 p-2 border border-amber-300">
                    <div className="text-xs text-amber-800 font-semibold">Inserted</div>
                    <div className="text-lg font-black text-amber-900">₹{coinsInserted}</div>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2 border border-amber-200">
                    <div className="text-xs text-slate-500">
                      {coinsInserted >= orderAmount ? "Change" : "Remaining"}
                    </div>
                    <div className="text-lg font-black text-emerald-700">
                      ₹{coinsInserted >= orderAmount ? coinChange : Math.max(0, orderAmount - coinsInserted)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-amber-200/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (coinsInserted / Math.max(1, orderAmount)) * 100)}%`,
                    }}
                  />
                </div>

                {/* Simulated Coin Input Buttons */}
                <div className="mt-4">
                  <div className="text-xs font-bold text-amber-900 mb-2">Insert Coin:</div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 5, 10].map((coin) => (
                      <button
                        key={coin}
                        type="button"
                        onClick={() => handleInsertCoin(coin)}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-b from-amber-200 to-amber-300 border border-amber-400 font-black text-amber-950 text-sm shadow hover:brightness-105 active:scale-95 transition"
                      >
                        + ₹{coin}
                      </button>
                    ))}
                    {coinsInserted > 0 && (
                      <button
                        type="button"
                        onClick={handleEjectCoins}
                        className="py-2 px-3 rounded-xl border border-red-300 bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition"
                      >
                        Return Coins
                      </button>
                    )}
                  </div>
                </div>

                {coinHistory.length > 0 && (
                  <div className="mt-3 text-xs text-amber-800 font-mono">
                    Inserted coins: {coinHistory.map((c) => `₹${c}`).join(" + ")}
                  </div>
                )}
              </div>
            )}

            {/* 3. GOOGLE PAY PANEL */}
            {selected === "google_pay" && (
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 text-center">
                <div className="text-sm font-extrabold text-blue-950 mb-1 flex items-center justify-center gap-1.5">
                  <span>📱</span> Scan with Google Pay or any UPI App
                </div>
                <p className="text-xs text-blue-800/80 mb-3">
                  Amount: <strong className="text-blue-950">₹{orderAmount.toFixed(2)}</strong> (exact amount encoded)
                </p>

                {gpayLoading ? (
                  <div className="py-12 text-sm text-blue-700 font-semibold animate-pulse">
                    Generating dynamic Google Pay QR...
                  </div>
                ) : upiQrUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-white rounded-2xl shadow-md border border-blue-200 inline-block">
                      <img
                        src={upiQrUrl}
                        alt="Google Pay UPI QR"
                        width={210}
                        height={210}
                        className="rounded-lg"
                      />
                    </div>
                    {upiIntentUri && (
                      <a
                        href={upiIntentUri}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
                      >
                        <span>G</span> Open in Google Pay App
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => triggerDispenseCycle("google_pay")}
                      className="mt-1 text-xs font-bold text-blue-700 underline hover:text-blue-900"
                    >
                      Simulate Google Pay Success (Instant Verification)
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            {/* 4. RAZORPAY PANEL */}
            {selected === "razorpay" && (
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-5 text-center">
                <div className="text-sm font-extrabold text-indigo-950 mb-1 flex items-center justify-center gap-1.5">
                  <span>⚡</span> Razorpay Secure Payment Gateway
                </div>
                <p className="text-xs text-indigo-800/80 mb-4">
                  Pay with Credit/Debit Cards, NetBanking, UPI, or Wallets.
                </p>
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-indigo-700 font-bold text-white shadow hover:bg-indigo-800 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {busy ? "Opening Gateway..." : `Pay ₹${orderAmount.toFixed(2)} with Razorpay`}
                </button>
              </div>
            )}

            {/* 5. STATIC QR (Preserved) */}
            {selected === "qr" && (
              <div className="mb-6 flex flex-col items-center gap-4">
                <img
                  src="/scanner.jpeg"
                  alt="Scan for payment"
                  width={200}
                  height={200}
                  className="rounded shadow"
                />
                {!qrPaid ? (
                  <button
                    type="button"
                    onClick={() => setQrPaid(true)}
                    className="bg-pink-600 text-white px-4 py-2 rounded font-semibold text-sm"
                  >
                    I Have Paid
                  </button>
                ) : (
                  <span className="text-violet-600 font-bold text-sm">Payment Confirmed!</span>
                )}
              </div>
            )}

            {/* 6. DEBIT CARD (Preserved) */}
            {selected === "debit" && (
              <div className="mb-6 flex flex-col items-center gap-4">
                <div className="border rounded p-10 bg-gray-900 text-white text-2xl font-semibold shadow-inner text-center">
                  Insert Your Debit Card
                </div>
                <div className="text-gray-500 text-xs">
                  (Please insert your card into the machine slot)
                </div>
              </div>
            )}

            {/* 7. CASH NOTE (Preserved) */}
            {selected === "cash" && (
              <div className="mb-6 flex flex-col items-center gap-4">
                {!cashReceived ? (
                  <button
                    type="button"
                    onClick={() => setCashReceived(true)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded font-semibold text-sm"
                  >
                    I Inserted Cash
                  </button>
                ) : (
                  <span className="text-violet-700 font-bold text-lg">We received the cash!</span>
                )}
              </div>
            )}

            {/* Confirm button */}
            <button
              type="submit"
              className="bg-pink-700 text-white px-5 py-3 rounded-xl mt-2 font-bold w-full shadow hover:bg-pink-800 disabled:opacity-40 transition"
              disabled={
                !selected ||
                (selected === "qr" && !qrPaid) ||
                (selected === "cash" && !cashReceived) ||
                (selected === "coin" && coinsInserted < orderAmount) ||
                busy
              }
            >
              {busy
                ? "Processing..."
                : selected === "coin" && coinsInserted < orderAmount
                ? `Insert ₹${Math.max(0, orderAmount - coinsInserted)} more coins`
                : "Confirm & Dispense Pad"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full mt-3 py-2.5 rounded-xl border-2 border-pink-300 text-pink-700 font-bold hover:bg-pink-50 transition text-sm"
            >
              Cancel Order
            </button>
          </form>
        ) : (
          /* DISPENSING AND COMPLETION ANIMATION */
          <div className="py-6 text-center">
            {dispensingStage === "verifying" && (
              <div className="space-y-4">
                <div className="text-4xl animate-spin">⚙️</div>
                <div className="text-xl font-extrabold text-pink-700">
                  Verifying Transaction & Tray Motor...
                </div>
                <p className="text-xs text-slate-600">Checking Slot A1 sensor status...</p>
              </div>
            )}

            {dispensingStage === "actuating" && (
              <div className="space-y-4">
                <div className="text-5xl animate-bounce">📦</div>
                <div className="text-xl font-extrabold text-pink-800">
                  Actuating Motor Spiral: Tray-A1...
                </div>
                <p className="text-xs text-slate-600">Product is dropping into the collection tray...</p>
              </div>
            )}

            {dispensingStage === "dispensed" && (
              <div className="space-y-5">
                <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>
                <div className="text-2xl font-extrabold text-emerald-800">
                  Product Dispensed Successfully!
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 text-sm text-left space-y-1.5">
                  <div className="font-bold">Collection Instructions:</div>
                  <div>• Please retrieve your sanitary napkin package from the dispenser tray below.</div>
                  <div>• Method: <strong className="capitalize">{selected?.replace("_", " ")}</strong></div>
                  <div>• Order ID: <span className="font-mono text-xs">{orderId}</span></div>
                  {coinChange > 0 && (
                    <div className="mt-2 font-bold text-amber-800">
                      🪙 Don't forget your change: ₹{coinChange} in coin return cup!
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/success?orderId=${encodeURIComponent(orderId)}`)}
                  className="w-full py-3 rounded-xl bg-pink-700 text-white font-bold shadow hover:bg-pink-800 transition"
                >
                  View Receipt & Finish
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}