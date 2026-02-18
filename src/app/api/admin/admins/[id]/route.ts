import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseService();
  const body = await req.json().catch(() => null);

  const patch: Record<string, unknown> = {};
  if (body?.email !== undefined) patch.email = String(body.email).trim().toLowerCase();
  if (body?.password !== undefined) {
    const pwd = String(body.password);
    if (pwd.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 chars" }, { status: 400 });
    }
    patch.password = pwd;
  }

  const { data, error } = await supabase
    .from("admins")
    .update(patch)
    .eq("id", id)
    .select("id, email, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseService();

  const { error } = await supabase.from("admins").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}