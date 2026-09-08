# Regras do projeto

- Nunca commitar direto na `main`: sempre criar uma branch nova para qualquer mudança.
- Nunca commitar `.env`, tokens ou credenciais.
- A RLS é a única barreira de isolamento entre tenants. Nunca adicionar filtro manual por `client_id` no front "por segurança" — isso mascara a ausência de RLS em vez de reforçá-la, e cria a falsa impressão de que o isolamento está garantido no cliente.
- Autorização nunca deriva de dado enviado pelo cliente (body, query, header). O tenant vem do `Host` da requisição via `client_domains` (`api/_lib/resolveClientId.ts`).
- Chamar o subagente `security-auditor` antes de qualquer push que mexa em autenticação, RLS ou endpoints.
