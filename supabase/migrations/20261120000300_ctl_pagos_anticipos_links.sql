create table if not exists public.ctl_cuentas (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  banco text not null check (char_length(banco) between 1 and 80),
  nombre text check (char_length(nombre) <= 80),
  ultimos4 text check (ultimos4 ~ '^[0-9A-Za-z]{1,4}$'),
  moneda text not null default 'GTQ' check (moneda in ('GTQ', 'USD')),
  activo boolean not null default true,
  orden smallint not null default 50,
  creado timestamptz not null default now()
);

alter table public.ctl_pago_extra add column if not exists forma text check (forma in ('efectivo', 'transferencia', 'deposito', 'tarjeta', 'cheque', 'anticipo', 'otro'));
alter table public.ctl_pago_extra add column if not exists destino text check (char_length(destino) <= 60);
alter table public.ctl_pago_extra add column if not exists comprobantes jsonb not null default '[]'::jsonb;
alter table public.ctl_pago_extra add column if not exists anticipo_id uuid;
alter table public.ctl_pago_extra add column if not exists registrado_por text check (char_length(registrado_por) <= 200);

alter table public.ctl_pagos add column if not exists forma text check (forma in ('efectivo', 'transferencia', 'deposito', 'tarjeta', 'cheque', 'anticipo', 'otro'));
alter table public.ctl_pagos add column if not exists destino text check (char_length(destino) <= 60);
alter table public.ctl_pagos add column if not exists comprobantes jsonb not null default '[]'::jsonb;
alter table public.ctl_pagos add column if not exists anticipo_id uuid;
alter table public.ctl_pagos add column if not exists registrado_por text check (char_length(registrado_por) <= 200);

alter table public.ctl_tienda_pagos add column if not exists destino text check (char_length(destino) <= 60);
alter table public.ctl_tienda_pagos add column if not exists comprobantes jsonb not null default '[]'::jsonb;

alter table public.ctl_cobros add column if not exists clase text check (clase in ('unico', 'servicio', 'mensualidad', 'otro'));
alter table public.ctl_cobros add column if not exists regimen text check (char_length(regimen) <= 40);

create table if not exists public.ctl_anticipos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  cliente_id text not null check (char_length(cliente_id) between 1 and 200),
  proyecto_id uuid references public.projects(id) on delete set null,
  monto numeric(12, 2) not null check (monto > 0),
  forma text not null check (forma in ('efectivo', 'transferencia', 'deposito', 'tarjeta', 'cheque', 'otro')),
  destino text check (char_length(destino) <= 60),
  referencia text check (char_length(referencia) <= 120),
  nota text check (char_length(nota) <= 500),
  comprobantes jsonb not null default '[]'::jsonb,
  aplicar_solo boolean not null default true,
  estado text not null default 'activo' check (estado in ('activo', 'devuelto', 'a_favor')),
  devuelto_el date,
  devuelto_monto numeric(12, 2) check (devuelto_monto >= 0),
  registrado_por text check (char_length(registrado_por) <= 200),
  creado timestamptz not null default now()
);

create table if not exists public.ctl_traslados (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  monto numeric(12, 2) not null check (monto > 0),
  de_destino text not null check (char_length(de_destino) between 1 and 60),
  banco_id uuid not null references public.ctl_bancos(id) on delete restrict,
  pagos text[] not null default '{}',
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now()
);

alter table public.ctl_banco_movimientos drop constraint if exists ctl_banco_movimientos_origen_check;
alter table public.ctl_banco_movimientos add constraint ctl_banco_movimientos_origen_check check (origen in ('manual', 'pago', 'gasto', 'aporte', 'dividendo', 'deuda', 'traslado', 'anticipo'));

