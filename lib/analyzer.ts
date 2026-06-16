export interface PlaceDetails {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: { photo_reference: string }[];
  types?: string[];
  business_status?: string;
  editorial_summary?: { overview?: string };
  reviews?: {
    rating: number;
    text: string;
    time: number;
    author_name: string;
  }[];
  url?: string;
  vicinity?: string;
  icon?: string;
}

export interface MetricResult {
  id: string;
  label: string;
  description: string;
  status: "fraco" | "razoavel" | "bom" | "pendente";
  score: number;
  maxScore: number;
  detail: string;
  limited?: boolean;
  limitedNote?: string;
}

export interface AnalysisResult {
  place: PlaceDetails;
  overallScore: number;
  availablePoints: number;
  totalPossiblePoints: number;
  metrics: MetricResult[];
  pendingMetrics: MetricResult[];
  weakCount: number;
  fairCount: number;
  goodCount: number;
}

function metric(
  id: string,
  label: string,
  description: string,
  score: number,
  maxScore: number,
  detail: string,
  options?: { limited?: boolean; limitedNote?: string }
): MetricResult {
  const pct = score / maxScore;
  const status = pct >= 0.8 ? "bom" : pct >= 0.4 ? "razoavel" : "fraco";
  return {
    id, label, description, status, score, maxScore, detail,
    limited: options?.limited,
    limitedNote: options?.limitedNote,
  };
}

function pendingMetric(id: string, label: string, maxScore: number): MetricResult {
  return {
    id, label,
    description: "Disponível após aprovação da Business Profile API.",
    status: "pendente",
    score: 0,
    maxScore,
    detail: "Aguardando Business Profile API.",
  };
}

// Métricas disponíveis via Places API: 49 pontos no total
// Métricas pendentes (Business Profile API): 51 pontos
// Total do sistema completo: 100 pontos
//
// Fontes: Whitespark Local Search Ranking Factors 2026,
// BrightLocal Consumer Survey 2024, Sterling Sky 2025,
// Google Docs Oficial, ContentByCass 2025, Shapo 2025

