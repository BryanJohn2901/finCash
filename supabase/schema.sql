-- Execute no Supabase: SQL Editor → New query → Run
-- Tabela de transações por usuário (ligada a auth.users)

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  description text not null,
  type text not null check (type in ('income', 'expense')),
  category text not null default 'outros',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Migração: adicionar colunas caso a tabela já exista
alter table public.transactions add column if not exists category text not null default 'outros';
alter table public.transactions add column if not exists date date not null default current_date;

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

drop policy if exists "Users read own transactions" on public.transactions;
drop policy if exists "Users insert own transactions" on public.transactions;
drop policy if exists "Users update own transactions" on public.transactions;
drop policy if exists "Users delete own transactions" on public.transactions;

create policy "Users read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ─── Tabela de metas de orçamento ─────────────────────────────────────────────

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  amount numeric not null check (amount > 0),
  month text not null, -- formato: 'YYYY-MM'
  created_at timestamptz not null default now(),
  unique (user_id, category, month)
);

alter table public.budgets enable row level security;

drop policy if exists "Users manage own budgets" on public.budgets;

create policy "Users manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
