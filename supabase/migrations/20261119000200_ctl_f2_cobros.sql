create table if not exists public.ctl_cobros (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  clave text not null check (char_length(clave) between 3 and 120),
  cliente_id text check (cliente_id is null or char_length(cliente_id) between 1 and 200),
  proyecto_id uuid references public.projects(id) on delete set null,
  tipo text not null check (tipo in ('inscripcion', 'mensualidad', 'extra', 'salario')),
  concepto text check (char_length(concepto) <= 200),
  vence date,
  monto numeric(12, 2) check (monto >= 0),
  saldado boolean not null default false,
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now(),
  unique (owner, clave),
  check (cliente_id is not null or tipo = 'salario')
);

create table if not exists public.ctl_pagos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id text check (cliente_id is null or char_length(cliente_id) between 1 and 200),
  cobro_clave text not null check (char_length(cobro_clave) between 3 and 120),
  fecha date not null,
  monto numeric(12, 2) not null check (monto > 0),
  cuenta text not null check (char_length(cuenta) between 1 and 60),
  referencia text check (char_length(referencia) <= 120),
  nota text check (char_length(nota) <= 500),
  recibo_numero integer,
  creado timestamptz not null default now(),
  check (cliente_id is not null or cobro_clave like 's:%')
);

create table if not exists public.ctl_pago_extra (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  recibo_numero integer,
  referencia text check (char_length(referencia) <= 120),
  creado timestamptz not null default now(),
  unique (owner, payment_id)
);

create unique index if not exists ctl_pago_extra_recibo on public.ctl_pago_extra (owner, recibo_numero) where recibo_numero is not null;

create index if not exists ctl_pagos_cliente on public.ctl_pagos (cliente_id, fecha);
create index if not exists ctl_pagos_cobro on public.ctl_pagos (owner, cobro_clave);
create unique index if not exists ctl_pagos_recibo on public.ctl_pagos (owner, recibo_numero) where recibo_numero is not null;

alter table public.ctl_cobros enable row level security;
drop policy if exists ctl_cobros_dueno on public.ctl_cobros;
create policy ctl_cobros_dueno on public.ctl_cobros for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_cobros from anon;
grant select, insert, update, delete on public.ctl_cobros to authenticated;
alter table public.ctl_pagos enable row level security;
drop policy if exists ctl_pagos_dueno on public.ctl_pagos;
create policy ctl_pagos_dueno on public.ctl_pagos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_pagos from anon;
grant select, insert, update, delete on public.ctl_pagos to authenticated;
alter table public.ctl_pago_extra enable row level security;
drop policy if exists ctl_pago_extra_dueno on public.ctl_pago_extra;
create policy ctl_pago_extra_dueno on public.ctl_pago_extra for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid() and exists (select 1 from public.payments p where p.id = payment_id and p.user_id = auth.uid()));
revoke all on public.ctl_pago_extra from anon;
grant select, insert, update, delete on public.ctl_pago_extra to authenticated;
