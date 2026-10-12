import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const qr_data = body?.qr_data || body?.card_code;
  const product_id = body?.product_id;
  const qty = Number(body?.qty ?? 1);
  const order_id = body?.order_id;

  if (!qr_data) {
    return NextResponse.json({ error: "Missing personal QR code data or Member Code" }, { status: 400 });
  }

  if (!product_id) {
    return NextResponse.json({ error: "Product selection is required" }, { status: 400 });
  }

  // 1. Find subscription
  const sub = await DataService.findSubscriptionByCodeOrQr(qr_data);
  if (!sub) {
    return NextResponse.json(
      { error: "Invalid Member QR code. No active subscription found for this code." },
      { status: 404 }
    );
  }

  // 2. Redeem quota and decrement stock
  const result = await DataService.redeemSubscriptionQuota(sub.id, product_id, qty);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // 3. If an orderId was passed, mark order as paid/dispensed with subscription_qr
  if (order_id) {
    await DataService.updateOrderStatus(order_id, "paid");
  }

  return NextResponse.json({
    ok: true,
    message: `Subscription verified! Dispensing ${qty} pad(s) for ${sub.user_name}.`,
    user_name: sub.user_name,
    card_code: sub.card_code,
    plan_name: sub.plan_name,
    remaining_quota: result.remainingQuota,
    valid_until: sub.valid_until,
    dispense_slot: "Tray-A1",
  });
}
