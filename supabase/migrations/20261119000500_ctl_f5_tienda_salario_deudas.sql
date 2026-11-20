create table if not exists public.ctl_productos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sku text check (char_length(sku) <= 60),
  nombre text not null check (char_length(nombre) between 1 and 200),
  costo numeric(12, 2) not null default 0 check (costo >= 0),
  precio numeric(12, 2) not null default 0 check (precio >= 0),
  envio_estimado numeric(12, 2) not null default 0 check (envio_estimado >= 0),
  activo boolean not null default true,
  compartir boolean not null default false,
  creado timestamptz not null default now()
);

create table if not exists public.ctl_ventas_tienda (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pedido text not null check (char_length(pedido) between 1 and 60),
  fecha date not null,
  cliente_nombre text check (char_length(cliente_nombre) <= 200),
  descripcion text not null check (char_length(descripcion) between 1 and 1000),
  cantidad integer not null default 1 check (cantidad >= 0),
  precio_venta numeric(12, 2) not null default 0 check (precio_venta >= 0),
  costo_producto numeric(12, 2) not null default 0 check (costo_producto >= 0),
  envio numeric(12, 2) not null default 0 check (envio >= 0),
  comision numeric(12, 2) not null default 0 check (comision >= 0),
  otros numeric(12, 2) not null default 0 check (otros >= 0),
  estado text not null default 'entregado' check (estado in ('pendiente', 'entregado', 'devuelto')),
  origen text not null default 'manual' check (origen in ('manual', 'csv')),
  creado timestamptz not null default now()
);

create unique index if not exists ctl_ventas_pedido on public.ctl_ventas_tienda (owner, lower(pedido));
create index if not exists ctl_ventas_fecha on public.ctl_ventas_tienda (owner, fecha);

create table if not exists public.ctl_salario_aumentos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  desde date not null,
  bruto numeric(12, 2) not null check (bruto > 0),
  descuentos numeric(12, 2) not null default 0 check (descuentos >= 0),
  dia_pago smallint not null default 30 check (dia_pago between 1 and 31),
  nota text check (char_length(nota) <= 300),
  creado timestamptz not null default now(),
  unique (owner, desde),
  check (descuentos <= bruto)
);

create table if not exists public.ctl_deudas (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),
  tipo text not null check (tipo in ('cuotas', 'tarjeta')),
  negocio_id uuid not null references public.ctl_negocios(id) on delete restrict,
  categoria_id uuid not null references public.ctl_categorias(id) on delete restrict,
  total numeric(12, 2) not null default 0 check (total >= 0),
  cuotas smallint check (cuotas > 0),
  cuota numeric(12, 2) check (cuota > 0),
  dia_pago smallint check (dia_pago between 1 and 31),
  inicio date not null,
  limite numeric(12, 2) check (limite >= 0),
  saldo_inicial numeric(12, 2) not null default 0 check (saldo_inicial >= 0),
  activo boolean not null default true,
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now()
);

create table if not exists public.ctl_deuda_movimientos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  deuda_id uuid not null references public.ctl_deudas(id) on delete cascade,
  tipo text not null check (tipo in ('pago', 'cargo')),
  fecha date not null,
  monto numeric(12, 2) not null check (monto > 0),
  nota text check (char_length(nota) <= 300),
  creado timestamptz not null default now()
);

create index if not exists ctl_deuda_movimientos_deuda on public.ctl_deuda_movimientos (deuda_id, fecha);

alter table public.ctl_productos enable row level security;
drop policy if exists ctl_productos_dueno on public.ctl_productos;
create policy ctl_productos_dueno on public.ctl_productos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_productos from anon;
grant select, insert, update, delete on public.ctl_productos to authenticated;
alter table public.ctl_ventas_tienda enable row level security;
drop policy if exists ctl_ventas_tienda_dueno on public.ctl_ventas_tienda;
create policy ctl_ventas_tienda_dueno on public.ctl_ventas_tienda for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_ventas_tienda from anon;
grant select, insert, update, delete on public.ctl_ventas_tienda to authenticated;
alter table public.ctl_salario_aumentos enable row level security;
drop policy if exists ctl_salario_aumentos_dueno on public.ctl_salario_aumentos;
create policy ctl_salario_aumentos_dueno on public.ctl_salario_aumentos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_salario_aumentos from anon;
grant select, insert, update, delete on public.ctl_salario_aumentos to authenticated;
alter table public.ctl_deudas enable row level security;
drop policy if exists ctl_deudas_dueno on public.ctl_deudas;
create policy ctl_deudas_dueno on public.ctl_deudas for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_deudas from anon;
grant select, insert, update, delete on public.ctl_deudas to authenticated;
alter table public.ctl_deuda_movimientos enable row level security;
drop policy if exists ctl_deuda_movimientos_dueno on public.ctl_deuda_movimientos;
create policy ctl_deuda_movimientos_dueno on public.ctl_deuda_movimientos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_deuda_movimientos from anon;
grant select, insert, update, delete on public.ctl_deuda_movimientos to authenticated;
