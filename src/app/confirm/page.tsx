"use client";

import { supabaseBrowser } from "@/lib/supabaseClient";
import type { Product } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const productId = sp.get("productId");
  const qty = Number(sp.get("qty") ?? "1");

  const supabase = useMemo(() => supabaseBrowser(), []);
  const [product, setProduct] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) setErr(error.message);
      else setProduct(data as Product);
    })();
  }, [productId, supabase]);

  const total = product ? Number(product.price) * qty : 0;

  const createOrder = async () => {
    if (!product) return;
    if (qty < 1) return;
    if (qty > product.stock) {
      setErr("Not enough stock.");
      return;
    }

    setBusy(true);
    setErr(null);

    const { data, error } = await supabase
      .from("orders")
      .insert({
        product_id: product.id,
        qty,
        amount: total,
        status: "pending",
      })
      .select("id")
      .single();

    setBusy(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push(`/payment-page?orderId=${encodeURIComponent(data.id)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-200 via-pink-100 to-pink-200 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white/70 shadow-xl backdrop-blur p-8">
        <h1 className="text-center text-3xl font-extrabold text-pink-700">
          Confirm Order
        </h1>

        {err && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700">
            {err}
          </div>
        )}

        {!product ? (
          <div className="mt-8 text-center text-pink-800/70">Loading...</div>
        ) : (
          <div className="mt-8 rounded-2xl bg-pink-50 border border-pink-200 p-5">
            <div className="text-lg font-bold text-pink-900">{product.name}</div>
            <div className="text-sm text-pink-900/70">
              {product.brand} • {product.size}
            </div>

            <div className="mt-4 flex justify-between">
              <span className="text-pink-800">Qty</span>
              <span className="font-bold text-pink-900">{qty}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-pink-800">Price</span>
              <span className="font-bold text-pink-900">
                ₹{Number(product.price).toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-pink-800">Total</span>
              <span className="text-xl font-extrabold text-pink-700">
                ₹{total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={createOrder}
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-pink-700 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Creating order..." : "Proceed to Payment"}
            </button>

            <button
              onClick={() => router.push("/")}
              className="mt-3 w-full rounded-xl border border-pink-300 py-3 font-semibold text-pink-800"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}