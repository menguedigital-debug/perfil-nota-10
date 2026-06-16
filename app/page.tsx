"use client";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Search, Loader2, Star, MapPin, Phone, Globe, Clock, LogOut, ChevronDown } from "lucide-react";
import { analyzePlace, AnalysisResult } from "@/lib/analyzer";
import { ScoreCircle } from "@/components/ScoreCircle";
import { MetricCard } from "@/components/MetricCard";

interface GmbLocation {
  name: string;
  title: string;
  storefrontAddress?: { addressLines?: string[] };
}

export default function Home() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<GmbLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      setLoadingLocations(true);
      fetch("/api/locations")
        .then((r) => r.json())
        .then((d) => setLocations(d.locations ?? []))
        .catch(() => {})
        .finally(() => setLoadingLocations(false));
    }
  }, [session]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao buscar negócio.");
        return;
      }
      const place = await res.json();
      setResult(analyzePlace(place));
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Perfil Nota 10</h1>
              <p className="text-xs text-gray-500">Análise de Google Meu Negócio</p>
            </div>
          </div>
          <div>
            {status === "authenticated" ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden md:block">{session.user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Entrar com Google
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Perfis GMB do usuário logado */}
        {status === "authenticated" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Seus perfis no Google</h2>
            {loadingLocations ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando perfis...
              </div>
            ) : locations.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum perfil GMB encontrado nesta conta.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {locations.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => setQuery(loc.title)}
                    className="text-left border border-gray-100 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50 transition"
                  >
                    <p className="font-medium text-gray-800 text-sm">{loc.title}</p>
                    {loc.storefrontAddress?.addressLines?.[0] && (
                      <p className="text-xs text-gray-400 mt-1">{loc.storefrontAddress.addressLines[0]}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {status !== "authenticated" && (
            <div className="mb-4 p-4 bg-indigo-50 rounded-xl flex items-start gap-3">
              <Star className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-indigo-800">Entre com Google para dados completos</p>
                <p className="text-xs text-indigo-600 mt-0.5">Conecte sua conta e acesse análise completa do seu perfil GMB.</p>
              </div>
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-800 mb-1">Analise um perfil</h2>
          <p className="text-sm text-gray-500 mb-4">
            Digite o nome do negócio ou endereço para analisar.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: Raul Parada Motos Camboriú"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Analisar
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {result && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <ScoreCircle score={result.overallScore} />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{result.place.name}</h3>
                    {result.place.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium">{result.place.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-400">({result.place.user_ratings_total} avaliações)</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {result.place.formatted_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                        <span>{result.place.formatted_address}</span>
                      </div>
                    )}
                    {result.place.formatted_phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 shrink-0 text-gray-400" />
                        <span>{result.place.formatted_phone_number}</span>
                      </div>
                    )}
                    {result.place.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 shrink-0 text-gray-400" />
                        <a
                          href={result.place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline truncate"
                        >
                          {result.place.website}
                        </a>
                      </div>
                    )}
                    {result.place.opening_hours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0 text-gray-400" />
                        <span>{result.place.opening_hours.open_now ? "Aberto agora" : "Fechado agora"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-500">{result.weakCount}</p>
                      <p className="text-xs text-gray-500">Fraco</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-500">{result.fairCount}</p>
                      <p className="text-xs text-gray-500">Razoável</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-500">{result.goodCount}</p>
                      <p className="text-xs text-gray-500">Bom</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h4 className="font-bold text-gray-800 mb-4">Pontuação Detalhada</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.metrics.map((m) => (
                  <MetricCard key={m.id} metric={m} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
