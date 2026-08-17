-- Libera acesso público (anônimo) ao que o cliente final da Central de Ajuda
-- precisa ler/gravar sem login: FAQ, config de e-mail, e abertura de
-- conversas/pendências. O painel interno (staff) continua restrito pela
-- policy tenant_isolation já existente, que exige JWT autenticado.

create policy public_read_knowledge_base on knowledge_base
  for select
  using (true);

create policy public_read_email_config on config_per_client
  for select
  using (true);

create policy public_insert_conversations on conversations
  for insert
  with check (true);

create policy public_insert_pending_items on pending_items
  for insert
  with check (true);
