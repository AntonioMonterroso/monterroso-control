create table if not exists public.ctl_ia_uso (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creado timestamptz not null default now(),
  modelo text not null check (char_length(modelo) between 1 and 60),
  tarea text not null check (tarea in ('anotar', 'preguntar', 'revisar')),
  tokens_entrada integer not null default 0 check (tokens_entrada >= 0),
  tokens_salida integer not null default 0 check (tokens_salida >= 0),
  costo_usd numeric(10, 6) not null default 0 check (costo_usd >= 0)
);

create index if not exists ctl_ia_uso_owner_creado on public.ctl_ia_uso (owner, creado);

do $$
declare t text;
begin
  foreach t in array array['ctl_ia_uso'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_dueno', t);
    execute format('create policy %I on public.%I for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid())', t || '_dueno', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

revoke update, delete on public.ctl_ia_uso from authenticated;
