create table if not exists public.ctl_categorias (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  tipo text not null check (tipo in ('gasto', 'ingreso')),
  clave text check (char_length(clave) <= 40),
  activo boolean not null default true,
  orden smallint not null default 50,
  creado timestamptz not null default now()
);

create unique index if not exists ctl_categorias_nombre on public.ctl_categorias (owner, tipo, lower(nombre));
create unique index if not exists ctl_categorias_clave on public.ctl_categorias (owner, clave) where clave is not null;

create table if not exists public.ctl_gastos_fijos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),
  negocio_id uuid not null references public.ctl_negocios(id) on delete restrict,
  categoria_id uuid not null references public.ctl_categorias(id) on delete restrict,
  cliente_id text check (cliente_id is null or char_length(cliente_id) between 1 and 200),
  monto numeric(12, 2) not null check (monto > 0),
  dia smallint not null check (dia between 1 and 31),
  inicio date not null,
  fin date,
  activo boolean not null default true,
  creado timestamptz not null default now(),
  check (fin is null or fin >= inicio)
);

create table if not exists public.ctl_gastos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  negocio_id uuid not null references public.ctl_negocios(id) on delete restrict,
  categoria_id uuid not null references public.ctl_categorias(id) on delete restrict,
  cliente_id text check (cliente_id is null or char_length(cliente_id) between 1 and 200),
  proyecto_id uuid references public.projects(id) on delete set null,
  descripcion text not null check (char_length(descripcion) between 1 and 300),
  monto numeric(12, 2) not null check (monto > 0),
  cuenta text check (char_length(cuenta) <= 60),
  proveedor text check (char_length(proveedor) <= 200),
  proveedor_nit text check (char_length(proveedor_nit) <= 30),
  factura_serie text check (char_length(factura_serie) <= 40),
  factura_numero text check (char_length(factura_numero) <= 40),
  archivo text check (char_length(archivo) <= 400),
  gasto_fijo_id uuid references public.ctl_gastos_fijos(id) on delete set null,
  periodo text check (periodo ~ '^\d{4}-\d{2}$'),
  origen_mw_id uuid,
  creado timestamptz not null default now()
);

create index if not exists ctl_gastos_fecha on public.ctl_gastos (owner, fecha);
create unique index if not exists ctl_gastos_fijo_mes on public.ctl_gastos (gasto_fijo_id, periodo) where gasto_fijo_id is not null;
create unique index if not exists ctl_gastos_origen_mw on public.ctl_gastos (owner, origen_mw_id) where origen_mw_id is not null;

alter table public.ctl_categorias enable row level security;
drop policy if exists ctl_categorias_dueno on public.ctl_categorias;
create policy ctl_categorias_dueno on public.ctl_categorias for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_categorias from anon;
grant select, insert, update, delete on public.ctl_categorias to authenticated;
alter table public.ctl_gastos_fijos enable row level security;
drop policy if exists ctl_gastos_fijos_dueno on public.ctl_gastos_fijos;
create policy ctl_gastos_fijos_dueno on public.ctl_gastos_fijos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_gastos_fijos from anon;
grant select, insert, update, delete on public.ctl_gastos_fijos to authenticated;
alter table public.ctl_gastos enable row level security;
drop policy if exists ctl_gastos_dueno on public.ctl_gastos;
create policy ctl_gastos_dueno on public.ctl_gastos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_gastos from anon;
grant select, insert, update, delete on public.ctl_gastos to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('ctl-archivos', 'ctl-archivos', false, 10485760)
on conflict (id) do nothing;

drop policy if exists ctl_archivos_leer on storage.objects;
create policy ctl_archivos_leer on storage.objects for select to authenticated using (bucket_id = 'ctl-archivos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists ctl_archivos_subir on storage.objects;
create policy ctl_archivos_subir on storage.objects for insert to authenticated with check (bucket_id = 'ctl-archivos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists ctl_archivos_borrar on storage.objects;
create policy ctl_archivos_borrar on storage.objects for delete to authenticated using (bucket_id = 'ctl-archivos' and (storage.foldername(name))[1] = auth.uid()::text);
