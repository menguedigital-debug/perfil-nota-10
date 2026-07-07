"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Download, MapPin, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { analyzePlace, enrichWithGmbData, type AnalysisResult, type PlaceDetails } from "@/lib/analyzer";
import { ScoreCircle } from "@/components/ScoreCircle";
import { BentoMetric } from "@/components/BentoMetric";
import { PDFDownloadButton } from "@/components/PDFDownloadButton";
import { AppHeader } from "@/components/AppHeader";

interface GmbLocation {
  name: string;
  title: string;
  metadata?: { placeId?: string };
}

export default function AnalisePage() {
  const { placeId } = useParams<{ placeId: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<GmbLocation[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch("/api/locations").then(r => r.json()).then(d => setLocations(d.locations ?? [])).catch(() => {});
  }, [session]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!result || !locations.length || result.pendingMetrics.length === 0) return;
    const match = locations.find(l => l.metadata?.placeId === placeId);
    if (!match) return;
    fetch(`/api/analyze-gmb?location=${encodeURIComponent(match.name)}`)
      .then(r => r.ok ? r.json() : null)
      .then(gmb => { if (gmb) setResult(prev => prev && prev.pendingMetrics.length > 0 ? enrichWithGmbData(prev, gmb) : prev); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  async function loadAnalysis() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/places?place_id=${placeId}`);
      if (!res.ok) { setError("Perfil não encontrado."); return; }
      const place: PlaceDetails = await res.json();
      let analysis = analyzePlace(place);

      // Tenta enriquecer imediatamente se já tiver locations
      if (locations.length) {
        const match = locations.find(l => l.metadata?.placeId === place.place_id);
        if (match) {
          const gmb = await fetch(`/api/analyze-gmb?location=${encodeURIComponent(match.name)}`).then(r => r.ok ? r.json() : null).catch(() => null);
          if (gmb) analysis = enrichWithGmbData(analysis, gmb);
        }
      }
      setResult(analysis);

      if (session?.user?.email) {
        fetch("/api/history", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ place_id: place.place_id, place_name: place.name, score: analysis.overallScore }),
        }).catch(() => {});
      }
    } catch { setError("Erro de conexão. Tente novamente."); }
    finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-32 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">{error || "Perfil não encontrado."}</p>
            <button onClick={() => router.push("/")} className="text-sm text-primary hover:underline">← Voltar à busca</button>
          </div>
        </div>
      </div>
    );
  }

  const statusOrder = { fraco: 0, razoavel: 1, bom: 2 };
  const sortMetrics = (arr: typeof result.metrics) =>
    [...arr].sort((a, b) => (statusOrder[a.status as keyof typeof statusOrder] ?? 3) - (statusOrder[b.status as keyof typeof statusOrder] ?? 3));

  const publicMetrics = sortMetrics(result.metrics);
  const privateMetrics = sortMetrics(result.pendingMetrics);
  const goodCount = [...publicMetrics, ...privateMetrics].filter(m => m.status === "bom").length;
  const fairCount = [...publicMetrics, ...privateMetrics].filter(m => m.status === "razoavel").length;
  const poorCount = [...publicMetrics, ...privateMetrics].filter(m => m.status === "fraco").length;
  const isEnriched = result.pendingMetrics.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Voltar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar à busca
          </Link>
        </motion.div>

        {/* Nome e endereço */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{result.place.name}</h1>
          {result.place.formatted_address && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {result.place.formatted_address}
            </p>
          )}
        </motion.div>

        {/* Score card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-8 grid gap-6 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
          <div className="flex flex-col items-center justify-center sm:col-span-1">
            <ScoreCircle score={result.overallScore} maxScore={100} size={180} />
          </div>
          <div className="flex flex-col justify-center sm:col-span-1 lg:col-span-2">
            <h2 className="font-display text-xl font-bold text-foreground">Score Geral</h2>
            <p className="mt-2 text-muted-foreground">
              Nota calculada sobre <span className="text-foreground font-medium">{result.totalPossiblePoints} pontos</span> possíveis,
              considerando {isEnriched ? "todas as métricas públicas e privadas" : "as métricas públicas disponíveis"}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-status-good" />
                <span className="text-sm font-medium text-foreground">{goodCount} Bom</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-status-fair" />
                <span className="text-sm font-medium text-foreground">{fairCount} Razoável</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-status-poor" />
                <span className="text-sm font-medium text-foreground">{poorCount} Fraco</span>
              </div>
            </div>
            {isEnriched && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                Análise enriquecida com dados do Google Business Profile
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 flex flex-wrap gap-3">
          <PDFDownloadButton result={result} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:glow-indigo">
            <Download className="h-4 w-4" />
            Baixar PDF
          </PDFDownloadButton>
          {session && (
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-surface-elevated">
              Ver no dashboard
            </Link>
          )}
        </motion.div>

        {/* Métricas públicas */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold text-foreground">Métricas Públicas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dados disponíveis via Google Places API — sem necessidade de login.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicMetrics.map((m, i) => <BentoMetric key={m.id} metric={m} index={i} />)}
          </div>
        </div>

        {/* Métricas GBP */}
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold text-foreground">Métricas do Google Business Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEnriched ? "Dados privados acessados via Business Profile API." : "Requer login do proprietário para desbloqueio completo."}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(isEnriched
              ? result.metrics.filter(m => ["response_rate","services","attributes","posts","visibility","engagement","verification"].includes(m.id))
              : privateMetrics
            ).map((m, i) => <BentoMetric key={m.id} metric={m} index={i + publicMetrics.length} />)}
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>Perfil Nota 10 — Análise gerada em {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </main>
    </div>
  );
}
