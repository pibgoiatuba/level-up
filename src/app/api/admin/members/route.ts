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

    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, email, name, photo_url, created_at")
      .order("name", { ascending: true });

    if (membersError) throw membersError;

    // Get submissions to calculate total XP and submission count per member
    const { data: subs, error: subsError } = await supabase
      .from("submissions")
      .select("email, total_xp");

    if (subsError) throw subsError;

    const xpMap: Record<string, { totalXp: number; subCount: number }> = {};
    (subs || []).forEach((s) => {
      const email = s.email?.toLowerCase();
      if (!email) return;
      if (!xpMap[email]) xpMap[email] = { totalXp: 0, subCount: 0 };
      xpMap[email].totalXp += s.total_xp || 0;
      xpMap[email].subCount += 1;
    });

    const membersWithStats = (members || []).map((m) => {
      const stats = xpMap[m.email.toLowerCase()] || { totalXp: 0, subCount: 0 };
      return {
        ...m,
        totalXp: stats.totalXp,
        submissionCount: stats.subCount,
      };
    });

    return NextResponse.json(membersWithStats);
  } catch (error) {
    console.error("Error fetching members for admin:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, photo_url } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e Email são obrigatórios" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const finalPhotoUrl =
      photo_url || `/profiles/${cleanName.toLowerCase()}.webp`;

    const { data, error } = await supabase
      .from("members")
      .insert({
        name: cleanName,
        email: cleanEmail,
        photo_url: finalPhotoUrl,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Já existe um participante com esse e-mail" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json({ error: "Erro ao criar participante" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name, email, photo_url } = await request.json();

    if (!id || !name || !email) {
      return NextResponse.json({ error: "ID, Nome e Email são obrigatórios" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const { data, error } = await supabase
      .from("members")
      .update({
        name: cleanName,
        email: cleanEmail,
        photo_url: photo_url || `/profiles/${cleanName.toLowerCase()}.webp`,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Já existe um participante com esse e-mail" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Erro ao atualizar participante" }, { status: 500 });
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
    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: "Erro ao excluir participante" }, { status: 500 });
  }
}

