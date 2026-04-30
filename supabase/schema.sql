-- Execute no Supabase: SQL Editor → New query → Run
-- Tabela de transações por usuário (ligada a auth.users)

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  description text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);

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
