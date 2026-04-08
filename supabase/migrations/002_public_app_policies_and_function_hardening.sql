-- Single-tenant POS app (no login): allow anon/authenticated access for app sync.
-- Keep RLS enabled but explicit for clarity with Supabase PostgREST access.

drop policy if exists "Authenticated users have full access to products" on public.products;
drop policy if exists "Authenticated users have full access to customers" on public.customers;
drop policy if exists "Authenticated users have full access to transactions" on public.transactions;
drop policy if exists "Authenticated users have full access to transaction_items" on public.transaction_items;

create policy "Public app read access to products"
on public.products
for select
to anon, authenticated
using (true);

create policy "Public app insert access to products"
on public.products
for insert
to anon, authenticated
with check (true);

create policy "Public app update access to products"
on public.products
for update
to anon, authenticated
using (true)
with check (true);

create policy "Public app read access to customers"
on public.customers
for select
to anon, authenticated
using (true);

create policy "Public app insert access to customers"
on public.customers
for insert
to anon, authenticated
with check (true);

create policy "Public app update access to customers"
on public.customers
for update
to anon, authenticated
using (true)
with check (true);

create policy "Public app read access to transactions"
on public.transactions
for select
to anon, authenticated
using (true);

create policy "Public app insert access to transactions"
on public.transactions
for insert
to anon, authenticated
with check (true);

create policy "Public app update access to transactions"
on public.transactions
for update
to anon, authenticated
using (true)
with check (true);

create policy "Public app delete access to transactions"
on public.transactions
for delete
to anon, authenticated
using (true);

create policy "Public app read access to transaction_items"
on public.transaction_items
for select
to anon, authenticated
using (true);

create policy "Public app insert access to transaction_items"
on public.transaction_items
for insert
to anon, authenticated
with check (true);

create policy "Public app update access to transaction_items"
on public.transaction_items
for update
to anon, authenticated
using (true)
with check (true);

create policy "Public app delete access to transaction_items"
on public.transaction_items
for delete
to anon, authenticated
using (true);

alter function public.set_updated_at() set search_path = public;
alter function public.set_product_low_stock_flag() set search_path = public;
alter function public.increment_product_checkout_count() set search_path = public;
alter function public.update_customer_debt_after_transaction() set search_path = public;
alter function public.get_daily_summary(date) set search_path = public;
