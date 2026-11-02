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
      .from("challenges")
      .select("*")
      .order("category", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ error: "Erro ao buscar desafios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { category, name, xp, type, display_order } = await request.json();

    if (!category || !name) {
      return NextResponse.json({ error: "Categoria e Nome são obrigatórios" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("challenges")
      .insert({
        category: category.trim(),
        name: name.trim(),
        xp: parseInt(xp, 10) || 0,
        type: type === "number" ? "number" : "checkbox",
        display_order: parseInt(display_order, 10) || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ error: "Erro ao criar desafio" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, category, name, xp, type, display_order } = await request.json();

    if (!id || !category || !name) {
      return NextResponse.json({ error: "ID, Categoria e Nome são obrigatórios" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("challenges")
      .update({
        category: category.trim(),
        name: name.trim(),
        xp: parseInt(xp, 10) || 0,
        type: type === "number" ? "number" : "checkbox",
        display_order: parseInt(display_order, 10) || 0,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json({ error: "Erro ao atualizar desafio" }, { status: 500 });
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
    const { error } = await supabase.from("challenges").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json({ error: "Erro ao excluir desafio" }, { status: 500 });
  }
}

