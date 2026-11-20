create table if not exists public.ctl_negocios (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  clave text not null check (clave in ('dev', 'canela', 'salario')),
  nombre text not null check (char_length(nombre) between 1 and 80),
  descripcion text check (char_length(descripcion) <= 300),
  activo boolean not null default true,
  orden smallint not null default 0,
  creado timestamptz not null default now(),
  unique (owner, clave)
);

create table if not exists public.ctl_cliente_extra (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_key text not null check (char_length(client_key) between 1 and 200),
  direccion text check (char_length(direccion) <= 300),
  notas text check (char_length(notas) <= 2000),
  activo boolean not null default true,
  creado timestamptz not null default now(),
  unique (owner, client_key)
);

create table if not exists public.ctl_proyecto_extra (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  inscripcion_forma text check (inscripcion_forma in ('completa', 'mitad', 'personalizada')),
  partes jsonb not null default '[]'::jsonb check (jsonb_typeof(partes) = 'array' and jsonb_array_length(partes) <= 24),
  fecha_firma date,
  notas_tecnicas text check (char_length(notas_tecnicas) <= 10000),
  creado timestamptz not null default now(),
  unique (owner, project_id)
);

alter table public.ctl_negocios enable row level security;
alter table public.ctl_cliente_extra enable row level security;
alter table public.ctl_proyecto_extra enable row level security;

drop policy if exists ctl_negocios_dueno on public.ctl_negocios;
create policy ctl_negocios_dueno on public.ctl_negocios for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists ctl_cliente_extra_dueno on public.ctl_cliente_extra;
create policy ctl_cliente_extra_dueno on public.ctl_cliente_extra for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists ctl_proyecto_extra_dueno on public.ctl_proyecto_extra;
create policy ctl_proyecto_extra_dueno on public.ctl_proyecto_extra for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

revoke all on public.ctl_negocios, public.ctl_cliente_extra, public.ctl_proyecto_extra from anon;
grant select, insert, update, delete on public.ctl_negocios, public.ctl_cliente_extra, public.ctl_proyecto_extra to authenticated;
