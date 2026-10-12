import { NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function GET() {
  const products = await DataService.getProducts();
  return NextResponse.json({ ok: true, data: products });
}
