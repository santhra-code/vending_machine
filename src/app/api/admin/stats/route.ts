import { NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

export async function GET() {
  const stats = await DataService.getStats();
  return NextResponse.json({
    data: stats,
  });
}