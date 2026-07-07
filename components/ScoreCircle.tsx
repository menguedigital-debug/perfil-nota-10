"use client";
import { motion } from "framer-motion";

interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreCircle({ score, maxScore = 100, size = 180, strokeWidth = 12 }: ScoreCircleProps) {
  const percentage = Math.min((score / Math.max(maxScore, 1)) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 80
    ? "var(--color-status-good)"
    : percentage >= 40
    ? "var(--color-status-fair)"
    : "var(--color-status-poor)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="oklch(0.18 0.06 270)" strokeWidth={strokeWidth} />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="font-display text-5xl font-bold" style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}>
          {Math.round(percentage)}
        </motion.span>
        <motion.span className="mt-1 text-sm text-muted-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Nota
        </motion.span>
      </div>
    </div>
  );
}
