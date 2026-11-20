# Reglas de construcción en Monterroso Control

Revisión de `Ecosistema Monterroso/REGLAS-ECOSISTEMA.md` §2.5b a §2.5q, pantalla por pantalla. Fecha: 2026-11-20.

**Leyenda:** ✔ ya cumplía · ✚ arreglado ahora · — no aplica · ◐ cumple en parte (ver notas).

## Lo que se arregló para todas las pantallas a la vez

| Regla | Qué se hizo | Dónde |
|---|---|---|
| §2.5d avisos encima, ventanas apiladas | Las ventanas se apilan con `showModal` y ninguna cierra a la de abajo. Esc cierra solo la de arriba. Los avisos se vuelven a subir encima cada vez que se abre una ventana. | `componentes/Ventana.tsx`, `componentes/Avisos.tsx` |
| §2.5e montos | Al copiar un monto «Q 1,350.00» se copia solo «1350.00». Al editar, los montos salen con dos decimales. | `lib/copiarMonto.ts` (con prueba), `componentes/FormRegistro.tsx` |
| §2.5f buscador | Cada tabla de más de 10 filas trae «Buscar en esta tabla…» con «3 de 140». Los totales se ven aunque la búsqueda no deje filas. Las listas de más de 12 opciones dejan escribir y se manejan con el teclado: flechas, Enter para elegir y Esc para cerrar sin cambiar. | `componentes/Tabla.tsx`, `componentes/SelectBuscable.tsx` |
| §2.5g pasos | Cada una de las 36 pantallas tiene «Pasos» junto al título, con 3 a 7 pasos. Cada paso puede llevar «Ir a…» a la parte exacta, y los pasos se pueden copiar o imprimir. **Falta el video** (pestaña Video); queda anotado. | `componentes/Pasos.tsx`, `lib/pasos.ts` |
| §2.5i la página no se sube | Al tocar algo dentro de una pantalla, la página conserva su alto, así que no brinca aunque lo nuevo sea más corto. Solo al cambiar de pantalla vuelve arriba. Todo `focus()` usa `preventScroll`. | `componentes/Marco.tsx`, `Ventana.tsx`, `Acceso.tsx` |
| §2.5k todo al día | Los datos se vuelven a leer cada 20 s, al volver a la ventana y cuando otra pestaña cambia los datos. No se repinta con una ventana abierta ni mientras se escribe, y si nada cambió no se repinta. | `lib/datos.tsx` |
| §2.5l botones | «Fantasma» pasó a gris sólido. Las salidas (Estado de cuenta, Recordatorios por WhatsApp, Copiar, PDF, Imprimir) van con el estilo de salida y su ícono. Los chips quedan solo para filtros. | `erp.css`, `ClienteFicha`, `Cobros`, `cobros/Ventanas` |
| §2.5n clic afuera | Un clic afuera ya no cierra. El primer clic muestra una sola vez «Para cerrar esta ventana: doble clic afuera, la X o Esc.». Con algo escrito, Esc y el doble clic preguntan «¿Salir sin guardar?» en una ventana propia. Lo escrito en buscadores no cuenta. Los menús chicos (clic derecho, listas) siguen cerrándose con un clic afuera. | `componentes/Ventana.tsx`, `componentes/MenuFila.tsx`, `SelectBuscable.tsx` |
| §2.5o marcar varias | La tabla trae «Marcar todas · N» o «Marcar todas las que se ven · N» y las acciones dicen cuántas van («… las marcadas · N»). `marcable` deja fuera las filas que no se pueden tocar, y la vista previa sale antes de lo que no se deshace. | `componentes/Tabla.tsx` |
| §2.5p dice qué hace | Una revisión automática recorrió todas las pantallas a 390, 768, 990 y 1280 px. Todo botón visible tiene `title` y los que son solo ícono tienen `aria-label`. Se reescribieron los títulos que solo repetían el nombre. | `capturas/` |

## Pantalla por regla

