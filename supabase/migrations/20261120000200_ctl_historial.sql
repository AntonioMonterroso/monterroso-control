create table if not exists public.ctl_historial (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tabla text not null check (tabla in ('projects', 'ctl_tarifas', 'ctl_productos', 'ctl_cliente_extra')),
  registro_id text not null check (char_length(registro_id) between 1 and 200),
  campo text not null check (char_length(campo) between 1 and 60),
  desde text not null check (desde ~ '^\d{4}-\d{2}$'),
  antes text check (char_length(antes) <= 500),
  despues text check (char_length(despues) <= 500),
  motivo text check (char_length(motivo) <= 500),
  por text check (char_length(por) <= 200),
  creado timestamptz not null default now()
);

create index if not exists ctl_historial_registro on public.ctl_historial (owner, tabla, registro_id, campo, desde);

alter table public.ctl_historial enable row level security;
drop policy if exists ctl_historial_dueno on public.ctl_historial;
create policy ctl_historial_dueno on public.ctl_historial for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_historial from anon;
grant select, insert, update, delete on public.ctl_historial to authenticated;
