"use client";
import { motion } from "framer-motion";

interface Point {
  score: number;
  date: string;
}

interface Props {
  points: Point[];
  width?: number;
  height?: number;
}

// Gráfico de linha SVG puro — evolução da nota ao longo do tempo.
export function ScoreTrend({ points, width = 520, height = 160 }: Props) {
  const padX = 32;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  // Ordena cronologicamente (mais antigo → mais recente)
  const data = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (data.length === 0) return null;

  const xFor = (i: number) => data.length === 1 ? padX + innerW / 2 : padX + (i / (data.length - 1)) * innerW;
  const yFor = (s: number) => padY + (1 - s / 100) * innerH;

  const linePath = data.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.score).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(data.length - 1).toFixed(1)} ${(padY + innerH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;

  const colorFor = (s: number) => s >= 70 ? "var(--status-good)" : s >= 45 ? "var(--status-fair)" : "var(--status-poor)";

  // Linhas de grade horizontais (0, 50, 100)
  const gridLines = [0, 50, 100];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grade */}
      {gridLines.map(g => (
        <g key={g}>
          <line x1={padX} y1={yFor(g)} x2={width - padX} y2={yFor(g)}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
          <text x={padX - 6} y={yFor(g) + 3} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{g}</text>
        </g>
      ))}

      {/* Área preenchida */}
      {data.length > 1 && (
        <motion.path d={areaPath} fill="url(#scoreTrendFill)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      )}

      {/* Linha */}
      {data.length > 1 && (
        <motion.path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: "easeOut" }} />
      )}

      {/* Pontos */}
      {data.map((p, i) => (
        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }}>
          <circle cx={xFor(i)} cy={yFor(p.score)} r="4.5" fill="var(--background)" stroke={colorFor(p.score)} strokeWidth="2.5" />
          <text x={xFor(i)} y={yFor(p.score) - 10} textAnchor="middle" fontSize="10" fontWeight="600" fill={colorFor(p.score)}>
            {p.score}
          </text>
        </motion.g>
      ))}

      {/* Datas no eixo X (primeira e última) */}
      {data.length > 1 && (
        <>
          <text x={xFor(0)} y={height - 4} textAnchor="start" fontSize="9" fill="var(--muted-foreground)">
            {new Date(data[0].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </text>
          <text x={xFor(data.length - 1)} y={height - 4} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">
            {new Date(data[data.length - 1].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </text>
        </>
      )}
    </svg>
  );
}
