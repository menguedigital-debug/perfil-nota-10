# Deploy e Infraestrutura

## Ambientes

| Ambiente | URL | Branch |
|----------|-----|--------|
| Produção | https://perfil-nota-10.vercel.app | main |
| Local | http://localhost:3000 | qualquer |

---

## Repositório GitHub

- **Conta:** menguedigital-debug
- **Repositório:** perfil-nota-10
- **URL:** https://github.com/menguedigital-debug/perfil-nota-10

---

## Vercel

- **Time:** menguedigital-2196s-projects
- **Projeto:** perfil-nota-10
- **Painel:** https://vercel.com/menguedigital-2196s-projects/perfil-nota-10

---

## Comandos de Deploy

### Desenvolvimento local
```bash
cd perfil-nota-10
npm run dev
# Acesse http://localhost:3000
```

### Deploy para produção (Vercel CLI)
```bash
cd perfil-nota-10
npx vercel --prod
```

### Verificar variáveis de ambiente no Vercel
```bash
npx vercel env ls
```

### Adicionar variável de ambiente
```bash
npx vercel env add NOME_DA_VARIAVEL production
```

---

## Build e Verificações

### Antes de fazer deploy
```bash
npm run build       # Verificar se o build passa
npm run lint        # Verificar erros de lint
npm run typecheck   # Verificar tipos TypeScript (se configurado)
```

### Estrutura de rotas geradas no build
```
Route (app)
├── /                        # Página principal (estática)
├── /_not-found              # Página 404 (estática)
├── /api/analyze-gmb         # API dinâmica
├── /api/auth/[...nextauth]  # Auth handlers
├── /api/locations           # API dinâmica
└── /api/places              # API dinâmica
```

---

## APIs Externas Utilizadas

### Google Places API (ativa)
- **Endpoint Text Search:** `https://maps.googleapis.com/maps/api/place/textsearch/json`
- **Endpoint Place Details:** `https://maps.googleapis.com/maps/api/place/details/json`
- **Chave:** `GOOGLE_PLACES_API_KEY` (server-side, nunca exposta ao cliente)
- **Custo:** $17/1.000 buscas (Text Search) + $17/1.000 (Details)
- **Projeto GCP:** perfil-nota-10

### Google Business Profile API (pendente aprovação)
- **Accounts:** `https://mybusinessaccountmanagement.googleapis.com/v1/accounts`
- **Locations:** `https://mybusinessbusinessinformation.googleapis.com/v1/{account}/locations`
- **Autenticação:** OAuth 2.0 com token do usuário (`session.accessToken`)
- **Caso de aprovação:** 0-4560000041606
- **Prazo estimado:** 7–10 dias úteis a partir de 16/06/2026

---

## Histórico de Deploys

| Data | Versão | Observação |
|------|--------|------------|
| 16/06/2026 | 0.1 | Deploy inicial — Places API + OAuth |
