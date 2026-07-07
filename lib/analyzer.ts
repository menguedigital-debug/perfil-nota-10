export interface GmbData {
  name?: string;
  categories?: {
    primaryCategory?: { displayName?: string; categoryId?: string };
    additionalCategories?: { displayName?: string }[];
  };
  profile?: { description?: string };
  serviceItems?: object[];
  attributes?: { name?: string; values?: string[] }[];
  _reviews?: {
    reviews?: { reviewReply?: { comment?: string } }[];
    totalReviewCount?: number;
  };
  _posts?: {
    localPosts?: { updateTime?: string; createTime?: string }[];
  };
  _perf?: {
    multiDailyMetricTimeSeries?: Array<{
      dailyMetricTimeSeries?: Array<{
        dailyMetric?: string;
        timeSeries?: { datedValues?: { value?: string }[] };
      }>;
    }>;
  } | null;
  _verif?: {
    verifications?: { state?: string; method?: string }[];
  } | null;
  _meta?: {
    reviewsAvailable?: boolean;
    postsAvailable?: boolean;
    perfAvailable?: boolean;
    verifAvailable?: boolean;
  };
}

function sumPerfMetric(perf: GmbData["_perf"], metricName: string): number {
  if (!perf) return 0;
  for (const group of perf.multiDailyMetricTimeSeries ?? []) {
    for (const ts of group.dailyMetricTimeSeries ?? []) {
      if (ts.dailyMetric === metricName) {
        return (ts.timeSeries?.datedValues ?? [])
          .reduce((s, v) => s + (parseInt(v.value ?? "0") || 0), 0);
      }
    }
  }
  return 0;
}

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
  // Atributos públicos retornados pela Places API
  wheelchair_accessible_entrance?: boolean;
  dine_in?: boolean;
  delivery?: boolean;
  takeout?: boolean;
  serves_beer?: boolean;
  serves_wine?: boolean;
  serves_breakfast?: boolean;
  serves_lunch?: boolean;
  serves_dinner?: boolean;
  serves_brunch?: boolean;
  serves_vegetarian_food?: boolean;
  reservable?: boolean;
  price_level?: number;
  curbside_pickup?: boolean;
}

