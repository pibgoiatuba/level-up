import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if user exists in members table
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, email")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (memberError) {
      console.error("Error verifying member:", memberError);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ valid: false, reason: "not_found" });
    }

    // 2. Check if user already submitted today (America/Sao_Paulo)
    const now = new Date();
    const spDateStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // YYYY-MM-DD
    const startOfTodaySP = new Date(`${spDateStr}T00:00:00-03:00`).toISOString();
    const endOfTodaySP = new Date(`${spDateStr}T23:59:59.999-03:00`).toISOString();

    const { data: todaySubmissions, error: subError } = await supabase
      .from("submissions")
      .select("id")
      .ilike("email", normalizedEmail)
      .gte("submission_date", startOfTodaySP)
      .lte("submission_date", endOfTodaySP)
      .limit(1);

    if (subError) {
      console.error("Error checking today submission:", subError);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (todaySubmissions && todaySubmissions.length > 0) {
      return NextResponse.json({ valid: false, reason: "already_submitted" });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error verifying player:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
