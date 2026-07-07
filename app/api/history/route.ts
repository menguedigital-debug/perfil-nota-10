import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ analyses: [] });

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("id, place_id, place_name, score, created_at")
    .eq("user_email", session.user.email)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ analyses: [] });
  return NextResponse.json({ analyses: data });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: true });

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { place_id, place_name, score } = await req.json();
  if (!place_id || !place_name || score === undefined) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { error } = await supabase.from("analyses").insert({
    user_email: session.user.email,
    place_id,
    place_name,
    score,
  });

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
