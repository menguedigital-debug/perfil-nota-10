import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPDF } from "@/components/ReportPDF";
import { AnalysisResult } from "@/lib/analyzer";

export async function POST(req: NextRequest) {
  const result: AnalysisResult = await req.json();
  const buffer = await renderToBuffer(<ReportPDF result={result} />);
  const name = result.place.name.replace(/[^a-z0-9]/gi, "_");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}_perfil_nota10.pdf"`,
    },
  });
}
