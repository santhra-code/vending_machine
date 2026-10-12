import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || searchParams.get("card_code") || searchParams.get("qr_data");

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const sub = await DataService.findSubscriptionByCodeOrQr(q);
  if (!sub) {
    return NextResponse.json({ error: "No active subscription found for this QR or Member Code" }, { status: 404 });
  }

  const remaining = Math.max(0, sub.annual_quota - sub.used_quota);
  const isExpired = new Date().toISOString().slice(0, 10) > sub.valid_until;

  return NextResponse.json({
    ok: true,
    data: {
      ...sub,
      remaining_quota: remaining,
      is_valid: sub.status === "active" && !isExpired && remaining > 0,
    },
  });
}
