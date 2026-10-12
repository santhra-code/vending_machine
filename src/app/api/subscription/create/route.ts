import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const user_name = String(body?.user_name ?? "").trim();
  const user_email = String(body?.user_email ?? "").trim();
  const user_phone = String(body?.user_phone ?? "").trim();
  const plan_name = body?.plan_name ? String(body.plan_name).trim() : "1-Year Annual Sanitary Hygiene Pass";

  if (!user_name || !user_email || !user_phone) {
    return NextResponse.json(
      { error: "Name, email, and phone number are required to issue an Annual Pass." },
      { status: 400 }
    );
  }

  const sub = await DataService.createSubscription({
    user_name,
    user_email,
    user_phone,
    plan_name,
  });

  return NextResponse.json({ ok: true, data: sub });
}

export async function GET() {
  const subs = await DataService.getSubscriptions();
  return NextResponse.json({ ok: true, data: subs });
}
