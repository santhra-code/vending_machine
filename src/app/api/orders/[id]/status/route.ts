// src/app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";
import { DataService } from "@/lib/dataService";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = supabaseService();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, products(*)")
      .eq("id", id)
      .single();
    if (!error && order) {
      return NextResponse.json({ ok: true, order });
    }
  } catch {
    // Fallback
  }

  const order = await DataService.getOrderById(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const product = await DataService.getProductById(order.product_id);
  return NextResponse.json({ ok: true, order: { ...order, products: product } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status as "paid" | "cancelled" | "dispensed" | undefined;
  const payment_method = body?.payment_method;

  if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    const supabase = supabaseService();

    if (status === "paid") {
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .select("id, product_id, qty, status")
        .eq("id", id)
        .single();

      if (!oErr && order) {
        if (order.status === "paid") return NextResponse.json({ ok: true, alreadyPaid: true });

        const { data: product, error: pErr } = await supabase
          .from("products")
          .select("id, stock")
          .eq("id", order.product_id)
          .single();

        if (pErr || !product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
        if (Number(product.stock) < Number(order.qty))
          return NextResponse.json({ error: "Not enough stock" }, { status: 409 });

        await supabase.from("orders").update({ 
          status: "paid",
          ...(payment_method ? { payment_method } : {})
        }).eq("id", id);
        
        await supabase
          .from("products")
          .update({ stock: Number(product.stock) - Number(order.qty) })
          .eq("id", product.id);

        return NextResponse.json({ ok: true });
      }
    } else {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (!error) return NextResponse.json({ ok: true });
    }
  } catch {
    // Supabase offline/unreachable fallback
  }

  // Resilient fallback logic
  const res = await DataService.updateOrderStatus(id, status as any);
  return NextResponse.json(res);
}
