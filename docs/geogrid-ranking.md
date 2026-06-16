# Geo-Grid Ranking — Pesquisa e Especificação

**Status:** Documentado — implementação prevista na Fase 2  
**Data da pesquisa:** Junho 2026

---

## O que é

O geo-grid de ranking exibe um mapa com uma grade de pontos ao redor do negócio. Em cada ponto, o sistema faz uma busca no Google e verifica em que posição o negócio aparece. O resultado é um mapa de calor mostrando o "alcance" do negócio no Google Maps.

Ferramentas que implementam: Local Falcon (pioneiro), GBPCheck, BrightLocal, Whitespark.

---

## O Google define um raio oficial por categoria?

**Não.** O Google documenta os três fatores do algoritmo local — **proximidade, relevância e destaque (prominence)** — sem nunca revelar thresholds de distância por categoria.

O que se sabe:
- A Places API Nearby Search tem raio máximo técnico de 50.000m, mas esse é o limite da API, não o comportamento do Local Pack
- O Google confirmou que buscas como "coffee" têm intent hiperlocal de bairro, enquanto "sports stadium" tem raio regional — sem quantificar em km
- Proximidade representa aproximadamente 55% do peso dos fatores de ranking local (Whitespark 2026)

**Todos os dados de raio neste documento são inferências baseadas em comportamento observado, não parâmetros oficiais.**

---

## Fator mais importante: densidade urbana

O raio de competição é determinado principalmente pela **densidade de concorrentes na área**, não pela categoria em si.

Estudo Rankings.io com 1.000 escritórios de advocacia nas 50 maiores cidades dos EUA:
- Em cidades densas (Boston, LA, NYC): 80%+ saíam do top 20 antes de 3 milhas (4,8 km)
- Em cidades menos densas (Columbus, Pittsburgh): apenas 26–28% tinham saído no mesmo raio

**Conclusão:** o mesmo tipo de negócio compete em raios muito diferentes dependendo da cidade. No Brasil, uma barbearia em São Paulo capital compete em ~500m; a mesma barbearia em Itajaí pode competir em 3–5 km.

---

## Estimativas de Raio por Categoria

Baseado em: comportamento do consumidor (Access Development n=2.131, Upside), dados de ranking (Rankings.io), recomendações de ferramentas (Local Falcon, Robben Media).

| Grupo | Categorias | Raio urbano | Raio suburbano | Raio rural |
|-------|-----------|-------------|----------------|------------|
| **Hiperlocal** | Restaurante, café, lanchonete, farmácia, padaria, mercadinho | 0,5–3 km | 3–6 km | 5–10 km |
| **Local** | Salão de beleza, barbearia, academia, loja de roupa/calçados, supermercado | 2–5 km | 5–10 km | 8–15 km |
| **Especializado** | Clínica médica, dentista, advogado, contador, escola | 5–10 km | 10–16 km | 15–25 km |
| **Destino** | Hotel, pousada, concessionária, hospital, shopping | 8–20 km | 15–35 km | 30–60 km |
| **Oficina mecânica** | Mecânica, funilaria, borracharia | 3–6 km | 6–12 km | 10–20 km |

**Dados de distância média de viagem do consumidor:**
- Restaurante: mediana 2,2 km (Upside, EUA)
- Supermercado: mediana 6,1 km (Upside, EUA)
- Farmácia/combustível: ~1,5–2 km (Access Development)
- Roupas/calçados: ~8–12 km (Access Development)
- Saúde (clínicas): ~10–16 km (NIH Travel Study — inclui hospitais e especialistas)
- Concessionária: mediana 8,3 km, até 30 km (Texas Dealer Study)

**Nota sobre dados brasileiros:** todos os estudos de distância disponíveis são americanos. No Brasil, com maior densidade urbana nas metrópoles e mais uso de transporte público, os raios tendem a ser menores nas capitais.

---

## Configurações de Grade Recomendadas

### Padrão do Local Falcon (referência de mercado)

| Tipo de área | Grade | Espaçamento | Cobertura total |
|-------------|-------|-------------|----------------|
| Urbana densa | 9×9 ou 11×11 | 250–500m | 2–5 km de raio |
| Suburbana | 9×9 ou 11×11 | 500m–1km | 4–10 km de raio |
| Rural | 7×7 ou 9×9 | 1–2 km | 6–16 km de raio |

**Grade padrão do Local Falcon:** 11×11