| Pantalla | b | c | d | e | f | g | h | i | j | k | l | n | o | p | q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Inicio `/` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | — | ✚ | — |
| Clientes `/clientes` | ✔ | ✔ | ✚ | ✔ | ✔ | ✚ | — | ✚ | — | ✚ | ✚ | ✚ | ✚ | ✚ | — |
| Ficha del cliente `/clientes/:id` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | ✚ | ✚ | ✔ | ✚ | ✚ | ✚ | ◐ | ✚ | — |
| Proyectos `/proyectos` | ✚ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | ✚ | ✚ | ✔ | ✚ | — | ✚ | — |
| Ficha del proyecto `/proyectos/:id` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | ✚ | ✚ | ✔ | ✚ | — | ✚ | — |
| Desarrollo `/desarrollo` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✚ | ✚ | ✚ |
| Documentos `/documentos` | ✔ | ✔ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | — | ✚ | ✔ | ✚ | ✔ | ✚ | — |
| Mi marca `/marca` | ✔ | ✔ | ✚ | — | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | — | ✚ | — |
| S.A. Ficha `/sa` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | ✔ | ✚ | ✔ | ✚ | ✔ | ✚ | ✔ | ✚ | — |
| S.A. Socios `/sa/socios` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | ✔ | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| S.A. Utilidades `/sa/utilidades` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ◐ | ✚ | — |
| S.A. Bancos `/sa/bancos` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| S.A. Estados `/sa/estados` | ✔ | ✔ | ✚ | ✔ | — | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | — | ✚ | — |
| S.A. Trámites `/sa/tramites` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | ✔ | ✚ | — | ✚ | ✔ | ✚ | ✔ | ✚ | — |
| S.A. Recordatorios `/sa/recordatorios` | ✔ | ✔ | ✚ | — | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✔ | ✚ | — |
| Lo que me deben `/cobros` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | ✔ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | — |
| Contratos `/contratos` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | ✔ | ✚ | — | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| Tienda resumen `/tienda` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | — | ✚ | — |
| Pedidos `/tienda/pedidos` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✔ | ✚ | — |
| Pagos de la tienda `/tienda/pagos` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| Productos `/tienda/productos` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✔ | ✚ | — |
| Gastos (3 rutas) `/gastos`, `/tienda/gastos`, `/salario/gastos` | ✔ | ✔ | ✚ | ✚ | ✚ | ✚ | ✔ | ✚ | — | ✚ | ✔ | ✚ | ✔ | ✚ | — |
| Presupuestos (3 rutas) | ✔ | ✔ | ✚ | ✚ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | — | ✚ | — |
| Mi salario `/salario` | ✔ | ✔ | ✚ | ✚ | ✚ | ✚ | — | ✚ | ✚ | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| Deudas `/deudas` | ✔ | ✔ | ✚ | ✚ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| Impuestos `/impuestos` | ✔ | ✔ | ✚ | ✚ | ✚ | ✚ | ✔ | ✚ | ✚ | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| Precios `/precios` | ✔ | ✔ | ✚ | ✚ | ✚ | ✚ | — | ✚ | ✚ | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| Reportes `/reportes` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | — | ✚ | — |
| Negocios `/negocios` | ✔ | ✔ | ✚ | — | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | — | ✚ | — |
| Categorías `/categorias` | ✔ | ✔ | ✚ | — | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| Monterroso World `/mundo` | ✔ | ✔ | ✚ | ✔ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✔ | ✚ | — |
| Pagos que recibí `/pagos` (y `/tienda/recibidos`, `/salario/recibidos`) | ✚ | ✔ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | ✚ | — |
| Saldo a favor `/saldo-a-favor` | ✚ | ✔ | ✚ | ✔ | ✚ | ✚ | ✚ | ✚ | — | ✚ | ✔ | ✚ | ✚ | ✚ | — |
| Dónde está mi dinero `/cuentas` | ✚ | ✔ | ✚ | ✚ | ✚ | ✚ | — | ✚ | — | ✚ | ✔ | ✚ | ✚ | ✚ | — |

§2.5m (cada impuesto solo en su período) no aplica a ninguna pantalla: Control no presenta impuestos, solo lleva el régimen y las facturas para control.

## Notas por regla

- **§2.5b nada de ir y venir**
  - «Nuevo proyecto» trae «Cliente nuevo», que abre encima la ventana del cliente y lo deja elegido al guardar.
  - Ya cumplían los datos que se llenan solos: Bancos › «Traer registrados», Impuestos › «Crear desde Gastos», documentos y proyectos «Desde una tarifa», y el monto del cobro en la ventana de pago.
  - «Ver» en Para no olvidar ya llevaba al lugar exacto.
- **§2.5c nada a los lados:** se revisaron todas las rutas a 390, 768, 990 y 1280 px y ninguna tiene barra horizontal.
- **§2.5e un solo lápiz**
  - El estado de los documentos dejó de ser una lista dentro de la tabla: ahora se cambia en su lápiz.
  - En Bancos, «Conciliado» sigue siendo casilla, igual que «Incluir» en el ERP. Ahora además tiene «Marcar conciliadas» y «Quitar conciliado» para varias a la vez.
