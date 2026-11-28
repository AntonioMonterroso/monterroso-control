import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const TOPE_USD = 25;
const AVISO_USD = 20;
const HAIKU = "claude-haiku-5-5";
const SONNET = "claude-sonnet-5-5";
const SONNET_RESPALDO = "claude-sonnet-5";

const PRECIOS: Record<string, { entrada: number; salida: number; largoEntrada?: number; largoSalida?: number; limite?: number }> = {
  [HAIKU]: { entrada: 0.1, salida: 0.5, largoEntrada: 0.5, largoSalida: 2.5, limite: 100000 },
  [SONNET]: { entrada: 2, salida: 10 },
  [SONNET_RESPALDO]: { entrada: 2, salida: 10 },
};

const ORIGENES = [/^https:\/\/control\.studiomonterroso\.com$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];

type Tarea = "uso" | "anotar" | "preguntar" | "revisar";
interface Mensaje { rol: "usuario" | "asistente"; texto: string }
interface Pedido { tarea: Tarea; mensajes: Mensaje[]; contexto: string }

function cabeceras(origen: string | null): Record<string, string> {
  const ok = origen && ORIGENES.some((r) => r.test(origen));
  return {
    "Access-Control-Allow-Origin": ok ? origen : "https://control.studiomonterroso.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function responder(origen: string | null, estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cabeceras(origen), "Content-Type": "application/json; charset=utf-8" } });
}

function inicioDelMes(): string {
  const gt = new Date(Date.now() - 6 * 3600000);
  const a = gt.getUTCFullYear();
  const m = gt.getUTCMonth();
  return new Date(Date.UTC(a, m, 1, 6, 0, 0)).toISOString();
}

function costo(modelo: string, entrada: number, salida: number): number {
  const p = PRECIOS[modelo] ?? PRECIOS[SONNET];
  const largo = p.limite != null && entrada > p.limite;
  const pe = largo ? p.largoEntrada ?? p.entrada : p.entrada;
  const ps = largo ? p.largoSalida ?? p.salida : p.salida;
  return Math.round(((entrada * pe + salida * ps) / 1_000_000) * 1_000_000) / 1_000_000;
}

function leerPedido(x: unknown): Pedido | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const tarea = o.tarea;
  if (tarea !== "uso" && tarea !== "anotar" && tarea !== "preguntar" && tarea !== "revisar") return null;
  const contexto = typeof o.contexto === "string" ? o.contexto : "";
  if (contexto.length > 60000) return null;
  const crudos = Array.isArray(o.mensajes) ? o.mensajes : [];
  if (crudos.length > 12) return null;
  const mensajes: Mensaje[] = [];
  for (const m of crudos) {
    if (!m || typeof m !== "object") return null;
    const r = m as Record<string, unknown>;
    if ((r.rol !== "usuario" && r.rol !== "asistente") || typeof r.texto !== "string" || r.texto.length > 2000) return null;
    if (r.texto.trim()) mensajes.push({ rol: r.rol, texto: r.texto });
  }
  if (tarea !== "uso" && tarea !== "revisar" && (!mensajes.length || mensajes[mensajes.length - 1].rol !== "usuario")) return null;
  return { tarea, mensajes, contexto };
}

function conversacion(mensajes: Mensaje[]): Anthropic.MessageParam[] {
  const l: Anthropic.MessageParam[] = [];
  for (const m of mensajes) {
    const role = m.rol === "usuario" ? "user" : "assistant";
    if (!l.length && role === "assistant") continue;
    const ultimo = l[l.length - 1];
    if (ultimo && ultimo.role === role) ultimo.content = `${ultimo.content as string}\n\n${m.texto}`;
    else l.push({ role, content: m.texto });
  }
  return l;
}

const REGLAS = `Eres el asistente de Monterroso Control, el sistema de dinero de Antonio en Guatemala. Hablas en español de Guatemala, de tú, claro y breve. El dinero se escribe así: «Q 1,350.00». Nunca inventes clientes, montos ni datos: usa solo lo que viene en DATOS. Nunca hagas sumas ni restas propias: copia las cifras exactas que vienen en DATOS. No escribas números de teléfono.`;

