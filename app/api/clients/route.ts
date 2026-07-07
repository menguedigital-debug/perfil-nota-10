import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ clients: [] });

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("clients")
    .select("id, place_id, place_name, last_score, last_analyzed_at, created_at")
    .eq("user_email", session.user.email)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ clients: [] });
  return NextResponse.json({ clients: data });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { place_id, place_name, last_score } = await req.json();
  if (!place_id || !place_name) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { error } = await supabase.from("clients").upsert({
    user_email: session.user.email,
    place_id,
    place_name,
    last_score,
    last_analyzed_at: new Date().toISOString(),
  }, { onConflict: "user_email,place_id" });

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_email", session.user.email);

  if (error) return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
