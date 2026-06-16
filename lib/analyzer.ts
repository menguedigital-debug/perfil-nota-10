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
  status: "fraco" | "razoavel" | "bom";
  score: number;
  maxScore: number;
  detail: string;
}

export interface AnalysisResult {
  place: PlaceDetails;
  overallScore: number;
  metrics: MetricResult[];
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
  detail: string
): MetricResult {
  const pct = score / maxScore;
  const status = pct >= 0.8 ? "bom" : pct >= 0.4 ? "razoavel" : "fraco";
  return { id, label, description, status, score, maxScore, detail };
}

const GENERIC_TYPES = new Set([
  "point_of_interest", "establishment", "premise", "political",
  "geocode", "locality", "sublocality", "country", "route",
]);

export function analyzePlace(place: PlaceDetails): AnalysisResult {
  const metrics: MetricResult[] = [];

  // Nome do negócio
  const nameLen = place.name?.length ?? 0;
  metrics.push(
    metric(
      "name",
      "Nome do Negócio",
      "O nome deve refletir o nome real do negócio, sem palavras-chave artificiais.",
      nameLen > 0 && nameLen <= 98 ? 10 : nameLen > 98 ? 5 : 0,
      10,
      nameLen > 0
        ? `Nome definido com ${nameLen} caracteres.`
        : "Nome não definido."
    )
  );

  // Telefone
  metrics.push(
    metric(
      "phone",
      "Número de Telefone",
      "Informação chave para que clientes possam entrar em contato.",
      place.formatted_phone_number ? 10 : 0,
      10,
      place.formatted_phone_number
        ? `Telefone: ${place.formatted_phone_number}`
        : "Telefone não definido."
    )
  );

  // Website
  metrics.push(
    metric(
      "website",
      "Website",
      "Ter um website transmite credibilidade e oferece mais informações ao cliente.",
      place.website ? 10 : 0,
      10,
      place.website ? `Website definido.` : "Website não definido."
    )
  );

  // Endereço
  metrics.push(
    metric(
      "address",
      "Endereço",
      "O endereço completo ajuda clientes a encontrarem o negócio fisicamente.",
      place.formatted_address ? 10 : 0,
      10,
      place.formatted_address
        ? `Endereço: ${place.formatted_address}`
        : "Endereço não definido."
    )
  );

  // Fotos — Places API retorna no máximo 10 referências
  const photoCount = place.photos?.length ?? 0;
  const photoScore = photoCount >= 10 ? 10 : photoCount >= 3 ? 7 : photoCount > 0 ? 4 : 0;
  const photoDetail = photoCount >= 10
    ? `Possui 10 ou mais fotos no perfil. Quantidade mínima recomendada atingida.`
    : photoCount > 0
    ? `${photoCount} foto(s) encontrada(s). Mínimo recomendado: 3.`
    : "Nenhuma foto encontrada no perfil.";
  metrics.push(metric("photos", "Fotos no Perfil", "Fotos mostram o negócio e geram mais confiança nos clientes.", photoScore, 10, photoDetail));

  // Status do negócio
  const isOpen = place.business_status === "OPERATIONAL";
  const isClosed = place.business_status === "CLOSED_PERMANENTLY";
  metrics.push(
    metric(
      "status",
      "Status do Negócio",
      "O perfil deve estar ativo e operacional no Google.",
      isOpen ? 10 : isClosed ? 0 : 5,
      10,
      isOpen
        ? "Negócio ativo e operacional."
        : isClosed
        ? "Negócio marcado como permanentemente fechado."
        : "Status do negócio indefinido."
    )
  );

  // Avaliações — quantidade
  const reviewCount = place.user_ratings_total ?? 0;
  metrics.push(
    metric(
      "reviews_count",
      "Quantidade de Avaliações",
      "Avaliações transmitem confiança para novos clientes.",
      reviewCount >= 50 ? 10 : reviewCount >= 10 ? 8 : reviewCount >= 3 ? 6 : reviewCount > 0 ? 3 : 0,
      10,
      `${reviewCount} avaliação(ões). Recomendado: mínimo 10.`
    )
  );

  // Avaliações — média
  const rating = place.rating ?? 0;
  metrics.push(
    metric(
      "reviews_rating",
      "Média de Avaliações",
      "Uma boa média transmite segurança e atrai mais clientes.",
      rating >= 4.5 ? 10 : rating >= 4.0 ? 8 : rating >= 3.5 ? 5 : rating > 0 ? 3 : 0,
      10,
      rating > 0 ? `Média: ${rating.toFixed(1)} estrelas.` : "Sem avaliações."
    )
  );

  // Avaliações com comentários (texto) — Places API retorna até 5 reviews
  const reviews = place.reviews ?? [];
  const reviewsWithText = reviews.filter((r) => r.text && r.text.trim().length > 0);
  const textRate = reviews.length > 0 ? reviewsWithText.length / reviews.length : 0;
  metrics.push(
    metric(
      "reviews_with_comments",
      "Avaliações com Comentários",
      "Avaliações com texto detalhado geram mais credibilidade e ajudam no SEO local.",
      reviews.length === 0 ? 5 : textRate >= 0.7 ? 10 : textRate >= 0.4 ? 6 : 3,
      10,
      reviews.length > 0
        ? `${reviewsWithText.length} de ${reviews.length} avaliações recentes têm comentário.`
        : "Nenhuma avaliação recente encontrada para análise."
    )
  );

  // Horário de funcionamento
  const hasHours = (place.opening_hours?.weekday_text?.length ?? 0) > 0;
  metrics.push(
    metric(
      "hours",
      "Horário de Funcionamento",
      "Clientes precisam saber quando podem visitar ou contatar o negócio.",
      hasHours ? 10 : 0,
      10,
      hasHours ? "Horário de funcionamento definido." : "Horário não definido."
    )
  );

  // Categoria específica (filtra tipos genéricos do Google)
  const specificTypes = (place.types ?? []).filter((t) => !GENERIC_TYPES.has(t));
  metrics.push(
    metric(
      "category",
      "Categoria do Negócio",
      "A categoria correta ajuda o Google a mostrar seu negócio para as pesquisas certas.",
      specificTypes.length > 0 ? 10 : 0,
      10,
      specificTypes.length > 0
        ? `Categoria: ${specificTypes.slice(0, 2).join(", ").replace(/_/g, " ")}.`
        : "Nenhuma categoria específica definida."
    )
  );

  const totalScore = metrics.reduce((sum, m) => sum + m.score, 0);
  const maxTotal = metrics.reduce((sum, m) => sum + m.maxScore, 0);
  const overallScore = Math.round((totalScore / maxTotal) * 100);

  const weakCount = metrics.filter((m) => m.status === "fraco").length;
  const fairCount = metrics.filter((m) => m.status === "razoavel").length;
  const goodCount = metrics.filter((m) => m.status === "bom").length;

  return { place, overallScore, metrics, weakCount, fairCount, goodCount };
}
