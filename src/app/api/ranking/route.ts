import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { differenceInCalendarWeeks, parseISO } from "date-fns";
import { Member } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // 0. Fetch Configs
    const { data: configRows } = await supabase.from("configs").select("key, value");
    let formOpenDay = 0; // Default Sunday
    let rankingUpdateDay = 1; // Default Monday
    let gameStartDate = "2026-05-18"; // Default

    (configRows || []).forEach((r) => {
      if (r.key === "DIA_ABERTURA_FORM") formOpenDay = parseInt(r.value, 10);
      if (r.key === "DIA_ATUALIZACAO_RANKING") rankingUpdateDay = parseInt(r.value, 10);
      if (r.key === "DATA_INICIO_JOGO") gameStartDate = r.value;
    });

    // 1. Fetch Members
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, email, name, photo_url");

    if (membersError) {
      console.error("Error fetching members:", membersError);
      throw membersError;
    }

    const membersMap: Record<string, Member> = {};
    (members || []).forEach((m) => {
      const memberName = m.name || m.email.split("@")[0];
      membersMap[m.email.toLowerCase()] = {
        email: m.email,
        name: memberName,
        photoUrl: m.photo_url || `/profiles/${memberName.toLowerCase()}.webp`,
        totalXp: 0,
        weeklyXp: 0,
      };
    });

    // 2. Calculate Suspense Window & Week
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

    let startDate = parseISO(gameStartDate);
    if (gameStartDate.includes("/")) {
      const [day, month, year] = gameStartDate.split("/");
      startDate = new Date(`${year}-${month}-${day}T00:00:00`);
    }
    const weekNum = differenceInCalendarWeeks(now, startDate, { weekStartsOn: 1 }) + 1;
    const targetWeekNum = Math.max(1, weekNum - 1);
    const currentWeekLabel = `SEMANA ${targetWeekNum}`;

    // 3. Fetch Submissions
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("email, week, total_xp, submission_date");

    if (subError) {
      console.error("Error fetching submissions:", subError);
      throw subError;
    }

    (submissions || []).forEach((sub) => {
      const subEmail = sub.email?.toLowerCase();
      if (!subEmail || !membersMap[subEmail]) return;

      const subDate = new Date(sub.submission_date).getTime();

      // Suspense window check
      if (isInsideSuspenseWindow && subDate >= lastFormOpenDate.getTime()) {
        return;
      }

      const xp = sub.total_xp || 0;
      membersMap[subEmail].totalXp += xp;

      if (sub.week && sub.week.trim() === currentWeekLabel.trim()) {
        membersMap[subEmail].weeklyXp = (membersMap[subEmail].weeklyXp || 0) + xp;
      }
    });

    // 4. Sort descending by totalXp
    const sortedMembers = Object.values(membersMap).sort((a, b) => b.totalXp - a.totalXp);
    return NextResponse.json(sortedMembers);
  } catch (error) {
    console.error("Error fetching ranking:", error);
    return NextResponse.json({ error: "Failed to fetch ranking" }, { status: 500 });
  }
}
