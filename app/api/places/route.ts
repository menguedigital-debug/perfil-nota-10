import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ error: "Query obrigatória" }, { status: 400 });

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&key=${API_KEY}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (!searchData.results?.length) {
    return NextResponse.json({ error: "Nenhum negócio encontrado" }, { status: 404 });
  }

  const placeId = searchData.results[0].place_id;

  const fields = [
    "place_id", "name", "rating", "user_ratings_total",
    "formatted_address", "formatted_phone_number", "website",
    "opening_hours", "photos", "types", "business_status",
    "editorial_summary", "reviews", "url", "vicinity",
  ].join(",");

  const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=pt-BR&key=${API_KEY}`;
  const detailRes = await fetch(detailUrl);
  const detailData = await detailRes.json();

  return NextResponse.json(detailData.result);
}
