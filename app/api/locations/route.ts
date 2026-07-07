import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Buscar contas do Google My Business
  const accountsRes = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  );
  const accountsData = await accountsRes.json();
  console.log("[GMB accounts]", JSON.stringify(accountsData));

  if (!accountsData.accounts?.length) {
    return NextResponse.json({ error: "Nenhuma conta GMB encontrada", raw: accountsData }, { status: 404 });
  }

  const accountName = accountsData.accounts[0].name;

  // Buscar localizações da conta
  const locationsRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,phoneNumbers,websiteUri,regularHours,specialHours,categories,profile,metadata,storefrontAddress&pageSize=100`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } }
  );
  const locationsData = await locationsRes.json();

  return NextResponse.json({
    account: accountsData.accounts[0],
    locations: locationsData.locations ?? [],
  });
}
