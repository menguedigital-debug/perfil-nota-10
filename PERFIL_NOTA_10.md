# Perfil Nota 10 — Documentação do App

## O que é

Ferramenta de análise de perfil Google (Google Business Profile) criada pela Mengue Digital.  
Serve dois propósitos:

1. **Prospecção** — analisar o perfil de qualquer negócio (sem login) e mostrar ao prospect o que está errado no perfil dele
2. **Clientes** — análise completa para negócios vinculados à conta Google do usuário, com dados privados do GBP

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Auth | NextAuth v5 (beta) com Google OAuth 2.0 |
| Banco de dados | Supabase (PostgreSQL) |
| Estilo | Tailwind CSS |
| PDF | `@react-pdf/renderer` (server-side via API route) |
| Ícones | Lucide React |
| Porta local | 3001 |
| Diretório | `/Users/felipemengue/MengueDigital/Projetos/perfil-nota-10` |

---

## Variáveis de Ambiente (`.env.local`)

```env
NEXT_PUBLIC_GOOGLE_MAPS_KEY=     # Google Maps / Places API (frontend)
GOOGLE_PLACES_API_KEY=           # Google Places API (backend — mesma chave ou separada)
GOOGLE_CLIENT_ID=                # OAuth 2.0 Client ID (GCP)
GOOGLE_CLIENT_SECRET=            # OAuth 2.0 Client Secret (GCP)
AUTH_SECRET=                     # NextAuth secret (gerado com `npx auth secret`)
NEXT_PUBLIC_SUPABASE_URL=        # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Chave anon do Supabase
```

> ⚠️ A chave `NEXT_PUBLIC_GOOGLE_MAPS_KEY` está em modo de testes — precisa ser restringida/trocada antes de ir para produção.

---

## APIs do Google utilizadas

Todas precisam estar habilitadas no GCP no projeto correto:

| API | Para que serve |
|---|---|
| Places API (legacy) | Busca pública de qualquer negócio |
| My Business Business Information API | Categorias, descrição, serviços, atributos |
| My Business Reviews API | Avaliações e respostas |
| My Business Postings API | Posts/atualizações do perfil |
| My Business Verifications API | Status de verificação do perfil |
| Business Profile Performance API | Impressões, cliques, pedidos de rota (90 dias) |
| My Business Account Management API | Listar contas e locations vinculadas |
| Google My Business API v4 (legacy) | Fallback para reviews e posts quando API nova falha |

O OAuth solicita os seguintes scopes:
- `https://www.googleapis.com/auth/business.manage`

---

## Arquitetura de Análise

### Fluxo para negócio qualquer (sem acesso GBP)

```
Usuário busca "Nome do negócio"
  → GET /api/places?q=...
    → Google Places Text Search → Place Details
  → analyzePlace(place) → AnalysisResult
    → result.metrics: 8 métricas públicas (49 pts totais)
    → result.pendingMetrics: 7 métricas bloqueadas (51 pts)
```

### Fluxo para negócio do cliente (com acesso GBP)

```
analyzePlace() retorna resultado base
  → tryEnrichWithGmb()
    → Verifica se place_id bate com algum location da conta
    → GET /api/analyze-gmb?location=locations/XXXXX
      → 6 fetches paralelos (location, attributes, reviews, posts, perf, verifications)
    → enrichWithGmbData(result, gmbData)
      → Substitui métricas públicas pelas reais (mesmo ID)
      → Resolve pendingMetrics com dados GBP
      → result.pendingMetrics: [] (vazio)
```

---

## Métricas

### 8 métricas públicas (Places API) — total 49 pts

| ID | Label | Pts máx | Fonte de dados |
|---|---|---|---|
| `reviews_count` | Quantidade de Avaliações | 14 | `user_ratings_total` |
| `reviews_rating` | Nota Média | 10 | `rating` |
| `photos` | Fotos no Perfil | 10 | `photos[]` (máx 10 pela API pública) |
| `hours` | Horário de Funcionamento | 6 | `opening_hours.weekday_text` |
| `website` | Website | 5 | `website` |
| `phone` | Número de Telefone | 4 | `formatted_phone_number` |
| `category` | Categoria do Negócio | 15 | `types[]` (traduzido p/ PT-BR) |
| `description` | Descrição do Negócio | 7 | `editorial_summary.overview` |

### 7 métricas GBP (requerem acesso do proprietário) — total 51 pts

| ID | Label | Pts máx | Fonte de dados |
|---|---|---|---|
| `response_rate` | Taxa de Resposta às Avaliações | 8 | `_reviews.reviews[].reviewReply` |
| `services` | Serviços e Produtos | 8 | `serviceItems[]` |
| `attributes` | Atributos | 7 | `attributes[]` |
| `posts` | Posts e Atualizações | 6 | `_posts.localPosts[].updateTime` |
| `visibility` | Visibilidade no Google | 10 | Performance API (impressões 90d) |
| `engagement` | Engajamento no Perfil | 8 | Performance API (cliques 90d) |
| `verification` | Verificação do Perfil | 8 | Verifications API (`state: COMPLETED`) |

### Cálculo do Score

- **Sem login**: `(pontos_ganhos / 49) * 100` — normalizado sobre os pts disponíveis
- **Com login**: `(pontos_ganhos / 100) * 100` — sobre total real

### Status por métrica

- **Bom** (`bom`): score ≥ 80% do maxScore
- **Razoável** (`razoavel`): score ≥ 40%
- **Fraco** (`fraco`): score < 40%
- **Não verificado** (`unverified: true`): requer acesso GBP — aparece com `?` cinza no PDF

---

## Rotas de API

### `GET /api/places`

