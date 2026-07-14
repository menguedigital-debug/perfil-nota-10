"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Loader2, TrendingUp, CheckCircle, ArrowRight, BarChart3, ShieldCheck, Clock } from "lucide-react";
import { analyzePlace, type PlaceDetails } from "@/lib/analyzer";

const WA_NUMBER = "5547989283137";

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
}

type Stage = "search" | "score" | "done";

export default function AnaliseGratisPage() {
  const [stage, setStage] = useState<Stage>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleQueryChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(text)}`);
        if (res.ok) setResults((await res.json()).results ?? []);
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 350);
  }

  async function selectBusiness(r: SearchResult) {
    setSelected(r);
    setFocused(false);
    setQuery(r.name);
    setResults([]);
    setStage("score");
    setLoadingScore(true);
    try {
      const res = await fetch(`/api/places?place_id=${r.placeId}`);
      if (res.ok) {
        const place: PlaceDetails = await res.json();
        setScore(analyzePlace(place).overallScore);
      }
    } catch { /* ignore */ }
    finally { setLoadingScore(false); }
  }

  function formatWhatsapp(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || whatsapp.replace(/\D/g, "").length < 10) return;
    setSubmitting(true);

    // Registra o lead (bônus — não bloqueia se o banco estiver fora)
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, whatsapp,
        place_id: selected?.placeId,
        place_name: selected?.name,
        score,
      }),
    }).catch(() => {});

    // Entrega principal: abre o WhatsApp da agência com os dados do lead
    const msg = `Olá! Sou *${name}* e quero o diagnóstico completo do perfil Google da *${selected?.name}* (nota ${score ?? "?"}/100). Meu WhatsApp: ${whatsapp}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");

    setTimeout(() => { setStage("done"); setSubmitting(false); }, 600);
  }

  const scoreColor = score === null ? "" : score >= 70 ? "#4ade80" : score >= 45 ? "#facc15" : "#f87171";

  return (
    <div className="min-h-screen bg-[#0a0d1a] text-white">
      {/* Header mínimo */}
      <div className="flex items-center justify-center px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/80">Perfil Nota 10</span>
        </div>
      </div>

      <main className="mx-auto max-w-xl px-5 py-10 sm:py-16">
        <AnimatePresence mode="wait">

          {/* ── ETAPA 1: BUSCA ────────────────────────────────── */}
          {stage === "search" && (
            <motion.div key="search"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Análise 100% gratuita
                </span>
                <h1 className="mt-6 font-display text-3xl font-bold leading-tight sm:text-4xl">
                  Seu Perfil Google está <span className="text-indigo-400">atraindo</span> ou <span className="text-red-400">afastando</span> clientes?
                </h1>
                <p className="mx-auto mt-4 max-w-md text-white/50 leading-relaxed">
                  Descubra em 30 segundos a nota do seu perfil no Google e o que está te fazendo perder clientes para a concorrência.
                </p>
              </div>

              <div className="relative mt-8">
                <div className={`flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-4 transition-all ${focused ? "border-indigo-500/50" : "border-white/10"}`}>
                  {searching
                    ? <Loader2 className="h-5 w-5 shrink-0 text-white/40 animate-spin" />
                    : <Search className="h-5 w-5 shrink-0 text-white/40" />}
                  <input
                    type="text"
                    placeholder="Digite o nome do seu negócio..."
                    value={query}
                    onChange={e => handleQueryChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 200)}
                    className="w-full bg-transparent text-white placeholder:text-white/30 focus:outline-none"
                  />
                </div>
                {results.length > 0 && focused && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#12162a] shadow-2xl">
                    {results.map(r => (
                      <button key={r.placeId} onMouseDown={() => selectBusiness(r)}
                        className="flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{r.name}</p>
                          <p className="mt-0.5 truncate text-xs text-white/40">{r.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-white/40">
                <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Sem cadastro</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-green-400" /> Resultado na hora</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-400" /> Sem compromisso</span>
              </div>
            </motion.div>
          )}

          {/* ── ETAPA 2: SCORE + FORM ─────────────────────────── */}
          {stage === "score" && (
            <motion.div key="score"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="text-center">
                <p className="text-sm text-white/50">Análise de</p>
                <h2 className="mt-1 font-display text-xl font-bold text-white">{selected?.name}</h2>
              </div>

              <div className="mt-8 flex flex-col items-center">
                {loadingScore ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                      <p className="text-sm text-white/40">Analisando seu perfil...</p>
                    </div>
                  </div>
                ) : (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center">
                    <div className="font-display text-7xl font-bold" style={{ color: scoreColor }}>
                      {score}
                    </div>
                    <p className="text-sm text-white/40 mt-1">de 100 pontos</p>
                    <p className="mt-4 max-w-xs text-center text-sm text-white/60 leading-relaxed">
                      {score !== null && score < 70
                        ? "Seu perfil tem pontos que estão custando clientes. Veja o diagnóstico completo e como corrigir."
                        : "Seu perfil vai bem, mas ainda dá para melhorar e atrair ainda mais clientes."}
                    </p>
                  </motion.div>
                )}
              </div>

              {!loadingScore && (
                <motion.form onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-center text-sm font-medium text-white">
                    Receba o diagnóstico completo no seu WhatsApp
                  </p>
                  <div className="mt-4 space-y-3">
                    <input
                      type="text" placeholder="Seu nome" value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0a0d1a] px-4 py-3 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:outline-none"
                    />
                    <input
                      type="tel" inputMode="numeric" placeholder="(00) 00000-0000" value={whatsapp}
                      onChange={e => setWhatsapp(formatWhatsapp(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#0a0d1a] px-4 py-3 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:outline-none"
                    />
                  </div>
                  <button type="submit" disabled={submitting || name.trim().length < 2 || whatsapp.replace(/\D/g, "").length < 10}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3.5 font-display text-base font-semibold text-white shadow-[0_0_25px_rgba(74,222,128,0.2)] transition-all hover:bg-green-400 disabled:opacity-40 disabled:shadow-none">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Quero o diagnóstico completo <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="mt-3 text-center text-[11px] text-white/25">
                    Ao enviar, você abre uma conversa no WhatsApp com a Mengue Digital.
                  </p>
                </motion.form>
              )}
            </motion.div>
          )}

          {/* ── ETAPA 3: CONCLUÍDO ────────────────────────────── */}
          {stage === "done" && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle className="h-9 w-9 text-green-400" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold text-white">Tudo certo, {name.split(" ")[0]}!</h2>
              <p className="mt-3 max-w-sm text-white/50 leading-relaxed">
                Abrimos uma conversa no WhatsApp com a Mengue Digital. Se a janela não abriu, toque no botão abaixo.
              </p>
              <button
                onClick={() => {
                  const msg = `Olá! Sou *${name}* e quero o diagnóstico completo do perfil Google da *${selected?.name}* (nota ${score ?? "?"}/100). Meu WhatsApp: ${whatsapp}`;
                  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3 font-semibold text-white transition-all hover:bg-green-400">
                Abrir WhatsApp
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        <footer className="mt-16 text-center">
          <p className="text-xs text-white/20">Perfil Nota 10 · Mengue Digital</p>
        </footer>
      </main>
    </div>
  );
}
