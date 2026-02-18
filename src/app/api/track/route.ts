import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";
import crypto from "crypto";

function getIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const supabase = supabaseService();

  const ip = getIp(req);
  const ip_hash = crypto.createHash("sha256").update(ip).digest("hex");
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // only one visit per ip per day
  const { data: existing, error: exErr } = await supabase
    .from("visits")
    .select("id")
    .eq("ip_hash", ip_hash)
    .eq("day", day)
    .limit(1);

  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  if ((existing ?? []).length > 0) return NextResponse.json({ ok: true, counted: false });

  const { error } = await supabase.from("visits").insert({ ip_hash, day });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, counted: true });
}