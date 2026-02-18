"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { supabaseBrowser } from "@/lib/supabaseClient";

type SortKey = "name_asc" | "price_asc" | "price_desc" | "stock_desc";

export default function HomePage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const inputClass =
    "w-full rounded-2xl border border-pink-200/80 bg-white/80 px-4 py-3 " +
    "text-slate-900 placeholder:text-slate-400 shadow-sm " +
    "outline-none focus:ring-4 focus:ring-fuchsia-300/40 focus:border-fuchsia-400";

  const selectClass =
    "w-full rounded-2xl border border-pink-200/80 bg-white/80 px-4 py-3 " +
    "text-slate-900 shadow-sm " +
    "outline-none focus:ring-4 focus:ring-fuchsia-300/40 focus:border-fuchsia-400";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (error) {
          setErrorMsg(error.message);
          setProducts([]);
          return;
        }

        setProducts((data ?? []) as Product[]);
      } catch (e: any) {
        if (!cancelled) setErrorMsg(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    let arr = products.filter((p) => {
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle) ||
        p.size.toLowerCase().includes(needle)
      );
    });

    arr = [...arr].sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "price_asc") return Number(a.price) - Number(b.price);
      if (sort === "price_desc") return Number(b.price) - Number(a.price);
      if (sort === "stock_desc") return Number(b.stock) - Number(a.stock);
      return 0;
    });

    return arr;
  }, [products, q, sort]);

  const setQty = (id: string, val: number, max: number) => {
    const safeMax = Math.max(1, max);
    const safe = Math.max(1, Math.min(safeMax, val));
    setQtyById((m) => ({ ...m, [id]: safe }));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-fuchsia-200 via-rose-100 to-indigo-200 px-4 py-10">
      {/* Admin Login: top-right */}
      <a
        href="/admin/login"
        className="fixed right-5 top-5 z-50 inline-flex items-center gap-2 rounded-full
                   bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white shadow-lg
                   backdrop-blur hover:bg-slate-900 transition"
      >
        Admin Login
      </a>

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="rounded-[2rem] bg-white/60 shadow-2xl backdrop-blur-xl border border-white/50 p-8 md:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 border border-white/70 shadow-sm">
              DIGITAL VENDING MACHINE
            </div>

            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-fuchsia-700 via-rose-600 to-indigo-700 bg-clip-text text-transparent">
                Choose. Confirm. Pay.
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-slate-700">
              Search products, pick quantity, and proceed to confirmation (payment
              page placeholder).
            </p>
          </div>

          {errorMsg && (
            <pre className="mt-6 whitespace-pre-wrap rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm overflow-auto">
              {errorMsg}
            </pre>
          )}

          {/* Search + Sort */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, brand, size..."
                className={inputClass}
              />
            </div>
            <div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={selectClass}
              >
                <option value="name_asc">Sort: Name (A-Z)</option>
                <option value="price_asc">Sort: Price (Low → High)</option>
                <option value="price_desc">Sort: Price (High → Low)</option>
                <option value="stock_desc">Sort: Stock (High → Low)</option>
              </select>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="mt-10 text-center text-slate-700 font-semibold">
              Loading products...
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-10 text-center text-slate-700 font-semibold">
              No products found.
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {filtered.map((p) => {
                const qty = qtyById[p.id] ?? 1;
                const canBuy = Number(p.stock) > 0;

                return (
                  <div
                    key={p.id}
                    className="w-full max-w-sm rounded-[1.5rem] bg-white/70 border border-white/70
                               shadow-xl backdrop-blur p-5 hover:shadow-2xl transition"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">
                          {p.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          {p.brand} • {p.size}
                        </div>

                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                          Stock: {p.stock}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-700 to-rose-600 bg-clip-text text-transparent">
                          ₹{Number(p.price).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Qty + Buy */}
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="h-10 w-10 rounded-2xl bg-gradient-to-r from-fuchsia-700 to-rose-600
                                     text-white font-extrabold shadow disabled:opacity-40"
                          disabled={!canBuy}
                          onClick={() => setQty(p.id, qty - 1, Number(p.stock))}
                        >
                          -
                        </button>

                        <div className="min-w-10 text-center font-extrabold text-slate-900">
                          {qty}
                        </div>

                        <button
                          className="h-10 w-10 rounded-2xl bg-gradient-to-r from-fuchsia-700 to-rose-600
                                     text-white font-extrabold shadow disabled:opacity-40"
                          disabled={!canBuy}
                          onClick={() => setQty(p.id, qty + 1, Number(p.stock))}
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="rounded-2xl bg-slate-900 px-4 py-2 font-semibold text-white
                                   shadow hover:bg-slate-800 disabled:opacity-40"
                        disabled={!canBuy}
                        onClick={() =>
                          router.push(
                            `/confirm?productId=${encodeURIComponent(
                              p.id
                            )}&qty=${encodeURIComponent(qty)}`
                          )
                        }
                      >
                        Buy Now
                      </button>
                    </div>

                    {!canBuy && (
                      <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
                        Out of stock
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer hint */}
          <div className="mt-10 text-center text-xs text-slate-600">
            Choose the right product & quantity and Click Order.
          </div>
        </div>
      </div>
    </div>
  );
}