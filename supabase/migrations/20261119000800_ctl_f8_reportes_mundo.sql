create table if not exists public.ctl_mw_areas (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  area text not null check (char_length(area) between 1 and 40),
  creado timestamptz not null default now(),
  unique (owner, area)
);

alter table public.ctl_mw_areas enable row level security;
drop policy if exists ctl_mw_areas_dueno on public.ctl_mw_areas;
create policy ctl_mw_areas_dueno on public.ctl_mw_areas for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
revoke all on public.ctl_mw_areas from anon;
grant select, insert, update, delete on public.ctl_mw_areas to authenticated;

create or replace view public.ctl_dinero_empresa with (security_invoker = true) as
select t.id, t.tx_date as fecha, t.kind as tipo, t.amount as monto, t.currency as moneda, t.category as categoria, t.area, t.note as nota
from public.fin_transactions t
where t.user_id = auth.uid()
  and t.area in (select a.area from public.ctl_mw_areas a where a.owner = auth.uid());

grant select on public.ctl_dinero_empresa to authenticated;

create or replace function public.ctl_mw_areas_disponibles()
returns setof text
language sql
stable
security invoker
set search_path = public
as $$
  select distinct area from public.fin_transactions where user_id = auth.uid() order by 1
$$;

grant execute on function public.ctl_mw_areas_disponibles() to authenticated;
