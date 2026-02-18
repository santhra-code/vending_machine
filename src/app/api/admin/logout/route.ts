import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/adminSession";

export async function POST() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}