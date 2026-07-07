import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// API legada Local Posts (mybusiness v4) — depende da Business Profile API aprovada
const BASE_URL = "https://mybusiness.googleapis.com/v4";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const accountName = req.nextUrl.searchParams.get("account");
  const locationName = req.nextUrl.searchParams.get("location");
  if (!accountName || !locationName) {
    return NextResponse.json({ error: "Conta e localização obrigatórias" }, { status: 400 });
  }

  const res = await fetch(`${BASE_URL}/${accountName}/${locationName}/localPosts`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: "Business Profile API ainda não aprovada para esta conta.", raw: data },
      { status: res.status }
    );
  }

  return NextResponse.json({ posts: data.localPosts ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { accountName, locationName, summary, ctaType, ctaUrl } = body;

  if (!accountName || !locationName || !summary?.trim()) {
    return NextResponse.json({ error: "Conta, localização e texto são obrigatórios" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    languageCode: "pt-BR",
    topicType: "STANDARD",
    summary: summary.trim(),
  };

  if (ctaType && ctaType !== "NONE") {
    payload.callToAction = {
      actionType: ctaType,
      ...(ctaUrl ? { url: ctaUrl } : {}),
    };
  }

  const res = await fetch(`${BASE_URL}/${accountName}/${locationName}/localPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: "Business Profile API ainda não aprovada para esta conta.", raw: data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
