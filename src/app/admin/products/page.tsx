"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

type NewProduct = {
  name: string;
  brand: string;
  size: string;
  price: string;
  stock: string;
  image_url: string;
  active: boolean;
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");

  const [form, setForm] = useState<NewProduct>({
    name: "",
    brand: "",
    size: "",
    price: "0",
    stock: "0",
    image_url: "",
    active: true,
  });

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }),
    []
  );

  const inputClass =
    "w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 " +
    "text-slate-900 placeholder:text-slate-400 shadow-sm " +
    "outline-none focus:ring-4 focus:ring-fuchsia-300/40 focus:border-fuchsia-400";

  const smallInputClass =
    "w-full rounded-xl border border-white/70 bg-white/80 px-3 py-2 " +
    "text-slate-900 placeholder:text-slate-400 shadow-sm " +
    "outline-none focus:ring-4 focus:ring-fuchsia-300/40 focus:border-fuchsia-400";

  const fetchProducts = async () => {
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    const res = await fetch("/api/admin/products");
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(json?.error ?? `Failed to load products (HTTP ${res.status})`);
      setProducts([]);
      setLoading(false);
      return;
    }

    setProducts((json.data ?? []) as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;

    return products.filter((p) => {
      const s = `${p.name} ${p.brand} ${p.size}`.toLowerCase();
      return s.includes(needle);
    });
  }, [products, q]);

  const addProduct = async () => {
    setBusy("add");
    setErr(null);
    setOkMsg(null);

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      size: form.size.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      image_url: form.image_url.trim() ? form.image_url.trim() : null,
      active: form.active,
    };

    if (!payload.name || !payload.brand || !payload.size) {
      setBusy(null);
      setErr("Please fill: name, brand, size");
      return;
    }

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      setErr(json?.error ?? `Add product failed (HTTP ${res.status})`);
      return;
    }

    setForm({
      name: "",
      brand: "",
      size: "",
      price: "0",
      stock: "0",
      image_url: "",
      active: true,
    });

    setOkMsg("Product added");
    await fetchProducts();
  };

  const patchProduct = async (id: string, patch: Partial<Product>) => {
    setBusy(`patch:${id}`);
    setErr(null);
    setOkMsg(null);

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });

    const json = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      setErr(json?.error ?? `Update failed (HTTP ${res.status})`);
      return;
    }

    setOkMsg("Updated");
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const yes = confirm("Delete this product?");
    if (!yes) return;

    setBusy(`del:${id}`);
    setErr(null);
    setOkMsg(null);

    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      setErr(json?.error ?? `Delete failed (HTTP ${res.status})`);
      return;
    }

    setOkMsg("Deleted");
    await fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-fuchsia-100 to-rose-200 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white/65 shadow-2xl backdrop-blur-xl border border-white/60 p-8 md:p-10">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/85 px-4 py-2 text-xs font-bold text-white shadow">
                ADMIN PANEL
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-rose-700 bg-clip-text text-transparent">
                  Products
                </span>
              </h1>
              <p className="mt-2 text-slate-700">
                Add products, update stock/price, hide/show items
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push("/admin")}
                className="rounded-2xl border border-white/70 bg-white/60 px-4 py-2 font-semibold text-slate-900 shadow-sm hover:bg-white/80 transition"
              >
                Back to Dashboard
              </button>
              <button
                disabled={loading}
                onClick={fetchProducts}
                className="rounded-2xl border border-white/70 bg-white/60 px-4 py-2 font-semibold text-slate-900 shadow-sm hover:bg-white/80 disabled:opacity-50 transition"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* Messages */}
          {err && (
            <pre className="mt-6 whitespace-pre-wrap rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm overflow-auto">
              {err}
            </pre>
          )}
          {okMsg && (
            <div className="mt-6 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800 text-sm font-semibold">
              {okMsg}
            </div>
          )}

          {/* Search */}
          <div className="mt-8">
            <input
              className={inputClass}
              placeholder="Search products (name, brand, size)..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Add Product */}
          <div className="mt-8 rounded-[1.5rem] bg-white/70 border border-white/70 shadow-xl backdrop-blur p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-slate-900">
                Add New Product
              </h2>
              <span className="text-xs font-semibold text-slate-600">
                Fields: name, brand, size required
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                className={inputClass}
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Brand"
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Size"
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Image URL (optional)"
                value={form.image_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image_url: e.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Price"
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
              />
              <input
                className={inputClass}
                placeholder="Stock"
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.target.value }))
                }
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-slate-900 font-semibold">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.checked }))
                  }
                />
                Active (visible on store)
              </label>

              <button
                disabled={busy === "add"}
                onClick={addProduct}
                className="rounded-2xl bg-gradient-to-r from-indigo-700 via-fuchsia-700 to-rose-700 px-5 py-3 font-semibold text-white shadow hover:opacity-95 disabled:opacity-50 transition"
              >
                {busy === "add" ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>

          {/* Product grid */}
          <div className="mt-10">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Product List
            </h2>

            {loading ? (
              <div className="mt-6 font-semibold text-slate-700">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="mt-6 font-semibold text-slate-700">
                No products found.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[1.5rem] bg-white/70 border border-white/70 shadow-xl backdrop-blur p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">
                          {p.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          {p.brand} • {p.size}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-bold text-white">
                          ID: <span className="font-mono">{p.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      <button
                        disabled={busy === `del:${p.id}`}
                        onClick={() => deleteProduct(p.id)}
                        className="rounded-2xl border border-red-300 bg-white/70 px-3 py-2 font-semibold text-red-700 shadow-sm hover:bg-white transition disabled:opacity-50"
                      >
                        {busy === `del:${p.id}` ? "Deleting..." : "Delete"}
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label className="text-xs font-bold text-slate-700">
                        PRICE
                        <input
                          type="number"
                          defaultValue={Number(p.price)}
                          className={smallInputClass + " mt-1"}
                          onBlur={(e) =>
                            patchProduct(p.id, { price: Number(e.target.value) })
                          }
                        />
                      </label>

                      <label className="text-xs font-bold text-slate-700">
                        STOCK
                        <input
                          type="number"
                          defaultValue={Number(p.stock)}
                          className={smallInputClass + " mt-1"}
                          onBlur={(e) =>
                            patchProduct(p.id, { stock: Number(e.target.value) })
                          }
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-slate-900 font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(p.active)}
                          onChange={(e) =>
                            patchProduct(p.id, { active: e.target.checked })
                          }
                          disabled={busy === `patch:${p.id}`}
                        />
                        Active
                      </label>

                      <div className="text-sm font-extrabold text-slate-900">
                        {money.format(Number(p.price))}
                      </div>
                    </div>

                    {p.image_url ? (
                      <a
                        href={p.image_url}
                        target="_blank"
                        className="mt-4 block text-sm font-semibold text-indigo-700 underline"
                        rel="noreferrer"
                      >
                        View Image
                      </a>
                    ) : (
                      <div className="mt-4 text-sm text-slate-600">
                        No image URL
                      </div>
                    )}

                    {busy === `patch:${p.id}` && (
                      <div className="mt-3 text-sm font-semibold text-slate-700">
                        Updating...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-10 text-center text-xs text-slate-600">
            Tip: Changes are saved when you click out of the price/stock field.
          </div>
        </div>
      </div>
    </div>
  );
}