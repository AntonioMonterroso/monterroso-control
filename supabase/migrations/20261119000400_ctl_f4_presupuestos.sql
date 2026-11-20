create table if not exists public.ctl_presupuestos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  periodo text not null check (periodo ~ '^\d{4}-\d{2}$'),
  negocio_id uuid not null references public.ctl_negocios(id) on delete cascade,
  categoria_id uuid not null references public.ctl_categorias(id) on delete cascade,
  monto numeric(12, 2) not null check (monto >= 0),
  creado timestamptz not null default now(),
  unique (owner, periodo, negocio_id, categoria_id)
);

alter table public.ctl_presupuestos enable row level security;
drop policy if exists ctl_presupuestos_dueno on public.ctl_presupuestos;
create policy ctl_presupuestos_dueno on public.ctl_presupuestos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_presupuestos from anon;
grant select, insert, update, delete on public.ctl_presupuestos to authenticated;
