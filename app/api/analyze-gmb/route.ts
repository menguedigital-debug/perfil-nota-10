import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const locationName = req.nextUrl.searchParams.get("location");
  if (!locationName) {
    return NextResponse.json({ error: "Location obrigatória" }, { status: 400 });
  }

  const fields = [
    "name", "title", "phoneNumbers", "websiteUri",
    "regularHours", "specialHours", "categories",
    "profile", "metadata", "storefrontAddress",
    "openInfo", "serviceItems",
  ].join(",");

  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=${fields}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
