-- Execute este arquivo no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  family_id uuid references public.families(id) on delete set null,
  drawn boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tabela secreta: nunca disponibilizar via API pública ou painel.
create table if not exists public.draws (
  giver_id uuid primary key references public.participants(id) on delete cascade,
  receiver_id uuid not null unique references public.participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint no_self_draw check (giver_id <> receiver_id)
);

alter table public.families enable row level security;
alter table public.participants enable row level security;
alter table public.draws enable row level security;

-- A aplicação acessa as tabelas exclusivamente pelo servidor usando a service_role key.
-- Não crie políticas públicas para essas tabelas.
revoke all on public.families from anon, authenticated;
revoke all on public.participants from anon, authenticated;
revoke all on public.draws from anon, authenticated;

-- Índices úteis
create index if not exists participants_family_id_idx on public.participants(family_id);


-- Bucket público para exibição das fotos dos participantes.
-- O envio dos arquivos continua protegido pela rota administrativa da aplicação.
insert into storage.buckets (id, name, public)
values ('participant-photos', 'participant-photos', true)
on conflict (id) do update set public = true;
