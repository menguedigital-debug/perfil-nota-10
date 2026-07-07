import { CheckCircle, AlertCircle, XCircle, HelpCircle } from "lucide-react";

type MetricStatus = "bom" | "razoavel" | "fraco" | "unverified" | "pendente" | "indisponivel";

const config: Record<string, { icon: React.ElementType; className: string; label: string }> = {
  bom: { icon: CheckCircle, className: "bg-status-good/15 text-status-good border-status-good/30", label: "Bom" },
  razoavel: { icon: AlertCircle, className: "bg-status-fair/15 text-status-fair border-status-fair/30", label: "Razoável" },
  fraco: { icon: XCircle, className: "bg-status-poor/15 text-status-poor border-status-poor/30", label: "Fraco" },
  unverified: { icon: HelpCircle, className: "bg-status-unverified/15 text-status-unverified border-status-unverified/30", label: "Não verif." },
  pendente: { icon: HelpCircle, className: "bg-status-unverified/15 text-status-unverified border-status-unverified/30", label: "Pendente" },
  indisponivel: { icon: HelpCircle, className: "bg-muted/15 text-muted-foreground border-muted-foreground/30", label: "Sem dados" },
};

export function StatusBadge({ status, label }: { status: MetricStatus; label?: string }) {
  const cfg = config[status] ?? config.fraco;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label ?? cfg.label}
    </span>
  );
}