export interface MetricResult {
  id: string;
  label: string;
  description: string;
  status: "fraco" | "razoavel" | "bom" | "pendente" | "indisponivel";
  score: number;
  maxScore: number;
  detail: string;
  limited?: boolean;
  limitedNote?: string;
  unverified?: boolean;
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

function unverifiedMetric(id: string, label: string, description: string, maxScore: number): MetricResult {
  return {
    id, label, description,
    status: "fraco",
    score: 0,
    maxScore,
    detail: "Não verificado — requer acesso ao Google Business Profile do proprietário.",
    unverified: true,
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

  // ── 7. CATEGORIA — 15 pts (aproximado via Places API types) ─────────────────
  // Fonte: Whitespark 2026 (categoria primária = fator #1 de relevância local)
  const placeTypesPT: Record<string, string> = {
    accounting: "Contabilidade", airport: "Aeroporto", amusement_park: "Parque de diversões",
    aquarium: "Aquário", art_gallery: "Galeria de arte", atm: "Caixa eletrônico",
    bakery: "Padaria", bank: "Banco", bar: "Bar", beauty_salon: "Salão de beleza",
    bicycle_store: "Loja de bicicletas", book_store: "Livraria", bowling_alley: "Boliche",
    bus_station: "Terminal de ônibus", cafe: "Cafeteria", campground: "Camping",
    car_dealer: "Concessionária de veículos", car_rental: "Locadora de veículos",
    car_repair: "Oficina mecânica", car_wash: "Lava-rápido", casino: "Cassino",
    cemetery: "Cemitério", church: "Igreja", city_hall: "Prefeitura",
    clothing_store: "Loja de roupas", convenience_store: "Conveniência",
    courthouse: "Tribunal", dentist: "Dentista", department_store: "Loja de departamentos",
    doctor: "Médico", drugstore: "Farmácia", electrician: "Eletricista",
    electronics_store: "Loja de eletrônicos", embassy: "Embaixada",
    fire_station: "Corpo de bombeiros", florist: "Floricultura",
    funeral_home: "Funerária", furniture_store: "Loja de móveis",
    gas_station: "Posto de gasolina", gym: "Academia",
    hair_care: "Cuidados com o cabelo", hardware_store: "Loja de ferragens",
    hindu_temple: "Templo hindu", home_goods_store: "Loja de artigos do lar",
    hospital: "Hospital", hotel: "Hotel", insurance_agency: "Seguradora",
    jewelry_store: "Joalheria", laundry: "Lavanderia", lawyer: "Escritório de advocacia",
    library: "Biblioteca", light_rail_station: "Estação de metrô leve",
    liquor_store: "Adega", locksmith: "Chaveiro", lodging: "Hospedagem",
    meal_delivery: "Entrega de refeições", meal_takeaway: "Refeições para viagem",
    mosque: "Mesquita", movie_rental: "Locadora", movie_theater: "Cinema",
    moving_company: "Transportadora", museum: "Museu", night_club: "Casa noturna",
    painter: "Pintor", park: "Parque", parking: "Estacionamento",
    pet_store: "Pet shop", pharmacy: "Farmácia", physiotherapist: "Fisioterapeuta",
    plumber: "Encanador", police: "Delegacia", post_office: "Correios",
    primary_school: "Escola primária", real_estate_agency: "Imobiliária",
    restaurant: "Restaurante", roofing_contractor: "Telhados",
    rv_park: "Parque de trailers", school: "Escola", secondary_school: "Colégio",
    shoe_store: "Sapataria", shopping_mall: "Shopping", spa: "Spa",
    stadium: "Estádio", storage: "Self-storage", store: "Loja",
    subway_station: "Estação de metrô", supermarket: "Supermercado",
    synagogue: "Sinagoga", taxi_stand: "Ponto de táxi", tourist_attraction: "Atração turística",
    train_station: "Estação de trem", transit_station: "Terminal de transporte",
    travel_agency: "Agência de viagens", university: "Universidade",
    veterinary_care: "Veterinário", zoo: "Zoológico",
  };
  const translateType = (t: string) => placeTypesPT[t] ?? t.replace(/_/g, " ");
  const genericTypes = new Set([
    "point_of_interest", "establishment", "food", "health",
    "premise", "subpremise", "political", "locality", "finance",
    "natural_feature", "geocode",
  ]);
  const specificTypes = (place.types ?? []).filter((t) => !genericTypes.has(t));
  let categoryScore = 0;
  let categoryDetail = "Nenhuma categoria detectada.";
  if (specificTypes.length >= 3) {
    categoryScore = 12;
    categoryDetail = `${specificTypes.length} categorias detectadas: ${specificTypes.slice(0, 3).map(translateType).join(", ")}.`;
  } else if (specificTypes.length >= 1) {
    categoryScore = 7;
    categoryDetail = `Categoria principal: ${translateType(specificTypes[0])}. Poucas categorias configuradas.`;
  } else if ((place.types ?? []).length > 0) {
    categoryScore = 2;
    categoryDetail = "Apenas categorias genéricas. Configure categorias específicas no GBP.";
  }
  metrics.push(
    metric("category", "Categoria do Negócio",
      "Categoria primária correta é o fator #1 de relevância local. Categorias secundárias aumentam visibilidade em buscas relacionadas.",
      categoryScore, 15, categoryDetail,
      { limited: true, limitedNote: "Dados inferidos da classificação pública do Google. Categorias reais configuradas no GBP podem ser diferentes." })
  );

  // ── 8. DESCRIÇÃO — 7 pts (aproximado via editorial_summary) ─────────────────
  // Fonte: Google Docs (descrição = relevância semântica no Local Pack)
  const overview = place.editorial_summary?.overview ?? "";
  let descScore = 0;
  let descDetail = "Nenhuma descrição pública encontrada.";
  if (overview.length >= 100) {
    descScore = 4;
    descDetail = `Descrição com ${overview.length} caracteres detectada. Verifique se foi configurada pelo proprietário.`;
  } else if (overview.length >= 30) {
    descScore = 2;
    descDetail = `Descrição curta (${overview.length} chars). Recomendado: 150+ caracteres.`;
  }
  metrics.push(
    metric("description", "Descrição do Negócio",
      "Descrições com 150+ caracteres e palavras-chave naturais melhoram a relevância semântica no Local Pack.",
      descScore, 7, descDetail,
      { limited: true, limitedNote: "Dados públicos — a descrição real cadastrada pelo proprietário só é acessível via GBP." })
  );

  // ── 9. ATRIBUTOS — 7 pts (via campos booleanos da Places API) ───────────────
  // Fonte: Whitespark 2026 (atributos = fator de filtragem no Maps)
  const attrFields: { key: keyof PlaceDetails; label: string }[] = [
    { key: "wheelchair_accessible_entrance", label: "Acessível para cadeirantes" },
    { key: "dine_in", label: "Comer no local" },
    { key: "delivery", label: "Delivery" },
    { key: "takeout", label: "Para viagem" },
    { key: "serves_beer", label: "Serve cerveja" },
    { key: "serves_wine", label: "Serve vinho" },
    { key: "serves_breakfast", label: "Café da manhã" },
    { key: "serves_lunch", label: "Almoço" },
    { key: "serves_dinner", label: "Jantar" },
    { key: "serves_brunch", label: "Brunch" },
    { key: "serves_vegetarian_food", label: "Opções vegetarianas" },
    { key: "reservable", label: "Aceita reservas" },
    { key: "curbside_pickup", label: "Retirada na calçada" },
  ];
  const detectedAttrs = attrFields.filter(a => place[a.key] === true);
  const hasAnyAttrData = attrFields.some(a => place[a.key] !== undefined);

  if (hasAnyAttrData) {
    let attrScore = 0;
    let attrDetail = "Nenhum atributo detectado na Places API.";
    if (detectedAttrs.length >= 5) {
      attrScore = 7;
      attrDetail = `${detectedAttrs.length} atributos detectados: ${detectedAttrs.slice(0, 3).map(a => a.label).join(", ")}${detectedAttrs.length > 3 ? ` e mais ${detectedAttrs.length - 3}` : ""}.`;
    } else if (detectedAttrs.length >= 3) {
      attrScore = 5;
      attrDetail = `${detectedAttrs.length} atributos: ${detectedAttrs.map(a => a.label).join(", ")}. Configure mais no GBP.`;
    } else if (detectedAttrs.length >= 1) {
      attrScore = 2;
      attrDetail = `${detectedAttrs.length} atributo(s): ${detectedAttrs.map(a => a.label).join(", ")}. Adicione mais atributos relevantes.`;
    } else {
      attrDetail = "Nenhum atributo configurado. Atributos aumentam visibilidade em buscas com filtros.";
    }
    metrics.push(
      metric("attributes", "Atributos do Perfil",
        "Atributos como 'acessível para cadeirantes', 'delivery', 'reservas' aumentam a relevância em buscas com filtros no Maps.",
        attrScore, 7, attrDetail,
        { limited: true, limitedNote: "Dados via Places API — atributos personalizados só são visíveis com acesso ao GBP." })
    );
  }

  // ── 10. TAXA DE RESPOSTA (amostra pública) — 8 pts ──────────────────────────
  // Places API retorna até 5 reviews recentes; usamos como amostra
  const publicReviews = place.reviews ?? [];
  if (publicReviews.length > 0) {
    // A Places API não retorna a resposta do proprietário — só sabemos que há reviews
    // Mostramos a distribuição de notas como proxy de engajamento
    const lowReviews = publicReviews.filter(r => r.rating <= 3).length;
    const hasNegative = lowReviews > 0;
    metrics.push(
      metric("response_rate", "Taxa de Resposta às Avaliações",
        "Responder avaliações (positivas e negativas) aumenta confiança do consumidor e é fator de engajamento no algoritmo local.",
        hasNegative ? 2 : 4, 8,
        `${publicReviews.length} avaliação(ões) recentes visíveis publicamente.${hasNegative ? ` ${lowReviews} com nota ≤3 — verifique se foram respondidas.` : " Sem avaliações negativas recentes."}`,
        { limited: true, limitedNote: "Taxa de resposta real requer acesso ao GBP. Esta é uma estimativa baseada nas 5 avaliações mais recentes visíveis publicamente." })
    );
  }

  // Status do negócio — usado abaixo
  const isOperational = place.business_status === "OPERATIONAL";
  const isClosedPermanently = place.business_status === "CLOSED_PERMANENTLY";
  void isOperational;
  void isClosedPermanently;

  // ── MÉTRICAS NÃO VERIFICÁVEIS SEM ACESSO GBP ────────────────────────────────
  const pendingMetrics: MetricResult[] = [
    unverifiedMetric("services", "Serviços e Produtos",
      "Perfis com serviços detalhados aparecem em mais buscas de intenção transacional e têm maior CTR.", 8),
    unverifiedMetric("posts", "Posts e Atualizações",
      "Posts semanais mantêm o perfil 'ativo' nos olhos do algoritmo e aumentam o engajamento direto com clientes.", 6),
    unverifiedMetric("visibility", "Visibilidade no Google",
      "Total de vezes que o perfil apareceu no Google Search e Maps nos últimos 90 dias.", 10),
    unverifiedMetric("engagement", "Engajamento no Perfil",
      "Soma de cliques para ligar, visitas ao site e pedidos de rota nos últimos 90 dias.", 8),
    unverifiedMetric("verification", "Verificação do Perfil",
      "Perfis verificados têm prioridade no Local Pack. O Voice of Merchant indica ao Google que o perfil está sob controle do proprietário real.", 8),
  ];

  // ── CÁLCULO ──────────────────────────────────────────────────────────────────
  const availablePoints = metrics.reduce((sum, m) => sum + m.maxScore, 0); // 49
  const totalPossiblePoints = availablePoints + pendingMetrics.reduce((sum, m) => sum + m.maxScore, 0); // 100
  const earnedPoints = metrics.reduce((sum, m) => sum + m.score, 0);
  const overallScore = Math.round((earnedPoints / availablePoints) * 100);

  const weakCount = metrics.filter((m) => m.status === "fraco").length;
  const fairCount = metrics.filter((m) => m.status === "razoavel").length;
  const goodCount = metrics.filter((m) => m.status === "bom").length;


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

export function enrichWithGmbData(result: AnalysisResult, gmb: GmbData): AnalysisResult {
  const resolvedMetrics: MetricResult[] = [];

  // ── CATEGORIA — 15 pts ──────────────────────────────────────────────────────
  const primary = gmb.categories?.primaryCategory;
  const additionalCount = gmb.categories?.additionalCategories?.length ?? 0;
  let categoryScore = 0;
  let categoryDetail = "Categoria primária não definida.";
  if (primary?.displayName) {
    categoryScore = additionalCount >= 2 ? 15 : additionalCount >= 1 ? 12 : 9;
    categoryDetail = `Primária: ${primary.displayName}. ${additionalCount > 0 ? `+${additionalCount} categoria(s) adicional(is).` : "Sem categorias adicionais."}`;
  }
  resolvedMetrics.push(
    metric("category", "Categoria do Negócio",
      "Categoria primária correta é o fator #1 de relevância local. Categorias secundárias aumentam visibilidade em buscas relacionadas.",
      categoryScore, 15, categoryDetail)
  );

  // ── DESCRIÇÃO — 7 pts ────────────────────────────────────────────────────────
  const desc = gmb.profile?.description ?? "";
  let descScore = 0;
  let descDetail = "Descrição do negócio não preenchida.";
  if (desc.length >= 150) { descScore = 7; descDetail = `Descrição com ${desc.length} caracteres. Ótimo.`; }
  else if (desc.length >= 50) { descScore = 4; descDetail = `Descrição com ${desc.length} caracteres. Recomendado: 150+.`; }
  else if (desc.length > 0) { descScore = 1; descDetail = `Descrição muito curta (${desc.length} chars). Expanda para 150+.`; }
  resolvedMetrics.push(
    metric("description", "Descrição do Negócio",
      "Descrições com 150+ caracteres e palavras-chave naturais melhoram a relevância semântica no Local Pack.",
      descScore, 7, descDetail)
  );

  // ── SERVIÇOS E PRODUTOS — 8 pts ──────────────────────────────────────────────
  const serviceCount = gmb.serviceItems?.length ?? 0;
  let servicesScore = 0;
  let servicesDetail = "Nenhum serviço ou produto cadastrado.";
  if (serviceCount >= 10) { servicesScore = 8; servicesDetail = `${serviceCount} serviços/produtos cadastrados. Excelente.`; }
  else if (serviceCount >= 5) { servicesScore = 6; servicesDetail = `${serviceCount} serviços cadastrados. Meta: 10+.`; }
  else if (serviceCount >= 1) { servicesScore = 3; servicesDetail = `${serviceCount} serviço(s) cadastrado(s). Adicione mais para ampliar visibilidade.`; }
  resolvedMetrics.push(
    metric("services", "Serviços e Produtos",
      "Perfis com serviços detalhados aparecem em mais buscas de intenção transacional e têm maior CTR.",
      servicesScore, 8, servicesDetail)
  );

  // ── ATRIBUTOS — 7 pts ────────────────────────────────────────────────────────
  const attrCount = gmb.attributes?.length ?? 0;
  let attrScore = 0;
  let attrDetail = "Nenhum atributo configurado.";
  if (attrCount >= 5) { attrScore = 7; attrDetail = `${attrCount} atributos configurados. Ótimo.`; }
  else if (attrCount >= 3) { attrScore = 5; attrDetail = `${attrCount} atributos. Recomendado: 5+.`; }
  else if (attrCount >= 1) { attrScore = 2; attrDetail = `${attrCount} atributo(s). Adicione mais atributos relevantes.`; }
  resolvedMetrics.push(
    metric("attributes", "Atributos",
      "Atributos como 'acessível para cadeirantes', 'Wi-Fi gratuito', 'estacionamento' aumentam a relevância em buscas com filtros.",
      attrScore, 7, attrDetail)
  );

  // ── TAXA DE RESPOSTA ÀS AVALIAÇÕES — 8 pts ──────────────────────────────────
  const reviewsAvailable = gmb._meta?.reviewsAvailable ?? (Object.keys(gmb._reviews ?? {}).length > 0);
  const reviews = gmb._reviews?.reviews ?? [];
  if (!reviewsAvailable) {
    resolvedMetrics.push({
      id: "response_rate", label: "Taxa de Resposta às Avaliações",
      description: "Responder avaliações (positivas e negativas) aumenta confiança do consumidor e é fator de engajamento no algoritmo local.",
      status: "indisponivel", score: 0, maxScore: 0,
      detail: "Dados não disponíveis via API. Verifique manualmente no Google Business Profile.",
    });
  } else {
    let responseScore = 0;
    let responseDetail = "Nenhuma avaliação encontrada via API.";
    if (reviews.length > 0) {
      const replied = reviews.filter((r) => r.reviewReply?.comment).length;
      const rate = Math.round((replied / reviews.length) * 100);
      if (rate >= 80) { responseScore = 8; responseDetail = `${rate}% das avaliações respondidas. Excelente engajamento.`; }
      else if (rate >= 50) { responseScore = 5; responseDetail = `${rate}% respondidas. Meta: 80%+.`; }
      else if (rate > 0) { responseScore = 2; responseDetail = `Apenas ${rate}% respondidas. Responda mais avaliações.`; }
      else { responseScore = 0; responseDetail = "Nenhuma avaliação respondida. Respostas aumentam confiança e CTR."; }
    }
    resolvedMetrics.push(
      metric("response_rate", "Taxa de Resposta às Avaliações",
        "Responder avaliações (positivas e negativas) aumenta confiança do consumidor e é fator de engajamento no algoritmo local.",
        responseScore, 8, responseDetail)
    );
  }

  // ── POSTS E ATUALIZAÇÕES — 6 pts ─────────────────────────────────────────────
  const postsAvailable = gmb._meta?.postsAvailable ?? (Object.keys(gmb._posts ?? {}).length > 0);
  const posts = gmb._posts?.localPosts ?? [];
  if (!postsAvailable) {
    resolvedMetrics.push({
      id: "posts", label: "Posts e Atualizações",
      description: "Posts semanais mantêm o perfil 'ativo' nos olhos do algoritmo e aumentam o engajamento direto com clientes.",
      status: "indisponivel", score: 0, maxScore: 0,
      detail: "Dados não disponíveis via API. Verifique manualmente no Google Business Profile.",
    });
  } else {
    let postsScore = 0;
    let postsDetail = "Nenhum post recente encontrado.";
    if (posts.length > 0) {
      const latest = posts[0];
      const lastDate = new Date(latest.updateTime ?? latest.createTime ?? 0);
      const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
      if (daysSince <= 30) { postsScore = 6; postsDetail = `Post há ${daysSince} dias. Perfil ativo.`; }
      else if (daysSince <= 90) { postsScore = 3; postsDetail = `Último post há ${daysSince} dias. Publique com mais frequência.`; }
      else { postsScore = 1; postsDetail = `Último post há ${daysSince} dias. Reative com posts regulares.`; }
    }
    resolvedMetrics.push(
      metric("posts", "Posts e Atualizações",
        "Posts semanais mantêm o perfil 'ativo' nos olhos do algoritmo e aumentam o engajamento direto com clientes.",
        postsScore, 6, postsDetail)
    );
  }

  // ── VISIBILIDADE NO GOOGLE (Performance API) — 10 pts ───────────────────────
  if (gmb._meta?.perfAvailable && gmb._perf) {
    const impressions =
      sumPerfMetric(gmb._perf, "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH") +
      sumPerfMetric(gmb._perf, "BUSINESS_IMPRESSIONS_MOBILE_SEARCH") +
      sumPerfMetric(gmb._perf, "BUSINESS_IMPRESSIONS_DESKTOP_MAPS") +
      sumPerfMetric(gmb._perf, "BUSINESS_IMPRESSIONS_MOBILE_MAPS");
    let visScore = 0;
    let visDetail = "";
    if (impressions >= 3000) { visScore = 10; visDetail = `${impressions.toLocaleString("pt-BR")} aparições nos últimos 90 dias. Excelente visibilidade.`; }
    else if (impressions >= 1000) { visScore = 7; visDetail = `${impressions.toLocaleString("pt-BR")} aparições nos últimos 90 dias. Boa visibilidade.`; }
    else if (impressions >= 300) { visScore = 4; visDetail = `${impressions.toLocaleString("pt-BR")} aparições. Perfil pouco visível — otimize categorias e palavras-chave.`; }
    else { visScore = 1; visDetail = `${impressions.toLocaleString("pt-BR")} aparições. Visibilidade muito baixa — revise completamente o perfil.`; }
    resolvedMetrics.push(
      metric("visibility", "Visibilidade no Google",
        "Total de vezes que o perfil apareceu no Google Search e Maps nos últimos 90 dias. Reflete diretamente a relevância do perfil para o algoritmo local.",
        visScore, 10, visDetail)
    );

    // ── ENGAJAMENTO (Performance API) — 8 pts ───────────────────────────────────
    const interactions =
      sumPerfMetric(gmb._perf, "CALL_CLICKS") +
      sumPerfMetric(gmb._perf, "WEBSITE_CLICKS") +
      sumPerfMetric(gmb._perf, "BUSINESS_DIRECTION_REQUESTS");
    let engScore = 0;
    let engDetail = "";
    if (interactions >= 100) { engScore = 8; engDetail = `${interactions} interações (ligações + site + rotas) em 90 dias. Engajamento alto.`; }
    else if (interactions >= 30) { engScore = 6; engDetail = `${interactions} interações em 90 dias. Engajamento médio.`; }
    else if (interactions >= 10) { engScore = 3; engDetail = `${interactions} interações em 90 dias. Engajamento baixo — melhore CTAs no perfil.`; }
    else { engScore = 1; engDetail = `${interactions} interações em 90 dias. Muito baixo — revise fotos, descrição e horários.`; }
    resolvedMetrics.push(
      metric("engagement", "Engajamento no Perfil",
        "Soma de cliques para ligar, visitas ao site e pedidos de rota nos últimos 90 dias. Mede se o perfil converte visualizações em ações reais.",
        engScore, 8, engDetail)
    );
  } else {
    resolvedMetrics.push({
      id: "visibility", label: "Visibilidade no Google",
      description: "Total de aparições no Google Search e Maps nos últimos 90 dias.",
      status: "indisponivel", score: 0, maxScore: 0,
      detail: "Dados de desempenho não disponíveis.",
    });
    resolvedMetrics.push({
      id: "engagement", label: "Engajamento no Perfil",
      description: "Ligações, cliques no site e pedidos de rota nos últimos 90 dias.",
      status: "indisponivel", score: 0, maxScore: 0,
      detail: "Dados de desempenho não disponíveis.",
    });
  }

  // ── VERIFICAÇÃO DO PERFIL — 8 pts ───────────────────────────────────────────
  if (gmb._meta?.verifAvailable && gmb._verif !== null) {
    const verifications = gmb._verif?.verifications ?? [];
    const completed = verifications.filter((v) => v.state === "COMPLETED");
    const pending = verifications.filter((v) => v.state === "PENDING");
    let verifScore = 0;
    let verifDetail = "Nenhuma verificação encontrada.";
    if (completed.length > 0) {
      verifScore = 8;
      verifDetail = `Perfil verificado (${completed[0].method ?? "método desconhecido"}). Google reconhece você como proprietário legítimo.`;
    } else if (pending.length > 0) {
      verifScore = 3;
      verifDetail = `Verificação em andamento (${pending[0].method ?? ""}). Aguarde a confirmação do Google.`;
    } else {
      verifScore = 0;
      verifDetail = "Perfil não verificado. A verificação é pré-requisito para editar o perfil e ganhar prioridade no ranking.";
    }
    resolvedMetrics.push(
      metric("verification", "Verificação do Perfil",
        "Perfis verificados têm prioridade no Local Pack. O Voice of Merchant indica ao Google que o perfil está sob controle do proprietário real.",
        verifScore, 8, verifDetail)
    );
  } else {
    resolvedMetrics.push({
      id: "verification", label: "Verificação do Perfil",
      description: "Status de verificação do perfil no Google.",
      status: "indisponivel", score: 0, maxScore: 0,
      detail: "API de verificação não disponível ou não habilitada no GCP.",
    });
  }

  // Recalcula score: só conta métricas verificáveis (maxScore > 0)
  // Métricas GMB substituem as aproximações da Places API (mesmos IDs)
  const replacedIds = new Set(resolvedMetrics.map((m) => m.id));
  const allMetrics = [...result.metrics.filter((m) => !replacedIds.has(m.id)), ...resolvedMetrics];
  const verifiableMax = allMetrics.reduce((s, m) => s + m.maxScore, 0);
  const earnedPoints = allMetrics.reduce((s, m) => s + m.score, 0);
  const overallScore = verifiableMax > 0 ? Math.round((earnedPoints / verifiableMax) * 100) : 0;

  const weakCount = allMetrics.filter((m) => m.status === "fraco").length;
  const fairCount = allMetrics.filter((m) => m.status === "razoavel").length;
  const goodCount = allMetrics.filter((m) => m.status === "bom").length;

  return {
    ...result,
    overallScore,
    availablePoints: verifiableMax,
    totalPossiblePoints: verifiableMax,
    metrics: allMetrics,
    pendingMetrics: [],
    weakCount,
    fairCount,
    goodCount,
  };
}
