"use client";
import { MetricResult } from "@/lib/analyzer";
import { CheckCircle, AlertCircle, XCircle, Clock, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useState } from "react";

const statusConfig = {
  bom: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/8 border-emerald-500/20 hover:border-emerald-500/40",
    bar: "bg-emerald-400",
    label: "BOM",
    dot: "bg-emerald-400",
  },
  razoavel: {
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/8 border-amber-500/20 hover:border-amber-500/40",
    bar: "bg-amber-400",
    label: "RAZOÁVEL",
    dot: "bg-amber-400",
  },
  fraco: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/8 border-red-500/20 hover:border-red-500/40",
    bar: "bg-red-400",
    label: "FRACO",
    dot: "bg-red-400",
  },
  pendente: {
    icon: Clock,
    color: "text-zinc-500",
    bg: "bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600/50",
    bar: "bg-zinc-600",
    label: "PENDENTE",
    dot: "bg-zinc-500",
  },
  indisponivel: {
    icon: AlertTriangle,
    color: "text-zinc-500",
    bg: "bg-zinc-800/30 border-zinc-700/25 hover:border-zinc-600/40",
    bar: "bg-zinc-600",
    label: "SEM DADOS",
    dot: "bg-zinc-500",
  },
};

export function MetricCard({ metric }: { metric: MetricResult }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[metric.status] ?? statusConfig.indisponivel;
  const Icon = cfg.icon;
  const pct = (metric.status === "pendente" || metric.status === "indisponivel" || metric.maxScore === 0)
    ? 0
    : Math.round((metric.score / metric.maxScore) * 100);

  return (
    <div className={`rounded-xl border transition-all duration-200 ${cfg.bg}`}>
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={`shrink-0 w-4 h-4 ${cfg.color}`} />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-medium text-zinc-100 text-sm truncate">{metric.label}</span>
            {metric.limited && (
              <AlertTriangle className="shrink-0 w-3 h-3 text-amber-400/70" aria-label="Dados parciais" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`text-[11px] font-bold tracking-wider ${cfg.color}`}>{cfg.label}</span>
          {open
            ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
            : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="h-px bg-white/5" />
          <p className="text-xs text-zinc-400 leading-relaxed">{metric.description}</p>
          <p className="text-xs text-zinc-300 font-medium">{metric.detail}</p>
          {metric.limited && metric.limitedNote && (
            <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              ⚠ {metric.limitedNote}
            </p>
          )}
          {metric.status !== "pendente" && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>{metric.score}/{metric.maxScore} pts</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-white/6 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${cfg.bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