Parâmetros: `?q=texto` ou `?place_id=ChIJxxx`

Retorna dados da Places API (público, sem auth). Rate limit: 20 req/min por IP (em memória).

### `GET /api/analyze-gmb`

Parâmetro: `?location=locations/XXXXX` (nome canônico do GBP)

Requer sessão autenticada. Faz 6 fetches paralelos. Retorna:

```json
{
  "name": "...",
  "categories": { "primaryCategory": {...}, "additionalCategories": [...] },
  "profile": { "description": "..." },
  "serviceItems": [...],
  "attributes": [...],
  "_reviews": { "reviews": [...], "totalReviewCount": 0 },
  "_posts": { "localPosts": [...] },
  "_perf": { "multiDailyMetricTimeSeries": [...] },
  "_verif": { "verifications": [{ "state": "COMPLETED", "method": "..." }] },
  "_meta": {
    "reviewsAvailable": true,
    "postsAvailable": true,
    "perfAvailable": true,
    "verifAvailable": true
  }
}
```

**Fallbacks para reviews e posts:**
1. `mybusinessreviews.googleapis.com/v1/{locationName}/reviews`
2. `mybusinessreviews.googleapis.com/v1/{accountName}/locations/{locationId}/reviews`
3. `mybusiness.googleapis.com/v4/{accountName}/locations/{locationId}/reviews` (legacy v4)

### `GET /api/locations`

Lista todos os locations GBP vinculados à conta do usuário autenticado.

### `POST /api/report-pdf`

Body: `AnalysisResult` (JSON)

Gera o PDF via `renderToBuffer` (server-side) e retorna o arquivo.  
Usa `@react-pdf/renderer` com `serverExternalPackages` no `next.config.ts`.

### `GET /api/history` / `POST /api/history`

Histórico de análises salvas no Supabase. Requer sessão.

### `GET /api/clients` / `POST /api/clients`

CRM básico de clientes salvos. Requer sessão.

### `GET /api/posts`

Lista posts de todos os locations do usuário (para a página `/posts`).

---

## Componentes Principais

### `lib/analyzer.ts`

Engine de análise. Funções principais:

- `analyzePlace(place: PlaceDetails): AnalysisResult` — análise pública
- `enrichWithGmbData(result, gmb: GmbData): AnalysisResult` — enriquece com dados GBP
- `unverifiedMetric(id, label, description, maxScore)` — cria métrica "não verificada" para prospecção

### `app/page.tsx`

Página principal. Lógica:

1. Ao autenticar, carrega `locations` e `history`
2. Busca via form → `/api/places` → `analyzePlace()` → `tryEnrichWithGmb()`
3. Se location do resultado bate com `locations` da conta, enriquece automaticamente
4. Exibe ScoreCircle + BentoGrid de métricas + botão PDF

### `components/BentoMetric.tsx`

Card clicável para cada métrica. Expande ao clicar mostrando detalhe, pontuação e barra de progresso. Exibe badge "NÃO VERIF." para métricas `unverified: true`.

### `components/ScoreCircle.tsx`

Círculo SVG animado com o score numérico.

### `components/ReportPDF.tsx`

Documento PDF completo no estilo "Análise de Saúde":

- Header navy: logo "M", Mengue Digital, telefone, e-mail
- Velocímetro SVG tricolor (vermelho→amarelo→verde) com agulha no score
- Contadores Fraco / Razoável / Bom
- Linha por métrica: círculo de status (✓/!/✗/?), título, caixa colorida com descrição + detalhe, barra de progresso Fraco|Razoável|Bom com ponteiro percentual
- Métricas não verificadas: faixa cinza com "Não verificado — requer acesso ao GBP do proprietário"
- Rodapé fixo com branding e data

**Limitação de fontes:** Usa apenas Helvetica (built-in do react-pdf). Caracteres Unicode especiais como `▼` não são suportados — usar apenas ASCII.

### `components/PDFDownloadButton.tsx`

Botão que faz POST para `/api/report-pdf`, cria blob URL e dispara download.

---

## Fluxo de Autenticação (NextAuth v5)

```
auth.ts → Google OAuth
  scopes: openid, email, profile, business.manage
  callbacks:
    jwt: salva accessToken no token JWT
    session: expõe accessToken na session
```

A `session.accessToken` é usada em `/api/analyze-gmb`, `/api/locations`, `/api/posts`.

---

## Banco de Dados (Supabase)

Tabelas utilizadas (inferido do código):

- `analyses` — histórico de análises (`place_id`, `place_name`, `score`, `user_email`, `created_at`)
- `clients` — clientes salvos (`place_id`, `place_name`, `last_score`, `user_email`)

---

## Pendências / Melhorias futuras

1. **Prospecção completa** — métricas GBP para negócios não vinculados. Opções: Places API New (tem mais atributos), Outscraper/DataForSEO, scraping
2. **Substituir API Key pública** — `NEXT_PUBLIC_GOOGLE_MAPS_KEY` precisa ser restringida por domínio após fase de testes
3. **Fonte customizada no PDF** — registrar fonte com suporte a Unicode para usar ▼ e outros símbolos
4. **Paginação de locations** — usuários com muitos perfis podem ultrapassar o retorno padrão da API
5. **Cache de análises** — results poderiam ser cacheados por `place_id` para reduzir chamadas à Places API

---

## Comandos

```bash
cd /Users/felipemengue/MengueDigital/Projetos/perfil-nota-10

# Instalar dependências
npm install

# Rodar em desenvolvimento (porta 3001)
npm run dev

# Build de produção
npm run build

# Type check
npx tsc --noEmit --skipLibCheck
```

---

*Criado por Mengue Digital · menguedigital@gmail.com · (47) 98928-3137*
