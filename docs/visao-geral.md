# Perfil Nota 10 — Visão Geral do Sistema

## O que é

O **Perfil Nota 10** é um sistema SaaS de análise de perfis do Google Business Profile (Google Meu Negócio). Ele analisa a qualidade de um perfil GMB e atribui uma pontuação de 0 a 100, identificando pontos fortes e oportunidades de melhoria.

Referência de mercado: [GBPCheck.com](https://www.gbpcheck.com)

---

## Proposta de Valor

- Agências e profissionais de marketing digital podem usar para **auditar perfis de clientes**
- Donos de negócios podem verificar **onde estão perdendo visibilidade no Google**
- Base para oferta de serviço recorrente de otimização de GMB

---

## Stack Tecnológica

| Tecnologia | Função |
|------------|--------|
| Next.js 14 (App Router) | Framework principal |
| TypeScript | Linguagem |
| Tailwind CSS | Estilo |
| NextAuth v5 | Autenticação Google OAuth |
| Google Places API | Dados públicos de perfis GMB |
| Google Business Profile API | Dados completos (pendente aprovação) |
| Vercel | Hospedagem e deploy |
| GitHub | Controle de versão |
| Supabase | Banco de dados — Fase 2 (não implementado) |

---

## Arquitetura

```
perfil-nota-10/
├── app/
│   ├── page.tsx                    # Página principal
│   ├── layout.tsx                  # Layout com SessionProvider
│   └── api/
│       ├── places/route.ts         # Proxy para Google Places API
│       ├── locations/route.ts      # Perfis GMB do usuário autenticado
│       ├── analyze-gmb/route.ts    # Análise de perfil via Business Profile API
│       └── auth/[...nextauth]/     # Handlers NextAuth v5
├── components/
│   ├── ScoreCircle.tsx             # Círculo SVG com pontuação
│   └── MetricCard.tsx              # Card expansível de métrica
├── lib/
│   └── analyzer.ts                 # Motor de análise e pontuação
├── types/
│   └── next-auth.d.ts              # Extensão do tipo Session (accessToken)
├── docs/                           # Esta pasta
├── auth.ts                         # Configuração NextAuth v5
└── .env.local                      # Variáveis de ambiente (não versionado)
```

---

## Fluxo de Funcionamento

### Modo Público (sem login)
1. Usuário digita nome ou endereço do negócio
2. Sistema chama `/api/places` → Google Places Text Search API
3. Retorna o perfil mais relevante via Places Details API
4. `lib/analyzer.ts` calcula a pontuação com base nos dados recebidos
5. Interface exibe nota geral, resumo e detalhes por métrica

### Modo Autenticado (com login Google)
1. Usuário clica em "Entrar com Google"
2. NextAuth v5 inicia fluxo OAuth com escopo `business.manage`
3. Token de acesso é armazenado na sessão
4. Sistema chama `/api/locations` → Business Profile API
5. Lista os perfis GMB associados à conta do usuário
6. Usuário seleciona um perfil para análise completa via `/api/analyze-gmb`

---

## Status Atual

| Funcionalidade | Status |
|----------------|--------|
| Busca pública por nome/endereço | ✅ Funcionando |
| Análise com 11 métricas (Places API) | ✅ Funcionando |
| Login com Google (OAuth) | ✅ Funcionando |
| Listagem de perfis GMB do usuário | ⏳ Aguardando aprovação da API |
| Análise completa com 12 métricas | ⏳ Aguardando aprovação da API |
| Histórico de análises (Supabase) | 🔲 Fase 2 |
| Multi-clientes / assinaturas | 🔲 Fase 2 |

---

## Limitação Atual

O sistema usa a **Google Places API** (dados públicos), que fornece informações limitadas. A análise completa requer a **Business Profile API**, cujo acesso foi solicitado ao Google (caso **0-4560000041606**) e está em análise (prazo: 7–10 dias úteis a partir de 16/06/2026).

Veja detalhes em: [criterios-avaliacao.md](./criterios-avaliacao.md)
