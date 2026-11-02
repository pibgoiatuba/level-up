import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("configs")
      .select("key, value");

    if (error) {
      console.error("Error fetching config from supabase:", error);
      throw error;
    }

    const config: Record<string, string> = {};
    (rows || []).forEach((row) => {
      if (row.key && row.value) {
        config[row.key] = row.value;
      }
    });

    // Default fallbacks if not found
    if (!config.DIA_ABERTURA_FORM) config.DIA_ABERTURA_FORM = "0";
    if (!config.DIA_ATUALIZACAO_RANKING) config.DIA_ATUALIZACAO_RANKING = "1";
    if (!config.DATA_INICIO_JOGO) config.DATA_INICIO_JOGO = "2026-05-18";

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json({
      DIA_ABERTURA_FORM: "0",
      DIA_ATUALIZACAO_RANKING: "1",
      DATA_INICIO_JOGO: "2026-05-18",
    });
  }
}
