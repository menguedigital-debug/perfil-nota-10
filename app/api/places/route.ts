import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

const FIELDS = [
  "place_id", "name", "rating", "user_ratings_total",
  "formatted_address", "formatted_phone_number", "website",
  "opening_hours", "photos", "types", "business_status",
  "editorial_summary", "reviews", "url", "vicinity",
].join(",");

async function getPlaceDetails(placeId: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${FIELDS}&language=pt-BR&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result ?? null;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas buscas. Aguarde 1 minuto e tente novamente." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  const params = req.nextUrl.searchParams;
  const placeId = params.get("place_id");
  const query = params.get("q");

  // Busca direta por place_id (para links compartilhados)
  if (placeId) {
    const result = await getPlaceDetails(placeId);
    if (!result) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  }

  if (!query) {
    return NextResponse.json({ error: "Informe o nome ou endereço do negócio." }, { status: 400 });
  }

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&key=${API_KEY}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.results?.length) {
    return NextResponse.json(
      { error: "Nenhum negócio encontrado. Tente usar o nome completo ou adicionar a cidade." },
      { status: 404 }
    );
  }

  const result = await getPlaceDetails(searchData.results[0].place_id);
  if (!result) return NextResponse.json({ error: "Erro ao carregar detalhes do perfil." }, { status: 500 });

  return NextResponse.json(result, {
    headers: { "X-RateLimit-Remaining": String(remaining) },
  });
}
