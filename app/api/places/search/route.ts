import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas buscas. Aguarde 1 minuto." }, { status: 429 });
  }

  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  const results = (data.results ?? []).slice(0, 8).map((r: {
    place_id: string;
    name: string;
    formatted_address?: string;
    types?: string[];
    rating?: number;
    user_ratings_total?: number;
  }) => ({
    placeId: r.place_id,
    name: r.name,
    address: r.formatted_address ?? "",
    types: r.types ?? [],
    rating: r.rating,
    reviewCount: r.user_ratings_total,
  }));

  return NextResponse.json({ results });
}
