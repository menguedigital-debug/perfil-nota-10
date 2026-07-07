"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, Star, TrendingUp, Trash2, Loader2, Plus, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  place_id: string;
  place_name: string;
  last_score: number | null;
  last_analyzed_at: string | null;
  created_at: string;
}

export default function ClientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") loadClients();
  }, [status]);

  async function loadClients() {
    setLoading(true);
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoading(false);
  }

  async function remove(id: string) {
    setRemoving(id);
    await fetch("/api/clients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setClients((c) => c.filter((x) => x.id !== id));
    setRemoving(null);
  }

  const filtered = clients.filter((c) =>
    c.place_name.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (s: number | null) => {
    if (!s) return "text-zinc-500";
    if (s >= 70) return "text-emerald-400";
    if (s >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const scoreBg = (s: number | null) => {
    if (!s) return "bg-zinc-800";
    if (s >= 70) return "bg-emerald-500/10";
    if (s >= 50) return "bg-amber-500/10";
    return "bg-red-500/10";
  };

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
        <p className="text-zinc-400 text-sm">Faça login para ver seus clientes</p>
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
      {/* Header */}
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
        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold text-white">Clientes</h1>
              {!loading && (
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                  {clients.length}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">Todos os perfis que você acompanha</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo cliente
          </Link>
        </div>

        {/* Stats rápidas */}
        {!loading && clients.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: clients.length, color: "text-zinc-200" },
              { label: "Acima de 70", value: clients.filter(c => (c.last_score ?? 0) >= 70).length, color: "text-emerald-400" },
              { label: "Abaixo de 50", value: clients.filter(c => c.last_score !== null && c.last_score < 50).length, color: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-zinc-800/60 p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Busca */}
        {clients.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-zinc-800/80 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
        )}

        {/* Lista */}
        <div className="rounded-2xl border border-white/8 bg-zinc-800/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <Users className="w-6 h-6 text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-300">
                  {search ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  {search ? "Tente outro nome" : "Analise um perfil e salve como cliente"}
                </p>
              </div>
              {!search && (
                <Link
                  href="/"
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Ir para análise →
                </Link>
              )}
            </div>
          ) : (
            <div>
              {/* Header da tabela */}
              <div className="grid grid-cols-12 px-4 py-2.5 border-b border-white/6 text-xs text-zinc-500 font-medium">
                <div className="col-span-5">Nome</div>
                <div className="col-span-2 text-center">Nota</div>
                <div className="col-span-3 hidden md:block">Última análise</div>
                <div className="col-span-2 md:col-span-2 text-right">Ação</div>
              </div>
              {/* Rows */}
              {filtered.map((client) => (
                <div
                  key={client.id}
                  className="grid grid-cols-12 px-4 py-3.5 border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors items-center group"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <Link
                      href={`/?id=${client.place_id}`}
                      className="text-sm font-medium text-zinc-200 hover:text-white transition-colors truncate"
                    >
                      {client.place_name}
                    </Link>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {client.last_score !== null ? (
                      <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${scoreBg(client.last_score)} ${scoreColor(client.last_score)}`}>
                        {client.last_score}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </div>
                  <div className="col-span-3 hidden md:block text-xs text-zinc-500">
                    {client.last_analyzed_at
                      ? new Date(client.last_analyzed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </div>
                  <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/?id=${client.place_id}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Analisar
                    </Link>
                    <button
                      onClick={() => remove(client.id)}
                      disabled={removing === client.id}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                    >
                      {removing === client.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
