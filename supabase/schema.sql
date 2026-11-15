-- ============================================================================
-- Dompetku — Skema database (Supabase / PostgreSQL)
-- ----------------------------------------------------------------------------
-- Cara pakai:
--   1. Buka project Supabase → menu "SQL Editor" → "New query".
--   2. Tempel seluruh isi file ini, lalu klik "Run".
--   3. Aman dijalankan ulang (menggunakan IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- Semua tabel memakai prefix "dompetku_" agar tidak bentrok dengan tabel lain
-- di project yang sama. Setiap baris terikat ke auth.uid() lewat Row Level
-- Security, jadi satu user tidak akan pernah bisa membaca data user lain.
-- ============================================================================

-- ============================ TABEL =========================================

create table if not exists public.dompetku_profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  name          text        not null default 'Sahabat',
  hide_balances boolean     not null default false,
  updated_at    timestamptz not null default now()
);

create table if not exists public.dompetku_wallets (
  user_id         uuid        not null references auth.users (id) on delete cascade,
  id              text        not null,
  name            text        not null,
  kind            text        not null check (kind in ('cash', 'bank', 'ewallet', 'credit', 'investment')),
  color           text        not null default '#10b981',
  initial_balance bigint      not null default 0,
  updated_at      timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.dompetku_categories (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  id         text        not null,
  name       text        not null,
  icon       text        not null default 'Shapes',
  color      text        not null default '#94a3b8',
  type       text        not null check (type in ('income', 'expense')),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.dompetku_transactions (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  id           text        not null,
  type         text        not null check (type in ('income', 'expense', 'transfer')),
  amount       bigint      not null check (amount >= 0),
  date         date        not null,
  wallet_id    text        not null,
  to_wallet_id text,
  category_id  text,
  note         text        not null default '',
  created_at   bigint      not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.dompetku_budgets (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  id           text        not null,
  category_id  text        not null,
  limit_amount bigint      not null check (limit_amount >= 0),
  month        text        not null check (month ~ '^\d{4}-\d{2}$'),
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.dompetku_goals (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  id         text        not null,
  name       text        not null,
  target     bigint      not null check (target >= 0),
  saved      bigint      not null default 0,
  deadline   date,
  color      text        not null default '#10b981',
  icon       text        not null default 'PiggyBank',
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ============================ INDEKS ========================================
-- Query utama selalu "where user_id = ...", sudah terlayani primary key.
-- Indeks tambahan untuk laporan/analitik bila nanti dibutuhkan di server.

create index if not exists dompetku_transactions_user_date_idx
  on public.dompetku_transactions (user_id, date desc);

create index if not exists dompetku_transactions_user_category_idx
  on public.dompetku_transactions (user_id, category_id);

create index if not exists dompetku_budgets_user_month_idx
  on public.dompetku_budgets (user_id, month);

-- ============================ TIMESTAMP =====================================

create or replace function public.dompetku_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'dompetku_profiles',
    'dompetku_wallets',
    'dompetku_categories',
    'dompetku_transactions',
    'dompetku_budgets',
    'dompetku_goals'
  ]
  loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
       for each row execute function public.dompetku_touch_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- ============================ ROW LEVEL SECURITY ============================
-- Setiap tabel hanya bisa dibaca/ditulis oleh pemilik baris (auth.uid()).

alter table public.dompetku_profiles     enable row level security;
alter table public.dompetku_wallets      enable row level security;
alter table public.dompetku_categories   enable row level security;
alter table public.dompetku_transactions enable row level security;
alter table public.dompetku_budgets      enable row level security;
alter table public.dompetku_goals        enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'dompetku_profiles',
    'dompetku_wallets',
    'dompetku_categories',
    'dompetku_transactions',
    'dompetku_budgets',
    'dompetku_goals'
  ]
  loop
    execute format('drop policy if exists %I_owner_all on public.%I', t, t);
    execute format(
      'create policy %I_owner_all on public.%I
       for all
       to authenticated
       using (auth.uid() = user_id)
       with check (auth.uid() = user_id)',
      t, t
    );
  end loop;
end;
$$;

-- ============================ HAK AKSES =====================================
-- Supabase biasanya sudah memberi hak ini otomatis; ditulis eksplisit supaya
-- skema tetap benar walau default privileges project berubah.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.dompetku_profiles,
  public.dompetku_wallets,
  public.dompetku_categories,
  public.dompetku_transactions,
  public.dompetku_budgets,
  public.dompetku_goals
to authenticated;

-- Anon (belum login) tidak diberi akses tabel sama sekali.

-- ============================ SELESAI =======================================
-- Verifikasi cepat: jalankan query berikut, hasilnya harus 6 baris.
--   select table_name, row_security
--   from information_schema.tables
--   where table_schema = 'public' and table_name like 'dompetku_%';
