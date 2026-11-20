alter table public.ctl_cliente_extra add column if not exists archivado boolean not null default false;

alter table public.ctl_negocios drop constraint if exists ctl_negocios_clave_check;
alter table public.ctl_negocios add constraint ctl_negocios_clave_check check (clave in ('dev', 'canela', 'salario', 'musica', 'diseno', 'sa'));
alter table public.ctl_negocios add column if not exists en_sa boolean not null default false;

create table if not exists public.ctl_sa (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  denominacion text check (char_length(denominacion) <= 200),
  nombre_comercial text check (char_length(nombre_comercial) <= 200),
  nit text check (char_length(nit) <= 30),
  escritura_numero text check (char_length(escritura_numero) <= 40),
  escritura_fecha date,
  notario text check (char_length(notario) <= 200),
  rm_numero text check (char_length(rm_numero) <= 40),
  rm_folio text check (char_length(rm_folio) <= 40),
  rm_libro text check (char_length(rm_libro) <= 40),
  patente_empresa text check (char_length(patente_empresa) <= 80),
  patente_sociedad text check (char_length(patente_sociedad) <= 80),
  representante text check (char_length(representante) <= 200),
  representante_cargo text check (char_length(representante_cargo) <= 120),
  nombramiento_fecha date,
  nombramiento_vence date,
  nombramiento_registro text check (char_length(nombramiento_registro) <= 120),
  organo_administracion text check (organo_administracion in ('administrador_unico', 'consejo')),
  domicilio text check (char_length(domicilio) <= 300),
  regimen text check (regimen in ('pequeno', 'general', 'utilidades')),
  inicio_operaciones date,
  cierre_mes smallint not null default 12 check (cierre_mes between 1 and 12),
  capital_autorizado numeric(14, 2) not null default 0 check (capital_autorizado >= 0),
  capital_suscrito numeric(14, 2) not null default 0 check (capital_suscrito >= 0),
  creado timestamptz not null default now(),
  unique (owner)
);

create table if not exists public.ctl_sa_documentos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 200),
  tipo text check (char_length(tipo) <= 60),
  fecha date,
  archivo text check (char_length(archivo) <= 400),
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now()
);

create table if not exists public.ctl_sa_socios (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 200),
  nit text check (char_length(nit) <= 30),
  dpi text check (char_length(dpi) <= 30),
  correo text check (char_length(correo) <= 120),
  telefono text check (char_length(telefono) <= 30),
  activo boolean not null default true,
  creado timestamptz not null default now()
);

create table if not exists public.ctl_sa_acciones (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  socio_id uuid not null references public.ctl_sa_socios(id) on delete restrict,
  serie text check (char_length(serie) <= 20),
  numero_desde integer check (numero_desde > 0),
  numero_hasta integer check (numero_hasta >= numero_desde),
  cantidad integer not null check (cantidad > 0),
  valor_nominal numeric(14, 2) not null check (valor_nominal > 0),
  fecha date not null,
  titulo text check (char_length(titulo) <= 60),
  estado text not null default 'vigente' check (estado in ('vigente', 'transmitida', 'anulada')),
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now()
);

create table if not exists public.ctl_sa_aportes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  socio_id uuid not null references public.ctl_sa_socios(id) on delete restrict,
  fecha date not null,
  monto numeric(14, 2) not null check (monto > 0),
  pagado numeric(14, 2) not null default 0 check (pagado >= 0),
  forma text not null default 'efectivo' check (forma in ('efectivo', 'especie')),
  descripcion text check (char_length(descripcion) <= 500),
  creado timestamptz not null default now(),
  check (pagado <= monto)
);

create table if not exists public.ctl_sa_transmisiones (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  de_socio_id uuid not null references public.ctl_sa_socios(id) on delete restrict,
  a_socio_id uuid not null references public.ctl_sa_socios(id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  serie text check (char_length(serie) <= 20),
  precio numeric(14, 2) check (precio >= 0),
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now(),
  check (de_socio_id <> a_socio_id)
);

create table if not exists public.ctl_sa_repartos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  desde date not null,
  hasta date not null,
  utilidad numeric(14, 2) not null,
  isr_sociedad numeric(14, 2) not null default 0 check (isr_sociedad >= 0),
  reserva numeric(14, 2) not null default 0 check (reserva >= 0),
  repartido numeric(14, 2) not null default 0 check (repartido >= 0),
  isr_dividendos_tasa numeric(5, 2) not null default 5 check (isr_dividendos_tasa between 0 and 100),
  fecha_acuerdo date not null,
  isr_pagado_el date,
  nota text check (char_length(nota) <= 1000),
  creado timestamptz not null default now(),
  check (hasta >= desde)
);

