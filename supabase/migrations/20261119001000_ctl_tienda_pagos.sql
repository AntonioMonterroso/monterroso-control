create table if not exists public.ctl_tienda_pagos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  medio text not null check (medio in ('shopify', 'contra_entrega', 'dropi', 'transferencia', 'otro')),
  monto numeric(12, 2) not null check (monto > 0),
  referencia text check (char_length(referencia) <= 120),
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now()
);

create table if not exists public.ctl_tienda_pago_partes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pago_id uuid not null references public.ctl_tienda_pagos(id) on delete cascade,
  venta_id uuid not null references public.ctl_ventas_tienda(id) on delete cascade,
  monto numeric(12, 2) not null check (monto > 0),
  creado timestamptz not null default now(),
  unique (pago_id, venta_id)
);

create index if not exists ctl_tienda_pago_partes_venta on public.ctl_tienda_pago_partes (venta_id);
create index if not exists ctl_tienda_pagos_fecha on public.ctl_tienda_pagos (owner, fecha);

alter table public.ctl_tienda_pagos enable row level security;
drop policy if exists ctl_tienda_pagos_dueno on public.ctl_tienda_pagos;
create policy ctl_tienda_pagos_dueno on public.ctl_tienda_pagos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_tienda_pagos from anon;
grant select, insert, update, delete on public.ctl_tienda_pagos to authenticated;
alter table public.ctl_tienda_pago_partes enable row level security;
drop policy if exists ctl_tienda_pago_partes_dueno on public.ctl_tienda_pago_partes;
create policy ctl_tienda_pago_partes_dueno on public.ctl_tienda_pago_partes for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid() and exists (select 1 from public.ctl_tienda_pagos p where p.id = pago_id and p.owner = auth.uid()) and exists (select 1 from public.ctl_ventas_tienda v where v.id = venta_id and v.owner = auth.uid()));
revoke all on public.ctl_tienda_pago_partes from anon;
grant select, insert, update, delete on public.ctl_tienda_pago_partes to authenticated;
