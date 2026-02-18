import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseService();
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = supabaseService();
  const body = await req.json().catch(() => null);

  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "Email and password (min 6 chars) required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("admins")
    .insert({ email, password })
    .select("id, email, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}