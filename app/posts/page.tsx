"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Star, Loader2, FileEdit, Send, Lock, ChevronDown,
  ExternalLink, Calendar,
} from "lucide-react";
import Link from "next/link";

interface GmbLocation {
  name: string;
  title: string;
  storefrontAddress?: { addressLines?: string[] };
}

interface LocalPost {
  name: string;
  summary?: string;
  state?: string;
  createTime?: string;
  callToAction?: { actionType: string; url?: string };
  searchUrl?: string;
}

const ctaOptions = [
  { value: "NONE", label: "Sem botão" },
  { value: "LEARN_MORE", label: "Saiba mais" },
  { value: "BOOK", label: "Reservar" },
  { value: "ORDER", label: "Pedir" },
  { value: "SHOP", label: "Comprar" },
  { value: "SIGN_UP", label: "Cadastre-se" },
  { value: "CALL", label: "Ligar" },
];

export default function PostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [accountName, setAccountName] = useState<string | null>(null);
  const [locations, setLocations] = useState<GmbLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GmbLocation | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [manualAccount, setManualAccount] = useState("");
  const [manualLocation, setManualLocation] = useState("");

  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [apiBlocked, setApiBlocked] = useState(false);

  const [summary, setSummary] = useState("");
  const [ctaType, setCtaType] = useState("NONE");
  const [ctaUrl, setCtaUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") loadLocations();
  }, [status]);

  async function loadLocations() {
    setLoadingLocations(true);
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      setAccountName(data.account?.name ?? null);
      setLocations(data.locations ?? []);
      if (data.locations?.length === 1) setSelectedLocation(data.locations[0]);
    } catch {
      // mantém estado vazio
    } finally {
      setLoadingLocations(false);
    }
  }

  const effectiveAccount = accountName || (manualAccount.trim() ? `accounts/${manualAccount.trim()}` : "");
  const effectiveLocation = selectedLocation?.name || (manualLocation.trim() ? `locations/${manualLocation.trim()}` : "");

  useEffect(() => {
    if (!effectiveAccount || !effectiveLocation) return;
    loadPosts();
  }, [effectiveAccount, effectiveLocation]);

  async function loadPosts() {
    if (!effectiveAccount || !effectiveLocation) return;
    setLoadingPosts(true);
    setApiBlocked(false);
    try {
      const res = await fetch(
        `/api/posts?account=${encodeURIComponent(effectiveAccount)}&location=${encodeURIComponent(effectiveLocation)}`
      );
      if (!res.ok) {
        setApiBlocked(true);
        setPosts([]);
        return;
      }
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setApiBlocked(true);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveAccount || !effectiveLocation || !summary.trim()) return;
    setPublishing(true);
    setPublishError("");
    setPublished(false);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: effectiveAccount,
          locationName: effectiveLocation,
          summary,
          ctaType,
          ctaUrl: ctaUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setApiBlocked(true);
        setPublishError(data.error ?? "Não foi possível publicar.");
        return;
      }
      setSummary("");
      setCtaType("NONE");
      setCtaUrl("");
      setPublished(true);
      loadPosts();
    } catch {
      setPublishError("Erro de conexão. Tente novamente.");
    } finally {
      setPublishing(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400 text-sm">Faça login para criar postagens</p>
        <button
          onClick={() => signIn("google")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          Entrar com Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-zinc-900/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-semibold text-sm">Perfil Nota 10</span>
            </div>
          </div>
          <span className="text-xs text-zinc-500 hidden md:block">{session?.user?.email}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileEdit className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Postagens</h1>
          </div>
          <p className="text-sm text-zinc-500">Crie posts no seu perfil do Google direto por aqui</p>
        </div>

        {/* Aviso de pendência da API */}
        {apiBlocked && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3.5">
            <Lock className="w-4 h-4 text-amber-400/70 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Aguardando aprovação da Business Profile API</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                A criação de posts depende da aprovação do Google (caso 0-4560000041606). A interface já está pronta — vai funcionar automaticamente assim que a aprovação chegar.
              </p>
            </div>
          </div>
        )}

        {/* Seletor de localização */}
        {loadingLocations ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
          </div>
        ) : (
          <>
            {locations.length > 1 && (
              <div className="rounded-2xl border border-white/8 bg-zinc-800/60 p-4">
                <label className="text-xs text-zinc-500 mb-2 block">Perfil</label>
                <div className="relative">
                  <select
                    value={selectedLocation?.name ?? ""}
                    onChange={(e) => setSelectedLocation(locations.find((l) => l.name === e.target.value) ?? null)}
                    className="w-full bg-zinc-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 appearance-none transition-all"
                  >
                    <option value="" disabled>Selecione um perfil...</option>
                    {locations.map((loc) => (
                      <option key={loc.name} value={loc.name}>{loc.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {locations.length === 0 && (
              <div className="rounded-2xl border border-white/8 bg-zinc-800/60 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Nenhum perfil detectado automaticamente</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Isso é esperado enquanto a Business Profile API está pendente de aprovação. Você pode informar a conta e o local manualmente para testar a publicação.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 mb-1.5 block">ID da conta (accounts/...)</label>
                    <input
                      value={manualAccount}
                      onChange={(e) => setManualAccount(e.target.value)}
                      placeholder="123456789012345"
                      className="w-full bg-zinc-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 mb-1.5 block">ID do local (locations/...)</label>
                    <input
                      value={manualLocation}
                      onChange={(e) => setManualLocation(e.target.value)}
                      placeholder="987654321098765"
                      className="w-full bg-zinc-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {effectiveAccount && effectiveLocation && (
              <>
                {/* Compositor */}
                <form onSubmit={publish} className="rounded-2xl border border-white/8 bg-zinc-800/60 p-5 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Texto do post</label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Conte uma novidade, promoção ou atualização do seu negócio..."
                      maxLength={1500}
                      rows={4}
                      className="w-full bg-zinc-800/80 border border-white/8 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
                    />
                    <p className="text-[10px] text-zinc-700 mt-1">{summary.length}/1500</p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 mb-2 block">Botão de ação</label>
                      <div className="relative">
                        <select
                          value={ctaType}
                          onChange={(e) => setCtaType(e.target.value)}
                          className="w-full bg-zinc-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-500/50 appearance-none transition-all"
                        >
                          {ctaOptions.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>
                    {ctaType !== "NONE" && (
                      <div className="flex-1">
                        <label className="text-xs text-zinc-500 mb-2 block">Link de destino</label>
                        <input
                          type="url"
                          value={ctaUrl}
                          onChange={(e) => setCtaUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-zinc-800/80 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {publishError && (
                    <p className="text-xs text-red-400">{publishError}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {published && <span className="text-xs text-emerald-400">Post publicado!</span>}
                    <button
                      type="submit"
                      disabled={publishing || !summary.trim()}
                      className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Publicar
                    </button>
                  </div>
                </form>

                {/* Lista de posts existentes */}
                <div className="rounded-2xl border border-white/8 bg-zinc-800/60 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/6">
                    <h2 className="text-sm font-semibold text-zinc-200">Posts publicados</h2>
                  </div>
                  {loadingPosts ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <FileEdit className="w-6 h-6 text-zinc-700" />
                      <p className="text-sm text-zinc-500">
                        {apiBlocked ? "Disponível após aprovação da API" : "Nenhum post ainda"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {posts.map((post) => (
                        <div key={post.name} className="px-5 py-4 border-b border-white/4 last:border-0">
                          <p className="text-sm text-zinc-300 leading-relaxed">{post.summary}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {post.createTime && (
                              <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                                <Calendar className="w-3 h-3" />
                                {new Date(post.createTime).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            {post.searchUrl && (
                              <a href={post.searchUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300">
                                <ExternalLink className="w-3 h-3" />Ver no Google
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
