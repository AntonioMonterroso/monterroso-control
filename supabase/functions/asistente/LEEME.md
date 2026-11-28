# Función «asistente»

Es la parte del asistente que corre en Supabase. Guarda la llave de Anthropic lejos de la página pública, revisa que quien pregunta haya entrado con su cuenta, lleva la cuenta de lo gastado en el mes y no deja pasar de USD 25 (avisa desde USD 20).

Modelos:

- Anotar y preguntar: `claude-haiku-5-5` (USD 0.10 por millón de tokens de entrada, USD 0.50 de salida).
- Revisar el mes: `claude-sonnet-5-5` (USD 2 y USD 10). Si Sonnet 5.5 rechaza la revisión por sus filtros de seguridad, la misma llamada la repite con `claude-sonnet-5`, que cuesta lo mismo.

Proyecto de Supabase: `mrujxfkrvzfotvxgfadg`.

## 1. Crear la tabla de lo gastado (una sola vez)

En el SQL Editor del proyecto, corre `supabase/migrations/20261127000100_ctl_ia_uso.sql`. Se puede volver a correr sin dañar nada.

## 2. Poner la llave de Anthropic (lo haces tú)

1. Entra a https://supabase.com/dashboard/project/mrujxfkrvzfotvxgfadg/functions/secrets (Edge Functions › Secrets).
2. Agrega un secreto con el nombre `ANTHROPIC_API_KEY` y como valor tu llave de la consola de Anthropic.
3. Guarda.

La llave no va en ningún archivo de este proyecto ni en la página.

## 3. Subir la función

Con la línea de comandos de Supabase, desde la carpeta `Monterroso Control`:

```bash
cd "/Users/antoniomonterrosojr./Documents/Claude/Monterroso Control"
npx supabase login
npx supabase functions deploy asistente --project-ref mrujxfkrvzfotvxgfadg
```

Sin la línea de comandos: en el panel, Edge Functions › Deploy a new function › Via Editor, nombre `asistente`, pega todo `supabase/functions/asistente/index.ts` y dale Deploy.

Deja encendido «Verify JWT» (viene así): solo responde a quien entró con su cuenta.

`SUPABASE_URL` y `SUPABASE_ANON_KEY` ya vienen puestas en todas las funciones; no hay que agregarlas.

## 4. Probar

Abre Monterroso Control con tu cuenta (no en modo de prueba), toca «Asistente» abajo a la derecha y escribe «¿quién me debe más?». Al pie del panel sale «Gastado este mes: USD … de 25».

## Cómo se cuida el tope

- Antes de cada llamada la función suma `costo_usd` de `ctl_ia_uso` desde el día 1 del mes (hora de Guatemala).
- Si ya va en USD 25 o más, no llama al modelo y responde que se llegó al tope.
- Si lo más que podría costar la llamada haría pasar de USD 25, tampoco la hace.
- Después de cada llamada guarda los tokens y el costo exacto de esa respuesta.
- Desde la página solo se puede leer y agregar en `ctl_ia_uso`; no se puede cambiar ni borrar lo anotado.
