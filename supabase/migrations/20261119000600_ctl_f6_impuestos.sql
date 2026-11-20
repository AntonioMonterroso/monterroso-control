create table if not exists public.ctl_impuesto_modo (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ambito text not null check (ambito in ('negocio', 'cliente')),
  negocio_id uuid references public.ctl_negocios(id) on delete cascade,
  cliente_id text check (cliente_id is null or char_length(cliente_id) between 1 and 200),
  regimen text not null check (regimen in ('sin_iva', 'pequeno', 'general')),
  desde date not null,
  creado timestamptz not null default now(),
  check ((ambito = 'negocio' and negocio_id is not null and cliente_id is null) or (ambito = 'cliente' and cliente_id is not null and negocio_id is null))
);

create unique index if not exists ctl_impuesto_modo_unico on public.ctl_impuesto_modo (owner, ambito, coalesce(negocio_id::text, cliente_id), desde);

create table if not exists public.ctl_facturas (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('emitida', 'recibida')),
  fecha date not null,
  serie text check (char_length(serie) <= 40),
  numero text not null check (char_length(numero) between 1 and 40),
  nit text check (char_length(nit) <= 30),
  nombre text not null check (char_length(nombre) between 1 and 200),
  total numeric(12, 2) not null check (total > 0),
  negocio_id uuid not null references public.ctl_negocios(id) on delete restrict,
  cliente_id text check (cliente_id is null or char_length(cliente_id) between 1 and 200),
  pago_id uuid,
  gasto_id uuid references public.ctl_gastos(id) on delete set null,
  archivo text check (char_length(archivo) <= 400),
  anulada boolean not null default false,
  creado timestamptz not null default now()
);

create unique index if not exists ctl_facturas_unica on public.ctl_facturas (owner, tipo, coalesce(nit, ''), coalesce(serie, ''), numero);
create index if not exists ctl_facturas_fecha on public.ctl_facturas (owner, fecha);

alter table public.ctl_impuesto_modo enable row level security;
drop policy if exists ctl_impuesto_modo_dueno on public.ctl_impuesto_modo;
create policy ctl_impuesto_modo_dueno on public.ctl_impuesto_modo for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_impuesto_modo from anon;
grant select, insert, update, delete on public.ctl_impuesto_modo to authenticated;
alter table public.ctl_facturas enable row level security;
drop policy if exists ctl_facturas_dueno on public.ctl_facturas;
create policy ctl_facturas_dueno on public.ctl_facturas for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_facturas from anon;
grant select, insert, update, delete on public.ctl_facturas to authenticated;
