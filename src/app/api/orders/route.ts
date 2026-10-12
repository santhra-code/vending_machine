import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";
import { DataService } from "@/lib/dataService";

export async function GET() {
  try {
    const supabase = supabaseService();
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error && data) return NextResponse.json({ ok: true, data });
  } catch {
    // Fallback
  }
  const orders = await DataService.getStats();
  return NextResponse.json({ ok: true, data: [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.product_id || !body?.qty || body?.amount === undefined) {
    return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
  }

  const { product_id, qty, amount, payment_method, user_identifier } = body;

  try {
    const supabase = supabaseService();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        product_id,
        qty: Number(qty),
        amount: Number(amount),
        status: "pending",
        payment_method: payment_method || null,
        user_identifier: user_identifier || null,
      })
      .select("id")
      .single();

    if (!error && data) {
      return NextResponse.json({ ok: true, id: data.id });
    }
  } catch {
    // Fallback
  }

  const order = await DataService.createOrder({
    product_id,
    qty: Number(qty),
    amount: Number(amount),
    payment_method,
    user_identifier,
  });

  return NextResponse.json({ ok: true, id: order.id, order });
}
