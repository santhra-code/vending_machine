import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const amount = Number(searchParams.get("amount") ?? "35");
  const orderId = searchParams.get("orderId") ?? "ORD-" + Date.now();
  const upiId = process.env.VENDING_UPI_ID || "santra.vending@upi";
  const payeeName = process.env.VENDING_PAYEE_NAME || "Digital Sanitary Napkin Vending";

  // Standard UPI URI specification
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Santra Vending Pad Order ${orderId}`)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(upiString, {
      width: 320,
      margin: 2,
      color: {
        dark: "#1e1b4b", // deep indigo
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      ok: true,
      qrDataUrl,
      upiString,
      gpayUri: upiString,
      amount,
      orderId,
      upiId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate UPI QR" }, { status: 500 });
  }
}
