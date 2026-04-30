-- Execute no Supabase: SQL Editor → New query → Run
-- Tabela pública de perfis (dados dos usuários que se cadastram).
-- O Auth continua em auth.users; aqui guardamos cópia/estendido para consultas e relatórios.

create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists usuarios_email_idx on public.usuarios (lower(email));

alter table public.usuarios enable row level security;

drop policy if exists "Usuarios select own" on public.usuarios;
drop policy if exists "Usuarios update own" on public.usuarios;

-- Cada usuário autenticado só vê e edita a própria linha (insert só via trigger)
create policy "Usuarios select own"
  on public.usuarios for select
  using (auth.uid() = id);

create policy "Usuarios update own"
  on public.usuarios for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Novo cadastro: criar linha em public.usuarios
create or replace function public.handle_new_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nome)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nome'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_usuarios on auth.users;

create trigger on_auth_user_created_usuarios
  after insert on auth.users
  for each row
  execute function public.handle_new_usuario();

-- Se o e-mail mudar no Auth, refletir em public.usuarios
create or replace function public.handle_usuario_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.usuarios
    set email = coalesce(new.email, email),
        atualizado_em = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_email_usuarios on auth.users;

create trigger on_auth_user_updated_email_usuarios
  after update of email on auth.users
  for each row
  execute function public.handle_usuario_email_update();

-- Usuários que já existiam antes do trigger: copiar de auth.users
insert into public.usuarios (id, email, nome)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'nome'), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(u.email, ''), '@', 1)
  )
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  nome = coalesce(public.usuarios.nome, excluded.nome),
  atualizado_em = now();
