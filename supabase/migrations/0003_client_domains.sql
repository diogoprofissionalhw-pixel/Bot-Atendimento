-- Mapa domínio -> client_id. O backend deriva o tenant a partir do Host da
-- requisição (nunca de um client_id enviado pelo front) para consultar essa
-- tabela; ver api/_lib/resolveClientId.ts.
--
-- Sem policies: só é lida pela service role dentro das Vercel Functions,
-- então RLS habilitada e sem nenhuma policy já nega acesso a anon/authenticated.

create table client_domains (
  domain text primary key,
  client_id uuid not null references clients(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index on client_domains (client_id);

alter table client_domains enable row level security;

-- resolveClientId sempre consulta com o Host em minusculas; normaliza aqui
-- para que um domain cadastrado com case diferente nao cause 404 permanente.
create or replace function client_domains_normalize_domain()
returns trigger as $$
begin
  new.domain = lower(new.domain);
  return new;
end;
$$ language plpgsql;

create trigger client_domains_normalize_domain
  before insert or update on client_domains
  for each row execute function client_domains_normalize_domain();
