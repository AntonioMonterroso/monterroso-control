create table if not exists public.ctl_dev_supabase (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  proyecto_id uuid references public.projects(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),
  ref text not null check (char_length(ref) between 3 and 200),
  plan text not null default 'gratis' check (plan in ('gratis', 'pro')),
  anon_key text check (anon_key is null or (char_length(anon_key) <= 1000 and anon_key !~* '^(sbp_|sb_secret_)')),
  ultimo_uso timestamptz,
  creado timestamptz not null default now()
);

create table if not exists public.ctl_dev_tokens (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  proyecto_id uuid references public.projects(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),
  tipo text not null check (tipo in ('supabase', 'github', 'ia', 'otro')),
  donde text check (char_length(donde) <= 300),
  ultimos4 text check (ultimos4 is null or char_length(ultimos4) <= 4),
  creado_el date,
  vence date,
  revocar_el date,
  revocado boolean not null default false,
  revocado_el date,
  creado timestamptz not null default now()
);

create table if not exists public.ctl_dev_servicios (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  proyecto_id uuid references public.projects(id) on delete cascade,
  tipo text not null check (tipo in ('dominio', 'hosting', 'suscripcion', 'otro')),
  nombre text not null check (char_length(nombre) between 1 and 200),
  proveedor text check (char_length(proveedor) <= 120),
  renovacion date,
  periodo text not null default 'anual' check (periodo in ('mensual', 'anual', 'unico')),
  costo numeric(12, 2) not null default 0 check (costo >= 0),
  paga text not null default 'yo' check (paga in ('cliente', 'yo')),
  categoria_id uuid references public.ctl_categorias(id) on delete set null,
  activo boolean not null default true,
  nota text check (char_length(nota) <= 1000),
  creado timestamptz not null default now()
);

create table if not exists public.ctl_dev_enlaces (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  proyecto_id uuid references public.projects(id) on delete cascade,
  tipo text not null check (tipo in ('repo', 'pagina', 'supabase', 'vercel', 'pages', 'otro')),
  nombre text not null check (char_length(nombre) between 1 and 120),
  url text not null check (url ~* '^https?://' and char_length(url) <= 500),
  revisado_en timestamptz,
  responde boolean,
  creado timestamptz not null default now()
);

create table if not exists public.ctl_dev_bitacora (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  proyecto_id uuid not null references public.projects(id) on delete cascade,
  fecha date not null,
  cambio text not null check (char_length(cambio) between 1 and 2000),
  version text check (char_length(version) <= 40),
  creado timestamptz not null default now()
);

create index if not exists ctl_dev_bitacora_proyecto on public.ctl_dev_bitacora (proyecto_id, fecha desc);

alter table public.ctl_gastos add column if not exists dev_servicio_id uuid references public.ctl_dev_servicios(id) on delete set null;
create unique index if not exists ctl_gastos_dev_servicio_mes on public.ctl_gastos (dev_servicio_id, periodo) where dev_servicio_id is not null;

alter table public.ctl_dev_supabase enable row level security;
drop policy if exists ctl_dev_supabase_dueno on public.ctl_dev_supabase;
create policy ctl_dev_supabase_dueno on public.ctl_dev_supabase for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_dev_supabase from anon;
grant select, insert, update, delete on public.ctl_dev_supabase to authenticated;
alter table public.ctl_dev_tokens enable row level security;
drop policy if exists ctl_dev_tokens_dueno on public.ctl_dev_tokens;
create policy ctl_dev_tokens_dueno on public.ctl_dev_tokens for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_dev_tokens from anon;
grant select, insert, update, delete on public.ctl_dev_tokens to authenticated;
alter table public.ctl_dev_servicios enable row level security;
drop policy if exists ctl_dev_servicios_dueno on public.ctl_dev_servicios;
create policy ctl_dev_servicios_dueno on public.ctl_dev_servicios for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_dev_servicios from anon;
grant select, insert, update, delete on public.ctl_dev_servicios to authenticated;
alter table public.ctl_dev_enlaces enable row level security;
drop policy if exists ctl_dev_enlaces_dueno on public.ctl_dev_enlaces;
create policy ctl_dev_enlaces_dueno on public.ctl_dev_enlaces for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_dev_enlaces from anon;
grant select, insert, update, delete on public.ctl_dev_enlaces to authenticated;
alter table public.ctl_dev_bitacora enable row level security;
drop policy if exists ctl_dev_bitacora_dueno on public.ctl_dev_bitacora;
create policy ctl_dev_bitacora_dueno on public.ctl_dev_bitacora for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_dev_bitacora from anon;
grant select, insert, update, delete on public.ctl_dev_bitacora to authenticated;
