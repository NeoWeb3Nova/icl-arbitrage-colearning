create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pair text not null,
  buy_exchange text not null,
  sell_exchange text not null,
  capital_usd numeric not null check (capital_usd >= 50),
  spread_pct numeric not null,
  net_outcome_usd numeric not null,
  status text not null default 'watching' check (status in ('watching', 'investigated', 'dismissed')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.watchlist_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.watchlist_items to authenticated;

drop policy if exists "watchlist owner can select" on public.watchlist_items;
drop policy if exists "watchlist owner can insert" on public.watchlist_items;
drop policy if exists "watchlist owner can update" on public.watchlist_items;
drop policy if exists "watchlist owner can delete" on public.watchlist_items;

create policy "watchlist owner can select"
  on public.watchlist_items for select
  using (auth.uid() = user_id);

create policy "watchlist owner can insert"
  on public.watchlist_items for insert
  with check (auth.uid() = user_id);

create policy "watchlist owner can update"
  on public.watchlist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "watchlist owner can delete"
  on public.watchlist_items for delete
  using (auth.uid() = user_id);
