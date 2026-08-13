-- Bot de Atendimento: schema inicial multi-tenant

create extension if not exists pgcrypto;

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  status text not null default 'active', -- active | suspended | trial
  created_at timestamptz not null default now()
);

create table config_per_client (
  client_id uuid primary key references clients(id) on delete cascade,
  minimax_model_cfg jsonb not null default '{}'::jsonb, -- prompt/persona, params
  ai_confidence_threshold numeric not null default 0.75,
  emailjs_service_id text,
  emailjs_template_id text,
  emailjs_public_key text,
  emailjs_reply_to_email text,
  branding jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table staff_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  auth_user_id uuid not null unique, -- fk lógico para auth.users do Supabase
  email text not null,
  role text not null default 'atendente', -- admin | atendente
  created_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  channel text not null, -- 'chat' | 'email'
  customer_ref text,
  status text not null default 'open', -- open | closed
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  sender text not null, -- 'customer' | 'ai' | 'staff'
  body text not null,
  ai_confidence numeric,
  created_at timestamptz not null default now()
);

create table pending_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  question text not null,
  status text not null default 'open', -- open | answered
  answered_by uuid references staff_users(id),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create table awaiting_approval (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  ai_suggestion text not null,
  ai_confidence numeric,
  status text not null default 'pending', -- pending | approved | edited | rejected
  reviewed_by uuid references staff_users(id),
  final_response text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table knowledge_base (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  question text not null,
  answer text not null,
  source text not null default 'seed', -- seed | from_pending_item | from_approval
  created_at timestamptz not null default now()
);

-- Índices para consultas por tenant
create index on config_per_client (client_id);
create index on staff_users (client_id);
create index on conversations (client_id);
create index on messages (client_id);
create index on messages (conversation_id);
create index on pending_items (client_id, status);
create index on awaiting_approval (client_id, status);
create index on knowledge_base (client_id);

-- RLS: isolamento por tenant via claim JWT app_metadata.client_id
alter table config_per_client enable row level security;
alter table staff_users enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table pending_items enable row level security;
alter table awaiting_approval enable row level security;
alter table knowledge_base enable row level security;

create or replace function current_client_id() returns uuid
language sql stable as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'client_id', '')::uuid
$$;

create policy tenant_isolation on config_per_client
  using (client_id = current_client_id());
create policy tenant_isolation on staff_users
  using (client_id = current_client_id());
create policy tenant_isolation on conversations
  using (client_id = current_client_id());
create policy tenant_isolation on messages
  using (client_id = current_client_id());
create policy tenant_isolation on pending_items
  using (client_id = current_client_id());
create policy tenant_isolation on awaiting_approval
  using (client_id = current_client_id());
create policy tenant_isolation on knowledge_base
  using (client_id = current_client_id());