### Configurações por categoria para o Perfil Nota 10

| Grupo | Grade sugerida | Espaçamento | Cobertura |
|-------|---------------|-------------|-----------|
| Hiperlocal | 9×9 | 250–500m | ~2–4 km raio |
| Local | 7×7 | 500–700m | ~2–4 km raio |
| Especializado | 9×9 | 1–1,5 km | ~8–12 km raio |
| Destino | 11×11 | 2–3 km | ~16–24 km raio |

### Regra de calibração (Local Falcon Knowledge Base)

> "Os pins da borda externa da grade devem estar em posição 20 ou pior. Se a maioria dos pins da borda está verde (top 10), o raio está pequeno demais e o usuário não está vendo onde sua visibilidade termina."

---

## Custo por Scan

Cada ponto da grade = 1 chamada à Places API (Nearby Search).

| Grade | Pontos | Custo estimado (Places API) |
|-------|--------|----------------------------|
| 5×5 | 25 | ~$0,43 |
| 7×7 | 49 | ~$0,83 |
| 9×9 | 81 | ~$1,38 |
| 11×11 | 121 | ~$2,06 |
| 13×13 | 169 | ~$2,87 |

*Baseado em $17/1.000 chamadas (Places API Nearby Search, junho 2026)*

---

## Modelo de Créditos

O custo variável por scan inviabiliza oferta ilimitada em plano fixo. Modelo de mercado (GBPCheck, Local Falcon):

- Créditos inclusos por plano mensal
- Recarga de créditos quando esgotados
- 1 scan = X créditos (proporcional ao tamanho da grade)

### Sugestão de precificação de créditos

| Scan | Grade | Créditos consumidos |
|------|-------|---------------------|
| Básico | 7×7 | 5 créditos |
| Padrão | 9×9 | 8 créditos |
| Completo | 11×11 | 12 créditos |
| Premium | 13×13 | 17 créditos |

---

## Implementação Técnica (Fase 2)

### Fluxo

1. Usuário define: negócio + palavra-chave + configurações da grade
2. Sistema calcula os pontos lat/lng da grade ao redor do negócio
3. Para cada ponto, chama Places API Nearby Search com a palavra-chave
4. Verifica a posição do negócio nos resultados (1–20) ou "não encontrado" (20+)
5. Renderiza o mapa com cores por posição

### Paleta de cores (padrão de mercado)

| Posição | Cor | Significado |
|---------|-----|-------------|
| 1–3 | Verde escuro | Excelente |
| 4–7 | Verde claro | Bom |
| 8–10 | Amarelo | Regular |
| 11–15 | Laranja | Fraco |
| 16–20 | Vermelho claro | Muito fraco |
| 20+ | Vermelho escuro | Fora do mapa |

### Dependências para implementar

- Supabase: controle de créditos por usuário
- Stripe: recarga de créditos
- Google Maps JavaScript API: renderização do mapa
- Places API Nearby Search: busca por ponto da grade
- Fila de jobs (Redis ou similar): processar 49–169 chamadas assíncronas

---

## Fontes

- [Local Falcon — How To Choose Scan Settings](https://www.localfalcon.com/knowledge-base/kb52-how-to-choose-scan-settings)
- [Local Falcon — Best Practices for Local Rank Tracking](https://www.localfalcon.com/blog/a-brief-guide-to-best-practices-for-local-rank-tracking)
- [Rankings.io — How Proximity Affects Rankings in Local Search Results](https://rankings.io/blog/proximity-local-seo/)
- [BrightLocal — Local Business Travel Times Research](https://www.brightlocal.com/research/local-business-travel-times/)
- [BrightLocal — Geo Grid Ranking Tools Compared](https://www.brightlocal.com/resources/geo-grid-ranking-tool-comparison-guide/)
- [Upside — How Far Will Grocery Customers Travel](https://www.upside.com/business/retailer-blog/how-far-will-grocery-customers-travel)
- [Access Development — How Far Will Consumers Travel](https://blog.accessdevelopment.com/research-how-far-will-consumers-travel-to-make-routine-purchases)
- [Whitespark — Local Search Ranking Factors 2026](https://whitespark.ca/local-search-ranking-factors/)
- [Robben Media — Grid Rank Tracking Complete Guide](https://robbenmedia.com/grid-rank-tracking-google-maps-complete-guide-to-local-seo-success/)
- [Google Developers — Places API Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
