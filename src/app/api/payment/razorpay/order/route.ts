import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount ?? 0);
  const orderId = String(body?.orderId ?? `ord_${Date.now()}`);

  if (amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const isConfigured =
    keyId &&
    keySecret &&
    keyId !== "your_razorpay_key_id" &&
    !keyId.includes("your_");

  if (isConfigured) {
    try {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: Math.round(amount * 100), // in paise
        currency: "INR",
        receipt: `receipt_${orderId.slice(0, 20)}`,
        payment_capture: 1,
      };

      const order = await razorpay.orders.create(options);
      return NextResponse.json({
        ok: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        isSandbox: false,
      });
    } catch (err: any) {
      console.warn("Razorpay API error, falling back to simulated checkout:", err.message);
    }
  }

  // Graceful Sandbox / Test Mode
  return NextResponse.json({
    ok: true,
    orderId: `order_test_${Date.now()}`,
    amount: Math.round(amount * 100),
    currency: "INR",
    keyId: keyId || "rzp_test_santra_demo",
    isSandbox: true,
    message: "Using Razorpay Sandbox / Demo Simulator. Real payments require live RAZORPAY_KEY_ID in .env",
  });
}
