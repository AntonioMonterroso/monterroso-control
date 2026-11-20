# Monterroso Control: plan para aprobar

Sistema aparte para llevar el control real de tus negocios: ventas, proyectos, cobros, gastos, costos, presupuestos y contratos. Usa el diseño del ERP (vino, tablas, lápiz y ojito).

Fecha: 19 de noviembre de 2026. Estado: **plan, todavía sin construir.**

---

## 1. Lo que decidiste

| Tema | Decisión |
|---|---|
| Dónde vive | Es una app aparte, con su propio enlace y login, y se instala en el teléfono. |
| Base de datos | Usa el mismo Supabase de Monterroso World, con tablas nuevas `ctl_*` separadas. |
| Negocios | Lleva tres:<br>1. **Monterroso Dev Studio**, el principal, que cobra una inscripción y después una mensualidad.<br>2. **Hogar Canela**, la tienda en Shopify, que vende por producto.<br>3. **Mi salario**, que se suma como ingreso. |
| Impuestos | Hay tres modos: sin IVA, pequeño contribuyente al 5 % y régimen general al 12 %. Se puede cambiar de modo y se pueden agregar facturas. |
| Dinero de Monterroso World | Va conectado, pero aquí solo se ven los gastos de la empresa. Los gastos personales nunca aparecen en este sistema. |

---

## 2. Pantallas (menú del ERP)

### Inicio (tablero)
- **Por negocio y en total:**
  - lo que entró este mes;
  - lo que falta cobrar;
  - los gastos;
  - la utilidad.
- **Presupuesto del mes:** lo planeado contra lo real, cuenta por cuenta, con su barra.
- **Próximos cobros:** las mensualidades de los próximos 7 días y las vencidas.
- **Selector arriba:** «Todos / Dev Studio / Hogar Canela / Salario».

### Clientes (Dev Studio)
- **Ficha del cliente:** nombre, rubro, WhatsApp, correo, NIT y el régimen que le aplica (sin IVA / 5 % / 12 %).
- **Proyectos asignados.** Cada proyecto lleva:
  - **inscripción** (pago único, que puede ir en partes, por ejemplo 50 % al firmar y 50 % al entregar);
  - **mensualidad** con el día de cobro, la fecha de inicio y la de fin, opcional;
  - estado: propuesta, en curso, entregado o cerrado.
- **Estado de cuenta:** cada renglón pendiente, enviado por WhatsApp y en PDF con el sello.
- **Gastos del cliente:** por ejemplo el dominio, el hosting, una plantilla o un servicio pagado para él. Con eso salen el **costo** y la **ganancia por cliente**.

### Cobros
- **Calendario de mensualidades** del mes. Cada cobro tiene uno de cuatro estados: pagado, por cobrar, vencido o dado por saldado.
- **Registrar un pago** con su fecha, la cuenta donde cayó y su recibo en PDF.
- **Recordatorio por WhatsApp,** uno por uno o a todos los que deben, en un solo paso.

### Ventas: Hogar Canela
- Los pedidos se registran a mano o se importan de Shopify en un Excel (CSV) **sin duplicar**. La llave es el número de pedido.
- Por cada pedido se guarda:
  - el precio de venta;
  - el costo del producto en Dropi;
  - el envío;
  - la comisión;
  - la utilidad del pedido.
- La conexión automática con Shopify queda para la fase de integración.

### Salario
- **Monto fijo que se repite solo cada mes.** Cuando te suben el sueldo, registras el aumento «desde tal mes» y queda el historial de aumentos.
- Lleva lo que te descuentan y lo que recibes en neto.
- Se suma al total de ingresos del tablero, separado de los negocios.
- **Gastos ligados al salario y a los negocios:** transporte, tokens de API, dominio, internet y otros parecidos. Cada uno se asigna al negocio que lo usa: Salario, Dev Studio o Hogar Canela.

### Deudas y tarjeta de crédito
- **Compras a cuotas** de lo que usas para trabajar, como una computadora: el total, el número de cuotas, la cuota del mes y lo que falta.
- **Tarjeta de crédito:** el saldo y los pagos del mes.
- Cada pago de una deuda se asigna a un negocio y entra en su presupuesto.

### Gastos
- **Gastos de la empresa,** formales y por categoría (software, dominio, equipo, internet, publicidad…), con:
  - su factura: serie, número, NIT del proveedor, el monto y la foto o el PDF con su ojito;
  - el negocio al que pertenece;
  - el cliente, si es un gasto de un cliente.
- **Gastos fijos que se repiten** cada mes, como la suscripción de Vercel o el internet.
- **De Monterroso World** solo entran los gastos que marques como «Empresa». Lo personal se queda allá y aquí no existe.

### Presupuestos
- **Catálogo propio de categorías,** solo para los gastos de estos negocios y aparte de las de Monterroso World. Viene con las básicas y puedes agregar, renombrar o apagar las tuyas:
  - transporte;
  - tokens de API;
  - dominio y hosting;
  - internet;
  - software;
  - equipo;
  - publicidad;
  - pago de deudas y tarjeta.
- Un presupuesto mensual por negocio y por categoría, de ingresos y de gastos.
- Se puede **copiar el del mes anterior** y ajustarlo.
- Al final del mes compara lo presupuestado con lo real y muestra la diferencia.