const SISTEMA_ANOTAR = `${REGLAS}

Tu trabajo: Antonio te dice un pago que recibió de un cliente o un gasto que hizo, y tú preparas el registro con la herramienta proponer_registro. Nada se guarda hasta que él lo confirme en pantalla.
- «me pagó», «me depositó», «recibí» de un cliente = tipo "pago". «pagué», «gasté», «compré» = tipo "gasto".
- cliente_dicho: el nombre tal como lo escribió Antonio. cliente_id: el id exacto de la lista de clientes solo si hay uno que coincide claramente; si no, "".
- cobro_clave: la clave exacta del cobro pendiente de ese cliente que mejor encaja (por ejemplo la mensualidad del mes que dijo, o la más vieja vencida); si no sabes, "".
- monto: número sin «Q» ni comas. fecha: AAAA-MM-DD; si no la dice, la de hoy; «ayer» es un día antes de hoy.
- forma: una de las formas de pago; si no la dice, "transferencia". destino: el valor exacto de la lista de destinos si lo dice o se deduce (efectivo, el banco que nombra); si no, "".
- Para gastos: negocio_clave según lo que dice o el negocio en pantalla (si es «todos», usa "dev"); categoria_id: el id exacto de la categoría que mejor encaja; descripcion: corta y clara, como «Internet de noviembre».
- Los campos que no apliquen van como "" (y monto 0 solo si de verdad no hay monto).
Si el mensaje no es un pago ni un gasto, o falta el monto, responde en texto con una pregunta corta, sin usar la herramienta.`;

const SISTEMA_PREGUNTAR = `${REGLAS}

Tu trabajo: responder la pregunta de Antonio con los DATOS de abajo, que ya vienen calculados por el sistema. «Lo que gané» = ingresos menos gastos («ganado»). Responde en 1 a 4 frases o una lista corta. Si la respuesta no está en los DATOS, dilo y sugiere en qué pantalla verlo (Lo que me deben, Pagos que recibí, Gastos, Reportes).`;

const SISTEMA_REVISAR = `${REGLAS}

Tu trabajo: revisar el mes con los DATOS de abajo (ya calculados por el sistema) y entregar la revisión con la herramienta entregar_revision.
- resumen: 2 o 3 frases. Empieza con lo que de verdad ganó (copia la cifra exacta de «Lo que de verdad ganó») y explica qué lo movió.
- hallazgos: lo que Antonio debe revisar o arreglar, de lo más importante a lo menos: cobros vencidos, posibles pagos repetidos, pagos sin comprobante, sin forma o sin decir dónde cayó, gastos fijos sin registrar, gastos sin factura. Cada uno con titulo corto, detalle con las cifras exactas de los DATOS y qué hacer, gravedad (alta, media o baja) y pantalla donde se arregla: "cobros" (lo que me deben), "pagos" (pagos que recibí: comprobantes, forma, dónde cayó, repetidos), "gastos" (gastos y gastos fijos), "cuentas", "cliente" (con su cliente_id exacto, el que va entre corchetes) o "ninguna". cliente_id va "" si no es de un cliente.
- Si todo está bien, dilo en el resumen y deja hallazgos con lo poco que haya.`;

const PROPONER: Anthropic.Tool = {
  name: "proponer_registro",
  description: "Prepara (sin guardar) el registro de un pago recibido de un cliente o de un gasto, para que Antonio lo confirme en pantalla.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      tipo: { type: "string", enum: ["pago", "gasto"] },
      cliente_dicho: { type: "string" },
      cliente_id: { type: "string" },
      cobro_clave: { type: "string" },
      monto: { type: "number" },
      fecha: { type: "string" },
      forma: { type: "string", enum: ["efectivo", "transferencia", "deposito", "tarjeta", "cheque", "otro"] },
      destino: { type: "string" },
      negocio_clave: { type: "string", enum: ["dev", "musica", "diseno", "canela", "salario", "sa", ""] },
      categoria_id: { type: "string" },
      descripcion: { type: "string" },
      nota: { type: "string" },
    },
    required: ["tipo", "cliente_dicho", "cliente_id", "cobro_clave", "monto", "fecha", "forma", "destino", "negocio_clave", "categoria_id", "descripcion", "nota"],
    additionalProperties: false,
  },
};

