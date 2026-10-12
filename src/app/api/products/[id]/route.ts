import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await DataService.getProductById(id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: product });
}
