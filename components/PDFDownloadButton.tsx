"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AnalysisResult } from "@/lib/analyzer";

interface Props {
  result: AnalysisResult;
  className?: string;
  children?: React.ReactNode;
}

export function PDFDownloadButton({ result, className, children }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.place.name.replace(/[^a-z0-9]/gi, "_")}_perfil_nota10.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleDownload} disabled={loading}
      className={className ?? "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-border rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-50"}>
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</> : children ?? "Exportar PDF"}
    </button>
  );
}
