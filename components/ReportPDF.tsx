import {
  Document, Page, Text, View, Svg, Path, Circle, Line,
} from "@react-pdf/renderer";
import { AnalysisResult, MetricResult } from "@/lib/analyzer";

// ── CORES ─────────────────────────────────────────────────────────────────────
const C = {
  navy: "#0f2044",
  red: "#e53e3e",
  amber: "#d69e2e",
  green: "#276749",
  redBg: "#fff5f5",
  amberBg: "#fffff0",
  greenBg: "#f0fff4",
  barRed: "#FC8181",
  barAmber: "#F6E05E",
  barGreen: "#68D391",
  text: "#1a202c",
  muted: "#4a5568",
  light: "#718096",
  border: "#e2e8f0",
  white: "#ffffff",
};

// ── GAUGE SVG ─────────────────────────────────────────────────────────────────
function GaugeSvg({ score }: { score: number }) {
  const cx = 90, cy = 88, r = 68;
  const toXY = (pct: number) => {
    const angle = Math.PI * (1 - pct / 100);
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };
  const p0 = toXY(0);
  const p40 = toXY(40);
  const p70 = toXY(70);
  const p100 = toXY(100);
  const ps = toXY(Math.min(Math.max(score, 1), 99));
  const arc = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;

  return (
    <Svg width={190} height={105} viewBox="0 0 180 100">
      <Path d={arc(p0, p40)} stroke={C.barRed} strokeWidth={11} fill="none" />
      <Path d={arc(p40, p70)} stroke={C.barAmber} strokeWidth={11} fill="none" />
      <Path d={arc(p70, p100)} stroke={C.barGreen} strokeWidth={11} fill="none" />
      <Line x1={cx} y1={cy} x2={ps.x.toFixed(1)} y2={ps.y.toFixed(1)} stroke={C.navy} strokeWidth={2.5} />
      <Circle cx={cx} cy={cy} r={5} fill={C.navy} />
    </Svg>
  );
}

// ── BARRA DE PROGRESSO ────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  const barW = 460;
  const pointerX = Math.round((pct / 100) * barW);
  return (
    <View>
      <View style={{ position: "relative", height: 14, marginBottom: 1 }}>
        <Text style={{ position: "absolute", left: Math.max(0, pointerX - 8), fontSize: 7, color: C.muted }}>
          {pct}%
        </Text>
      </View>
      <View style={{ position: "relative", height: 6, marginBottom: 2 }}>
        <Text style={{ position: "absolute", left: Math.max(0, pointerX - 3), fontSize: 8, color: C.muted, top: -2 }}>
          v
        </Text>
      </View>
      <View style={{ flexDirection: "row", height: 18, borderRadius: 2, overflow: "hidden" }}>
        <View style={{ flex: 1, backgroundColor: C.barRed, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 7, color: C.white, fontFamily: "Helvetica-Bold" }}>Fraco</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: C.barAmber, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 7, color: "#744210", fontFamily: "Helvetica-Bold" }}>Razoável</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: C.barGreen, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 7, color: C.white, fontFamily: "Helvetica-Bold" }}>Bom</Text>
        </View>
      </View>
    </View>
  );
}

// ── ÍCONE DE STATUS ───────────────────────────────────────────────────────────
function StatusDot({ status, unverified }: { status: string; unverified?: boolean }) {
  const color = unverified ? "#a0aec0"
    : status === "bom" ? C.green
    : status === "razoavel" ? C.amber
    : C.red;
  const symbol = unverified ? "?" : status === "bom" ? "✓" : status === "razoavel" ? "!" : "✗";
  return (
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color, justifyContent: "center", alignItems: "center", marginRight: 8, marginTop: 1, flexShrink: 0 }}>
      <Text style={{ fontSize: 9, color: C.white, fontFamily: "Helvetica-Bold" }}>{symbol}</Text>
    </View>
  );
}

