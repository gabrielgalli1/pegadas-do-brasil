-- Persists game progress per authenticated (including anonymous) player.
-- The browser cache remains available for offline play, while this table is
-- the shared source of truth whenever Supabase can be reached.
create table if not exists public.progresso_jogador (
  jogador_id uuid primary key references public.jogadores(id) on delete cascade,
  fases jsonb not null default '{}'::jsonb,
  pontuacao integer not null default 0 check (pontuacao >= 0),
  maior_pontuacao integer not null default 0 check (maior_pontuacao >= 0),
  conquistas text[] not null default '{}'::text[],
  atualizado_em timestamptz not null default now()
);

alter table public.progresso_jogador enable row level security;

drop policy if exists "Jogador le o proprio progresso" on public.progresso_jogador;
create policy "Jogador le o proprio progresso"
on public.progresso_jogador for select
to authenticated
using ((select auth.uid()) = jogador_id);

drop policy if exists "Jogador cria o proprio progresso" on public.progresso_jogador;
create policy "Jogador cria o proprio progresso"
on public.progresso_jogador for insert
to authenticated
with check ((select auth.uid()) = jogador_id);

drop policy if exists "Jogador atualiza o proprio progresso" on public.progresso_jogador;
create policy "Jogador atualiza o proprio progresso"
on public.progresso_jogador for update
to authenticated
using ((select auth.uid()) = jogador_id)
with check ((select auth.uid()) = jogador_id);

grant select, insert, update on public.progresso_jogador to authenticated;

create or replace function public.atualizar_data_progresso_jogador()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists progresso_jogador_atualizar_data on public.progresso_jogador;
create trigger progresso_jogador_atualizar_data
before update on public.progresso_jogador
for each row execute function public.atualizar_data_progresso_jogador();