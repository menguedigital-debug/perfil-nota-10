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

  const headers = { Authorization: `Bearer ${session.accessToken}` };

  const fields = [
    "name", "title", "phoneNumbers", "websiteUri",
    "regularHours", "specialHours", "categories",
    "profile", "metadata", "storefrontAddress",
    "serviceItems",
  ].join(",");

  // Buscar account para montar caminho completo (reviews/posts exigem accounts/{id}/locations/{id})
  const accountsRes = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers }
  );
  const accountsData = await accountsRes.json().catch(() => ({}));
  const accountName = accountsData.accounts?.[0]?.name as string | undefined;
  const locationId = locationName.replace("locations/", "");
  const fullLocationPath = accountName
    ? `${accountName}/locations/${locationId}`
    : locationName;

  // Performance API — parâmetros repetidos para dailyMetrics
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() - 1); // ontem (dados até D-1)
  const start = new Date(now); start.setDate(start.getDate() - 91);
  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "CALL_CLICKS",
    "WEBSITE_CLICKS",
    "BUSINESS_DIRECTION_REQUESTS",
  ];
  const perfParams = metrics.map(m => `dailyMetrics=${encodeURIComponent(m)}`).join("&")
    + `&dailyRange.startDate.year=${start.getFullYear()}`
    + `&dailyRange.startDate.month=${start.getMonth() + 1}`
    + `&dailyRange.startDate.day=${start.getDate()}`
    + `&dailyRange.endDate.year=${end.getFullYear()}`
    + `&dailyRange.endDate.month=${end.getMonth() + 1}`
    + `&dailyRange.endDate.day=${end.getDate()}`;

  const [locationRes, attributesRes, reviewsRes, postsRes, perfRes, verifRes] = await Promise.all([
    fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=${fields}`,
      { headers }
    ),
    fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}/attributes`,
      { headers }
    ).catch(() => null),
    fetch(
      `https://mybusinessreviews.googleapis.com/v1/${locationName}/reviews?pageSize=50`,
      { headers }
    ).catch(() => null).then(async (r) => {
      if (r && r.ok) return r;
      const r2 = await fetch(
        `https://mybusinessreviews.googleapis.com/v1/${fullLocationPath}/reviews?pageSize=50`,
        { headers }
      ).catch(() => null);
      if (r2 && r2.ok) return r2;
      // Fallback: legacy Google My Business API v4
      const r3 = await fetch(
        `https://mybusiness.googleapis.com/v4/${fullLocationPath}/reviews?pageSize=50`,
        { headers }
      ).catch(() => null);
      return (r3 && r3.ok) ? r3 : (r ?? r2 ?? r3);
    }),
    fetch(
      `https://mybusinesspostings.googleapis.com/v1/${locationName}/localPosts?pageSize=10`,
      { headers }
    ).catch(() => null).then(async (r) => {
      if (r && r.ok) return r;
      const r2 = await fetch(
        `https://mybusinesspostings.googleapis.com/v1/${fullLocationPath}/localPosts?pageSize=10`,
        { headers }
      ).catch(() => null);
      if (r2 && r2.ok) return r2;
      // Fallback: legacy Google My Business API v4 (já habilitada)
      const r3 = await fetch(
        `https://mybusiness.googleapis.com/v4/${fullLocationPath}/localPosts?pageSize=10`,
        { headers }
      ).catch(() => null);
      return (r3 && r3.ok) ? r3 : (r ?? r2 ?? r3);
    }),
    fetch(
      `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries?${perfParams}`,
      { headers }
    ).catch(() => null),
    fetch(
      `https://mybusinessverifications.googleapis.com/v1/${locationName}/verifications`,
      { headers }
    ).catch(() => null).then(async (r) => {
      if (r && r.ok) return r;
      const r2 = await fetch(
        `https://mybusinessverifications.googleapis.com/v1/${fullLocationPath}/verifications`,
        { headers }
      ).catch(() => null);
      return (r2 && r2.ok) ? r2 : (r ?? r2);
    }),
  ]);

  const locationData = await locationRes.json();
  const attributesData = attributesRes ? await attributesRes.json().catch(() => ({})) : {};
  const reviewsText = reviewsRes ? await reviewsRes.text().catch(() => "") : "";
  const postsText = postsRes ? await postsRes.text().catch(() => "") : "";
  const perfData = perfRes ? await perfRes.json().catch(() => ({})) : {};
  const verifData = verifRes ? await verifRes.json().catch(() => ({})) : {};
  const reviewsRaw = (() => { try { return JSON.parse(reviewsText); } catch { return {}; } })();
  const postsRaw = (() => { try { return JSON.parse(postsText); } catch { return {}; } })();

  // Se serviceItems causou erro 400, refaz sem ele
  let finalLocationData = locationData;
  if (locationData.error?.code === 400) {
    const fallbackFields = fields.replace(",serviceItems", "");
    const retryRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=${fallbackFields}`,
      { headers }
    );
    finalLocationData = await retryRes.json();
  }

  const attributes = attributesData.attributes ?? [];
  const reviewsData = reviewsRaw.error ? {} : reviewsRaw;
  const reviewsAvailable = reviewsRes?.ok === true && !reviewsRaw.error;
  const postsAvailable = postsRes?.ok === true && !postsRaw.error;
  const perfAvailable = perfRes?.ok === true && !perfData.error;
  const verifAvailable = verifRes?.ok === true && !verifData.error;

  return NextResponse.json({
    ...finalLocationData,
    attributes,
    _reviews: reviewsData,
    _posts: postsRaw,
    _perf: perfAvailable ? perfData : null,
    _verif: verifAvailable ? verifData : null,
    _meta: { reviewsAvailable, postsAvailable, perfAvailable, verifAvailable },
  });
}