create table if not exists public.ctl_links (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  codigo text not null unique check (codigo ~ '^[A-Za-z0-9_-]{32,64}$'),
  tipo text not null check (tipo in ('cotizacion', 'propuesta', 'estado_cuenta', 'recibo')),
  documento_id uuid references public.ctl_documentos(id) on delete cascade,
  cliente_id text check (char_length(cliente_id) <= 200),
  pago_id text check (char_length(pago_id) <= 120),
  titulo text not null check (char_length(titulo) between 1 and 200),
  area text not null default 'corporativo' check (char_length(area) <= 30),
  cuerpo text not null check (char_length(cuerpo) <= 200000),
  vence date,
  estado text not null default 'activo' check (estado in ('activo', 'retirado')),
  whatsapp text check (whatsapp ~ '^[0-9]{8,15}$'),
  visto_primero timestamptz,
  vistas integer not null default 0,
  aceptado_por text check (char_length(aceptado_por) <= 120),
  aceptado_el timestamptz,
  creado timestamptz not null default now()
);

create index if not exists ctl_links_documento on public.ctl_links (owner, documento_id);

do $$
declare t text;
begin
  foreach t in array array['ctl_cuentas', 'ctl_anticipos', 'ctl_traslados', 'ctl_links'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_dueno', t);
    execute format('create policy %I on public.%I for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid())', t || '_dueno', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

create or replace function public.ctl_documento_publico(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare l public.ctl_links;
begin
  if p_codigo is null or p_codigo !~ '^[A-Za-z0-9_-]{32,64}$' then
    return jsonb_build_object('estado', 'no_existe');
  end if;
  select * into l from public.ctl_links where codigo = p_codigo;
  if not found or l.estado = 'retirado' or l.tipo not in ('cotizacion', 'propuesta', 'estado_cuenta', 'recibo') then
    return jsonb_build_object('estado', 'no_existe');
  end if;
  if l.vence is not null and l.vence < current_date then
    return jsonb_build_object('estado', 'vencido', 'titulo', l.titulo, 'area', l.area, 'whatsapp', l.whatsapp);
  end if;
  update public.ctl_links set vistas = vistas + 1, visto_primero = coalesce(visto_primero, now()) where id = l.id;
  return jsonb_build_object(
    'estado', 'activo',
    'tipo', l.tipo,
    'titulo', l.titulo,
    'area', l.area,
    'cuerpo', l.cuerpo,
    'vence', l.vence,
    'whatsapp', l.whatsapp,
    'puede_aceptar', l.tipo in ('cotizacion', 'propuesta'),
    'aceptado_por', l.aceptado_por,
    'aceptado_el', l.aceptado_el
  );
end;
$$;

create or replace function public.ctl_documento_aceptar(p_codigo text, p_nombre text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare l public.ctl_links;
begin
  if p_codigo is null or p_codigo !~ '^[A-Za-z0-9_-]{32,64}$' or p_nombre is null or char_length(trim(p_nombre)) not between 2 and 120 then
    return jsonb_build_object('ok', false);
  end if;
  select * into l from public.ctl_links where codigo = p_codigo;
  if not found or l.estado <> 'activo' or l.tipo not in ('cotizacion', 'propuesta') or (l.vence is not null and l.vence < current_date) then
    return jsonb_build_object('ok', false);
  end if;
  if l.aceptado_el is null then
    update public.ctl_links set aceptado_por = trim(p_nombre), aceptado_el = now() where id = l.id;
  end if;
  return jsonb_build_object('ok', true, 'aceptado_el', coalesce(l.aceptado_el, now()));
end;
$$;

revoke all on function public.ctl_documento_publico(text) from public;
revoke all on function public.ctl_documento_aceptar(text, text) from public;
grant execute on function public.ctl_documento_publico(text) to anon, authenticated;
grant execute on function public.ctl_documento_aceptar(text, text) to anon, authenticated;

alter table public.ctl_historial drop constraint if exists ctl_historial_tabla_check;
alter table public.ctl_historial add constraint ctl_historial_tabla_check check (tabla in ('projects', 'ctl_tarifas', 'ctl_productos', 'ctl_cliente_extra', 'payments', 'ctl_pagos', 'ctl_anticipos'));
alter table public.ctl_historial drop constraint if exists ctl_historial_desde_check;
alter table public.ctl_historial add constraint ctl_historial_desde_check check (desde ~ '^\d{4}-\d{2}$');
