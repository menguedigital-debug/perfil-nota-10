# Variáveis de Ambiente

## Arquivo `.env.local` (desenvolvimento local)

```env
# Google Places API — dados públicos de perfis GMB
GOOGLE_PLACES_API_KEY=sua_chave_aqui

# Google Maps — exibição de mapa no frontend (pode ser a mesma chave)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=sua_chave_aqui

# Google OAuth — credenciais do OAuth Client ID (GCP Console)
AUTH_GOOGLE_ID=seu_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=seu_client_secret

# NextAuth — chave secreta para assinar tokens JWT
AUTH_SECRET=string_aleatoria_segura_min_32_chars

# URL base do app (muda conforme ambiente)
NEXTAUTH_URL=http://localhost:3000

# Supabase — Fase 2 (deixar em branco por enquanto)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Variáveis no Vercel (produção)

Configuradas via Vercel CLI ou painel em vercel.com → Project → Settings → Environment Variables.

| Variável | Valor em produção |
|----------|------------------|
| `GOOGLE_PLACES_API_KEY` | Chave restrita por domínio |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Chave restrita por domínio |
| `AUTH_GOOGLE_ID` | Mesmo do GCP |
| `AUTH_GOOGLE_SECRET` | Mesmo do GCP |
| `AUTH_SECRET` | String segura (diferente do local) |
| `NEXTAUTH_URL` | `https://perfil-nota-10.vercel.app` |

---

## Como adicionar variáveis no Vercel via CLI

```bash
cd perfil-nota-10
npx vercel env add NOME_DA_VARIAVEL production
# Cola o valor quando solicitado
```

Após adicionar todas as variáveis, fazer redeploy:

```bash
npx vercel --prod
```

---

## ⚠️ Segurança

- **Nunca commitar o `.env.local`** no Git (já está no `.gitignore`)
- A chave atual da Google API (`AIzaSyD0...`) foi compartilhada em chat — **substituir por chave com restrição de domínio após testes**
- O `AUTH_SECRET` em produção deve ser diferente do local e ter no mínimo 32 caracteres aleatórios
- Variáveis prefixadas com `NEXT_PUBLIC_` ficam **expostas no frontend** — usar apenas para chaves que podem ser públicas

---

## Google Cloud Console — Configuração OAuth

**Projeto:** perfil-nota-10 (número: 807492932878)

**URIs de redirecionamento autorizados:**
```
http://localhost:3000/api/auth/callback/google
https://perfil-nota-10.vercel.app/api/auth/callback/google
```

**Origens JavaScript autorizadas:**
```
http://localhost:3000
https://perfil-nota-10.vercel.app
```

**Escopo OAuth solicitado:**
```
openid
email
profile
https://www.googleapis.com/auth/business.manage
```
