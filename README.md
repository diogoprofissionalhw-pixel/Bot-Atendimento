# Bot de Atendimento

Central de Ajuda com chat de IA e canal "Reclame Aqui" (e-mail via EmailJS),
com painel interno de Pendências e Aguardando aprovação. Arquitetura multi-tenant.

O provedor de IA é plugável via `AI_API_URL`/`AI_API_KEY`/`AI_MODEL` (qualquer
API compatível com o formato OpenAI de chat completions). Hoje está
configurado para OpenRouter enquanto a integração com a MiniMax M3 (prevista
na spec original) não está pronta — trocar de provedor não exige mudar código.

## Estrutura

```
src/                 front-end (React + Vite + Tailwind)
  pages/CentralAjuda  FAQ + chat + Reclame Aqui (o que o cliente final vê)
  pages/Painel        Pendências + Aguardando aprovação (equipe interna)
api/                  Vercel Functions — proxy da API de IA e regras de decisão
supabase/migrations/  schema multi-tenant com RLS por client_id
```

Publicado na Vercel: o front (Vite) e o backend (`api/chat.ts`, uma Vercel
Function) sobem juntos no mesmo deploy.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencher com suas chaves
npx vercel dev          # sobe front + api/ juntos, como na Vercel
```

(`npm run dev` também funciona para só o front, mas aí `/api/chat` não responde
localmente — use `vercel dev` para testar o fluxo completo.)

Rode a migration `supabase/migrations/0001_init.sql` no seu projeto Supabase antes de usar.

## Decisões já tomadas (ver histórico da conversa)

- **Multi-tenant desde o início**: tabelas com `client_id` + RLS via claim
  `app_metadata.client_id` do JWT. `config_per_client` guarda config de IA,
  EmailJS e branding por cliente.
- **EmailJS via Reply-To**: o formulário de Reclame Aqui nunca falsifica o
  "From" — usa a caixa real do cliente conectada ao EmailJS, com o e-mail do
  usuário final como `reply_to`.
- **Credencial da IA no backend**: a chave do provedor de IA fica só na
  Vercel Function (`api/chat.ts`), nunca no bundle do front (resolve CORS e
  vazamento de credencial).
- **RLS com policies separadas para visitante anônimo e staff logado**
  (`0002_public_access.sql`): FAQ, config de e-mail e abertura de
  conversas/pendências são públicas; `messages`, `awaiting_approval` e
  `staff_users` exigem JWT autenticado com `client_id`.
- **Critério de confiança objetivo**: o modelo retorna um score 0–1 junto da
  resposta; acima do `ai_confidence_threshold` do cliente responde direto,
  entre esse valor e 0.4 vai para aprovação, abaixo de 0.4 vira pendência.

## Em aberto (não implementado ainda)

- **Autenticação do painel interno** (`/painel` está sem guard de auth agora).
  Precisa de Supabase Auth com claim `client_id` no `app_metadata` do usuário.
- **Recebimento de e-mail de entrada** (webhook/IMAP) — hoje o canal de
  e-mail só cobre o envio via Reclame Aqui, não a leitura de respostas por
  e-mail do cliente.
- **Seed inicial da `knowledge_base`** por cliente.
- Integração com o site de destino (ex: `telemed-link-up`) fica fora deste
  repositório — este projeto é o componente isolado, pensado para revenda.
