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
  if (body?.name !== undefined) patch.name = String(body.name).trim();
  if (body?.brand !== undefined) patch.brand = String(body.brand).trim();
  if (body?.size !== undefined) patch.size = String(body.size).trim();
  if (body?.image_url !== undefined) patch.image_url = body.image_url ? String(body.image_url) : null;
  if (body?.price !== undefined) patch.price = Number(body.price);
  if (body?.stock !== undefined) patch.stock = Number(body.stock);
  if (body?.active !== undefined) patch.active = Boolean(body.active);

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select("*")
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

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}