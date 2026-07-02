-- ============================================================
-- VaultMindOS — Auth Trigger v1.0
-- Modulo 5 do Master Execution Roadmap
--
-- Objetivo: toda vez que alguem se cadastra via Supabase Auth
-- (auth.users), criar automaticamente a linha correspondente em
-- public.users_profile com role = 'subscriber' por padrao. Sem
-- isso, um usuario autenticado nao tem perfil/role e as checagens
-- de acesso do Modulo 5 (login, /admin, papeis) quebram.
--
-- Como aplicar: colar no SQL Editor do projeto Supabase e rodar,
-- depois de ja ter aplicado docs/database/schema-v1.sql.
-- Idempotente — pode rodar de novo sem duplicar.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users_profile (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    'subscriber'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Promover o primeiro administrador (rodar manualmente, uma vez,
-- trocando o e-mail abaixo pelo do fundador, depois de ele criar
-- a propria conta pela tela /login ou pelo Supabase Dashboard):
--
--   update public.users_profile
--   set role = 'admin'
--   where id = (select id from auth.users where email = 'seu-email@dominio.com');
--
-- Isso NAO roda automaticamente de proposito — promover alguem a
-- admin e uma decisao manual, nunca implicita.
-- ------------------------------------------------------------
