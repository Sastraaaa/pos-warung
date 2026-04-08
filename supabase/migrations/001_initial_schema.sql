create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Umum',
  capital_price numeric(12,0) not null default 0,
  selling_price numeric(12,0) not null default 0,
  current_stock integer not null default 0,
  low_stock_flag boolean not null default false,
  checkout_count integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  total_outstanding_debt numeric(14,0) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('LUNAS', 'KASBON_FULL', 'SEBAGIAN')),
  customer_id uuid references public.customers(id) on delete set null,
  total_amount numeric(14,0) not null default 0,
  paid_amount numeric(14,0) not null default 0,
  debt_created numeric(14,0) not null default 0,
  created_at timestamptz not null default now(),
  is_synced boolean not null default false
);

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  historical_capital_price numeric(12,0) not null,
  historical_selling_price numeric(12,0) not null
);

create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_low_stock on public.products (low_stock_flag);
create index if not exists idx_products_checkout_count on public.products (checkout_count desc);
create index if not exists idx_customers_debt on public.customers (total_outstanding_debt desc);
create index if not exists idx_transactions_created_at on public.transactions (created_at desc);
create index if not exists idx_transactions_type on public.transactions (transaction_type);
create index if not exists idx_transactions_customer on public.transactions (customer_id);
create index if not exists idx_transactions_synced on public.transactions (is_synced);
create index if not exists idx_transaction_items_transaction on public.transaction_items (transaction_id);
create index if not exists idx_transaction_items_product on public.transaction_items (product_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_product_low_stock_flag()
returns trigger
language plpgsql
as $$
begin
  new.low_stock_flag = new.current_stock <= 5;
  return new;
end;
$$;

create or replace function public.increment_product_checkout_count()
returns trigger
language plpgsql
as $$
begin
  update public.products
  set checkout_count = checkout_count + new.quantity
  where id = new.product_id;

  return new;
end;
$$;

create or replace function public.update_customer_debt_after_transaction()
returns trigger
language plpgsql
as $$
begin
  if new.transaction_type in ('KASBON_FULL', 'SEBAGIAN') and new.customer_id is not null then
    update public.customers
    set total_outstanding_debt = total_outstanding_debt + coalesce(new.debt_created, 0)
    where id = new.customer_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before insert or update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before insert or update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_low_stock_flag on public.products;
create trigger trg_products_low_stock_flag
before insert or update on public.products
for each row execute function public.set_product_low_stock_flag();

drop trigger if exists trg_transaction_items_increment_checkout_count on public.transaction_items;
create trigger trg_transaction_items_increment_checkout_count
after insert on public.transaction_items
for each row execute function public.increment_product_checkout_count();

drop trigger if exists trg_transactions_update_customer_debt on public.transactions;
create trigger trg_transactions_update_customer_debt
after insert on public.transactions
for each row execute function public.update_customer_debt_after_transaction();

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;

create policy "Authenticated users have full access to products"
on public.products
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users have full access to customers"
on public.customers
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users have full access to transactions"
on public.transactions
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users have full access to transaction_items"
on public.transaction_items
for all
to authenticated
using (true)
with check (true);

-- NOTE: For local-first sync, the Supabase service role key should be used for background sync operations.

create or replace function public.get_daily_summary(p_date date)
returns table (
  total_transactions bigint,
  total_revenue numeric(14,0),
  total_profit numeric(20,0),
  total_kasbon numeric(14,0),
  total_outstanding_debt numeric(14,0)
)
language sql
stable
as $$
with daily_transactions as (
  select id, transaction_type, paid_amount, debt_created
  from public.transactions
  where created_at::date = p_date
)
select
  (select count(*)::bigint from daily_transactions) as total_transactions,
  (select coalesce(sum(case when transaction_type = 'LUNAS' then paid_amount else 0 end), 0::numeric(14,0)) from daily_transactions) as total_revenue,
  (select coalesce(sum((ti.historical_selling_price - ti.historical_capital_price) * ti.quantity), 0::numeric(20,0))
   from daily_transactions dt
   left join public.transaction_items ti on ti.transaction_id = dt.id) as total_profit,
  (select coalesce(sum(debt_created), 0::numeric(14,0)) from daily_transactions) as total_kasbon,
  (select coalesce(sum(total_outstanding_debt), 0::numeric(14,0)) from public.customers) as total_outstanding_debt;
$$;
