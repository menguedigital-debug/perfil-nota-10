"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, CheckCircle, AlertCircle, XCircle, Share2, Loader2, BarChart3 } from "lucide-react";
import { analyzePlace, enrichWithGmbData, type AnalysisResult, type PlaceDetails } from "@/lib/analyzer";

const WA_NUMBER = "5547989283137";

function ScoreArc({ score }: { score: number }) {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  const color = score >= 70 ? "#4ade80" : score >= 45 ? "#facc15" : "#f87171";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-display text-5xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-white/50 mt-1 tracking-widest uppercase">de 100</span>
      </div>
    </div>
  );
}

function MetricBar({ score, maxScore, status }: { score: number; maxScore: number; status: string }) {
  const pct = Math.round((score / maxScore) * 100);
  const color = status === "bom" ? "bg-green-400" : status === "razoavel" ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

const statusIcon = {
  bom: <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />,
  razoavel: <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0" />,
  fraco: <XCircle className="h-4 w-4 text-red-400 shrink-0" />,
};

export default function RelatorioPage() {
  const { placeId } = useParams<{ placeId: string }>();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/places?place_id=${placeId}`);
        if (!res.ok) return;
        const place: PlaceDetails = await res.json();
        setResult(analyzePlace(place));
      } finally {
        setLoading(false);
      }
    })();
  }, [placeId]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    const name = result?.place.name ?? "meu negócio";
    const score = result?.overallScore ?? 0;
    const msg = `Olá! Vi a análise do perfil Google da *${name}* e a nota ficou *${score}/100*. Gostaria de saber como melhorar!`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-white/40">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0a0d1a] flex items-center justify-center">
        <p className="text-white/50">Perfil não encontrado.</p>
      </div>
    );
  }

  const statusOrder = { fraco: 0, razoavel: 1, bom: 2 };
  const allMetrics = [...result.metrics, ...result.pendingMetrics]
    .filter(m => !m.unverified)
    .sort((a, b) => (statusOrder[a.status as keyof typeof statusOrder] ?? 3) - (statusOrder[b.status as keyof typeof statusOrder] ?? 3));

  const goodCount = allMetrics.filter(m => m.status === "bom").length;
  const fairCount = allMetrics.filter(m => m.status === "razoavel").length;
  const poorCount = allMetrics.filter(m => m.status === "fraco").length;

  const scoreLabel = result.overallScore >= 70 ? "Bom" : result.overallScore >= 45 ? "Pode melhorar" : "Precisa de atenção";
  const scoreSub = result.overallScore >= 70
    ? "Seu perfil está bem otimizado, mas ainda há espaço para crescer."
    : result.overallScore >= 45
    ? "Seu perfil tem pontos fortes, mas várias métricas importantes precisam de atenção."
    : "Seu perfil Google está perdendo clientes todos os dias. Veja o que precisa mudar.";

  return (
    <div className="min-h-screen bg-[#0a0d1a] text-white">

      {/* Header mínimo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/80">Perfil Nota 10</span>
        </div>
        <button onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
          <Share2 className="h-3.5 w-3.5" />
          {copied ? "Link copiado!" : "Compartilhar"}
        </button>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-12 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[80px]" />
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <p className="text-xs font-medium tracking-widest text-indigo-400 uppercase mb-4">Análise do Perfil Google</p>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{result.place.name}</h1>
          {result.place.formatted_address && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-white/40">
              <MapPin className="h-3.5 w-3.5" />
              {result.place.formatted_address}
            </p>
          )}
        </motion.div>
      </section>

      {/* Score */}
      <section className="flex flex-col items-center px-5 pb-12">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
          <ScoreArc score={result.overallScore} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mt-6 text-center">
          <p className="font-display text-xl font-bold text-white">{scoreLabel}</p>
          <p className="mt-2 max-w-sm text-sm text-white/50 leading-relaxed">{scoreSub}</p>
        </motion.div>

        {/* Contadores */}
        <div className="mt-8 flex gap-4">
          {[
            { count: poorCount, label: "Fraco", color: "text-red-400", dot: "bg-red-400" },
            { count: fairCount, label: "Razoável", color: "text-yellow-400", dot: "bg-yellow-400" },
            { count: goodCount, label: "Bom", color: "text-green-400", dot: "bg-green-400" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5">
              <div className={`h-2 w-2 rounded-full ${s.dot}`} />
              <span className={`text-sm font-semibold ${s.color}`}>{s.count}</span>
              <span className="text-xs text-white/40">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Métricas */}
      <section className="border-t border-white/5 px-5 py-10">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-lg font-bold text-white mb-6">O que analisamos</h2>
          <div className="space-y-3">
            {allMetrics.map((m, i) => (
              <motion.div key={m.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                className="rounded-2xl border border-white/6 bg-white/3 p-4">
                <div className="flex items-start gap-3">
                  {statusIcon[m.status as keyof typeof statusIcon] ?? <AlertCircle className="h-4 w-4 text-white/30 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-white">{m.label}</p>
                      <span className="text-xs text-white/40 shrink-0">{m.score}/{m.maxScore} pts</span>
                    </div>
                    <MetricBar score={m.score} maxScore={m.maxScore} status={m.status} />
                    <p className="mt-2 text-xs text-white/40 leading-relaxed">{m.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-5 py-14">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-xl font-bold text-white">
            Quer melhorar a nota do seu perfil?
          </h2>
          <p className="mt-3 text-sm text-white/50 leading-relaxed">
            A Mengue Digital é especialista em otimização de perfil Google. Fale com a gente e descubra o plano certo para o seu negócio.
          </p>
          <button onClick={handleWhatsApp}
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-green-500 px-8 py-4 font-display text-base font-semibold text-white shadow-[0_0_30px_rgba(74,222,128,0.25)] transition-all hover:bg-green-400 hover:shadow-[0_0_40px_rgba(74,222,128,0.35)] active:scale-95">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Quero melhorar meu perfil
          </button>
          <p className="mt-4 text-xs text-white/25">(47) 98928-3137 · menguedigital@gmail.com</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-5 py-6 text-center">
        <p className="text-xs text-white/20">
          Análise gerada por <span className="text-white/40">Perfil Nota 10</span> · Mengue Digital · {new Date().toLocaleDateString("pt-BR")}
        </p>
      </footer>

    </div>
  );
}
