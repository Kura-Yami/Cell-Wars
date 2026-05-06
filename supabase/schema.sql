-- Supabase schema draft for Cell Wars.
-- Run this later in the Supabase SQL editor after the prototype screens are ready.

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'lobby',
  created_at timestamptz not null default now(),
  started_at timestamptz
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  player_name text not null,
  score integer not null default 0,
  size numeric not null default 24,
  x numeric not null default 0,
  y numeric not null default 0,
  is_eliminated boolean not null default false,
  joined_at timestamptz not null default now()
);

alter table public.game_rooms enable row level security;
alter table public.room_players enable row level security;

-- TODO: tighten these policies before production.
-- For the prototype, authenticated users, including anonymous guests, can read and write lobby data.
create policy "authenticated users can read game rooms"
on public.game_rooms for select
to authenticated
using (true);

create policy "authenticated users can create game rooms"
on public.game_rooms for insert
to authenticated
with check (true);

create policy "authenticated users can update game rooms"
on public.game_rooms for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can read room players"
on public.room_players for select
to authenticated
using (true);

create policy "authenticated users can join rooms"
on public.room_players for insert
to authenticated
with check (true);

create policy "authenticated users can update room players"
on public.room_players for update
to authenticated
using (true)
with check (true);
