import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { differenceInCalendarWeeks, parseISO } from "date-fns";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, totalXp, details } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Fetch Configs for Start Date
    const { data: configRows } = await supabase
      .from("configs")
      .select("key, value");

    let gameStartDate = "2026-05-18";
    (configRows || []).forEach((r) => {
      if (r.key === "DATA_INICIO_JOGO") gameStartDate = r.value;
    });

    // 2. Check if user exists in members table
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, email")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (memberError) {
      console.error("Error finding member:", memberError);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: "User not found in members" }, { status: 403 });
    }

    // 3. Format details nicely
    const formattedDetails = details
      ? Object.entries(details)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "";

    // 4. Calculate current week
    const now = new Date();
    let startDate = parseISO(gameStartDate);
    if (gameStartDate.includes("/")) {
      const [day, month, year] = gameStartDate.split("/");
      startDate = new Date(`${year}-${month}-${day}T00:00:00`);
    }
    const weekNum = differenceInCalendarWeeks(now, startDate, { weekStartsOn: 1 }) + 1;
    const currentWeek = `SEMANA ${Math.max(1, weekNum)}`;

    // 5. Insert into submissions
    const { error: insertError } = await supabase.from("submissions").insert({
      member_id: member.id,
      email: normalizedEmail,
      week: currentWeek,
      total_xp: totalXp || 0,
      details: details || {},
      details_text: formattedDetails,
      submission_date: now.toISOString(),
    });

    if (insertError) {
      console.error("Error inserting submission:", insertError);
      return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
