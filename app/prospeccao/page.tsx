"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, MapPin, Star, Globe, Phone, TrendingDown, TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

interface Business {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number;
  score: number;
  goodCount: number;
  fairCount: number;
  poorCount: number;
  hasWebsite: boolean;
  hasPhone: boolean;
}

type SortMode = "oportunidade" | "melhores";

export default function ProspeccaoPage() {
  const [query, setQuery] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("oportunidade");

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (query.trim().length < 3) return;
    setLoading(true); setError(""); setSearched(true);
    try {
      const res = await fetch(`/api/prospect?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro na busca."); setBusinesses([]); }
      else setBusinesses(data.businesses ?? []);
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }

  const sorted = [...businesses].sort((a, b) =>
    sortMode === "oportunidade" ? a.score - b.score : b.score - a.score
  );

  const scoreColor = (s: number) => s >= 70 ? "text-status-good" : s >= 45 ? "text-status-fair" : "text-status-poor";
  const scoreBg = (s: number) => s >= 70 ? "bg-status-good/10 border-status-good/30" : s >= 45 ? "bg-status-fair/10 border-status-fair/30" : "bg-status-poor/10 border-status-poor/30";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Prospecção em Lote</h1>
          <p className="mt-2 text-muted-foreground">
            Busque um segmento em uma cidade e veja quais negócios têm o perfil mais fraco — suas melhores oportunidades de venda.
          </p>
        </motion.div>

        {/* Busca */}
        <form onSubmit={handleSearch} className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ex: pizzaria em Balneário Camboriú"
                className="w-full rounded-xl border border-border bg-card py-3.5 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
            <button type="submit" disabled={loading || query.trim().length < 3}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:glow-indigo disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              Buscar
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Analisamos até 12 negócios por busca. Inclua a cidade para resultados mais precisos.</p>
        </form>

        {/* Loading */}
        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando perfis... isso pode levar alguns segundos.</p>
          </div>
        )}

        {/* Erro */}
        {error && !loading && (
          <div className="mt-8 rounded-xl border border-status-poor/30 bg-status-poor/10 px-4 py-3 text-sm text-status-poor">
            {error}
          </div>
        )}

        {/* Resultados */}
        {!loading && sorted.length > 0 && (
          <div className="mt-8">
            {/* Barra de ordenação */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{sorted.length}</span> negócios analisados
              </p>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                <button onClick={() => setSortMode("oportunidade")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sortMode === "oportunidade" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <TrendingDown className="h-3.5 w-3.5" />
                  Oportunidades
                </button>
                <button onClick={() => setSortMode("melhores")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sortMode === "melhores" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  Melhores
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="mt-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {sorted.map((b, i) => (
                  <motion.div key={b.placeId} layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                    {/* Ranking + Score */}
                    <div className="flex items-center gap-4">
                      <span className="font-display text-sm font-bold text-muted-foreground w-6 text-center shrink-0">
                        {i + 1}
                      </span>
                      <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border ${scoreBg(b.score)}`}>
                        <span className={`font-display text-xl font-bold ${scoreColor(b.score)}`}>{b.score}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{b.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {b.address}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {b.rating !== null && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-status-fair text-status-fair" />
                            {b.rating.toFixed(1)} ({b.reviewCount})
                          </span>
                        )}
                        {!b.hasWebsite && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-status-poor/10 px-1.5 py-0.5 text-[10px] font-medium text-status-poor">
                            <Globe className="h-2.5 w-2.5" /> Sem site
                          </span>
                        )}
                        {!b.hasPhone && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-status-poor/10 px-1.5 py-0.5 text-[10px] font-medium text-status-poor">
                            <Phone className="h-2.5 w-2.5" /> Sem telefone
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {b.goodCount} bom · {b.fairCount} razoável · {b.poorCount} fraco
                        </span>
                      </div>
                    </div>

                    {/* Ação */}
                    <Link href={`/analise/${b.placeId}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-all hover:bg-surface-elevated shrink-0">
                      Ver análise
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Estado vazio pós-busca */}
        {!loading && searched && !error && sorted.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <p>Nenhum negócio encontrado. Tente outro termo ou adicione a cidade.</p>
          </div>
        )}
      </main>
    </div>
  );
}
