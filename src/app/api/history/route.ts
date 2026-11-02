import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const playerNameParam = url.searchParams.get("player");

    if (!playerNameParam) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 0. Fetch Configs to get formOpenDay
    const { data: configRows } = await supabase.from("configs").select("key, value");
    let formOpenDay = 0; // Default Sunday
    (configRows || []).forEach((r) => {
      if (r.key === "DIA_ABERTURA_FORM") formOpenDay = parseInt(r.value, 10);
    });

    // Calculate Suspense Window
    const systemNow = new Date();
    const spTimeStr = systemNow.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T");
    const now = new Date(spTimeStr);
    const currentDay = now.getDay();

    const isInsideSuspenseWindow = currentDay === formOpenDay;

    let daysSinceFormOpen = currentDay - formOpenDay;
    if (daysSinceFormOpen < 0) daysSinceFormOpen += 7;

    const lastFormOpenDate = new Date(now);
    lastFormOpenDate.setDate(now.getDate() - daysSinceFormOpen);
    lastFormOpenDate.setHours(0, 0, 0, 0);

    // 1. Fetch Member by name
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, email, name, photo_url");

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    const normalizedPlayerName = playerNameParam.trim().toLowerCase();
    const targetMember = (members || []).find(
      (m) =>
        (m.name && m.name.toLowerCase() === normalizedPlayerName) ||
        m.email.split("@")[0].toLowerCase() === normalizedPlayerName
    );

    if (!targetMember) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const targetProfile = {
      name: targetMember.name,
      photoUrl: targetMember.photo_url || `/profiles/${targetMember.name.toLowerCase()}.webp`,
      totalXp: 0,
    };

    // 2. Fetch Submissions for this member
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("submission_date, week, total_xp, details_text")
      .ilike("email", targetMember.email);

    if (subError) {
      console.error("Error fetching submissions:", subError);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    const weeksMap: Record<string, { items: any[]; weekTotal: number }> = {};

    (submissions || []).forEach((sub) => {
      const subDate = new Date(sub.submission_date).getTime();

      // Hide submissions made during suspense window
      if (isInsideSuspenseWindow && subDate >= lastFormOpenDate.getTime()) {
        return;
      }

      const xp = sub.total_xp || 0;
      targetProfile.totalXp += xp;

      const weekLabel = (sub.week || "SEMANA 1").trim().toUpperCase();
      if (!weeksMap[weekLabel]) {
        weeksMap[weekLabel] = { items: [], weekTotal: 0 };
      }

      weeksMap[weekLabel].weekTotal += xp;

      // Parse details text: "Leitura: Concluído (30 XP)\nOração: 5 vezes (50 XP)"
      if (sub.details_text) {
        const lines = sub.details_text.split("\n");
        lines.forEach((line: string) => {
          if (line.trim()) {
            const colonIdx = line.indexOf(":");
            if (colonIdx !== -1) {
              const name = line.substring(0, colonIdx).trim();
              let result = line.substring(colonIdx + 1).trim();

              result = result.replace(/vezes/g, "x");
              result = result.replace(/Concluído/g, "").trim();

              weeksMap[weekLabel].items.push({
                name,
                result,
                date: sub.submission_date,
              });
            } else {
              weeksMap[weekLabel].items.push({
                name: line.trim(),
                result: "",
                date: sub.submission_date,
              });
            }
          }
        });
      }
    });

    // Sort weeks descending (e.g. SEMANA 3, SEMANA 2, SEMANA 1)
    const sortedWeeks = Object.keys(weeksMap)
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        return numB - numA;
      })
      .map((weekLabel) => ({
        week: weekLabel,
        weekTotal: weeksMap[weekLabel].weekTotal,
        items: weeksMap[weekLabel].items,
      }));

    return NextResponse.json({
      profile: targetProfile,
      history: sortedWeeks,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