const ENTREGAR: Anthropic.Tool = {
  name: "entregar_revision",
  description: "Entrega la revisión del mes: un resumen y la lista de hallazgos con la pantalla donde se arregla cada uno.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      resumen: { type: "string" },
      hallazgos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            detalle: { type: "string" },
            gravedad: { type: "string", enum: ["alta", "media", "baja"] },
            pantalla: { type: "string", enum: ["resumen", "cobros", "pagos", "gastos", "cuentas", "cliente", "ninguna"] },
            cliente_id: { type: "string" },
          },
          required: ["titulo", "detalle", "gravedad", "pantalla", "cliente_id"],
          additionalProperties: false,
        },
      },
    },
    required: ["resumen", "hallazgos"],
    additionalProperties: false,
  },
};

const TOPE_SALIDA: Record<Exclude<Tarea, "uso">, number> = { anotar: 1024, preguntar: 1024, revisar: 8000 };

function textoDe(content: { type: string }[]): string {
  return content.flatMap((b) => (b.type === "text" ? [(b as Anthropic.TextBlock).text] : [])).join("\n").trim();
}

function herramientaDe(content: { type: string }[], nombre: string): unknown {
  const b = content.find((x) => x.type === "tool_use" && (x as Anthropic.ToolUseBlock).name === nombre) as Anthropic.ToolUseBlock | undefined;
  return b ? b.input : null;
}

