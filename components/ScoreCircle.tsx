"use client";

interface Props {
  score: number;
}

export function ScoreCircle({ score }: Props) {
  const label = score >= 80 ? "BOM" : score >= 50 ? "RAZOÁVEL" : "FRACO";
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="60" y="55" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>{score}</text>
        <text x="60" y="75" textAnchor="middle" fontSize="13" fill="#6b7280">{label}</text>
      </svg>
      <p className="text-sm text-gray-500 font-medium">Pontuação Geral</p>
    </div>
  );
}
