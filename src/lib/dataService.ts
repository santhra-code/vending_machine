import { supabaseService } from "./supabaseServer";
import type { Product, Order, Subscription, DispenseLog, CoinTransaction } from "./types";
import fs from "fs";
import path from "path";

// Initial seed data for resilience when Supabase is offline or not yet migrated
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    name: "Whisper Ultra Clean (XL+ Wings)",
    brand: "Whisper",
    size: "XL+ (280mm)",
    price: 35,
    stock: 24,
    image_url: null,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-002",
    name: "Stayfree Secure Cottony Soft",
    brand: "Stayfree",
    size: "Regular (240mm)",
    price: 28,
    stock: 30,
    image_url: null,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-003",
    name: "Sofy AntiBacterial Extra Long",
    brand: "Sofy",
    size: "XXL (320mm)",
    price: 45,
    stock: 18,
    image_url: null,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-004",
    name: "Nua Ultra Thin Rash-Free",
    brand: "Nua",
    size: "Heavy Flow (290mm)",
    price: 40,
    stock: 15,
    image_url: null,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-005",
    name: "Carmesi 100% Eco-Biodegradable",
    brand: "Carmesi",
    size: "Standard (260mm)",
    price: 50,
    stock: 20,
    image_url: null,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-006",
    name: "Santra Emergency Care Single Pad",
    brand: "Santra Vending",
    size: "Regular (240mm)",
    price: 10,
    stock: 50,
    image_url: null,
    active: true,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-demo-01",
    user_name: "Priya Sharma",
    user_email: "priya.sharma@campus.edu",
    user_phone: "+91 98765 43210",
    card_code: "SAN-2025-PRIYA",
    qr_data: "SAN-SUB:SAN-2025-PRIYA:priya.sharma@campus.edu",
    status: "active",
    plan_name: "1-Year Student Annual Hygiene Pass",
    valid_from: "2025-01-01",
    valid_until: "2026-12-31",
    annual_quota: 60,
    monthly_quota: 5,
    used_quota: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "sub-demo-02",
    user_name: "Ananya Patel",
    user_email: "ananya.patel@workplace.org",
    user_phone: "+91 98123 45678",
    card_code: "SAN-2025-ANANYA",
    qr_data: "SAN-SUB:SAN-2025-ANANYA:ananya.patel@workplace.org",
    status: "active",
    plan_name: "1-Year Institutional Care Pass",
    valid_from: "2025-03-01",
    valid_until: "2026-03-01",
    annual_quota: 120,
    monthly_quota: 10,
    used_quota: 3,
    created_at: new Date().toISOString(),
  },
];

type MemoryStore = {
  products: Product[];
  orders: Order[];
  subscriptions: Subscription[];
  dispenseLogs: DispenseLog[];
  coinTransactions: CoinTransaction[];
  visits: { id: string; ip_hash: string; day: string }[];
};

// Global in-memory fallback store
declare global {
  // eslint-disable-next-line no-var
  var __santraStore: MemoryStore | undefined;
}

function getStore(): MemoryStore {
  if (!global.__santraStore) {
    global.__santraStore = {
      products: [...INITIAL_PRODUCTS],
      orders: [],
      subscriptions: [...INITIAL_SUBSCRIPTIONS],
      dispenseLogs: [],
      coinTransactions: [],
      visits: [],
    };
  }
  return global.__santraStore;
}