create table if not exists public.ctl_sa_reparto_socios (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reparto_id uuid not null references public.ctl_sa_repartos(id) on delete cascade,
  socio_id uuid not null references public.ctl_sa_socios(id) on delete restrict,
  acciones integer not null check (acciones >= 0),
  porcentaje numeric(9, 6) not null check (porcentaje between 0 and 100),
  bruto numeric(14, 2) not null check (bruto >= 0),
  isr numeric(14, 2) not null check (isr >= 0),
  neto numeric(14, 2) not null check (neto >= 0),
  pagado_el date,
  cuenta_id uuid,
  creado timestamptz not null default now(),
  unique (reparto_id, socio_id)
);

create table if not exists public.ctl_bancos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  banco text not null check (char_length(banco) between 1 and 80),
  numero text not null check (char_length(numero) between 1 and 40),
  nombre text check (char_length(nombre) <= 120),
  moneda text not null default 'GTQ' check (moneda in ('GTQ', 'USD')),
  saldo_inicial numeric(14, 2) not null default 0,
  fecha_saldo date not null,
  activo boolean not null default true,
  creado timestamptz not null default now()
);

create table if not exists public.ctl_banco_movimientos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cuenta_id uuid not null references public.ctl_bancos(id) on delete cascade,
  fecha date not null,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  monto numeric(14, 2) not null check (monto > 0),
  descripcion text not null check (char_length(descripcion) between 1 and 300),
  origen text not null default 'manual' check (origen in ('manual', 'pago', 'gasto', 'aporte', 'dividendo', 'deuda')),
  origen_id text check (char_length(origen_id) <= 120),
  referencia text check (char_length(referencia) <= 120),
  conciliado boolean not null default false,
  creado timestamptz not null default now()
);

create unique index if not exists ctl_banco_mov_origen on public.ctl_banco_movimientos (owner, origen, origen_id) where origen_id is not null;
create index if not exists ctl_banco_mov_cuenta on public.ctl_banco_movimientos (cuenta_id, fecha);

create table if not exists public.ctl_banco_conciliaciones (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cuenta_id uuid not null references public.ctl_bancos(id) on delete cascade,
  periodo text not null check (periodo ~ '^\d{4}-\d{2}$'),
  saldo_banco numeric(14, 2) not null,
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now(),
  unique (cuenta_id, periodo)
);

create table if not exists public.ctl_sa_tramites (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 200),
  detalle text check (char_length(detalle) <= 1000),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'hecho', 'no_aplica')),
  fecha date,
  costo numeric(14, 2) not null default 0 check (costo >= 0),
  responsable text check (char_length(responsable) <= 120),
  archivo text check (char_length(archivo) <= 400),
  orden smallint not null default 50,
  gasto_id uuid,
  creado timestamptz not null default now()
);

create table if not exists public.ctl_recordatorios (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 200),
  detalle text check (char_length(detalle) <= 1000),
  cada text not null default 'unico' check (cada in ('mensual', 'trimestral', 'anual', 'unico')),
  proxima date not null,
  dias_aviso smallint not null default 7 check (dias_aviso between 0 and 120),
  activo boolean not null default true,
  hecho_el date,
  creado timestamptz not null default now()
);

