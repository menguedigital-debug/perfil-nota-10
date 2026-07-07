"use client";
import { MetricResult } from "@/lib/analyzer";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { MetricProgressBar } from "./MetricProgressBar";

export function BentoMetric({ metric, index = 0 }: { metric: MetricResult; index?: number }) {
  const [expanded, setExpanded] = useState(false);
  const status = (metric.unverified ? "unverified" : metric.status) as "bom" | "razoavel" | "fraco" | "unverified" | "pendente" | "indisponivel";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group cursor-pointer rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-foreground truncate">{metric.label}</h3>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} />
            {metric.unverified && <span className="text-xs text-muted-foreground">Requer acesso GBP</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!metric.unverified && metric.maxScore > 0 && (
            <span className="font-display text-lg font-bold text-foreground">
              {metric.score}<span className="text-sm font-normal text-muted-foreground">/{metric.maxScore}</span>
            </span>
          )}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {!metric.unverified && metric.maxScore > 0 && (
        <div className="mt-4">
          <MetricProgressBar score={metric.score} maxScore={metric.maxScore} />
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-border pt-4 space-y-1.5">
              <p className="text-sm text-muted-foreground">{metric.description}</p>
              <p className="text-sm text-foreground font-medium">{metric.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
