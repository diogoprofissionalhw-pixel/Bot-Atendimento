# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
cp .env.example .env      # preencher com as chaves reais (nunca commitar .env)
npx vercel dev             # sobe front (Vite) + api/ juntos, como na Vercel
npm run dev                 # só o front — /api/chat e demais endpoints não respondem
npm run build                # tsc -b (só type-check de src/) && vite build
npm run preview
```

Não há lint nem test runner configurados neste projeto (sem `npm run lint`/`test` em `package.json`).

`tsc -b` só inclui `src/` (`tsconfig.json`: `"include": ["src"]`) — não faz type-check de `api/`. Para validar as Vercel Functions, use `npx vercel dev` ou `npx vercel build` localmente; `npm run build` sozinho não pega erros de tipo em `api/`.

Rode as migrations em `supabase/migrations/` (em ordem, `0001` → `0003`) no projeto Supabase antes de usar. Para testar localmente sem cadastrar domínio em `client_domains`, defina `DEV_CLIENT_ID` no `.env` — só ativa com `VERCEL_ENV=development` (nunca em deployments reais da Vercel, que só têm `production`/`preview`).

Para criar um usuário de staff (login do painel): `node --env-file=.env scripts/create-staff-user.mjs <email> <senha> <client_id>` — script local, não é endpoint, roda com a service role.

## Arquitetura

Central de Ajuda com chat de IA e canal "Reclame Aqui" (e-mail via EmailJS), mais um painel interno de Pendências/Aguardando aprovação. Multi-tenant desde o schema. Front (Vite/React) e backend (`api/`, Vercel Functions) sobem juntos no mesmo deploy da Vercel.

```
src/                 front-end (React + Vite + Tailwind)
  pages/CentralAjuda  FAQ + chat + Reclame Aqui (cliente final)
  pages/Painel        Pendências + Aguardando aprovação (equipe interna, autenticado)
  pages/Login          tela de login (Supabase Auth)
  components/RequireAuth  guard de rota + logout
api/                  Vercel Functions
  _lib/resolveClientId.ts  deriva client_id do Host da requisição
  _lib/ai.ts                chama o provedor de IA (pluggable)
  _lib/supabaseAdmin.ts     cliente com service role (ignora RLS)
  chat.ts, faq.ts, email-config.ts, conversations.ts, pending-items.ts
supabase/migrations/  schema multi-tenant com RLS por client_id
scripts/               scripts locais rodados manualmente com a service role
```

**Dois modelos de resolução de tenant, para dois fluxos diferentes** — é preciso entender os dois para mexer em qualquer endpoint ou no painel:

1. **Fluxo público (cliente final)**: `api/faq.ts`, `api/chat.ts`, `api/email-config.ts`, `api/conversations.ts`, `api/pending-items.ts` usam `supabaseAdmin` (service role, ignora RLS). `client_id` nunca vem do body/query — vem do `Host` da requisição via `resolveClientId()`, que consulta `client_domains` (domínio → `client_id`). Como esses endpoints ignoram RLS, cada query filtra `client_id` manualmente no servidor.
2. **Painel interno (staff)**: usa o cliente Supabase com *anon key* + sessão autenticada (`supabase.auth`). Não há filtro manual de `client_id` no front — o isolamento vem da RLS `tenant_isolation` (`0001_init.sql`), baseada no claim `app_metadata.client_id` do JWT (ver regra sobre filtro manual de `client_id` abaixo). Esse claim só pode ser setado pela service role (`scripts/create-staff-user.mjs`, via `auth.admin.createUser`), nunca pelo próprio usuário.

**Fluxo de decisão da IA** (`api/chat.ts`): a resposta do modelo vem com um `confidence` 0–1 junto; `confidence >= ai_confidence_threshold` (por cliente, em `config_per_client`) responde direto; `>= 0.4` vai para `awaiting_approval`; abaixo de `0.4` vira `pending_items`.

Provedor de IA é plugável via `AI_API_URL`/`AI_API_KEY`/`AI_MODEL` (qualquer API compatível com chat completions no formato OpenAI) — hoje OpenRouter, enquanto a integração com MiniMax M3 (da spec original) não está pronta.

EmailJS no Reclame Aqui nunca falsifica o "From": usa a caixa real do cliente conectada ao EmailJS, com o e-mail do usuário final como `reply_to`.

Histórico de correções relevante ao ler o código: `0002_public_access.sql` documenta policies públicas de RLS que existiram e foram removidas (isolamento multi-tenant quebrado); `api/_lib/resolveClientId.ts` documenta por que `client_id` nunca pode vir de input do cliente.

Integração com o site de destino (ex.: `telemed-link-up`) fica fora deste repositório — este projeto é o componente isolado, pensado para revenda.

## Regras do projeto

- Nunca commitar direto na `main`: sempre criar uma branch nova para qualquer mudança.
- Nunca commitar `.env`, tokens ou credenciais.
- Filtro manual por `client_id` depende do contexto — são dois casos opostos, não confundir:
  - Em `api/*` usando `supabaseAdmin` (service role): filtrar `client_id` no servidor é **obrigatório**. A service role ignora RLS, então sem esse filtro manual não há isolamento nenhum.
  - No front com sessão autenticada (Painel, cliente anon key): filtro manual de `client_id` é **proibido**. A RLS `tenant_isolation` já isola por `app_metadata.client_id` do JWT; adicionar `.eq("client_id", ...)` no front mascara a ausência de RLS em vez de reforçá-la, e cria a falsa impressão de que o isolamento está garantido no cliente.
- Autorização nunca deriva de dado enviado pelo cliente (body, query, header). O tenant vem do `Host` da requisição via `client_domains` (`api/_lib/resolveClientId.ts`).
- Chamar o subagente `security-auditor` antes de qualquer push que mexa em autenticação, RLS ou endpoints.
