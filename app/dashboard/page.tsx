"use client";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { TrendingUp, Search, Building2, Clock, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ScoreCircle } from "@/components/ScoreCircle";

interface HistoryItem {
  id: string;
  place_id: string;
  place_name: string;
  score: number;
  created_at: string;
}

interface GmbLocation {
  name: string;
  title: string;
  metadata?: { placeId?: string };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [locations, setLocations] = useState<GmbLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { setLoading(false); return; }
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/history").then(r => r.json()),
      fetch("/api/locations").then(r => r.json()),
    ]).then(([h, l]) => {
      setHistory(h.analyses ?? []);
      setLocations(l.locations ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
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
          <p className="text-muted-foreground text-sm">Faça login para acessar o dashboard.</p>
          <button onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  const totalAnalyses = history.length;
  const avgScore = totalAnalyses > 0 ? Math.round(history.reduce((s, h) => s + h.score, 0) / totalAnalyses) : 0;
  const lastDate = history.length > 0 ? new Date(history[0].created_at).toLocaleDateString("pt-BR") : "—";
  const latest = history[0];

  const stats = [
    { label: "Análises feitas", value: String(totalAnalyses), icon: Search, change: "Total acumulado" },
    { label: "Perfil médio", value: avgScore ? String(avgScore) : "—", icon: TrendingUp, change: "Nota geral" },
    { label: "Locations", value: String(locations.length), icon: Building2, change: "Vinculados ao GBP" },
    { label: "Última análise", value: lastDate, icon: Clock, change: history.length > 0 ? history[0].place_name.slice(0, 20) : "Nenhuma ainda" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumo das suas análises e perfis vinculados.{session?.user?.email && ` • ${session.user.email}`}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5">
            <stat.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-display text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xs text-primary truncate">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Análise mais recente */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground">Análise mais recente</h2>
          {latest ? (
            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
              <ScoreCircle score={latest.score} maxScore={100} size={140} strokeWidth={10} />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-foreground truncate">{latest.place_name}</p>
                <p className="text-sm text-muted-foreground">{new Date(latest.created_at).toLocaleDateString("pt-BR")}</p>
                <Link href={`/analise/${latest.place_id}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  Ver análise <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Nenhuma análise ainda. <Link href="/" className="text-primary hover:underline">Analisar agora →</Link></p>
          )}
        </div>

        {/* Dicas */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground">Dicas rápidas</h2>
          <ul className="mt-4 space-y-3">
            {[
              "Adicione mais fotos — negócios com 20+ fotos recebem 42% mais pedidos de rota.",
              "Responda a todas as avaliações — a taxa de resposta impacta diretamente a percepção dos clientes.",
              "Publique atualizações semanalmente — posts recentes aumentam a visibilidade no Google.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Histórico */}
      {history.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Histórico de análises</h2>
          <div className="space-y-1">
            {history.map(item => (
              <Link key={item.id} href={`/analise/${item.place_id}`}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-surface-elevated transition-colors group">
                <span className="text-sm text-foreground">{item.place_name}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${item.score >= 70 ? "text-status-good" : item.score >= 50 ? "text-status-fair" : "text-status-poor"}`}>
                    {item.score}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
