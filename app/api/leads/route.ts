import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Captura de lead da página pública /analise-gratis.
// A entrega principal do lead é via WhatsApp (no client). Aqui apenas
// registramos o lead no Supabase quando disponível — falha graciosamente
// se o banco estiver pausado ou a tabela não existir.
export async function POST(req: NextRequest) {
  let body: { name?: string; whatsapp?: string; place_id?: string; place_name?: string; score?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { name, whatsapp, place_id, place_name, score } = body;
  if (!name || !whatsapp) {
    return NextResponse.json({ error: "Nome e WhatsApp são obrigatórios" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: true, saved: false });

  try {
    const insert = supabase.from("leads").insert({
      name,
      whatsapp,
      place_id: place_id ?? null,
      place_name: place_name ?? null,
      score: score ?? null,
    });
    // Timeout curto: se o banco estiver pausado, não trava a resposta
    const result = await Promise.race([
      insert,
      new Promise<{ error: { message: string } }>(resolve =>
        setTimeout(() => resolve({ error: { message: "timeout" } }), 3000)
      ),
    ]);
    const saved = !("error" in result && result.error);
    return NextResponse.json({ ok: true, saved });
  } catch {
    // Nunca perde o lead por causa do banco — o WhatsApp já capturou
    return NextResponse.json({ ok: true, saved: false });
  }
}