### Precios y productos
- **Tarifas** de Dev Studio: los paquetes con su inscripción y su mensualidad, y los extras como el dominio.
- **Productos** de Hogar Canela: costo, precio y margen.
- Estos precios están **pensados para compartirse** después con la página studiomonterroso.com. Esa conexión de los tres lados es una fase posterior.

### Contratos
- **Armador de contratos** por plantilla, con las cláusulas que eliges. Los datos del cliente, el proyecto, la inscripción, la mensualidad, el plazo y las condiciones se llenan solos.
- Se genera en PDF con tu formato, listo para firmar a mano.
- Cada contrato queda guardado en el cliente, con la fecha en que se hizo y la fecha en que se firmó.

### Impuestos y facturas
- **Por cliente o por negocio** eliges el modo: sin IVA, 5 % o 12 %, y lo puedes cambiar desde un mes en adelante.
- **Facturas emitidas** a clientes y **recibidas** de proveedores, que se ligan al cobro o al gasto.
- **Resumen del mes:**
  - en pequeño contribuyente, el 5 % de lo facturado;
  - en régimen general, el débito, el crédito y lo que hay que pagar.
- Lo que muestra es para tu control; no presenta nada en la SAT.

### Reportes
- Estado de resultados por negocio y en total, por mes y por año.
- Costo y ganancia por cliente.
- Flujo de caja: lo que entra y lo que sale cada mes.
- Todo se exporta a Excel o PDF.

---

## 3. Base de datos (tablas nuevas, solo tuyas)

- **Tablas:**
  - `ctl_negocios`: Dev Studio, Hogar Canela y Salario.
  - `ctl_clientes` y `ctl_proyectos`: con la inscripción en partes y la mensualidad.
  - `ctl_cobros`: lo que toca cobrar.
  - `ctl_pagos`: lo que se recibió.
  - `ctl_gastos`: con el negocio, el cliente (opcional), la categoría, la factura y el archivo.
  - `ctl_gastos_fijos`.
  - `ctl_ventas_tienda` y `ctl_productos`.
  - `ctl_salario` y `ctl_salario_aumentos`: el monto fijo y desde qué mes cambia.
  - `ctl_categorias`: el catálogo propio, editable.
  - `ctl_deudas` y `ctl_deuda_pagos`: compras a cuotas y la tarjeta de crédito.
  - `ctl_presupuestos`: por mes, negocio y categoría.
  - `ctl_tarifas`.
  - `ctl_contratos` y `ctl_plantillas_contrato`.
  - `ctl_facturas`: emitidas y recibidas.
  - `ctl_impuesto_modo`: el régimen por negocio o cliente, desde un mes.
- **Candado:** cada tabla con RLS de dueño, es decir que solo tú las ves.
- **Conexión con Monterroso World:** una vista que solo deja pasar los movimientos marcados como «Empresa».
- **Clientes y trabajos que ya tienes en Monterroso World:** se ofrecen para traerlos una sola vez. Antes de copiar nada te muestro la lista para que la apruebes, y no se borra nada allá.

---

## 4. Fases

| Fase | Qué queda listo |
|---|---|
| **F1** | Base, login y menú con el diseño del ERP; negocios, clientes y proyectos (inscripción + mensualidad). |
| **F2** | Cobros, pagos, recibos, estado de cuenta y recordatorios por WhatsApp. |
| **F3** | Gastos de la empresa y del cliente, gastos fijos, facturas con ojito y costo y ganancia por cliente. |
| **F4** | Presupuestos mensuales y el tablero con lo planeado contra lo real. |
| **F5** | Hogar Canela (pedidos, productos e importación sin duplicar), Salario con sus aumentos, y Deudas y tarjeta. |
| **F6** | Impuestos (sin IVA / 5 % / 12 %), facturas emitidas y recibidas y el resumen del mes. |
| **F7** | Armador de contratos y tarifas compartibles. |
| **F8** | Reportes en Excel y PDF y la conexión con Dinero de Monterroso World, solo lo de «Empresa». |
| **Después** | La integración de los tres lados: la página, Monterroso World y este sistema. |

Cada fase se prueba en celular, tablet, a media pantalla (unos 990 px) y en escritorio antes de pasar a la siguiente.

---

## 5. Cómo se construye (el fork)

- Lo construye una **sesión aparte** (fork), y yo le paso este plan.
- **El token de Supabase:** el que pegaste antes en el chat ya quedó expuesto y conviene revocarlo, no reutilizarlo. Para construir hay dos caminos:
  1. **Recomendado:** yo te entrego cada migración en SQL y tú la corres en el SQL Editor de Supabase. Así ningún token pasa por el chat.
  2. Creas un token nuevo solo para la construcción y lo revocas al terminar.
- Lo publico en GitHub Pages bajo studiomonterroso.com (por ejemplo `control.studiomonterroso.com`), solo con login.

---

## 6. Respuestas

| Pregunta | Respuesta |
|---|---|
| Salario | Es un monto fijo que se repite solo y puede ir aumentando. También se llevan sus gastos: transporte, tokens de API, dominio, internet, y deudas o tarjeta por compras como computadoras. |
| Cuentas del presupuesto | Catálogo propio y personalizable, solo para estos gastos. |
| Nombre | Monterroso Control. |
| Inscripción en partes | Sin valor por defecto: en cada proyecto se elige cómo se divide. |
| Token | Se usa el token que Antonio dio antes. La migración se aplica con ese token y después se revoca. |
