"use client";
import { motion } from "framer-motion";

export function MetricProgressBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = Math.min((score / Math.max(maxScore, 1)) * 100, 100);
  const color = pct >= 80
    ? "var(--color-status-good)"
    : pct >= 40
    ? "var(--color-status-fair)"
    : "var(--color-status-poor)";

  return (
    <div className="relative w-full">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div className="absolute left-[40%] top-0 h-full w-px bg-background/30" />
        <div className="absolute left-[80%] top-0 h-full w-px bg-background/30" />
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Fraco</span>
        <span>Razoável</span>
        <span>Bom</span>
      </div>
    </div>
  );
}
