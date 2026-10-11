-- SONATA: players
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- One row per signed-in user, created automatically when they sign up.
-- Safe to run again: it updates an older table instead of replacing it.

create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  instrument text, -- empty until the player picks one from their account
  created_at timestamptz not null default now()
);

-- If the table was created by an earlier version of this file, bring it in line.
alter table public.players alter column instrument drop not null;
alter table public.players alter column instrument drop default;

-- Instrument level: beginner -> intermediate -> professional.
-- Global ranking: developing -> established -> world_class. Empty means unranked.
alter table public.players add column if not exists instrument_level text not null default 'beginner';
alter table public.players add column if not exists global_rank text;

alter table public.players drop constraint if exists players_instrument_level_check;
alter table public.players add constraint players_instrument_level_check
  check (instrument_level in ('beginner', 'intermediate', 'professional'));

alter table public.players drop constraint if exists players_global_rank_check;
alter table public.players add constraint players_global_rank_check
  check (global_rank in ('developing', 'established', 'world_class'));

-- The ranking rule: a beginner is unranked, and a player whose instrument is
-- intermediate or above starts the global ranking at developing.
create or replace function public.apply_ranking_rule()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.instrument_level = 'beginner' then
    new.global_rank := null;
  elsif new.global_rank is null then
    new.global_rank := 'developing';
  end if;
  return new;
end;
$$;

revoke execute on function public.apply_ranking_rule() from public, anon, authenticated;

drop trigger if exists players_ranking_rule on public.players;
create trigger players_ranking_rule
  before insert or update on public.players
  for each row execute function public.apply_ranking_rule();

alter table public.players enable row level security;

-- The leaderboard is public, so anyone can read players, signed in or not.
drop policy if exists "Anyone can view players" on public.players;
create policy "Anyone can view players"
  on public.players for select
  using (true);

-- A player can change only their own row, and only their name and instrument
-- (see the grant below). Level and ranking are set by the league, not the player.
drop policy if exists "Players update their own row" on public.players;
create policy "Players update their own row"
  on public.players for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select on public.players to anon, authenticated;
grant update (display_name, instrument) on public.players to authenticated;

-- Create the players row whenever someone signs up (email or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.players (id, display_name, instrument)
  values (
    new.id,
    coalesce(
      -- the name typed on the sign-up form, else the name on their Google account
      nullif(left(btrim(new.raw_user_meta_data ->> 'display_name'), 30), ''),
      nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 30), ''),
      nullif(left(btrim(new.raw_user_meta_data ->> 'name'), 30), ''),
      'Player ' || upper(substr(new.id::text, 1, 4))
    ),
    nullif(new.raw_user_meta_data ->> 'instrument', '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
