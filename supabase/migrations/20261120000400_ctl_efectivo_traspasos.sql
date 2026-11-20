alter table public.ctl_cuentas add column if not exists tipo text not null default 'banco';
alter table public.ctl_cuentas drop constraint if exists ctl_cuentas_tipo_check;
alter table public.ctl_cuentas add constraint ctl_cuentas_tipo_check check (tipo in ('banco', 'efectivo'));
alter table public.ctl_cuentas add column if not exists saldo_inicial numeric(12, 2) not null default 0;

alter table public.ctl_gastos add column if not exists destino text check (char_length(destino) <= 60);

create table if not exists public.ctl_traspasos (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  monto numeric(12, 2) not null check (monto > 0),
  de text not null check (char_length(de) between 1 and 60),
  a text not null check (char_length(a) between 1 and 60),
  nota text check (char_length(nota) <= 500),
  creado timestamptz not null default now(),
  check (de <> a)
);

alter table public.ctl_traspasos enable row level security;
drop policy if exists ctl_traspasos_dueno on public.ctl_traspasos;
create policy ctl_traspasos_dueno on public.ctl_traspasos for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_traspasos from anon;
grant select, insert, update, delete on public.ctl_traspasos to authenticated;