// ── LINHA DE MÉTRICA ──────────────────────────────────────────────────────────
function MetricRow({ m }: { m: MetricResult }) {
  const pct = m.unverified ? null
    : m.status === "bom" ? 100
    : m.status === "razoavel" ? Math.max(34, Math.round((m.score / Math.max(m.maxScore, 1)) * 100))
    : Math.min(33, Math.round((m.score / Math.max(m.maxScore, 1)) * 100));

  const rowBg = m.unverified ? "#f7fafc"
    : m.status === "bom" ? C.greenBg
    : m.status === "razoavel" ? C.amberBg
    : C.redBg;

  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
        <StatusDot status={m.status} unverified={m.unverified} />
        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text, flex: 1 }}>
          {m.label}
        </Text>
      </View>
      <View style={{ backgroundColor: rowBg, borderRadius: 4, padding: 8, marginBottom: 6 }}>
        <Text style={{ fontSize: 8.5, color: C.muted, marginBottom: 4, lineHeight: 1.4 }}>
          {m.description}
        </Text>
        <Text style={{ fontSize: 8.5, color: C.text, fontFamily: "Helvetica-Bold" }}>
          {m.detail}
        </Text>
      </View>
      {pct !== null && <ProgressBar pct={pct} />}
      {pct === null && (
        <View style={{ height: 18, backgroundColor: "#edf2f7", borderRadius: 2, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 7, color: C.light }}>Não verificado — requer acesso ao GBP do proprietário</Text>
        </View>
      )}
    </View>
  );
}

// ── DOCUMENTO PRINCIPAL ───────────────────────────────────────────────────────
export function ReportPDF({ result }: { result: AnalysisResult }) {
  const { place, overallScore, metrics, pendingMetrics } = result;
  const allMetrics = [...metrics, ...pendingMetrics];
  const totalWeak = allMetrics.filter(m => m.status === "fraco").length;
  const totalFair = allMetrics.filter(m => m.status === "razoavel").length;
  const totalGood = allMetrics.filter(m => m.status === "bom").length;
  const date = new Date().toLocaleDateString("pt-BR");

  return (
    <Document title={`Análise de Saúde — ${place.name}`} author="Mengue Digital">
      <Page size="A4" style={{ fontFamily: "Helvetica", fontSize: 9, color: C.text, backgroundColor: C.white, paddingBottom: 50 }}>

        {/* HEADER */}
        <View style={{ backgroundColor: C.navy, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 32, paddingVertical: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#1a3a6e", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: C.white, fontSize: 16, fontFamily: "Helvetica-Bold" }}>M</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: C.white, fontSize: 13, fontFamily: "Helvetica-Bold" }}>Mengue Digital</Text>
            <Text style={{ color: "#93a3c8", fontSize: 8.5, marginTop: 2 }}>47 98928-3137</Text>
            <Text style={{ color: "#93a3c8", fontSize: 8.5 }}>menguedigital@gmail.com</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 32, paddingTop: 20 }}>

          {/* TÍTULO */}
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 20 }}>
            Análise de Saúde da {place.name}:
          </Text>

          {/* GAUGE + CONTADORES */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
            <View style={{ alignItems: "center" }}>
              <GaugeSvg score={overallScore} />
              <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: C.text, marginTop: -8 }}>
                {overallScore}
              </Text>
            </View>
            <View style={{ marginLeft: 32, gap: 8 }}>
              {[
                { count: totalWeak, label: "Fraco", color: C.red, bg: C.redBg },
                { count: totalFair, label: "Razoável", color: C.amber, bg: C.amberBg },
                { count: totalGood, label: "Bom", color: C.green, bg: C.greenBg },
              ].map(s => (
                <View key={s.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: s.color, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: C.white, fontSize: 12, fontFamily: "Helvetica-Bold" }}>{s.count}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: s.color, fontFamily: "Helvetica-Bold" }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* MÉTRICAS */}
          {allMetrics.filter(m => m.status !== "indisponivel").map(m => (
            <MetricRow key={m.id} m={m} />
          ))}

        </View>

        {/* RODAPÉ */}
        <View style={{ position: "absolute", bottom: 16, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 }} fixed>
          <Text style={{ fontSize: 7, color: C.light }}>Mengue Digital — Análise de Perfil Google</Text>
          <Text style={{ fontSize: 7, color: C.light }}>{place.name} · {date}</Text>
        </View>

      </Page>
    </Document>
  );
}
