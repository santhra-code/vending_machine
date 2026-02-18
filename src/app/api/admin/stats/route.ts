import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseService();

  // Paid orders
  const { data: paidOrders, error: paidErr } = await supabase
    .from("orders")
    .select("id, qty, amount, status")
    .eq("status", "paid");

  if (paidErr) return NextResponse.json({ error: paidErr.message }, { status: 500 });

  const totalUsersPurchased = (paidOrders ?? []).length;
  const totalProductsSold = (paidOrders ?? []).reduce((s, o) => s + Number(o.qty ?? 0), 0);
  const totalRevenue = (paidOrders ?? []).reduce((s, o) => s + Number(o.amount ?? 0), 0);

  // Visitors (if tracking table exists)
  let totalVisitors = 0;
  const { data: visits, error: vErr } = await supabase
    .from("visits")
    .select("id");

  if (!vErr) {
    totalVisitors = (visits ?? []).length;
  }

  return NextResponse.json({
    data: {
      totalUsersPurchased,
      totalVisitors,
      totalProductsSold,
      totalRevenue,
    },
  });
}