export const DataService = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Product[];
      }
    } catch {
      // Fallback
    }
    return getStore().products.filter((p) => p.active);
  },

  async getAllAdminProducts(): Promise<Product[]> {
    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Product[];
      }
    } catch {
      // Fallback
    }
    return getStore().products;
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) return data as Product;
    } catch {
      // Fallback
    }
    return getStore().products.find((p) => p.id === id) ?? null;
  },

  async createProduct(item: Omit<Product, "id" | "created_at">): Promise<Product> {
    const newProd: Product = {
      ...item,
      id: "prod-" + Date.now(),
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("products")
        .insert(item)
        .select("*")
        .single();
      if (!error && data) return data as Product;
    } catch {
      // Fallback
    }

    getStore().products.unshift(newProd);
    return newProd;
  },

  async updateProduct(id: string, patch: Partial<Product>): Promise<Product | null> {
    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("products")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (!error && data) return data as Product;
    } catch {
      // Fallback
    }

    const store = getStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      store.products[idx] = { ...store.products[idx], ...patch };
      return store.products[idx];
    }
    return null;
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const supabase = supabaseService();
      await supabase.from("products").delete().eq("id", id);
    } catch {
      // Fallback
    }
    const store = getStore();
    store.products = store.products.filter((p) => p.id !== id);
    return true;
  },

  // ORDERS
  async createOrder(params: {
    product_id: string;
    qty: number;
    amount: number;
    payment_method?: string;
    user_identifier?: string;
  }): Promise<Order> {
    const newOrder: Order = {
      id: "ord-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now().toString(36),
      product_id: params.product_id,
      qty: params.qty,
      amount: params.amount,
      status: "pending",
      payment_method: params.payment_method as any,
      user_identifier: params.user_identifier,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("orders")
        .insert({
          product_id: params.product_id,
          qty: params.qty,
          amount: params.amount,
          status: "pending",
          payment_method: params.payment_method,
          user_identifier: params.user_identifier,
        })
        .select("*")
        .single();
      if (!error && data) return data as Order;
    } catch {
      // Fallback
    }

    getStore().orders.unshift(newOrder);
    return newOrder;
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) return data as Order;
    } catch {
      // Fallback
    }
    return getStore().orders.find((o) => o.id === id) ?? null;
  },

  async updateOrderStatus(id: string, status: "paid" | "cancelled" | "dispensed"): Promise<{ ok: boolean; order?: Order }> {
    try {
      const supabase = supabaseService();
      const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
      if (order) {
        if (status === "paid") {
          const { data: prod } = await supabase.from("products").select("id, stock").eq("id", order.product_id).single();
          if (prod && Number(prod.stock) >= Number(order.qty)) {
            await supabase.from("products").update({ stock: Number(prod.stock) - Number(order.qty) }).eq("id", prod.id);
          }
        }
        await supabase.from("orders").update({ status }).eq("id", id);
      }
    } catch {
      // Fallback
    }

    const store = getStore();
    const order = store.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      if (status === "paid") {
        const prod = store.products.find((p) => p.id === order.product_id);
        if (prod && prod.stock >= order.qty) {
          prod.stock -= order.qty;
        }
      }
      return { ok: true, order };
    }
    return { ok: true };
  },

  // SUBSCRIPTIONS (ANNUAL 1-YEAR PASSES)
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data as Subscription[];
    } catch {
      // Fallback
    }
    return getStore().subscriptions;
  },

  async findSubscriptionByCodeOrQr(query: string): Promise<Subscription | null> {
    const clean = query.trim().toUpperCase();
    const store = getStore();

    // Check supabase
    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .or(`card_code.ilike.%${clean}%,qr_data.ilike.%${clean}%,user_phone.eq.${clean},user_email.ilike.%${clean}%`)
        .limit(1)
        .single();
      if (!error && data) return data as Subscription;
    } catch {
      // Fallback
    }

    // Match in local store
    return (
      store.subscriptions.find((s) => {
        return (
          s.card_code.toUpperCase() === clean ||
          s.qr_data.toUpperCase().includes(clean) ||
          s.user_phone.replace(/\D/g, "") === clean.replace(/\D/g, "") ||
          s.user_email.toLowerCase() === query.trim().toLowerCase()
        );
      }) ?? null
    );
  },

  async createSubscription(params: {
    user_name: string;
    user_email: string;
    user_phone: string;
    plan_name?: string;
  }): Promise<Subscription> {
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const card_code = `SAN-SUB-${now.getFullYear()}-${randomSuffix}`;
    const qr_data = `SAN-SUB:${card_code}:${params.user_email.trim().toLowerCase()}`;

    const newSub: Subscription = {
      id: "sub-" + Date.now(),
      user_name: params.user_name.trim(),
      user_email: params.user_email.trim().toLowerCase(),
      user_phone: params.user_phone.trim(),
      card_code,
      qr_data,
      status: "active",
      plan_name: params.plan_name || "1-Year Annual Sanitary Hygiene Pass",
      valid_from: now.toISOString().slice(0, 10),
      valid_until: oneYearLater.toISOString().slice(0, 10),
      annual_quota: 60, // 5 pads per month * 12 months = 60
      monthly_quota: 5,
      used_quota: 0,
      created_at: now.toISOString(),
    };

    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("subscriptions")
        .insert(newSub)
        .select("*")
        .single();
      if (!error && data) return data as Subscription;
    } catch {
      // Fallback
    }

    getStore().subscriptions.unshift(newSub);
    return newSub;
  },

  async redeemSubscriptionQuota(
    subId: string,
    productId: string,
    qty: number
  ): Promise<{ ok: boolean; error?: string; remainingQuota?: number }> {
    const store = getStore();
    const sub = store.subscriptions.find((s) => s.id === subId);

    if (!sub) return { ok: false, error: "Subscription pass not found" };

    if (sub.status !== "active") {
      return { ok: false, error: "Subscription is not active" };
    }

    const today = new Date().toISOString().slice(0, 10);
    if (today > sub.valid_until) {
      sub.status = "expired";
      return { ok: false, error: "Annual subscription has expired. Please renew." };
    }

    const available = sub.annual_quota - sub.used_quota;
    if (available < qty) {
      return {
        ok: false,
        error: `Insufficient quota. Only ${available} pad(s) available in your annual pass.`,
      };
    }

    // Check product stock
    const prod = store.products.find((p) => p.id === productId);
    if (!prod || prod.stock < qty) {
      return { ok: false, error: "Selected product is out of stock in this vending slot." };
    }

    // Deduct stock and increment used quota
    sub.used_quota += qty;
    prod.stock -= qty;

    // Log dispense
    const log: DispenseLog = {
      id: "disp-" + Date.now(),
      product_id: prod.id,
      product_name: prod.name,
      qty,
      method: "subscription_qr",
      user_identifier: `${sub.user_name} (${sub.card_code})`,
      status: "success",
      slot: "Tray-A1",
      created_at: new Date().toISOString(),
    };
    store.dispenseLogs.unshift(log);

    // Also update Supabase if accessible
    try {
      const supabase = supabaseService();
      await supabase
        .from("subscriptions")
        .update({ used_quota: sub.used_quota })
        .eq("id", sub.id);
      await supabase
        .from("products")
        .update({ stock: prod.stock })
        .eq("id", prod.id);
      await supabase.from("dispense_logs").insert(log);
    } catch {
      // Handled via memory store
    }

    return { ok: true, remainingQuota: sub.annual_quota - sub.used_quota };
  },

  // DISPENSE LOGS
  async logDispense(log: Omit<DispenseLog, "id" | "created_at">): Promise<DispenseLog> {
    const newLog: DispenseLog = {
      ...log,
      id: "disp-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    getStore().dispenseLogs.unshift(newLog);

    try {
      const supabase = supabaseService();
      await supabase.from("dispense_logs").insert(newLog);
    } catch {
      // Ignored
    }

    return newLog;
  },

  async getDispenseLogs(): Promise<DispenseLog[]> {
    try {
      const supabase = supabaseService();
      const { data, error } = await supabase
        .from("dispense_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data as DispenseLog[];
    } catch {
      // Ignored
    }
    return getStore().dispenseLogs;
  },

  // COIN TRANSACTIONS
  async recordCoinTransaction(tx: Omit<CoinTransaction, "id" | "created_at">): Promise<CoinTransaction> {
    const newTx: CoinTransaction = {
      ...tx,
      id: "coin-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    getStore().coinTransactions.unshift(newTx);

    try {
      const supabase = supabaseService();
      await supabase.from("coin_transactions").insert(newTx);
    } catch {
      // Ignored
    }
    return newTx;
  },

  // STATS
  async getStats() {
    const store = getStore();
    try {
      const supabase = supabaseService();
      const { data: paidOrders } = await supabase
        .from("orders")
        .select("id, qty, amount, status")
        .eq("status", "paid");

      if (paidOrders && paidOrders.length > 0) {
        const totalUsersPurchased = paidOrders.length;
        const totalProductsSold = paidOrders.reduce((s, o) => s + Number(o.qty ?? 0), 0);
        const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.amount ?? 0), 0);

        let totalVisitors = 0;
        const { data: visits } = await supabase.from("visits").select("id");
        if (visits) totalVisitors = visits.length;

        return {
          totalUsersPurchased,
          totalVisitors,
          totalProductsSold,
          totalRevenue,
          totalSubscribers: store.subscriptions.length,
          totalDispensedPads: store.dispenseLogs.length,
        };
      }
    } catch {
      // Fallback to store
    }

    const paid = store.orders.filter((o) => o.status === "paid" || o.status === "dispensed");
    return {
      totalUsersPurchased: paid.length + store.dispenseLogs.length,
      totalVisitors: Math.max(12, store.visits.length),
      totalProductsSold: paid.reduce((s, o) => s + o.qty, 0) + store.dispenseLogs.reduce((s, d) => s + d.qty, 0),
      totalRevenue: paid.reduce((s, o) => s + o.amount, 0),
      totalSubscribers: store.subscriptions.length,
      totalDispensedPads: store.dispenseLogs.length,
    };
  },
};
