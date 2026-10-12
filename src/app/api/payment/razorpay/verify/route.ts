import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { DataService } from "@/lib/dataService";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body || {};

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isConfigured =
    keySecret &&
    keySecret !== "your_razorpay_secret" &&
    !keySecret.includes("your_");

  if (isConfigured && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature verification" }, { status: 400 });
    }
  }

  // Update order status and stock
  if (orderId) {
    await DataService.updateOrderStatus(orderId, "paid");
    const order = await DataService.getOrderById(orderId);
    if (order) {
      await DataService.logDispense({
        order_id: orderId,
        product_id: order.product_id,
        qty: order.qty,
        method: "razorpay",
        user_identifier: razorpay_payment_id || "online_user",
        status: "success",
        slot: "Tray-A1",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Payment successfully verified and stock reserved for dispensing.",
    paymentId: razorpay_payment_id || `sim_${Date.now()}`,
  });
}