- **§2.5f**
  - En S.A. › Estados no se puso buscador porque es un estado financiero, no un listado.
  - Pasaron al buscador con teclado:
    - Cliente, proyecto, plantilla y tarifa en Armador, Editor de documentos y Proyecto.
    - Filtros de Cobros y Desarrollo.
    - Color de Mi marca (26 opciones).
    - Negocio y categoría de Monterroso World.
- **§2.5g:** video y pasos hechos en las 40 pantallas; cada cambio de pantalla debe actualizar su archivo en `video/guias/` y su entrada en `lib/pasos.ts` (la prueba lo vigila). Antes de publicar se comprobó que los selectores de «Ir a…» de cada pantalla existen. El de Monterroso World no se encuentra en modo de prueba porque esa parte no se muestra ahí.
- **§2.5h el ojito**
  - Se agregó en Documentos (ve el documento encima, sin salir) y en los gastos de la ficha del cliente.
  - Ya estaba en Gastos, Impuestos, S.A. Ficha, Trámites y Contratos.
- **§2.5j historia** (migración nueva `20261120000200_ctl_historial.sql`)
  - **Mensualidad:** al cambiarla se pide «Rige desde (mes)» y «Por qué cambia». Los meses anteriores siguen cobrando el monto de antes (`mensualidadEn`, con prueba) y la ficha muestra la historia con quién y cuándo.
  - **Tarifas:** cada cambio de inscripción, mensualidad o precio queda en «Precios anteriores».
  - **Salario y régimen:** ya eran por mes. Ahora muestran «Anotado» y, en el régimen, «Antes».
- **§2.5o:** se agregó «… las marcadas» en Clientes (borrar o archivar, o reactivar), Desarrollo (las 5 secciones, más «Marcar revocados» en Tokens), Socios, Bancos, Contratos y Plantillas, Pagos de la tienda, Pagos de Cobros (solo los de Control), Salario, Deudas (solo sin movimientos), Impuestos (régimen), Precios y Categorías (solo las que no se usan).
  - No aplica donde la fila solo se abre o se edita: Proyectos, Negocios, Presupuestos y Reportes.
  - ◐ En Utilidades cada reparto tiene botones propios por socio, y no se juntaron.
  - ◐ En la ficha del cliente, «Lo que debe» sigue con «Pago» por fila; el pago de varias a la vez está en Cobros («Marcar como pagados»).
- **§2.5q:** en Desarrollo › Supabase, tocar la dirección o la llave pública la copia. La llave sigue con puntos y el aviso dice «Llave pública copiada». Los tokens solo guardan los últimos 4, así que no hay nada que copiar.

## Clientes: borrar o archivar a la vista

- Cada fila tiene su lápiz y un bote «Borrar o archivar». Al pasar encima dice qué pasará con ese cliente: «Lo borra; no tiene movimientos» o «Lo archiva porque tiene 1 trabajo y 2 pagos».
- «Marcar todas · N» y «Borrar o archivar las marcadas · N» abren primero la vista previa: «Se borran · 2» con los nombres y «Se archivan · 3» con el motivo de cada uno. Todo se puede deshacer.
- Clic derecho, o mantener presionado en el celular, sobre la fila: Abrir, Editar, Borrar o archivar (o Reactivar si está archivado).
- En la ficha, «Borrar o archivar» es un botón gris sólido, separado del lápiz de Datos.
- En «Archivados»: «Reactivar» por fila y «Reactivar las marcadas».

## Capturas

`capturas/reglas-{390,768,990,1280}-*.png`:

- `clientes`, `clientes-marcadas`, `clientes-previa`, `clientes-menu`, `clientes-deshacer`
- `ficha`
- `ventana-aviso-afuera`, `salir-sin-guardar`, `apiladas`
- `combo`, `pasos`, `desarrollo-copiar`

## Dinero: orden y nombres (2026-11-20)

Menú «Dinero» con Lo que me deben, Pagos que recibí, Saldo a favor y Dónde está mi dinero. Cada pantalla: resumen arriba, lo urgente (vencido, falta pasar a la S.A.) después y el detalle al final, con un solo botón principal y lo demás en «Más». Palabras y estados según `GLOSARIO.md`.
