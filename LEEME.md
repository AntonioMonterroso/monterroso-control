# Monterroso Control

## Ver la app en este equipo

```bash
cd "/Users/antoniomonterrosojr./Documents/Claude/Monterroso Control/app" && npm run dev
```

Abre http://localhost:5173. Para verla sin la base, usa «Entrar en modo de prueba»: lo que guardes ahí se queda solo en ese navegador.

## SQL que falta correr

Hay que correrlo una sola vez, en este orden, en el SQL Editor del Supabase de Monterroso World. Todos los archivos se pueden volver a correr sin dañar nada.

1. `supabase/migrations/20261119000100_ctl_f1_base.sql` (negocios y lo extra de clientes y proyectos de World)
2. `supabase/migrations/20261119000200_ctl_f2_cobros.sql`
3. `supabase/migrations/20261119000300_ctl_f3_gastos.sql` (también crea el espacio privado `ctl-archivos` para facturas y comprobantes)
4. `supabase/migrations/20261119000400_ctl_f4_presupuestos.sql`
5. `supabase/migrations/20261119000500_ctl_f5_tienda_salario_deudas.sql`
6. `supabase/migrations/20261119000600_ctl_f6_impuestos.sql`
7. `supabase/migrations/20261119000700_ctl_f7_contratos_tarifas.sql`
8. `supabase/migrations/20261119000800_ctl_f8_reportes_mundo.sql` (solo lee `fin_transactions` de Monterroso World, por las áreas que marques como Empresa)
9. `supabase/migrations/20261119000900_ctl_desarrollo.sql` (Supabase, tokens sin su valor, dominios y servicios, enlaces y bitácora)
10. `supabase/migrations/20261119001000_ctl_tienda_pagos.sql` (pagos de Hogar Canela ligados a sus pedidos)

Los clientes y proyectos de Dev Studio son los mismos de Monterroso World: Control lee y escribe `projects`, `payments` y `settings.data.clientExtra` con la misma forma que World. Lo que World no tiene va en las tablas `ctl_*` ligadas por el id del trabajo o la llave del cliente.

Cuando entras por primera vez con tu cuenta, la app crea sola:

- los tres negocios;
- las categorías base;
- la plantilla de contrato.
