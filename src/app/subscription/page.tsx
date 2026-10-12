"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import type { Subscription } from "@/lib/types";

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState<"my_card" | "subscribe" | "directory">("my_card");
  const [searchCode, setSearchCode] = useState("SAN-2025-PRIYA");
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [allSubs, setAllSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // New Subscription Form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPlan, setFormPlan] = useState("1-Year Student Annual Hygiene Pass (60 Pads/Year)");
  const [submitting, setSubmitting] = useState(false);

  // Fetch subscription by card code
  const fetchCard = async (code: string) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/subscription/lookup?q=${encodeURIComponent(code)}`);
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.error) {
        throw new Error(json?.error || "Member card not found");
      }
      setCurrentSub(json.data);

      // Generate visual QR code
      const qrPayload = json.data.qr_data || json.data.card_code;
      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 250,
        margin: 2,
        color: { dark: "#831843", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch (e: any) {
      setErr(e.message || "Could not load subscription");
      setCurrentSub(null);
      setQrDataUrl(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all subscriptions for directory
  const fetchAllSubs = async () => {
    try {
      const res = await fetch("/api/subscription/create");
      const json = await res.json().catch(() => null);
      if (json?.data) {
        setAllSubs(json.data);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchCard(searchCode);
    fetchAllSubs();
  }, []);

  // Handle new 1-year pass registration
  const handleRegisterPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      setErr("Please fill in your name, email, and mobile number.");
      return;
    }

    setSubmitting(true);
    setErr(null);
    setOkMsg(null);

    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: formName,
          user_email: formEmail,
          user_phone: formPhone,
          plan_name: formPlan,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || json?.error) {
        throw new Error(json?.error || "Failed to register subscription");
      }

      setOkMsg(`🎉 1-Year Pass Created! Your Member Code is ${json.data.card_code}`);
      setSearchCode(json.data.card_code);
      fetchCard(json.data.card_code);
      fetchAllSubs();
      setActiveTab("my_card");
      setFormName("");
      setFormEmail("");
      setFormPhone("");
    } catch (e: any) {
      setErr(e.message || "Failed to create subscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-200 via-rose-100 to-indigo-200 px-4 py-8">
      {/* Top Header */}
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <a
            href="/"
            className="text-sm font-bold text-slate-800 bg-white/70 px-4 py-2 rounded-full shadow-sm hover:bg-white transition"
          >
            ← Back to Vending Store
          </a>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("my_card")}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition shadow-sm ${
                activeTab === "my_card"
                  ? "bg-fuchsia-700 text-white"
                  : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
            >
              💳 My Personal QR Pass
            </button>
            <button
              onClick={() => setActiveTab("subscribe")}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition shadow-sm ${
                activeTab === "subscribe"
                  ? "bg-fuchsia-700 text-white"
                  : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
            >
              ✨ Get 1-Year Pass
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition shadow-sm ${
                activeTab === "directory"
                  ? "bg-fuchsia-700 text-white"
                  : "bg-white/70 text-slate-700 hover:bg-white"
              }`}
            >
              📋 Member List
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm font-semibold">
            {err}
          </div>
        )}

        {okMsg && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm font-bold">
            {okMsg}
          </div>
        )}

        {/* TAB 1: MY PERSONAL QR CARD */}
        {activeTab === "my_card" && (
          <div>
            {/* Lookup bar */}
            <div className="rounded-2xl bg-white/70 backdrop-blur p-4 mb-6 border border-white/60 shadow-sm flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="text-xs font-bold text-slate-700">Lookup Member Code:</div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="e.g. SAN-2025-PRIYA"
                  className="rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-mono outline-none focus:ring-2 focus:ring-fuchsia-400"
                />
                <button
                  onClick={() => fetchCard(searchCode)}
                  className="rounded-xl bg-slate-900 text-white text-xs font-bold px-3 py-1.5 hover:bg-slate-800 transition"
                >
                  Load Card
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 text-slate-700 font-semibold">
                Loading Member Pass...
              </div>
            ) : currentSub ? (
              <div className="flex flex-col items-center">
                {/* PHYSICAL / DIGITAL HYGIENE CARD MOCKUP */}
                <div className="w-full max-w-md rounded-[2.5rem] bg-gradient-to-br from-fuchsia-800 via-rose-700 to-indigo-900 text-white p-7 shadow-2xl border-4 border-white/30 backdrop-blur-xl relative overflow-hidden">
                  {/* Decorative background circles */}
                  <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-fuchsia-500/20 rounded-full blur-xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-200">
                        Santra Digital Vending
                      </div>
                      <div className="text-xl font-extrabold tracking-tight">
                        ANNUAL HYGIENE PASS
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-300 text-emerald-200 text-[10px] font-black tracking-wider uppercase">
                      ● {currentSub.status}
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="my-6 flex flex-col items-center justify-center">
                    <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-fuchsia-200">
                      {qrDataUrl && (
                        <img
                          src={qrDataUrl}
                          alt="Personal Member QR"
                          width={180}
                          height={180}
                          className="rounded-lg"
                        />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="font-mono text-xs font-bold tracking-wider text-fuchsia-100">
                        {currentSub.card_code}
                      </div>
                      <div className="text-[11px] text-fuchsia-200">
                        Scan at machine scanner to dispense pad
                      </div>
                    </div>
                  </div>

                  {/* User Details & Quota */}
                  <div className="border-t border-white/20 pt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] text-fuchsia-200 uppercase font-semibold">
                        Cardholder Name
                      </div>
                      <div className="font-bold text-white text-sm">{currentSub.user_name}</div>
                      <div className="text-[11px] text-fuchsia-200">{currentSub.user_phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-fuchsia-200 uppercase font-semibold">
                        Validity Period
                      </div>
                      <div className="font-bold text-white text-xs">
                        1 Year ({currentSub.valid_until})
                      </div>
                      <div className="text-[10px] text-fuchsia-200">
                        From: {currentSub.valid_from}
                      </div>
                    </div>
                  </div>

                  {/* Quota Counter */}
                  <div className="mt-4 rounded-xl bg-white/10 backdrop-blur p-3 border border-white/15 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-fuchsia-200">Remaining Quota: </span>
                      <strong className="text-white text-sm">
                        {Math.max(0, currentSub.annual_quota - currentSub.used_quota)} / {currentSub.annual_quota} Pads
                      </strong>
                    </div>
                    <div className="text-right text-[11px] text-fuchsia-200 font-semibold">
                      Used: {currentSub.used_quota}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => window.print()}
                    className="rounded-2xl bg-slate-900 text-white font-bold px-5 py-2.5 text-xs shadow hover:bg-slate-800 transition"
                  >
                    🖨️ Print / Save Member Card
                  </button>
                  <a
                    href="/kiosk"
                    className="rounded-2xl bg-indigo-700 text-white font-bold px-5 py-2.5 text-xs shadow hover:bg-indigo-800 transition"
                  >
                    🏧 Test Scan on Kiosk Simulator →
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: REGISTER NEW 1-YEAR PASS */}
        {activeTab === "subscribe" && (
          <div className="mx-auto max-w-xl rounded-[2rem] bg-white/70 shadow-2xl backdrop-blur-xl border border-white/60 p-8">
            <h2 className="text-2xl font-extrabold text-slate-900 text-center">
              Get Your 1-Year Sanitary Hygiene Pass
            </h2>
            <p className="mt-2 text-xs text-center text-slate-600">
              Enjoy 12 months of unlimited or quota-based access to sanitary pads across all institutional and campus vending machines with your unique personal QR code.
            </p>

            <form onSubmit={handleRegisterPass} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sanya Iyer"
                  className="w-full rounded-xl border border-pink-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. sanya@university.edu"
                  className="w-full rounded-xl border border-pink-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +91 98765 00000"
                  className="w-full rounded-xl border border-pink-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Annual Plan</label>
                <select
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value)}
                  className="w-full rounded-xl border border-pink-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400"
                >
                  <option value="1-Year Student Annual Hygiene Pass (60 Pads/Year)">
                    1-Year Student Pass (5 Pads/Mo • 60 Pads/Year) - ₹399/year
                  </option>
                  <option value="1-Year Institutional Care Pass (120 Pads/Year)">
                    1-Year Institutional Pass (10 Pads/Mo • 120 Pads/Year) - ₹699/year
                  </option>
                  <option value="1-Year Subsidized Community Pass (Free Sponsored Access)">
                    1-Year Subsidized Pass (Sponsored Free Access) - ₹0
                  </option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-fuchsia-700 to-rose-600 py-3 text-sm font-bold text-white shadow-lg hover:opacity-95 disabled:opacity-50 transition"
                >
                  {submitting ? "Generating Personal QR Pass..." : "Activate 1-Year Pass & Generate QR Card"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: MEMBER DIRECTORY */}
        {activeTab === "directory" && (
          <div className="rounded-[2rem] bg-white/70 shadow-2xl backdrop-blur-xl border border-white/60 p-6 md:p-8">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">
              Registered Member Passes ({allSubs.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allSubs.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-2xl bg-white/80 border border-pink-200 p-4 shadow-sm hover:shadow transition flex justify-between items-center"
                >
                  <div>
                    <div className="font-extrabold text-slate-900">{sub.user_name}</div>
                    <div className="text-xs text-slate-600 font-mono">{sub.card_code}</div>
                    <div className="text-xs text-fuchsia-700 mt-1">{sub.plan_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Quota Remaining: {Math.max(0, sub.annual_quota - sub.used_quota)} / {sub.annual_quota}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSearchCode(sub.card_code);
                      fetchCard(sub.card_code);
                      setActiveTab("my_card");
                    }}
                    className="rounded-xl bg-fuchsia-100 text-fuchsia-800 text-xs font-bold px-3 py-2 border border-fuchsia-300 hover:bg-fuchsia-200"
                  >
                    View QR Card →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