export function analyzePlace(place: PlaceDetails): AnalysisResult {
  const metrics: MetricResult[] = [];

  // ── 1. VOLUME DE AVALIAÇÕES — 14 pts ────────────────────────────────────────
  // Fonte: Sterling Sky 2025 (10 reviews = ponto de inflexão de ranking),
  // Visionary Marketing 2026 (50+ reviews = 4,4x mais cliques)
  const reviewCount = place.user_ratings_total ?? 0;
  let reviewCountScore = 0;
  if (reviewCount >= 100) reviewCountScore = 14;
  else if (reviewCount >= 50) reviewCountScore = 11;
  else if (reviewCount >= 10) reviewCountScore = 7;
  else if (reviewCount >= 1) reviewCountScore = 3;
  metrics.push(
    metric(
      "reviews_count",
      "Quantidade de Avaliações",
      "Perfis com 50+ avaliações recebem 4,4x mais cliques. Ter 10+ avaliações já gera aumento perceptível no ranking.",
      reviewCountScore,
      14,
      reviewCount === 0
        ? "Nenhuma avaliação encontrada."
        : `${reviewCount} avaliação(ões). Meta recomendada: 50+.`
    )
  );

  // ── 2. NOTA MÉDIA — 10 pts ──────────────────────────────────────────────────
  // Fonte: BrightLocal 2024 (92% dos consumidores exigem ≥4.0),
  // Shapo 2025 (4.2–4.5 = zona de confiança genuína)
  const rating = place.rating ?? 0;
  let ratingScore = 0;
  if (rating >= 4.5) ratingScore = 10;
  else if (rating >= 4.2) ratingScore = 7;
  else if (rating >= 4.0) ratingScore = 5;
  else if (rating >= 3.5) ratingScore = 2;
  metrics.push(
    metric(
      "reviews_rating",
      "Nota Média",
      "92% dos consumidores exigem nota ≥4.0. A faixa 4.2–4.5 é a 'zona de confiança' onde a nota parece genuína.",
      ratingScore,
      10,
      rating > 0 ? `Média atual: ${rating.toFixed(1)} estrelas.` : "Sem avaliações."
    )
  );

  // ── 3. FOTOS — 10 pts (dados limitados: Places API retorna no máximo 10) ────
  // Fonte: Google Business Profile Insights (100+ fotos = +520% chamadas),
  // ContentByCass 2025 (15+ fotos = maior engajamento), Localo 2025
  const photoCount = place.photos?.length ?? 0;
  let photoScore = 0;
  if (photoCount >= 10) photoScore = 7;
  else if (photoCount >= 5) photoScore = 5;
  else if (photoCount >= 1) photoScore = 2;
  metrics.push(
    metric(
      "photos",
      "Fotos no Perfil",
      "Perfis com fotos recebem 42% mais pedidos de rota e 35% mais cliques. Meta recomendada: 15+ fotos.",
      photoScore,
      10,
      photoCount === 0
        ? "Nenhuma foto encontrada."
        : photoCount >= 10
        ? `${photoCount}+ fotos detectadas (limite da API pública). Perfil pode ter mais.`
        : `${photoCount} foto(s). Meta recomendada: 15+.`,
      {
        limited: true,
        limitedNote: "A API pública retorna no máximo 10 referências de fotos. A contagem real pode ser maior.",
      }
    )
  );

  // ── 4. HORÁRIO DE FUNCIONAMENTO — 6 pts ─────────────────────────────────────
  // Fonte: Whitespark 2026 (fator #5 individual: "Business is Open at Time of Search")
  const hasHours = (place.opening_hours?.weekday_text?.length ?? 0) > 0;
  metrics.push(
    metric(
      "hours",
      "Horário de Funcionamento",
      "Fator #5 de ranking local. Horário ausente causa perda de visibilidade em buscas temporais.",
      hasHours ? 6 : 0,
      6,
      hasHours ? "Horário de funcionamento cadastrado." : "Horário não cadastrado. Isso afeta o ranking em buscas com filtro de horário."
    )
  );

  // ── 5. WEBSITE — 5 pts ──────────────────────────────────────────────────────
  // Fonte: Visionary Marketing 2026 (schema LocalBusiness = +14% CTR),
  // NAP consistency data 2024
  metrics.push(
    metric(
      "website",
      "Website",
      "Completa o ciclo NAP (Nome, Endereço, Telefone + Website) e valida a legitimidade do negócio para o Google.",
      place.website ? 5 : 0,
      5,
      place.website ? "Website vinculado ao perfil." : "Website não vinculado. Afeta a consistência NAP e a confiança do Google."
    )
  );

  // ── 6. TELEFONE — 4 pts ─────────────────────────────────────────────────────
  // Fonte: NAP consistency studies 2024 (inconsistência = -40% de chance no Local Pack)
  metrics.push(
    metric(
      "phone",
      "Número de Telefone",
      "Parte do NAP (Nome, Endereço, Telefone). Inconsistências reduzem em até 40% a chance de aparecer no Local Pack.",
      place.formatted_phone_number ? 4 : 0,
      4,
      place.formatted_phone_number
        ? `Telefone: ${place.formatted_phone_number}`
        : "Telefone não cadastrado."
    )
  );

  // ── MÉTRICAS INFORMATIVAS (não pontuadas) ────────────────────────────────────

  // Status do negócio — informativo
  const isOperational = place.business_status === "OPERATIONAL";
  const isClosedPermanently = place.business_status === "CLOSED_PERMANENTLY";

  // Avaliações com comentários — informativo (Places API retorna apenas 5 recentes)
  const reviews = place.reviews ?? [];
  const reviewsWithText = reviews.filter((r) => r.text?.trim().length > 0);

  // ── MÉTRICAS PENDENTES (Business Profile API) ────────────────────────────────
  const pendingMetrics: MetricResult[] = [
    pendingMetric("category", "Categoria do Negócio", 15),
    pendingMetric("response_rate", "Taxa de Resposta às Avaliações", 8),
    pendingMetric("services", "Serviços e Produtos", 8),
    pendingMetric("description", "Descrição do Negócio", 7),
    pendingMetric("attributes", "Atributos", 7),
    pendingMetric("posts", "Posts e Atualizações", 6),
  ];

  // ── CÁLCULO ──────────────────────────────────────────────────────────────────
  const availablePoints = metrics.reduce((sum, m) => sum + m.maxScore, 0); // 49
  const totalPossiblePoints = availablePoints + pendingMetrics.reduce((sum, m) => sum + m.maxScore, 0); // 100
  const earnedPoints = metrics.reduce((sum, m) => sum + m.score, 0);
  const overallScore = Math.round((earnedPoints / availablePoints) * 100);

  const weakCount = metrics.filter((m) => m.status === "fraco").length;
  const fairCount = metrics.filter((m) => m.status === "razoavel").length;
  const goodCount = metrics.filter((m) => m.status === "bom").length;

  // Silencia warnings de variáveis usadas apenas para contexto futuro
  void isOperational;
  void isClosedPermanently;
  void reviewsWithText;

  return {
    place,
    overallScore,
    availablePoints,
    totalPossiblePoints,
    metrics,
    pendingMetrics,
    weakCount,
    fairCount,
    goodCount,
  };
}
