"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, MapPin, TrendingUp, Shield, FileText, ArrowRight, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
}

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.prefetch("/dashboard");
  }, [status, router]);

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

  function selectResult(placeId: string) {
    setFocused(false);
    router.push(`/analise/${placeId}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-16 pb-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <TrendingUp className="h-4 w-4" />
              Análise gratuita do seu perfil Google
            </span>
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Descubra a <span className="text-primary">nota</span> do seu
            <br />
            Perfil Google
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Analisamos 15 métricas do seu Google Business Profile e mostramos
            exatamente o que precisa melhorar para atrair mais clientes.
          </p>

          {/* Search box */}
          <div className="mx-auto mt-10 max-w-xl">
            <div className="relative">
              <div className={`flex items-center gap-3 rounded-2xl border bg-card px-4 py-4 transition-all duration-300 ${focused ? "border-primary/50 shadow-[0_0_30px_oklch(0.52_0.2_270/0.15)]" : "border-border"}`}>
                {searching ? (
                  <Loader2 className="h-5 w-5 shrink-0 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <input
                  type="text"
                  placeholder="Nome do negócio ou endereço..."
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 200)}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                />
              </div>

              {results.length > 0 && focused && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                  {results.map(r => (
                    <button key={r.placeId} onMouseDown={() => selectResult(r.placeId)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-elevated border-b border-border last:border-0">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{r.address}</p>
                      </div>
                      {r.rating && <span className="text-xs text-muted-foreground shrink-0">★ {r.rating.toFixed(1)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Exemplo: <span className="text-foreground">Pizzaria Bella Napoli</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Tudo que você precisa saber sobre seu perfil
            </h2>
            <p className="mt-4 text-muted-foreground">
              15 métricas analisadas em segundos, com relatório completo para compartilhar.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Search, title: "Busca Pública", desc: "Analise qualquer negócio sem precisar de acesso. Ideal para prospecção." },
              { icon: Shield, title: "Dados Privados do GBP", desc: "Com login, acesse reviews, posts, performance e verificação do perfil." },
              { icon: FileText, title: "Relatório em PDF", desc: "Gere um relatório profissional para enviar ao cliente ou salvar no histórico." },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:-translate-y-0.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Pronto para analisar seu perfil?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Leva menos de 1 minuto. É gratuito e não precisa de cartão.
          </p>
          <button
            onClick={() => document.querySelector("input")?.focus()}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:glow-indigo"
          >
            Começar agora
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>Perfil Nota 10 — Ferramenta de análise Google Business Profile</p>
          <p className="mt-1">Criado por Mengue Digital</p>
        </div>
      </footer>
    </div>
  );
}
