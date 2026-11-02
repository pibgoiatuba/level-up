import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("submissions")
      .select("id, member_id, email, week, total_xp, details_text, submission_date, created_at")
      .order("submission_date", { ascending: false })
      .limit(150);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Erro ao buscar submissões" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, email, week, total_xp, details_text, submission_date } = await request.json();

    if (!id || !email) {
      return NextResponse.json({ error: "ID e Email são obrigatórios" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const cleanEmail = email.trim().toLowerCase();

    // Check if member exists to link member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .ilike("email", cleanEmail)
      .maybeSingle();

    const { data, error } = await supabase
      .from("submissions")
      .update({
        email: cleanEmail,
        member_id: member?.id || null,
        week: week ? week.trim() : "SEMANA 1",
        total_xp: parseInt(total_xp, 10) || 0,
        details_text: details_text || null,
        submission_date: submission_date || new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json({ error: "Erro ao atualizar envio" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("submissions").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json({ error: "Erro ao excluir submissão" }, { status: 500 });
  }
}
