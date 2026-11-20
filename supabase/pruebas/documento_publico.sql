begin;

insert into public.ctl_links (owner, codigo, tipo, titulo, area, cuerpo, whatsapp)
select id, 'PruebaDeLinkPublico0123456789abcdefXYZ', 'cotizacion', 'Cotización de prueba', 'web', '<h1>Cotización</h1><p>Total Q 100.00</p>', null
from auth.users order by created_at limit 1;

insert into public.ctl_links (owner, codigo, tipo, titulo, area, cuerpo)
select id, 'PruebaDeLinkRetirado0123456789abcdefXYZ', 'propuesta', 'Retirado', 'web', '<p>x</p>'
from auth.users order by created_at limit 1;
update public.ctl_links set estado = 'retirado' where codigo = 'PruebaDeLinkRetirado0123456789abcdefXYZ';

set local role anon;

do $$
declare t text; n integer;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename like 'ctl\_%' loop
    begin
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then raise exception 'anon ve % filas de %', n, t; end if;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

do $$
declare r jsonb;
begin
  r := public.ctl_documento_publico('PruebaDeLinkPublico0123456789abcdefXYZ');
  if r->>'estado' <> 'activo' then raise exception 'no devolvió el documento: %', r; end if;
  if r ? 'numero' or r ? 'owner' or r ? 'cliente_id' or r ? 'documento_id' then raise exception 'devuelve datos internos: %', r; end if;
  r := public.ctl_documento_publico('PruebaDeLinkRetirado0123456789abcdefXYZ');
  if r->>'estado' <> 'no_existe' then raise exception 'un link retirado se ve: %', r; end if;
  r := public.ctl_documento_publico('corto');
  if r->>'estado' <> 'no_existe' then raise exception 'un código inválido respondió: %', r; end if;
  r := public.ctl_documento_aceptar('PruebaDeLinkPublico0123456789abcdefXYZ', 'Cliente de prueba');
  if (r->>'ok')::boolean is not true then raise exception 'no se pudo aceptar: %', r; end if;
end $$;

reset role;

do $$
begin
  begin
    insert into public.ctl_links (owner, codigo, tipo, titulo, area, cuerpo)
    select id, 'PruebaDeContratoNoWeb0123456789abcdefXYZ', 'acuerdo', 'Contrato', 'web', '<p>x</p>' from auth.users limit 1;
    raise exception 'se pudo crear un link de contrato';
  exception when check_violation then null;
  end;
end $$;

rollback;
