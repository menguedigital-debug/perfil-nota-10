"use client";
import { MetricResult } from "@/lib/analyzer";
import { CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const statusConfig = {
  bom: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 border-green-200", bar: "bg-green-500", label: "BOM" },
  razoavel: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50 border-amber-200", bar: "bg-amber-500", label: "RAZOÁVEL" },
  fraco: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 border-red-200", bar: "bg-red-500", label: "FRACO" },
};

export function MetricCard({ metric }: { metric: MetricResult }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[metric.status];
  const Icon = cfg.icon;
  const pct = Math.round((metric.score / metric.maxScore) * 100);

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg}`}>
      <button className="w-full flex items-center justify-between gap-3" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={`shrink-0 w-5 h-5 ${cfg.color}`} />
          <span className="font-medium text-gray-800 text-sm text-left">{metric.label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-600">{metric.description}</p>
          <p className="text-xs text-gray-700 font-medium">{metric.detail}</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
