create table if not exists public.ctl_tarifas (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),
  tipo text not null check (tipo in ('paquete', 'extra')),
  inscripcion numeric(12, 2) not null default 0 check (inscripcion >= 0),
  mensualidad numeric(12, 2) not null default 0 check (mensualidad >= 0),
  precio numeric(12, 2) not null default 0 check (precio >= 0),
  descripcion text check (char_length(descripcion) <= 1000),
  incluye text check (char_length(incluye) <= 2000),
  compartir boolean not null default false,
  activo boolean not null default true,
  orden smallint not null default 50,
  creado timestamptz not null default now()
);

create table if not exists public.ctl_plantillas_contrato (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),
  encabezado text not null check (char_length(encabezado) <= 4000),
  clausulas jsonb not null default '[]'::jsonb check (jsonb_typeof(clausulas) = 'array'),
  cierre text not null default '' check (char_length(cierre) <= 2000),
  creado timestamptz not null default now()
);

create table if not exists public.ctl_contratos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id text not null check (char_length(cliente_id) between 1 and 200),
  proyecto_id uuid references public.projects(id) on delete set null,
  plantilla_id uuid references public.ctl_plantillas_contrato(id) on delete set null,
  titulo text not null check (char_length(titulo) between 1 and 200),
  contenido text not null check (char_length(contenido) <= 60000),
  fecha date not null,
  fecha_firma date,
  creado timestamptz not null default now()
);

create index if not exists ctl_contratos_cliente on public.ctl_contratos (cliente_id);

alter table public.ctl_tarifas enable row level security;
drop policy if exists ctl_tarifas_dueno on public.ctl_tarifas;
create policy ctl_tarifas_dueno on public.ctl_tarifas for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_tarifas from anon;
grant select, insert, update, delete on public.ctl_tarifas to authenticated;
alter table public.ctl_plantillas_contrato enable row level security;
drop policy if exists ctl_plantillas_contrato_dueno on public.ctl_plantillas_contrato;
create policy ctl_plantillas_contrato_dueno on public.ctl_plantillas_contrato for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_plantillas_contrato from anon;
grant select, insert, update, delete on public.ctl_plantillas_contrato to authenticated;
alter table public.ctl_contratos enable row level security;
drop policy if exists ctl_contratos_dueno on public.ctl_contratos;
create policy ctl_contratos_dueno on public.ctl_contratos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_contratos from anon;
grant select, insert, update, delete on public.ctl_contratos to authenticated;

create or replace view public.ctl_precios_compartibles with (security_invoker = true) as
select 'tarifa'::text as origen, id, nombre, tipo, inscripcion, mensualidad, precio, descripcion, incluye, orden
from public.ctl_tarifas where compartir and activo
union all
select 'producto', id, nombre, 'producto', 0, 0, precio, null, null, 100
from public.ctl_productos where compartir and activo;

grant select on public.ctl_precios_compartibles to authenticated;
