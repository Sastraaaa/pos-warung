drop policy if exists "Public app read access to products" on public.products;
drop policy if exists "Public app insert access to products" on public.products;
drop policy if exists "Public app update access to products" on public.products;

drop policy if exists "Public app read access to customers" on public.customers;
drop policy if exists "Public app insert access to customers" on public.customers;
drop policy if exists "Public app update access to customers" on public.customers;

drop policy if exists "Public app read access to transactions" on public.transactions;
drop policy if exists "Public app insert access to transactions" on public.transactions;
drop policy if exists "Public app update access to transactions" on public.transactions;
drop policy if exists "Public app delete access to transactions" on public.transactions;

drop policy if exists "Public app read access to transaction_items" on public.transaction_items;
drop policy if exists "Public app insert access to transaction_items" on public.transaction_items;
drop policy if exists "Public app update access to transaction_items" on public.transaction_items;
drop policy if exists "Public app delete access to transaction_items" on public.transaction_items;

create policy "Client role read products"
on public.products
for select
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'));

create policy "Client role insert products"
on public.products
for insert
to anon, authenticated
with check (auth.role() in ('anon', 'authenticated'));

create policy "Client role update products"
on public.products
for update
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

create policy "Client role read customers"
on public.customers
for select
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'));

create policy "Client role insert customers"
on public.customers
for insert
to anon, authenticated
with check (auth.role() in ('anon', 'authenticated'));

create policy "Client role update customers"
on public.customers
for update
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

create policy "Client role read transactions"
on public.transactions
for select
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'));

create policy "Client role insert transactions"
on public.transactions
for insert
to anon, authenticated
with check (auth.role() in ('anon', 'authenticated'));

create policy "Client role update transactions"
on public.transactions
for update
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

create policy "Client role delete transactions"
on public.transactions
for delete
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'));

create policy "Client role read transaction_items"
on public.transaction_items
for select
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'));

create policy "Client role insert transaction_items"
on public.transaction_items
for insert
to anon, authenticated
with check (auth.role() in ('anon', 'authenticated'));

create policy "Client role update transaction_items"
on public.transaction_items
for update
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

create policy "Client role delete transaction_items"
on public.transaction_items
for delete
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'));
