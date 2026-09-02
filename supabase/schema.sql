create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null default 'Guest',
  total numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  source text not null default 'website',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_id text not null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null default 0,
  line_total numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_inventory (
  id uuid primary key default gen_random_uuid(),
  menu_id text not null unique,
  item_name text not null,
  stock integer not null default 10 check (stock >= 0),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.menu_inventory enable row level security;

drop policy if exists "Allow anonymous order inserts" on public.orders;
drop policy if exists "Allow anonymous order updates" on public.orders;
drop policy if exists "Allow admin order updates" on public.orders;
drop policy if exists "Allow anonymous order item inserts" on public.order_items;
drop policy if exists "Allow anonymous menu inventory reads" on public.menu_inventory;
drop policy if exists "Allow anonymous menu inventory writes" on public.menu_inventory;
drop policy if exists "Allow anonymous menu inventory updates" on public.menu_inventory;
drop policy if exists "Allow admin menu inventory writes" on public.menu_inventory;
drop policy if exists "Allow admin menu inventory updates" on public.menu_inventory;
drop policy if exists "Allow anonymous order reads" on public.orders;
drop policy if exists "Allow anonymous order item reads" on public.order_items;
drop policy if exists "Allow admin order reads" on public.orders;
drop policy if exists "Allow admin order item reads" on public.order_items;

create policy "Allow anonymous order inserts"
on public.orders
for insert
with check (true);

create policy "Allow admin order updates"
on public.orders
for update
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Allow anonymous order item inserts"
on public.order_items
for insert
with check (true);

create policy "Allow anonymous menu inventory reads"
on public.menu_inventory
for select
using (true);

create policy "Allow admin menu inventory writes"
on public.menu_inventory
for insert
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Allow admin menu inventory updates"
on public.menu_inventory
for update
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Allow admin order reads"
on public.orders
for select
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Allow admin order item reads"
on public.order_items
for select
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.create_order_and_reserve_stock(
  customer_name_input text,
  total_input numeric,
  items_input jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  item_record jsonb;
  requested_quantity integer;
  available_stock integer;
begin
  if jsonb_typeof(items_input) <> 'array' or jsonb_array_length(items_input) = 0 then
    raise exception 'Order harus memiliki item';
  end if;

  for item_record in select value from jsonb_array_elements(items_input)
  loop
    requested_quantity := (item_record ->> 'quantity')::integer;
    select stock into available_stock
    from public.menu_inventory
    where menu_id = item_record ->> 'menu_id'
    for update;

    if available_stock is null or requested_quantity <= 0 or available_stock < requested_quantity then
      raise exception 'Stok menu tidak mencukupi';
    end if;
  end loop;

  insert into public.orders (customer_name, total, status, source)
  values (coalesce(nullif(trim(customer_name_input), ''), 'Guest'), total_input, 'pending', 'website')
  returning id into new_order_id;

  insert into public.order_items (order_id, menu_id, item_name, quantity, unit_price, line_total)
  select
    new_order_id,
    item ->> 'menu_id',
    item ->> 'item_name',
    (item ->> 'quantity')::integer,
    (item ->> 'unit_price')::numeric,
    (item ->> 'line_total')::numeric
  from jsonb_array_elements(items_input) as item;

  update public.menu_inventory inventory
  set stock = inventory.stock - item_totals.quantity,
      updated_at = now()
  from (
    select item ->> 'menu_id' as menu_id, sum((item ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(items_input) as item
    group by item ->> 'menu_id'
  ) item_totals
  where inventory.menu_id = item_totals.menu_id;

  return new_order_id;
end;
$$;

revoke all on function public.create_order_and_reserve_stock(text, numeric, jsonb) from public;
grant execute on function public.create_order_and_reserve_stock(text, numeric, jsonb) to anon, authenticated;

create or replace function public.cancel_order_and_restore_stock(order_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Akses admin diperlukan';
  end if;

  if not exists (
    select 1
    from public.orders
    where id = order_id_input
      and status <> 'cancelled'
  ) then
    raise exception 'Order tidak ditemukan atau sudah dibatalkan';
  end if;

  update public.menu_inventory inventory
  set stock = inventory.stock + item_totals.quantity,
      updated_at = now()
  from (
    select menu_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = order_id_input
    group by menu_id
  ) item_totals
  where inventory.menu_id = item_totals.menu_id;

  delete from public.orders
  where id = order_id_input;
end;
$$;

revoke all on function public.cancel_order_and_restore_stock(uuid) from public, anon;
grant execute on function public.cancel_order_and_restore_stock(uuid) to authenticated;

insert into public.menu_inventory (menu_id, item_name, stock)
values
  ('c1', 'Expresso', 10),
  ('c2', 'Caffee Latte', 10),
  ('c3', 'Long Black', 10),
  ('c4', 'Piccolo', 10),
  ('c5', 'Americano', 10),
  ('c6', 'Cappucino', 10),
  ('c7', 'Flat White', 10),
  ('c8', 'Cold Brew', 10),
  ('n1', 'Matcha Latte', 10),
  ('n2', 'Chocolate', 10),
  ('n3', 'Red Velvet', 10),
  ('n4', 'Taro Latte', 10),
  ('n5', 'Lemon Tea', 10),
  ('n6', 'Lychee Tea', 10),
  ('n7', 'Milk Tea', 10),
  ('n8', 'Sparkling Yuzu', 10),
  ('f1', 'Butter Croissant', 10),
  ('f2', 'French Toast', 10),
  ('f3', 'Egg Benedict', 10),
  ('f4', 'Truffle Fries', 10),
  ('f5', 'Chicken Waffle', 10),
  ('f6', 'Beef Sandwich', 10),
  ('f7', 'Carbonara', 10),
  ('f8', 'Banana Cake', 10)
on conflict (menu_id) do nothing;
