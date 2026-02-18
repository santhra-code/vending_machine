import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }

  const email = "admin@local.test";
  const password = "admin123";

  const supabase = supabaseService();

  const { data, error } = await supabase
    .from("admins")
    .upsert({ email, password }, { onConflict: "email" })
    .select("id, email, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, login: { email, password }, row: data });
}