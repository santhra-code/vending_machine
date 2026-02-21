import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } } // ✅ params is NOT a Promise
) {
  const { id } = params;
  const body = await req.json().catch(() => null);
  const status = body?.status as "paid" | "cancelled" | undefined;

  if (!status || (status !== "paid" && status !== "cancelled")) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = supabaseService();

  if (status === "paid") {
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id, product_id, qty, status")
      .eq("id", id)
      .single();

    if (oErr || !order) {
      return NextResponse.json(
        { error: oErr?.message ?? "Order not found" },
        { status: 404 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id, stock")
      .eq("id", order.product_id)
      .single();

    if (pErr || !product) {
      return NextResponse.json(
        { error: pErr?.message ?? "Product not found" },
        { status: 404 }
      );
    }

    if (Number(product.stock) < Number(order.qty)) {
      return NextResponse.json(
        { error: "Not enough stock to complete payment" },
        { status: 409 }
      );
    }

    const { error: updOrderErr } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", id);

    if (updOrderErr) {
      return NextResponse.json({ error: updOrderErr.message }, { status: 500 });
    }

    const { error: updProdErr } = await supabase
      .from("products")
      .update({ stock: Number(product.stock) - Number(order.qty) })
      .eq("id", product.id);

    if (updProdErr) {
      return NextResponse.json({ error: updProdErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // Cancel order
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}