import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: challenges, error } = await supabase
      .from("challenges")
      .select("category, name, xp, type, display_order")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching challenges:", error);
      throw error;
    }

    if (!challenges || challenges.length === 0) {
      return NextResponse.json([]);
    }

    // Group by category
    const grouped: Record<string, any[]> = {};
    challenges.forEach((c) => {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push({
        category: c.category,
        name: c.name,
        xp: c.xp,
        type: c.type === "number" ? "number" : "checkbox",
      });
    });

    const result = Object.keys(grouped).map((category) => ({
      category,
      challenges: grouped[category],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}
