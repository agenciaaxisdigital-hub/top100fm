-- =============================================================
-- TOP100 FM — Schema completo do banco de dados
-- Execute este SQL no SQL Editor do novo projeto Supabase
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. PROMOÇÕES
-- ─────────────────────────────────────────────
create table if not exists promotions (
  id                      uuid primary key default gen_random_uuid(),
  title                   text not null,
  description             text,
  image_url               text,
  link                    text,
  is_active               boolean default true,
  show_as_popup           boolean default false,
  popup_duration_seconds  integer,
  display_order           integer,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 2. NOTÍCIAS
-- ─────────────────────────────────────────────
create table if not exists news (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  summary        text,
  content        text,
  image_url      text,
  podcast_link   text,
  is_published   boolean default false,
  is_pinned      boolean default false,
  pinned_at      timestamptz,
  display_order  integer,
  -- campos para notícias automáticas via RSS
  auto_generated boolean default false,
  source_url     text unique,   -- evita duplicatas na ingestão automática
  source_name    text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 3. PROGRAMAÇÃO
-- ─────────────────────────────────────────────
create table if not exists programacao (
  id            uuid primary key default gen_random_uuid(),
  day_of_week   integer not null check (day_of_week between 0 and 6),
  program_name  text not null,
  presenter     text,
  start_time    text not null,  -- formato HH:MM
  end_time      text not null,  -- formato HH:MM
  is_active     boolean default true,
  display_order integer,
  flyer_url     text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 4. PODCASTS
-- ─────────────────────────────────────────────
create table if not exists podcasts (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  youtube_url    text not null,
  thumbnail_url  text,
  is_active      boolean default true,
  display_order  integer,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 5. USUÁRIOS ADMIN
-- ─────────────────────────────────────────────
create table if not exists admin_users (
  id             uuid primary key default gen_random_uuid(),
  username       text not null unique,
  password_hash  text not null,
  created_at     timestamptz default now()
);

-- ─────────────────────────────────────────────
-- 6. INSCRIÇÕES EM PROMOÇÕES
-- ─────────────────────────────────────────────
create table if not exists promotion_entries (
  id            uuid primary key default gen_random_uuid(),
  promotion_id  uuid not null references promotions(id) on delete cascade,
  full_name     text not null,
  whatsapp      text not null,
  cpf           text not null,
  instagram     text not null,
  facebook      text,
  birth_date    date,
  created_at    timestamptz default now(),
  -- uma pessoa só pode se inscrever uma vez por promoção
  unique (promotion_id, cpf)
);

-- ─────────────────────────────────────────────
-- 7. CONFIGURAÇÕES DO SITE
-- ─────────────────────────────────────────────
create table if not exists site_settings (
  setting_key    text primary key,
  setting_value  text not null,
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────────
-- FUNÇÕES PARA O ADMIN (senha com bcrypt)
-- ─────────────────────────────────────────────

-- Habilita extensão pgcrypto (necessária para crypt/gen_salt)
create extension if not exists pgcrypto;

-- Cria usuário admin com senha hasheada
create or replace function admin_create_user(p_username text, p_password text)
returns void
language plpgsql
security definer
as $$
begin
  insert into admin_users (username, password_hash)
  values (p_username, crypt(p_password, gen_salt('bf', 10)));
end;
$$;

-- Verifica login do admin
create or replace function admin_check_password(p_username text, p_password text)
returns table(id uuid, username text)
language plpgsql
security definer
as $$
begin
  return query
  select u.id, u.username
  from admin_users u
  where lower(u.username) = lower(p_username)
    and u.password_hash = crypt(p_password, u.password_hash);
end;
$$;

-- ─────────────────────────────────────────────
-- RLS — Row Level Security
-- ─────────────────────────────────────────────

-- Habilita RLS em todas as tabelas
alter table promotions         enable row level security;
alter table news               enable row level security;
alter table programacao        enable row level security;
alter table podcasts           enable row level security;
alter table admin_users        enable row level security;
alter table promotion_entries  enable row level security;
alter table site_settings      enable row level security;

-- LEITURA PÚBLICA (anon key pode ler registros publicados/ativos)
create policy "public_read_promotions"
  on promotions for select
  using (is_active = true);

create policy "public_read_news"
  on news for select
  using (is_published = true);

create policy "public_read_programacao"
  on programacao for select
  using (is_active = true);

create policy "public_read_podcasts"
  on podcasts for select
  using (is_active = true);

create policy "public_read_site_settings"
  on site_settings for select
  using (true);

-- Qualquer um pode se inscrever em promoções
create policy "public_insert_promotion_entries"
  on promotion_entries for insert
  with check (true);

-- SERVICE ROLE tem acesso total (ignora RLS automaticamente)
-- Nenhuma policy adicional necessária para service_role

-- ─────────────────────────────────────────────
-- STORAGE — bucket "media" para upload de imagens
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Permite upload pelo service_role (admin)
create policy "admin_upload_media"
  on storage.objects for insert
  with check (bucket_id = 'media');

create policy "admin_update_media"
  on storage.objects for update
  using (bucket_id = 'media');

create policy "admin_delete_media"
  on storage.objects for delete
  using (bucket_id = 'media');

-- Leitura pública das imagens
create policy "public_read_media"
  on storage.objects for select
  using (bucket_id = 'media');

-- ─────────────────────────────────────────────
-- CONFIGURAÇÕES PADRÃO DO SITE
-- ─────────────────────────────────────────────
insert into site_settings (setting_key, setting_value) values
  ('radio_name',        '"TOP100 FM"'),
  ('radio_slogan',      '"A Rádio do Brasil"'),
  ('radio_description', '"TOP100 FM - A melhor programação do rádio brasileiro."'),
  ('stream_url',        '"https://stream.zeno.fm/seu-stream"'),
  ('auto_news_enabled', 'false'),
  ('live_active',       'false'),
  ('popup_enabled',     'false'),
  ('popup_frequency',   '"once_per_session"'),
  ('popup_delay',       '3'),
  ('popup_position',    '"center"')
on conflict (setting_key) do nothing;