Deno.serve(async (req: Request) => {
  const origen = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cabeceras(origen) });
  if (req.method !== "POST") return responder(origen, 405, { error: "metodo", mensaje: "Solo POST." });

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const llave = Deno.env.get("ANTHROPIC_API_KEY");
  if (!url || !anon) return responder(origen, 500, { error: "config", mensaje: "Falta la configuración de Supabase en la función." });
  if (!token) return responder(origen, 401, { error: "sesion", mensaje: "Entra con tu cuenta para usar el asistente." });

  const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: quien, error: errQuien } = await sb.auth.getUser(token);
  if (errQuien || !quien?.user) return responder(origen, 401, { error: "sesion", mensaje: "Tu sesión venció. Vuelve a entrar." });
  const owner = quien.user.id;

  let crudo: unknown;
  try {
    const t = await req.text();
    if (t.length > 120000) return responder(origen, 413, { error: "grande", mensaje: "El pedido es demasiado grande." });
    crudo = JSON.parse(t);
  } catch {
    return responder(origen, 400, { error: "pedido", mensaje: "El pedido no se entendió." });
  }
  const pedido = leerPedido(crudo);
  if (!pedido) return responder(origen, 400, { error: "pedido", mensaje: "El pedido no se entendió." });

  const { data: filas, error: errUso } = await sb.from("ctl_ia_uso").select("costo_usd").eq("owner", owner).gte("creado", inicioDelMes());
  if (errUso) return responder(origen, 500, { error: "uso", mensaje: "No se pudo leer lo gastado este mes. ¿Ya se corrió la migración ctl_ia_uso?" });
  const gastado = Math.round((filas ?? []).reduce((s: number, f: { costo_usd: number | string }) => s + Number(f.costo_usd || 0), 0) * 1_000_000) / 1_000_000;
  const estado = { gastado, tope: TOPE_USD, aviso: gastado >= AVISO_USD };

  if (pedido.tarea === "uso") return responder(origen, 200, { tipo: "uso", ...estado });
  if (gastado >= TOPE_USD) return responder(origen, 402, { error: "tope", mensaje: `Llegaste al tope de USD ${TOPE_USD} de este mes. El asistente vuelve el mes que viene.`, ...estado });
  if (!llave) return responder(origen, 500, { error: "config", mensaje: "Falta la llave ANTHROPIC_API_KEY en los secretos de la función." });

  const tarea = pedido.tarea;
  const modelo = tarea === "revisar" ? SONNET : HAIKU;
  const sistemaBase = tarea === "anotar" ? SISTEMA_ANOTAR : tarea === "preguntar" ? SISTEMA_PREGUNTAR : SISTEMA_REVISAR;
  const system = `${sistemaBase}\n\nDATOS:\n${pedido.contexto}`;
  const messages = tarea === "revisar" ? [{ role: "user" as const, content: "Revisa el mes y entrégame la revisión con la herramienta entregar_revision." }] : conversacion(pedido.mensajes.slice(-10));
  if (!messages.length) return responder(origen, 400, { error: "pedido", mensaje: "Escribe algo primero." });

  const caracteres = system.length + messages.reduce((s, m) => s + String(m.content).length, 0);
  const peor = costo(modelo, Math.ceil(caracteres / 2.5) + 1500, TOPE_SALIDA[tarea]);
  if (gastado + peor > TOPE_USD) return responder(origen, 402, { error: "tope", mensaje: `Esta consulta pasaría el tope de USD ${TOPE_USD} del mes.`, ...estado });

  const cliente = new Anthropic({ apiKey: llave, maxRetries: 1, timeout: 90_000 });
  let modeloUsado = modelo;
  let entrada = 0;
  let salida = 0;
  let contenido: { type: string }[] = [];
  let motivo: string | null = null;
  try {
    if (tarea === "revisar") {
      const r = await cliente.beta.messages.create({
        model: SONNET,
        max_tokens: TOPE_SALIDA.revisar,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: [{ model: SONNET_RESPALDO }],
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system,
        tools: [ENTREGAR],
        tool_choice: { type: "auto" },
        messages,
      });
      modeloUsado = r.model;
      entrada = r.usage.input_tokens + (r.usage.cache_creation_input_tokens ?? 0) + (r.usage.cache_read_input_tokens ?? 0);
      salida = r.usage.output_tokens;
      contenido = r.content;
      motivo = r.stop_reason;
    } else {
      const r = await cliente.messages.create({
        model: HAIKU,
        max_tokens: TOPE_SALIDA[tarea],
        thinking: { type: "disabled" },
        output_config: { effort: "low" },
        system,
        ...(tarea === "anotar" ? { tools: [PROPONER], tool_choice: { type: "auto" as const } } : {}),
        messages,
      });
      modeloUsado = r.model;
      entrada = r.usage.input_tokens + (r.usage.cache_creation_input_tokens ?? 0) + (r.usage.cache_read_input_tokens ?? 0);
      salida = r.usage.output_tokens;
      contenido = r.content;
      motivo = r.stop_reason;
    }
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return responder(origen, 429, { error: "ocupado", mensaje: "El asistente está ocupado. Intenta en un minuto.", ...estado });
    if (e instanceof Anthropic.AuthenticationError) return responder(origen, 500, { error: "config", mensaje: "La llave ANTHROPIC_API_KEY no es válida.", ...estado });
    if (e instanceof Anthropic.BadRequestError) { console.error("anthropic 400", e.message); return responder(origen, 502, { error: "modelo", mensaje: "El asistente no pudo con este pedido.", ...estado }); }
    if (e instanceof Anthropic.APIError) { console.error("anthropic", e.status, e.message); return responder(origen, 502, { error: "modelo", mensaje: "El asistente no respondió. Intenta otra vez.", ...estado }); }
    console.error("anthropic conexion", e);
    return responder(origen, 502, { error: "red", mensaje: "No se pudo conectar con el asistente. Intenta otra vez.", ...estado });
  }

  const costoUsd = costo(modeloUsado, entrada, salida);
  const { error: errIns } = await sb.from("ctl_ia_uso").insert({ modelo: modeloUsado.slice(0, 60), tarea, tokens_entrada: entrada, tokens_salida: salida, costo_usd: costoUsd });
  if (errIns) console.error("ctl_ia_uso", errIns.message);
  const nuevo = Math.round((gastado + costoUsd) * 1_000_000) / 1_000_000;
  const fin = { gastado: nuevo, tope: TOPE_USD, aviso: nuevo >= AVISO_USD, costo: costoUsd };

  if (motivo === "refusal") return responder(origen, 200, { tipo: "texto", texto: "No puedo ayudarte con eso. Prueba a escribirlo de otra forma.", ...fin });
  if (tarea === "revisar") {
    const rev = herramientaDe(contenido, "entregar_revision");
    if (rev) return responder(origen, 200, { tipo: "revision", revision: rev, ...fin });
    return responder(origen, 200, { tipo: "texto", texto: textoDe(contenido) || "No se pudo armar la revisión. Intenta otra vez.", ...fin });
  }
  if (tarea === "anotar") {
    const prop = herramientaDe(contenido, "proponer_registro");
    if (prop) return responder(origen, 200, { tipo: "propuesta", propuesta: prop, texto: textoDe(contenido), ...fin });
  }
  if (motivo === "max_tokens" && !textoDe(contenido)) return responder(origen, 200, { tipo: "texto", texto: "La respuesta salió muy larga. Pregunta algo más corto.", ...fin });
  return responder(origen, 200, { tipo: "texto", texto: textoDe(contenido) || "No tengo una respuesta para eso.", ...fin });
});
