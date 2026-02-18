import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/admin/:path*"],
};

async function verify(token: string) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("Missing ADMIN_JWT_SECRET");

  const key = new TextEncoder().encode(secret);
  await jwtVerify(token, key);
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // allow admin login page
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get("admin_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

  try {
    await verify(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}