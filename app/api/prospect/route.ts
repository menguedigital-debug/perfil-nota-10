import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyzePlace, type PlaceDetails } from "@/lib/analyzer";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const MAX_RESULTS = 12;

const FIELDS = [
  "place_id", "name", "rating", "user_ratings_total",
  "formatted_address", "formatted_phone_number", "website",
  "opening_hours", "photos", "types", "business_status",
  "editorial_summary", "reviews", "url", "vicinity",
  "wheelchair_accessible_entrance", "dine_in", "delivery", "takeout",
  "serves_beer", "serves_wine", "serves_breakfast", "serves_lunch",
  "serves_dinner", "serves_brunch", "serves_vegetarian_food",
  "reservable", "price_level", "curbside_pickup",
].join(",");

async function getDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${FIELDS}&language=pt-BR&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas buscas. Aguarde 1 minuto." }, { status: 429 });
  }

  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ error: "Informe o segmento e a cidade (ex: pizzaria em Florianópolis)." }, { status: 400 });
  }

  // 1. Busca textual → lista de place_ids
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&key=${API_KEY}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.results?.length) {
    return NextResponse.json({ error: "Nenhum negócio encontrado. Tente outro termo ou adicione a cidade." }, { status: 404 });
  }

  const placeIds: string[] = searchData.results
    .slice(0, MAX_RESULTS)
    .map((r: { place_id: string }) => r.place_id);

  // 2. Detalhes + análise em paralelo
  const settled = await Promise.allSettled(placeIds.map(getDetails));

  const businesses = settled
    .map(s => (s.status === "fulfilled" ? s.value : null))
    .filter((p): p is PlaceDetails => p !== null)
    .map(place => {
      const analysis = analyzePlace(place);
      const all = [...analysis.metrics, ...analysis.pendingMetrics].filter(m => !m.unverified);
      return {
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address ?? place.vicinity ?? "",
        rating: place.rating ?? null,
        reviewCount: place.user_ratings_total ?? 0,
        score: analysis.overallScore,
        goodCount: all.filter(m => m.status === "bom").length,
        fairCount: all.filter(m => m.status === "razoavel").length,
        poorCount: all.filter(m => m.status === "fraco").length,
        hasWebsite: !!place.website,
        hasPhone: !!place.formatted_phone_number,
      };
    });

  return NextResponse.json({ query, count: businesses.length, businesses });
}