alter table public.ctl_sa enable row level security;
drop policy if exists ctl_sa_dueno on public.ctl_sa;
create policy ctl_sa_dueno on public.ctl_sa for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa from anon;
grant select, insert, update, delete on public.ctl_sa to authenticated;
alter table public.ctl_sa_documentos enable row level security;
drop policy if exists ctl_sa_documentos_dueno on public.ctl_sa_documentos;
create policy ctl_sa_documentos_dueno on public.ctl_sa_documentos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa_documentos from anon;
grant select, insert, update, delete on public.ctl_sa_documentos to authenticated;
alter table public.ctl_sa_socios enable row level security;
drop policy if exists ctl_sa_socios_dueno on public.ctl_sa_socios;
create policy ctl_sa_socios_dueno on public.ctl_sa_socios for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa_socios from anon;
grant select, insert, update, delete on public.ctl_sa_socios to authenticated;
alter table public.ctl_sa_acciones enable row level security;
drop policy if exists ctl_sa_acciones_dueno on public.ctl_sa_acciones;
create policy ctl_sa_acciones_dueno on public.ctl_sa_acciones for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa_acciones from anon;
grant select, insert, update, delete on public.ctl_sa_acciones to authenticated;
alter table public.ctl_sa_aportes enable row level security;
drop policy if exists ctl_sa_aportes_dueno on public.ctl_sa_aportes;
create policy ctl_sa_aportes_dueno on public.ctl_sa_aportes for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa_aportes from anon;
grant select, insert, update, delete on public.ctl_sa_aportes to authenticated;
alter table public.ctl_sa_transmisiones enable row level security;
drop policy if exists ctl_sa_transmisiones_dueno on public.ctl_sa_transmisiones;
create policy ctl_sa_transmisiones_dueno on public.ctl_sa_transmisiones for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa_transmisiones from anon;
grant select, insert, update, delete on public.ctl_sa_transmisiones to authenticated;
alter table public.ctl_sa_repartos enable row level security;
drop policy if exists ctl_sa_repartos_dueno on public.ctl_sa_repartos;
create policy ctl_sa_repartos_dueno on public.ctl_sa_repartos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa_repartos from anon;
grant select, insert, update, delete on public.ctl_sa_repartos to authenticated;
alter table public.ctl_sa_reparto_socios enable row level security;
drop policy if exists ctl_sa_reparto_socios_dueno on public.ctl_sa_reparto_socios;
create policy ctl_sa_reparto_socios_dueno on public.ctl_sa_reparto_socios for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa_reparto_socios from anon;
grant select, insert, update, delete on public.ctl_sa_reparto_socios to authenticated;
alter table public.ctl_bancos enable row level security;
drop policy if exists ctl_bancos_dueno on public.ctl_bancos;
create policy ctl_bancos_dueno on public.ctl_bancos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_bancos from anon;
grant select, insert, update, delete on public.ctl_bancos to authenticated;
alter table public.ctl_banco_movimientos enable row level security;
drop policy if exists ctl_banco_movimientos_dueno on public.ctl_banco_movimientos;
create policy ctl_banco_movimientos_dueno on public.ctl_banco_movimientos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_banco_movimientos from anon;
grant select, insert, update, delete on public.ctl_banco_movimientos to authenticated;
alter table public.ctl_banco_conciliaciones enable row level security;
drop policy if exists ctl_banco_conciliaciones_dueno on public.ctl_banco_conciliaciones;
create policy ctl_banco_conciliaciones_dueno on public.ctl_banco_conciliaciones for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_banco_conciliaciones from anon;
grant select, insert, update, delete on public.ctl_banco_conciliaciones to authenticated;
alter table public.ctl_sa_tramites enable row level security;
drop policy if exists ctl_sa_tramites_dueno on public.ctl_sa_tramites;
create policy ctl_sa_tramites_dueno on public.ctl_sa_tramites for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_sa_tramites from anon;
grant select, insert, update, delete on public.ctl_sa_tramites to authenticated;
alter table public.ctl_recordatorios enable row level security;
drop policy if exists ctl_recordatorios_dueno on public.ctl_recordatorios;
create policy ctl_recordatorios_dueno on public.ctl_recordatorios for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_recordatorios from anon;
grant select, insert, update, delete on public.ctl_recordatorios to authenticated;

create table if not exists public.ctl_marca (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text check (char_length(nombre) <= 120),
  cargo text check (char_length(cargo) <= 120),
  correo text check (char_length(correo) <= 120),
  telefono text check (char_length(telefono) <= 30),
  sitio text check (char_length(sitio) <= 120),
  redes jsonb not null default '{}'::jsonb check (jsonb_typeof(redes) = 'object'),
  color text check (char_length(color) <= 40),
  creado timestamptz not null default now(),
  unique (owner)
);

create table if not exists public.ctl_documentos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('cotizacion', 'propuesta', 'acuerdo', 'membretada')),
  area text not null default 'web' check (area in ('corporativo', 'web', 'musica', 'diseno')),
  anio smallint not null,
  numero integer,
  cliente_id text check (cliente_id is null or char_length(cliente_id) between 1 and 200),
  proyecto_id uuid references public.projects(id) on delete set null,
  fecha date not null,
  vigencia_dias smallint check (vigencia_dias between 1 and 365),
  titulo text not null check (char_length(titulo) between 1 and 200),
  datos jsonb not null default '{}'::jsonb check (jsonb_typeof(datos) = 'object'),
  contenido text check (char_length(contenido) <= 60000),
  estado text not null default 'borrador' check (estado in ('borrador', 'enviado', 'aceptado', 'rechazado')),
  creado timestamptz not null default now()
);

create unique index if not exists ctl_documentos_numero on public.ctl_documentos (owner, tipo, anio, numero) where numero is not null;
create index if not exists ctl_documentos_cliente on public.ctl_documentos (owner, cliente_id);

alter table public.ctl_marca enable row level security;
drop policy if exists ctl_marca_dueno on public.ctl_marca;
create policy ctl_marca_dueno on public.ctl_marca for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_marca from anon;
grant select, insert, update, delete on public.ctl_marca to authenticated;
alter table public.ctl_documentos enable row level security;
drop policy if exists ctl_documentos_dueno on public.ctl_documentos;
create policy ctl_documentos_dueno on public.ctl_documentos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_documentos from anon;
grant select, insert, update, delete on public.ctl_documentos to authenticated;
