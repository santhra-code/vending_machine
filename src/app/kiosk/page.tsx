"use client";

import React, { useState, useEffect } from "react";
import type { Product, Subscription } from "@/lib/types";

export default function KioskPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [mode, setMode] = useState<"select" | "pay" | "dispensing" | "success">("select");
  const [method, setMethod] = useState<"qr_pass" | "coins" | "gpay">("qr_pass");

  // QR Pass Scanner state
  const [scannedCode, setScannedCode] = useState("SAN-2025-PRIYA");
  const [verifiedSub, setVerifiedSub] = useState<Subscription | null>(null);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [scannerErr, setScannerErr] = useState<string | null>(null);

  // Coins state
  const [coinsInserted, setCoinsInserted] = useState(0);
  const [coinChange, setCoinChange] = useState(0);

  // Dispense animation state
  const [dispenseStep, setDispenseStep] = useState(0);

  // Load products
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && data.data.length > 0) {
          setProducts(data.data);
          setSelectedProduct(data.data[0]);
        }
      })
      .catch(() => null);
  }, []);

  const totalAmount = selectedProduct ? selectedProduct.price * qty : 0;

  // Redeem Annual Subscription QR Code at the Machine
  const handleScanMemberQR = async () => {
    if (!selectedProduct) return;
    setScannerBusy(true);
    setScannerErr(null);

    try {
      const res = await fetch("/api/subscription/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_data: scannedCode.trim(),
          product_id: selectedProduct.id,
          qty,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || json?.error) {
        throw new Error(json?.error || "Invalid QR Code or Expired Subscription");
      }

      setVerifiedSub({
        user_name: json.user_name,
        card_code: json.card_code,
        plan_name: json.plan_name,
        used_quota: json.used_quota ?? 0,
        annual_quota: 60,
      } as any);

      startDispensingSequence("Personal Member QR Pass");
    } catch (e: any) {
      setScannerErr(e.message || "Failed to scan member pass");
    } finally {
      setScannerBusy(false);
    }
  };

  // Insert Coin into Machine
  const handleInsertCoin = (coinVal: number) => {
    const nextInserted = coinsInserted + coinVal;
    setCoinsInserted(nextInserted);

    if (nextInserted >= totalAmount) {
      const change = nextInserted - totalAmount;
      setCoinChange(change);
      startDispensingSequence(`Coin Payment (₹${nextInserted} received)`);
    }
  };

  // Run Motor Dispensing Sequence
  const startDispensingSequence = (methodName: string) => {
    setMode("dispensing");
    setDispenseStep(1); // Actuating motor

    // Trigger hardware dispense log
    fetch("/api/hardware/dispense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedProduct?.id,
        method: methodName,
        qty,
        slot: "Slot-A1",
      }),
    }).catch(() => null);

    setTimeout(() => {
      setDispenseStep(2); // Sensor beam broken / dropped
    }, 1500);

    setTimeout(() => {
      setDispenseStep(3); // In collection tray
      setMode("success");
    }, 3000);
  };

  const resetKiosk = () => {
    setMode("select");
    setCoinsInserted(0);
    setCoinChange(0);
    setVerifiedSub(null);
    setDispenseStep(0);
    setScannerErr(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-8">
      {/* Top status bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <a
          href="/"
          className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-700 transition"
        >
          ← Exit Kiosk to Web Store
        </a>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          MACHINE ONLINE • ESP32 RELAY ACTIVE • SENSORS OK
        </div>
      </div>

      {/* VENDING MACHINE KIOSK HOUSING */}
      <div className="w-full max-w-4xl bg-slate-900 border-4 border-slate-700 rounded-[2.5rem] shadow-2xl p-6 md:p-8 relative overflow-hidden">
        {/* Machine Header */}
        <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black tracking-widest text-fuchsia-400 uppercase">
              Sanitary Napkin Automated Dispenser
            </div>
            <div className="text-2xl font-black text-white">
              SANTRA HYGIENE VENDING KIOSK
            </div>
          </div>
          <div className="flex gap-2">
            <span className="bg-slate-800 text-xs px-3 py-1 rounded-full text-slate-300 font-mono">
              Unit: CAMPUS-A1
            </span>
            <span className="bg-fuchsia-950 border border-fuchsia-700 text-xs px-3 py-1 rounded-full text-fuchsia-300 font-bold">
              1-Year Member Pass Enabled
            </span>
          </div>
        </div>

        {/* STEP 1: SELECT PRODUCT */}
        {mode === "select" && (
          <div>
            <div className="text-sm font-bold text-slate-300 mb-3 flex items-center justify-between">
              <span>STEP 1: SELECT SANITARY NAPKIN TRAY</span>
              <span className="text-xs text-slate-500">Pick item & quantity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {products.map((p, idx) => {
                const isSelected = selectedProduct?.id === p.id;
                const slotLabel = `Slot ${String.fromCharCode(65 + Math.floor(idx / 3))}${(idx % 3) + 1}`;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`cursor-pointer rounded-2xl p-4 border transition ${
                      isSelected
                        ? "bg-fuchsia-950/60 border-fuchsia-500 ring-2 ring-fuchsia-400"
                        : "bg-slate-800/80 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-fuchsia-300 font-bold">
                        {slotLabel}
                      </span>
                      <span className="text-lg font-black text-white">
                        ₹{p.price}
                      </span>
                    </div>

                    <div className="mt-2 font-bold text-sm text-white line-clamp-1">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-400">{p.brand} • {p.size}</div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-mono">Stock: {p.stock}</span>
                      {isSelected && (
                        <span className="text-fuchsia-400 font-bold">Selected ✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedProduct && (
              <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">Selected Product:</div>
                  <div className="text-base font-bold text-white">{selectedProduct.name}</div>
                  <div className="text-xs text-fuchsia-300">Unit Price: ₹{selectedProduct.price}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="text-base font-bold text-slate-300 px-2 hover:text-white"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-sm min-w-6 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(selectedProduct.stock, qty + 1))}
                      className="text-base font-bold text-slate-300 px-2 hover:text-white"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total</div>
                    <div className="text-xl font-black text-fuchsia-400">₹{totalAmount}</div>
                  </div>

                  <button
                    onClick={() => setMode("pay")}
                    className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-600 px-6 py-2.5 font-bold text-white shadow-lg hover:opacity-90 transition text-sm"
                  >
                    Proceed to Payment / Scan QR →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PAYMENT / AUTHENTICATION */}
        {mode === "pay" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMode("select")}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Change Product
              </button>
              <div className="text-sm font-bold text-fuchsia-300">
                Item: {selectedProduct?.name} (Qty: {qty}) • Total: ₹{totalAmount}
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setMethod("qr_pass")}
                className={`py-3 px-2 rounded-xl text-xs md:text-sm font-bold border transition ${
                  method === "qr_pass"
                    ? "bg-fuchsia-600 border-fuchsia-400 text-white shadow"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🎟️ Personal QR Pass
              </button>
              <button
                onClick={() => setMethod("coins")}
                className={`py-3 px-2 rounded-xl text-xs md:text-sm font-bold border transition ${
                  method === "coins"
                    ? "bg-amber-600 border-amber-400 text-white shadow"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🪙 Insert Coins
              </button>
              <button
                onClick={() => setMethod("gpay")}
                className={`py-3 px-2 rounded-xl text-xs md:text-sm font-bold border transition ${
                  method === "gpay"
                    ? "bg-blue-600 border-blue-400 text-white shadow"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
              >
                📱 Google Pay / UPI
              </button>
            </div>

            {/* METHOD 1: SCAN MEMBER QR PASS */}
            {method === "qr_pass" && (
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6 text-center">
                <div className="text-base font-extrabold text-fuchsia-300 mb-1">
                  Optical QR Code Scanner
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Hold your personal 1-Year Member QR card facing the optical scanner lens below:
                </p>

                {/* Simulated scanner view */}
                <div className="w-56 h-56 mx-auto rounded-2xl border-2 border-dashed border-fuchsia-500 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden mb-4">
                  <div className="w-full h-0.5 bg-fuchsia-500 absolute animate-pulse" />
                  <span className="text-4xl">📷</span>
                  <span className="text-[11px] text-fuchsia-400 font-mono mt-2">
                    SCANNER READY
                  </span>
                </div>

                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                      placeholder="Enter Member Code or QR Token"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono outline-none focus:ring-2 focus:ring-fuchsia-500"
                    />
                    <button
                      onClick={handleScanMemberQR}
                      disabled={scannerBusy}
                      className="whitespace-nowrap rounded-xl bg-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-fuchsia-500 transition disabled:opacity-50"
                    >
                      {scannerBusy ? "Verifying Pass..." : "Scan & Dispense"}
                    </button>
                  </div>

                  <div className="flex justify-center items-center gap-2 text-xs text-slate-400">
                    <span>Quick test passes:</span>
                    <button
                      onClick={() => setScannedCode("SAN-2025-PRIYA")}
                      className="font-mono text-fuchsia-400 hover:underline"
                    >
                      SAN-2025-PRIYA
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setScannedCode("SAN-2025-ANANYA")}
                      className="font-mono text-fuchsia-400 hover:underline"
                    >
                      SAN-2025-ANANYA
                    </button>
                  </div>
                </div>

                {scannerErr && (
                  <div className="mt-4 rounded-xl bg-red-950/80 border border-red-700 p-2.5 text-xs text-red-300 font-semibold">
                    {scannerErr}
                  </div>
                )}
              </div>
            )}

            {/* METHOD 2: COIN ACCEPTOR */}
            {method === "coins" && (
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6 text-center">
                <div className="text-base font-extrabold text-amber-400 mb-1">
                  Electronic Coin Acceptor Slot
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Accepts ₹1, ₹2, ₹5, and ₹10 coins. Dispenses automatically once exact or excess amount reached.
                </p>

                <div className="max-w-md mx-auto grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-500">Price</div>
                    <div className="text-xl font-black text-white">₹{totalAmount}</div>
                  </div>
                  <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-600">
                    <div className="text-xs text-amber-300 font-bold">Inserted</div>
                    <div className="text-xl font-black text-amber-400">₹{coinsInserted}</div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-500">
                      {coinsInserted >= totalAmount ? "Change" : "Remaining"}
                    </div>
                    <div className="text-xl font-black text-emerald-400">
                      ₹{coinsInserted >= totalAmount ? coinChange : Math.max(0, totalAmount - coinsInserted)}
                    </div>
                  </div>
                </div>

                <div className="max-w-md mx-auto flex flex-wrap gap-2">
                  {[1, 2, 5, 10].map((coin) => (
                    <button
                      key={coin}
                      onClick={() => handleInsertCoin(coin)}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 font-black text-slate-950 text-sm shadow hover:brightness-110 active:scale-95 transition"
                    >
                      + ₹{coin}
                    </button>
                  ))}
                  {coinsInserted > 0 && (
                    <button
                      onClick={() => {
                        setCoinsInserted(0);
                        setCoinChange(0);
                      }}
                      className="py-3 px-4 rounded-xl border border-red-600 text-red-400 text-xs font-bold hover:bg-red-950"
                    >
                      Eject Coins
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* METHOD 3: GOOGLE PAY */}
            {method === "gpay" && (
              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6 text-center">
                <div className="text-base font-extrabold text-blue-400 mb-1">
                  Google Pay & UPI Terminal
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Scan UPI QR with Google Pay, PhonePe, or Paytm app.
                </p>

                <div className="p-3 bg-white rounded-2xl shadow-xl inline-block mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=santra.vending@upi%26pn=Santra%20Vending%26am=${totalAmount}%26cu=INR`}
                    alt="UPI QR"
                    width={180}
                    height={180}
                    className="rounded-lg"
                  />
                </div>

                <div>
                  <button
                    onClick={() => startDispensingSequence("Google Pay UPI")}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white text-xs hover:bg-blue-500 transition"
                  >
                    Simulate Payment Received on Google Pay →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: LIVE MOTORIZED DISPENSING */}
        {(mode === "dispensing" || mode === "success") && (
          <div className="py-10 text-center space-y-6">
            {dispenseStep === 1 && (
              <div className="space-y-4">
                <div className="text-6xl animate-spin">⚙️</div>
                <div className="text-2xl font-black text-fuchsia-400">
                  Actuating Motor Spiral (Slot A1)...
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Stepper Motor Pulse Duration: 1500ms • Driving helical coil...
                </p>
              </div>
            )}

            {dispenseStep === 2 && (
              <div className="space-y-4">
                <div className="text-6xl animate-bounce">📦</div>
                <div className="text-2xl font-black text-amber-400">
                  Pad Dropping into Dispenser Tray!
                </div>
                <p className="text-xs text-emerald-400 font-mono">
                  ✓ IR Drop Sensor: Beam broken • Product fall verified!
                </p>
              </div>
            )}

            {dispenseStep === 3 && (
              <div className="space-y-5">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl text-emerald-400">
                  ✓
                </div>
                <div className="text-3xl font-black text-emerald-400">
                  Dispense Complete!
                </div>
                <div className="max-w-md mx-auto bg-slate-800 rounded-2xl p-4 border border-slate-700 text-left text-xs space-y-2">
                  <div className="font-bold text-white text-sm">Dispenser Status:</div>
                  <div className="text-slate-300">
                    • Product: <strong>{selectedProduct?.name}</strong> (Qty: {qty})
                  </div>
                  {verifiedSub && (
                    <div className="text-fuchsia-300">
                      • Cardholder: <strong>{verifiedSub.user_name}</strong> (Pass: {verifiedSub.card_code})
                    </div>
                  )}
                  {coinChange > 0 && (
                    <div className="text-amber-400 font-bold">
                      • Coin Change Returned: ₹{coinChange} in return cup
                    </div>
                  )}
                  <div className="text-emerald-400 font-bold pt-1">
                    Please push open the bottom acrylic flap and collect your item.
                  </div>
                </div>

                <button
                  onClick={resetKiosk}
                  className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-rose-600 px-8 py-3 font-bold text-white shadow-lg hover:opacity-90 transition text-sm"
                >
                  Ready for Next Customer (Reset)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
