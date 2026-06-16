# Roadmap — Perfil Nota 10

## Fase 1 — MVP (concluída em 16/06/2026)

- [x] Projeto Next.js 14 criado e configurado
- [x] Integração com Google Places API
- [x] Motor de análise com pontuação (lib/analyzer.ts)
- [x] Interface de busca e resultados
- [x] Componentes ScoreCircle e MetricCard
- [x] Login com Google (NextAuth v5)
- [x] Escopo OAuth para business.manage
- [x] Deploy na Vercel
- [x] Variáveis de ambiente configuradas em produção
- [x] OAuth redirect URIs configuradas para produção
- [x] Documentação do sistema (esta pasta)
- [x] Critérios de avaliação pesquisados e documentados com fontes

---

## Fase 1.5 — Business Profile API (bloqueada)

**Dependência:** Aprovação do Google (caso 0-4560000041606)  
**Lembrete agendado:** 19/06/2026

- [ ] Implementar critérios de avaliação fundamentados (ver criterios-avaliacao.md)
- [ ] Listagem de perfis GMB do usuário autenticado
- [ ] Análise de descrição do negócio (750 chars)
- [ ] Taxa de resposta às avaliações
- [ ] Listagem de serviços e produtos
- [ ] Atributos do negócio
- [ ] Posts e frequência de publicação
- [ ] Contagem real de fotos (sem limite de 10)
- [ ] Categoria real do negócio (não classificação automática do Google)
- [ ] Recência das avaliações como subcritério
- [ ] Pontuação ponderada por importância (substituir sistema linear atual)

---

## Fase 2 — Produto Comercial

- [ ] Supabase: banco de dados para histórico de análises
- [ ] Histórico de análises por usuário
- [ ] Comparativo de evolução do perfil ao longo do tempo
- [ ] Multi-clientes: agência gerencia vários perfis
- [ ] Sistema de assinaturas (Stripe ou similar)
- [ ] Planos: Free (análise pública), Pro (análise completa), Agency (multi-clientes)
- [ ] Relatórios em PDF exportáveis
- [ ] Alertas por e-mail quando perfil sofre queda de pontuação
- [ ] Comparativo com concorrentes (mesma categoria + cidade)

---

## Débitos Técnicos

| Item | Prioridade | Observação |
|------|-----------|------------|
| Trocar API Key do Google por chave restrita por domínio | Alta | Chave atual foi compartilhada em chat |
| Implementar critérios de avaliação corretos (criterios-avaliacao.md) | Alta | Sistema atual usa estimativas |
| Remover ou marcar métrica "Categoria" como limitada | Média | Usando classificação automática, não categoria real |
| Adicionar testes automatizados | Média | Nenhum teste implementado |
| Rate limiting nas APIs | Média | Qualquer um pode fazer buscas ilimitadas |
| Conectar GitHub ao Vercel via OAuth | Baixa | Deploy via CLI como alternativa |
