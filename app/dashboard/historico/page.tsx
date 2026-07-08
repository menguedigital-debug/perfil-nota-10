"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, TrendingDown, Minus, ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { ScoreTrend } from "@/components/ScoreTrend";

interface HistoryItem {
  id: string;
  place_id: string;
  place_name: string;
  score: number;
  created_at: string;
}

interface Group {
  placeId: string;
  name: string;
  points: { score: number; date: string }[];
  lastDate: string;
  firstScore: number;
  lastScore: number;
}

export default function HistoricoPage() {
  const { status } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { setLoading(false); return; }
    if (status !== "authenticated") return;
    fetch("/api/history?full=true")
      .then(r => r.json())
      .then(d => {
        const analyses: HistoryItem[] = d.analyses ?? [];
        const map = new Map<string, Group>();
        for (const a of analyses) {
          const g = map.get(a.place_id);
          if (g) {
            g.points.push({ score: a.score, date: a.created_at });
          } else {
            map.set(a.place_id, {
              placeId: a.place_id,
              name: a.place_name,
              points: [{ score: a.score, date: a.created_at }],
              lastDate: a.created_at,
              firstScore: 0,
              lastScore: 0,
            });
          }
        }
        // Calcula primeira/última nota cronológica e ordena por análise mais recente
        const result = Array.from(map.values()).map(g => {
          const sorted = [...g.points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return {
            ...g,
            firstScore: sorted[0].score,
            lastScore: sorted[sorted.length - 1].score,
            lastDate: sorted[sorted.length - 1].date,
          };
        }).sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
        setGroups(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center py-32 text-center">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">Faça login para acessar o histórico.</p>
          <button onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground">Histórico de Evolução</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe como a nota de cada perfil evoluiu ao longo das análises.
        </p>
      </motion.div>

      {groups.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma análise registrada ainda.</p>
          <Link href="/" className="text-sm text-primary hover:underline">Analisar um perfil →</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {groups.map((g, i) => {
            const delta = g.lastScore - g.firstScore;
            const multipleAnalyses = g.points.length > 1;
            return (
              <motion.div key={g.placeId}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-foreground truncate">{g.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {g.points.length} {g.points.length === 1 ? "análise" : "análises"} · última em {new Date(g.lastDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {multipleAnalyses && (
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        delta > 0 ? "bg-status-good/10 text-status-good" : delta < 0 ? "bg-status-poor/10 text-status-poor" : "bg-muted text-muted-foreground"
                      }`}>
                        {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : delta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    )}
                    <Link href={`/analise/${g.placeId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      Ver análise <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="mt-4">
                  {multipleAnalyses ? (
                    <ScoreTrend points={g.points} />
                  ) : (
                    <div className="flex items-center gap-4 rounded-xl bg-background/50 px-4 py-6">
                      <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border ${
                        g.lastScore >= 70 ? "border-status-good/30 bg-status-good/10" : g.lastScore >= 45 ? "border-status-fair/30 bg-status-fair/10" : "border-status-poor/30 bg-status-poor/10"
                      }`}>
                        <span className={`font-display text-2xl font-bold ${
                          g.lastScore >= 70 ? "text-status-good" : g.lastScore >= 45 ? "text-status-fair" : "text-status-poor"
                        }`}>{g.lastScore}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Apenas uma análise até agora. Analise novamente mais tarde para ver a evolução da nota.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
