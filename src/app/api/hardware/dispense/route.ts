import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { productId, orderId, method, slot, qty } = body || {};

  const dispenseCount = Number(qty || 1);
  const activeSlot = slot || "Tray-A1";

  // Simulate motor pulse delay or physical hardware command
  const hardwarePulse = {
    relayPin: 12,
    motorSlot: activeSlot,
    cycleDurationMs: 1500 * dispenseCount,
    dropSensorStatus: "IR_BEAM_BROKEN_ITEM_CONFIRMED",
    timestamp: new Date().toISOString(),
  };

  if (productId) {
    const prod = await DataService.getProductById(productId);
    await DataService.logDispense({
      order_id: orderId,
      product_id: productId,
      product_name: prod?.name || "Sanitary Napkin",
      qty: dispenseCount,
      method: method || "direct",
      status: "success",
      slot: activeSlot,
    });
  }

  return NextResponse.json({
    ok: true,
    message: `Motor ${activeSlot} actuated. Product dropped into dispensing tray.`,
    hardwarePulse,
  });
}

export async function GET() {
  const logs = await DataService.getDispenseLogs();
  return NextResponse.json({ ok: true, data: logs });
}
