import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const locationName = req.nextUrl.searchParams.get("location") ?? "locations/7684093838078563628";
  const headers = { Authorization: `Bearer ${session.accessToken}` };

  // Testar diferentes formatos de path para reviews e posts
  const tests = await Promise.all([
    fetch(`https://mybusinessreviews.googleapis.com/v1/${locationName}/reviews?pageSize=5`, { headers })
      .then(async r => ({ url: `reviews v1 (${locationName})`, status: r.status, body: await r.json() })),
    fetch(`https://mybusinesspostings.googleapis.com/v1/${locationName}/localPosts?pageSize=5`, { headers })
      .then(async r => ({ url: `posts v1 (${locationName})`, status: r.status, body: await r.json() })),
    // Tentar com account prefix — buscar account primeiro
    fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers })
      .then(async r => ({ url: "accounts list", status: r.status, body: await r.json() })),
  ]);

  return NextResponse.json({ tests });
}
