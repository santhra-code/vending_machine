import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const patch: Record<string, unknown> = {};
  if (body?.name !== undefined) patch.name = String(body.name).trim();
  if (body?.brand !== undefined) patch.brand = String(body.brand).trim();
  if (body?.size !== undefined) patch.size = String(body.size).trim();
  if (body?.image_url !== undefined) patch.image_url = body.image_url ? String(body.image_url) : null;
  if (body?.price !== undefined) patch.price = Number(body.price);
  if (body?.stock !== undefined) patch.stock = Number(body.stock);
  if (body?.active !== undefined) patch.active = Boolean(body.active);

  const data = await DataService.updateProduct(id, patch);
  if (!data) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await DataService.deleteProduct(id);
  return NextResponse.json({ ok: true });
}