import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function GET() {
  const products = await DataService.getAllAdminProducts();
  return NextResponse.json({ data: products });
}

export async function POST(req: NextRequest) {
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

  const data = await DataService.createProduct(payload);
  return NextResponse.json({ data });
}