import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseService();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = supabaseService();
  const body = await req.json().catch(() => null);

  const payload = {
    name: String(body?.name ?? "").trim(),
    brand: String(body?.brand ?? "").trim(),
    size: String(body?.size ?? "").trim(),
    price: Number(body?.price ?? 0),
    stock: Number(body?.stock ?? 0),
    image_url: body?.image_url ? String(body.image_url) : null,
    active: body?.active === false ? false : true,
  };

  if (!payload.name || !payload.brand || !payload.size) {
    return NextResponse.json({ error: "name, brand, size are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}