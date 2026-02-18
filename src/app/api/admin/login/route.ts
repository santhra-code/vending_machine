import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServer";
import { setAdminCookie, signAdminSession } from "@/lib/adminSession";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const supabase = supabaseService();

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, email, password")
      .eq("email", email)
      .single();

    // IMPORTANT: show clear reason
    if (error) {
      return NextResponse.json(
        { error: `Supabase error reading admins: ${error.message}` },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: "No admin found with this email (seed one first)" },
        { status: 401 }
      );
    }

    const ok = password === admin.password;
    if (!ok) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    const token = await signAdminSession({ adminId: admin.id, email: admin.email });
    await setAdminCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}