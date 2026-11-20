export interface Paso { texto: string; ir?: string }
export interface GuiaPasos { ruta: string; pasos: Paso[] }

export const PASOS: GuiaPasos[] = [
  {
    ruta: '/',
    pasos: [
      { texto: 'Arriba ves el mes en curso: lo que entró, lo que te deben («Me deben»), los gastos y la utilidad del mes.', ir: '.erp-kpis' },
      { texto: 'Toca «Todos» o el nombre de un negocio para ver solo los números de ese negocio.', ir: '.c-chips' },
      { texto: 'En «Presupuesto del mes» cada barra muestra lo real contra lo planeado de cada categoría.', ir: '.c-dos' },
      { texto: 'En «Lo que me deben: vencido y esta semana» toca el nombre del cliente para abrir su ficha, o «Ver todo lo que me deben» para ver la lista completa.' },
      { texto: 'En «Pagos que recibí» ves los últimos pagos; toca «Ver todos» para abrir todo el historial.', ir: 'a[title="Abre el historial completo de pagos recibidos"]' },
      { texto: 'Si aparece «Para no olvidar», toca «Ver» en cada aviso para ir a donde se arregla.' },
    ],
  },
  {
    ruta: '/clientes',
    pasos: [
      { texto: 'Toca «Nuevo cliente» para crear uno; al guardarlo se abre su ficha.', ir: 'button[title="Abre la ventana para crear un cliente nuevo"]' },
      { texto: 'Escribe en el buscador un nombre, NIT, teléfono o correo para encontrar al cliente.', ir: '.c-herramientas' },
      { texto: 'Usa los chips «Activos», «Todos», «Inactivos» y «Archivados» para cambiar qué clientes se ven.', ir: '.c-chips' },
      { texto: 'Toca un cliente para abrir su ficha, o el lápiz de su fila para editar sus datos; los encabezados de columna ordenan la lista.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca el basurero «Borrar o archivar» de la fila: si no tiene movimientos se borra, y si tiene trabajos o pagos se archiva; después puedes tocar «Deshacer».' },
      { texto: 'Marca varias casillas y toca «Borrar o archivar las marcadas»; antes te muestra cuáles se borran y cuáles se archivan.' },
      { texto: 'Con clic derecho o dejando presionada una fila tienes «Abrir», «Editar» y «Borrar o archivar»; los archivados se ven en «Archivados» y vuelven con «Reactivar».' },
    ],
  },
  {
    ruta: '/clientes/:id',
    pasos: [
      { texto: 'Arriba ves lo que te debe, lo que te ha pagado, su saldo a favor y la ganancia.', ir: '.erp-kpis' },
      { texto: 'Toca un chip del índice («Datos», «Lo que debe», «Pagos que hizo», «Saldo a favor», «Proyectos», «Documentos» o «Desarrollo») para bajar a esa parte.', ir: '.c-indice' },
      { texto: 'Toca «Registrar pago»: el cliente ya viene elegido; marcas lo que pagó, «Siguiente», y pones fecha, «Usar saldo a favor», forma de pago, «Dónde cayó» y comprobante.', ir: 'button[title="Elige al cliente y lo que pagó; después pones la fecha, la forma, dónde cayó y el comprobante"]' },
      { texto: 'En «Lo que debe» toca «Pago» en una fila, o marca varias y toca «Registrar pago de las marcadas».', ir: '#f-debe' },
      { texto: 'En «Más» tienes «Agregar cobro», «Registrar anticipo», «Proyecto nuevo», «Contrato» y «Documento».', ir: 'button[aria-haspopup="menu"]' },
      { texto: 'Toca «Estado de cuenta» para mandarlo por WhatsApp, en PDF o con «Versión web».', ir: 'button[title="Abre su estado de cuenta para mandarlo por WhatsApp, en PDF o como página web"]' },
      { texto: 'Toca «Borrar o archivar»: si no tiene movimientos se borra y si los tiene se archiva; vuelve con «Reactivar».' },
    ],
  },
  {
    ruta: '/proyectos',
    pasos: [
      { texto: 'Toca «Nuevo proyecto» para crear un proyecto; si el cliente no existe, créalo ahí mismo con «Cliente nuevo».', ir: 'button[title="Crear un proyecto para un cliente"]' },
      { texto: 'Escribe en el buscador el nombre del proyecto o del cliente.', ir: '.c-herramientas' },
      { texto: 'Usa los chips «Abiertos», «Propuesta», «En curso», «Entregado», «Cerrado» o «Todos» para filtrar por estado.', ir: '.c-chips' },
      { texto: 'Toca un proyecto para abrir su ficha, o el lápiz de la fila para editarlo.', ir: '.m-tabla-envoltura' },
      { texto: 'La columna «Próximo cobro» te dice cuándo toca cobrar la siguiente mensualidad.' },
      { texto: 'Si cambias la mensualidad con el lápiz, eliges «Rige desde (mes)»: los meses de antes siguen con el monto anterior y el cambio queda en su historia.' },
    ],
  },
  {
    ruta: '/proyectos/:id',
    pasos: [
      { texto: 'Toca «Editar» para cambiar el proyecto, su inscripción y su mensualidad.', ir: 'button[title="Abre el proyecto para corregir su inscripción, su mensualidad y sus fechas"]' },
      { texto: 'Toca «Registrar pago»: solo salen los cobros de este proyecto; marcas lo que pagó, «Siguiente», y pones la fecha, la forma de pago y «Dónde cayó».', ir: 'button[title="Elige al cliente y lo que pagó; después pones la fecha, la forma, dónde cayó y el comprobante"]' },
      { texto: 'Usa las pestañas «Resumen» y «Desarrollo» para cambiar lo que ves del proyecto.', ir: '.c-pestanas' },
      { texto: 'En «Resumen» ves la inscripción, la mensualidad, lo que ha pagado y el costo del proyecto.', ir: '.erp-kpis' },
      { texto: 'La tabla «Lo que debe de este proyecto» lista cada cobro con su vencimiento, su estado y lo que falta.' },
      { texto: 'En «Pagos que hizo» ves lo pagado este año, desde siempre, el saldo a favor y cada pago.' },
      { texto: 'En «Desarrollo» anotas Supabase, enlaces, dominios y servicios, tokens y la «Bitácora de cambios» de este proyecto.' },
    ],
  },
  {
    ruta: '/desarrollo',
    pasos: [
      { texto: 'En «Para no olvidar» ves lo que vence pronto; toca «Ver» para ir a donde se arregla.', ir: '.c-seccion-dev' },
      { texto: 'Usa las pestañas «Todo», «Supabase», «Tokens», «Servicios» y «Enlaces» para ver una sola parte.', ir: '.c-pestanas' },
      { texto: 'Escribe en el buscador, elige un «Proyecto» o toca «Con aviso» para ver solo lo que necesita atención.', ir: '.c-herramientas' },
      { texto: 'En «Supabase» toca «Mantener activo» para hacer una consulta liviana y anotar la fecha.' },
      { texto: 'Toca «Supabase», «Token», «Servicio» o «Enlace» en cada sección para agregar uno nuevo; en «Enlaces» toca «Revisar» para ver si la dirección responde.' },
      { texto: 'En «Para copiar» toca la dirección o la llave pública para copiarla; la llave se copia sin mostrarse.' },
      { texto: 'Cada fila se edita con su lápiz y se quita con el basurero; marca varias para quitarlas juntas.' },
    ],
  },
  {
    ruta: '/documentos',
    pasos: [
      { texto: 'Toca «Cotización», «Propuesta» u «Hoja membretada» para armar un documento nuevo.', ir: 'button[title="Armar una cotización con número correlativo del año"]' },
      { texto: 'Toca «Acuerdo de servicios» para armar el contrato con la plantilla; se guarda en Contratos.', ir: 'button[title="Armar el acuerdo de servicios (contrato) con la plantilla"]' },
      { texto: 'Escribe un título, cliente o número en el buscador, o toca un chip de tipo para filtrar.', ir: '.c-herramientas' },
      { texto: 'Toca el ojito para ver el documento encima; el estado («Borrador», «Enviado», «Aceptado» o «Rechazado») se cambia con el lápiz.', ir: '.m-tabla-envoltura' },
      { texto: 'En cotizaciones y propuestas toca el ícono de compartir: «Compartir en la web» tiene «Copiar link», «Enviar por WhatsApp», «Ver como el cliente», «Bajar PDF», «Retirar link» y «Crear link nuevo». Los contratos no van a la web.' },
      { texto: 'Al armar o editar ves a la derecha la vista previa igual al PDF, con «Bajar PDF» y «Enviar por WhatsApp»; lo que falta se resalta.' },
      { texto: 'Junto al ícono ves si el cliente lo abrió: «Sin abrir», «Visto 2 veces» o «Aceptado»; marca varias para quitarlas juntas.' },
    ],
  },
  {
    ruta: '/marca',
    pasos: [
      { texto: 'Toca «Editar datos» para poner tu nombre, cargo, correo, teléfono, sitio y redes.', ir: 'button[title="Editar tus datos de contacto para tarjetas y documentos"]' },
      { texto: 'Elige el área («Corporativo», «Desarrollo Web», «Música» o «Diseño») y el «Color» de las piezas.', ir: '.c-herramientas' },
      { texto: 'En la tarjeta de presentación toca «PDF para imprimir», «Frente PNG» o «Reverso PNG».', ir: 'button[title="Abrir el PDF para imprimir (frente y reverso, 96 × 56 mm con 3 mm de sangrado)"]' },
      { texto: 'En «Redes» toca el tamaño de portada o publicación que quieras bajar en PNG.' },
      { texto: 'Solo salen los datos que llenes; lo que dejes vacío no aparece.' },
    ],
  },
  {
    ruta: '/sa',
    pasos: [
      { texto: 'Toca «Llenar la ficha» o «Editar» para poner los datos de la escritura, el registro y el representante.', ir: 'button[title="Editar los datos de la sociedad"]' },
      { texto: 'Revisa los bloques «Identificación», «Escritura e inscripciones» y «Administración».' },
      { texto: 'En «Negocios de la sociedad» ves qué negocios cuentan para la sociedad desde el inicio de operaciones.' },
      { texto: 'En «Documentos» toca «Documento» para agregar la escritura, patentes o nombramiento con su archivo.', ir: 'button[title="Agregar la escritura, patentes, nombramiento u otro documento"]' },
      { texto: 'Cada documento se ve con el ojito, se edita con el lápiz y se quita con el basurero.' },
    ],
  },
  {
    ruta: '/sa/socios',
    pasos: [
      { texto: 'Arriba ves el capital autorizado, suscrito, pagado y lo que falta por pagar.', ir: '.erp-kpis' },
      { texto: 'Usa las pestañas «Socios», «Registro de accionistas», «Aportaciones» y «Transmisiones».', ir: '.c-pestanas' },
      { texto: 'El botón de arriba cambia con la pestaña: «Socio», «Acciones», «Aportación» o «Transmisión».', ir: '.c-cabeza-acciones' },
      { texto: 'Cada fila se edita con su lápiz; quitar pide confirmar y se puede deshacer.', ir: '.m-tabla-envoltura' },
      { texto: 'Un socio solo se puede quitar si no tiene acciones ni aportaciones.' },
    ],
  },
  {
    ruta: '/sa/utilidades',
    pasos: [
      { texto: 'En «Calcular el reparto» pon el período «Desde» y «Hasta (cierre)».', ir: '.c-ficha' },
      { texto: 'Escribe el ISR de la sociedad del período y, si quieres, el «Monto a repartir»; vacío reparte todo lo distribuible.' },
      { texto: 'La tabla del reparto muestra a cada socio con su dividendo, el ISR y el neto a pagar.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Registrar el reparto» para guardar lo que acordó la asamblea.' },
      { texto: 'En «Repartos registrados» toca «Pagado» por cada socio e «ISR pagado hoy» cuando lo pagues a la SAT.' },
    ],
  },
  {
    ruta: '/sa/bancos',
    pasos: [
      { texto: 'Toca «Cuenta» para agregar una cuenta bancaria de la sociedad.', ir: 'button[title="Agregar una cuenta bancaria de la sociedad"]' },
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Toca una cuenta para ver sus movimientos.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Traer registrados» para agregar cobros, gastos y pagos ya registrados sin duplicar, o «Movimiento» para uno a mano.' },
      { texto: 'Marca «Conciliado» en lo que ya salió en el estado de cuenta (o marca varias y toca «Marcar conciliadas») y toca «Guardar saldo» con el saldo del banco.' },
    ],
  },
  {
    ruta: '/sa/estados',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Usa las pestañas «Del mes» o «Del año» para cambiar el período.', ir: '.c-pestanas' },
      { texto: 'Revisa el «Estado de resultados» y el «Balance general».' },
      { texto: 'La línea «Cuenta por cobrar al socio o administrador» es lo de la S.A. que cayó en tu cuenta personal; se quita con «Registrar traslado a la S.A.» en «Dónde está mi dinero».' },
      { texto: 'Toca «Excel» para bajarlos o «PDF» para abrirlos con el formato de la firma.', ir: 'button[title="Abrir los estados con el formato de la firma para guardarlos en PDF"]' },
    ],
  },
  {
    ruta: '/sa/tramites',
    pasos: [
      { texto: 'Si la lista está vacía, toca «Agregar los pasos de Guatemala» para cargar los pasos de constitución.' },
      { texto: 'Toca «Paso» para agregar un paso propio.', ir: 'button[title="Agregar un paso propio"]' },
      { texto: 'Arriba ves el avance y el costo de la constitución.', ir: '.erp-kpis' },
      { texto: 'En cada paso edita con el lápiz para poner estado, fecha, responsable y costo.', ir: '.m-tabla-envoltura' },
      { texto: 'Si un paso tiene costo, toca «Gasto» para registrarlo en Gastos.' },
    ],
  },
  {
    ruta: '/sa/recordatorios',
    pasos: [
      { texto: 'Toca «Obligaciones comunes» para agregar las que se repiten según el régimen; revisa sus fechas.' },
      { texto: 'Toca «Recordatorio» para agregar uno propio.', ir: 'button[title="Agregar un recordatorio propio"]' },
      { texto: 'La tabla muestra cada recordatorio con su próxima fecha y cuántos días antes avisa.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Hecho» cuando lo cumplas; si se repite pasa solo a la siguiente fecha.' },
      { texto: 'Cada recordatorio se edita con su lápiz y se quita con el basurero.' },
    ],
  },
  {
    ruta: '/cobros',
    pasos: [
      { texto: 'Arriba ves «Me deben en total», lo «Vencido», lo que «Falta de este mes» y lo que «Entró este mes».', ir: '.erp-kpis' },
      { texto: 'Si hay cobros vencidos sale una franja roja; toca «Ver solo vencidos» para ver solo esos.', ir: '.c-urgente' },
      { texto: 'Usa los chips «Por cobrar», «Vencidos», «Pagados del mes», «Saldados» y «Todos del mes»; elige cliente, proyecto, rubro o negocio y «Ver por» agrupa.', ir: '.c-herramientas' },
      { texto: 'Toca «Registrar pago»: eliges el cliente y marcas los cobros, tocas «Siguiente» y pones fecha, forma de pago, «Dónde cayó» y comprobante.', ir: 'button[title="Elige al cliente y lo que pagó; después pones la fecha, la forma, dónde cayó y el comprobante"]' },
      { texto: 'En cada fila toca «Pago» para registrar lo que pagó, o «Saldar» para dejar de cobrarlo a propósito; marca varias y toca «Marcar como pagados».' },
      { texto: 'En «Más» tienes «Agregar cobro», «Registrar anticipo» y «Recordatorios por WhatsApp».', ir: 'button[aria-haspopup="menu"]' },
    ],
  },
  {
    ruta: '/pagos',
    pasos: [
      { texto: 'Arriba ves lo que entró en el período, cuántos pagos tienen «Falta decir dónde cayó» y cuántos no tienen comprobante.', ir: '.erp-kpis' },
      { texto: 'Elige el período con «Este mes», «Mes anterior», «Este año», «Rango» o «Desde el inicio»; «Lista», «Por mes» y «Por cliente» cambian cómo se ve.', ir: '.c-herramientas' },
      { texto: 'Filtra por cliente, proyecto, negocio, forma de pago, «Dónde cayó» o comprobante.', ir: '.c-filtros-dim' },
      { texto: 'Toca «Falta la forma» o «Falta decir dónde cayó» en una fila para abrir el pago y completarlo; «¿Repetido?» avisa que hay otro pago igual.', ir: '.m-tabla-envoltura' },
      { texto: 'El lápiz abre «Editar pago»: en «A qué se aplicó (tipo y período)» cambias el cobro o tocas «Repartir en otro cobro»; «Eliminar pago» te dice qué cobros vuelven a «por cobrar» y si también se borra en Monterroso World.' },
      { texto: 'Marca varios para «Completar forma y cuenta», «Eliminar los marcados» o «Bajar recibos».' },
      { texto: 'Toca «Excel» o «PDF» para bajar lo filtrado; en «Más» está «Registrar anticipo».', ir: '.c-cabeza-acciones' },
    ],
  },
  {
    ruta: '/saldo-a-favor',
    pasos: [
      { texto: 'Arriba ves el «Saldo a favor hoy» de tus clientes y lo «Usado este mes» en sus cobros.', ir: '.erp-kpis' },
      { texto: 'Toca «Registrar anticipo» cuando un cliente te pague antes de que exista el cobro: cliente, fecha, monto, forma de pago y «Dónde cayó».', ir: 'button[title="Registra un pago adelantado que queda como saldo a favor del cliente"]' },
      { texto: 'Usa los chips «Con saldo» y «Todos», o busca por cliente, referencia o monto.', ir: '.c-herramientas' },
      { texto: 'En cada fila toca «Aplicar anticipo» para usarlo en los cobros que debe, en parte o completo.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Sobrante» si sobra al cerrar el proyecto: devolverlo al cliente o dejarlo a favor para un trabajo futuro.' },
    ],
  },
  {
    ruta: '/cuentas',
    pasos: [
      { texto: 'Arriba ves cuánto tienes hoy entre cuentas y efectivo, lo que entró este mes y lo que «Falta pasar a la S.A.».', ir: '.erp-kpis' },
      { texto: 'Toca «Registrar traspaso» cuando el dinero pase de una caja o cuenta a otra: eliges «Sale de», «Entra a», monto, fecha y nota.', ir: 'button[title="Registra dinero que pasa de una caja o cuenta a otra"]' },
      { texto: 'En «Más» toca «Agregar cuenta personal» o «Agregar caja de efectivo»; ya vienen «Efectivo billetera» y «Efectivo Papá».', ir: 'button[aria-haspopup="menu"]' },
      { texto: 'En «Falta pasar a la S.A.» marca los pagos y toca «Registrar traslado a la S.A.»; pones la fecha y la cuenta de la S.A.' },
      { texto: '«Saldo de cada cuenta y caja» dice lo que entró, salió y el saldo de hoy; el lápiz renombra, pone el saldo inicial o apaga.' },
      { texto: 'En «Traspasos entre cuentas y cajas» ves cada traspaso; el basurero lo quita y se puede deshacer.' },
    ],
  },
  {
    ruta: '/contratos',
    pasos: [
      { texto: 'Toca «Armar contrato» para hacer un contrato con los datos de un cliente.', ir: 'button[title="Armar un contrato con los datos de un cliente"]' },
      { texto: 'En el armador ves a la derecha la vista previa igual al PDF (en pantallas angostas, la pestaña «Vista previa»); lo que falta sale como «[Falta: …]».' },
      { texto: 'Arriba de la vista previa: «Ajustar al ancho» o «100 %», la página, «Bajar PDF» y «Enviar por WhatsApp».' },
      { texto: 'Usa las pestañas «Contratos» y «Plantillas».', ir: '.c-pestanas' },
      { texto: 'Escribe el cliente o el título en el buscador para encontrar un contrato.', ir: '.c-herramientas' },
      { texto: 'En cada contrato puedes verlo, abrir su PDF, editar la firma o el texto, o quitarlo; quitar se puede deshacer.' },
      { texto: 'En «Plantillas» toca «Nueva plantilla» o el lápiz para cambiar las cláusulas.' },
    ],
  },
  {
    ruta: '/tienda',
    pasos: [
      { texto: 'Arriba ves las ventas, el costo, la utilidad y lo que falta cobrar de los pedidos del mes.', ir: '.erp-kpis' },
      { texto: 'La tabla «Pedidos por cobrar» lista los pedidos que no se han pagado completos.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Registrar pago» para ir a registrar un pago de la tienda.', ir: 'a[title="Registrar un pago"]' },
      { texto: 'Los encabezados de columna ordenan la lista por fecha, estado o lo que debe.' },
    ],
  },
  {
    ruta: '/tienda/pedidos',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Toca «Importar de Shopify» y elige el CSV de pedidos; entran solo los nuevos, sin duplicar.', ir: '.c-btn-archivo' },
      { texto: 'Toca «Nuevo pedido» para registrar uno a mano.', ir: 'button[title="Registrar un pedido a mano"]' },
      { texto: 'Escribe el pedido, producto o cliente en el buscador.', ir: '.c-herramientas' },
      { texto: 'Edita un pedido con su lápiz, por ejemplo para poner el costo real.', ir: '.m-tabla-envoltura' },
      { texto: 'Marca varios pedidos y toca «Quitar las marcadas» para quitarlos juntos.' },
    ],
  },
  {
    ruta: '/tienda/pagos',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Toca «Registrar pago» para anotar lo que entró y ligarlo a sus pedidos.', ir: 'button[title="Registrar lo que entró y ligarlo a sus pedidos"]' },
      { texto: 'En la ventana elige la fecha y el «Medio», y marca los pedidos que cubre el pago.' },
      { texto: 'En «Dónde cayó» elige la cuenta; en «Comprobante» elige, arrastra o pega con Ctrl/⌘ + V la foto o el PDF.' },
      { texto: 'Edita un pago con su lápiz para corregir la fecha, el medio o la referencia.', ir: '.m-tabla-envoltura' },
      { texto: 'Si quitas un pago, pide confirmar y sus pedidos vuelven a quedar por cobrar.' },
    ],
  },
  {
    ruta: '/tienda/recibidos',
    pasos: [
      { texto: 'Arriba ves lo que entró en el período y cuántos pagos tienen «Falta decir dónde cayó» o no tienen comprobante.', ir: '.erp-kpis' },
      { texto: 'Elige el período y cómo verlo: «Lista», «Por mes» o «Por cliente».', ir: '.c-herramientas' },
      { texto: 'Filtra por forma de pago, «Dónde cayó» o comprobante.', ir: '.c-filtros-dim' },
      { texto: 'Toca «Falta decir dónde cayó» o el lápiz para elegir la cuenta o caja y el comprobante; toca un pago para ver su detalle.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Excel» o «PDF» para bajar lo filtrado.', ir: '.c-cabeza-acciones' },
    ],
  },
  {
    ruta: '/tienda/productos',
    pasos: [
      { texto: 'Toca «Nuevo producto» para agregar un producto.', ir: 'button[title="Agregar un producto"]' },
      { texto: 'Escribe el nombre o el SKU en el buscador.', ir: '.c-herramientas' },
      { texto: 'Edita un producto con su lápiz; ahí también lo marcas para compartirlo con la página.', ir: '.m-tabla-envoltura' },
      { texto: 'Quitar un producto se puede deshacer y no cambia los pedidos ya registrados.' },
      { texto: 'Marca varios productos y toca «Quitar las marcadas» para quitarlos juntos.' },
    ],
  },
  {
    ruta: '/tienda/gastos',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Usa las pestañas «Gastos del mes» y «Gastos fijos».', ir: '.c-pestanas' },
      { texto: 'Toca «Nuevo gasto» para registrar un gasto de la tienda; en «De dónde salió el dinero» eliges la cuenta o caja.', ir: 'button[title="Registrar un gasto de la empresa"]' },
      { texto: 'Si aparece «Gastos fijos por registrar este mes», toca «Registrar» en cada uno.' },
      { texto: 'Escribe descripción, proveedor, NIT o factura en el buscador; cada gasto se edita con su lápiz.', ir: '.c-herramientas' },
      { texto: 'En «Gastos fijos» toca «Gasto fijo» para agregar uno que se repite cada mes.' },
    ],
  },
  {
    ruta: '/tienda/presupuesto',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Arriba ves ingresos, gastos y utilidad reales contra lo planeado de la tienda.', ir: '.erp-kpis' },
      { texto: 'Toca el lápiz de una categoría para poner su monto presupuestado.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Copiar mes anterior» para traer los montos del mes pasado sin tocar los que ya pusiste.' },
    ],
  },
  {
    ruta: '/salario',
    pasos: [
      { texto: 'Toca «Poner salario» la primera vez; después el botón dice «Registrar aumento» para un aumento desde un mes.' },
      { texto: 'El salario se repite solo cada mes y sale en «Lo que me deben» como por recibir.' },
      { texto: 'En «Últimos 12 meses» toca «Recibido» cuando te paguen el mes.' },
      { texto: 'En «Historial de aumentos» corrige un monto con el lápiz o quítalo con el basurero.', ir: '.m-tabla-envoltura' },
    ],
  },
  {
    ruta: '/salario/gastos',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Usa las pestañas «Gastos del mes» y «Gastos fijos».', ir: '.c-pestanas' },
      { texto: 'Toca «Nuevo gasto» para un gasto del salario, como transporte o internet; elige «De dónde salió el dinero».', ir: 'button[title="Registrar un gasto de la empresa"]' },
      { texto: 'Si aparece «Gastos fijos por registrar este mes», toca «Registrar» en cada uno.' },
      { texto: 'Cada gasto se edita con su lápiz; marca varios y toca «Quitar las marcadas» para quitarlos juntos.', ir: '.c-herramientas' },
    ],
  },
  {
    ruta: '/salario/presupuesto',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Arriba ves lo real contra lo planeado del salario.', ir: '.erp-kpis' },
      { texto: 'Toca el lápiz de una categoría para poner su monto presupuestado.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Copiar mes anterior» para traer los montos del mes pasado sin tocar los que ya pusiste.' },
    ],
  },
  {
    ruta: '/salario/recibidos',
    pasos: [
      { texto: 'Arriba ves lo que entró en el período y cuántos pagos tienen «Falta decir dónde cayó» o no tienen comprobante.', ir: '.erp-kpis' },
      { texto: 'Elige el período y cómo verlo: «Lista», «Por mes» o «Por cliente».', ir: '.c-herramientas' },
      { texto: 'Filtra por forma de pago, «Dónde cayó» o comprobante.', ir: '.c-filtros-dim' },
      { texto: 'Toca «Falta decir dónde cayó» o el lápiz para abrir «Editar pago»; ahí está «A qué se aplicó (tipo y período)» y «Eliminar pago».', ir: '.m-tabla-envoltura' },
      { texto: 'Marca varios para «Completar forma y cuenta» o «Eliminar los marcados».' },
      { texto: 'Toca «Excel» o «PDF» para bajar lo filtrado.', ir: '.c-cabeza-acciones' },
    ],
  },
  {
    ruta: '/gastos',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Usa las pestañas «Gastos del mes», «Gastos fijos» y «Costo y ganancia por cliente».', ir: '.c-pestanas' },
      { texto: 'Toca «Nuevo gasto» para registrar un gasto; en «De dónde salió el dinero» eliges la cuenta o caja.', ir: 'button[title="Registrar un gasto de la empresa"]' },
      { texto: 'Escribe en el buscador o toca «Todos» o un negocio para filtrar.', ir: '.c-herramientas' },
      { texto: 'Si aparece «Gastos fijos por registrar este mes», toca «Registrar» en cada uno.' },
      { texto: 'Cada gasto se edita con su lápiz; marca varios y toca «Quitar las marcadas» para quitarlos juntos.' },
    ],
  },
  {
    ruta: '/deudas',
    pasos: [
      { texto: 'Toca «Nueva deuda» para agregar una compra a cuotas o una tarjeta de crédito.', ir: 'button[title="Agregar una compra a cuotas o una tarjeta"]' },
      { texto: 'Arriba ves cuánto debes en total y las cuotas del mes.', ir: '.erp-kpis' },
      { texto: 'En cada deuda toca «Pago» para registrar un pago, o «Compra» si es tarjeta.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca una deuda para ver sus movimientos abajo.' },
      { texto: 'Cada movimiento se corrige con su lápiz o se quita con el basurero; quitar se puede deshacer.' },
    ],
  },
  {
    ruta: '/presupuestos',
    pasos: [
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'Toca un negocio para poner su presupuesto, o «Todos juntos» para ver la suma (solo lectura).', ir: '.c-chips' },
      { texto: 'Arriba ves ingresos, gastos y utilidad reales contra lo planeado.', ir: '.erp-kpis' },
      { texto: 'Toca el lápiz de una categoría para poner su monto presupuestado.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Copiar mes anterior» para traer los montos del mes pasado sin tocar los que ya pusiste.' },
    ],
  },
  {
    ruta: '/impuestos',
    pasos: [
      { texto: 'Usa las pestañas «Resumen del mes», «Facturas» y «Régimen».', ir: '.c-pestanas' },
      { texto: 'Elige el mes con las flechas del selector de mes.', ir: '.c-selector-mes' },
      { texto: 'En «Resumen del mes» ves por negocio lo facturado, las compras y lo que toca pagar.' },
      { texto: 'En «Facturas» toca «Emitida» o «Recibida» para agregar una factura, y filtra con «Todas», «Emitidas» o «Recibidas».' },
      { texto: 'Si te avisa que hay gastos con número de factura, toca «Traerlas» para crearlas.' },
      { texto: 'En «Régimen» toca «Cambiar régimen» para cambiarlo desde un mes.' },
    ],
  },
  {
    ruta: '/precios',
    pasos: [
      { texto: 'Toca «Paquete» para agregar uno con inscripción y mensualidad.', ir: 'button[title="Agregar un paquete con inscripción y mensualidad"]' },
      { texto: 'Toca «Extra» para agregar un extra con precio único.', ir: 'button[title="Agregar un extra con precio único"]' },
      { texto: 'Edita una tarifa con su lápiz; ahí marcas «Compartir con la página».', ir: '.m-tabla-envoltura' },
      { texto: 'Toca «Copiar compartidos» para copiar los precios marcados, listos para la página.' },
      { texto: 'Quitar una tarifa se puede deshacer y no cambia los proyectos que ya la usaron.' },
    ],
  },
  {
    ruta: '/reportes',
    pasos: [
      { texto: 'Usa las pestañas «Estado de resultados», «Flujo de caja», «Por forma y cuenta» y «Ganancia por cliente».', ir: '.c-pestanas' },
      { texto: 'Toca el año que quieres ver y, si aplica, «Todos» o un negocio.', ir: '.c-herramientas' },
      { texto: 'En «Estado de resultados» ves ingresos y gastos por categoría y la tabla «Mes a mes».' },
      { texto: 'En «Por forma y cuenta» ves lo que entró por forma de pago y por cuenta; filtra con «Forma de pago» y «Dónde cayó».' },
      { texto: 'Toca «Excel» para bajar el reporte o «PDF» para guardarlo o imprimirlo.', ir: 'button[title="Abrir este reporte para guardarlo en PDF o imprimirlo"]' },
    ],
  },
  {
    ruta: '/negocios',
    pasos: [
      { texto: 'Aquí ves tus negocios con cuántos clientes tiene cada uno y si está activo.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca el lápiz de un negocio para cambiarle el nombre o apagarlo.' },
      { texto: 'Apagar un negocio no borra lo que ya está registrado.' },
    ],
  },
  {
    ruta: '/categorias',
    pasos: [
      { texto: 'Toca «Nueva categoría» para agregar una categoría de gasto.', ir: 'button[title="Agregar una categoría de gasto"]' },
      { texto: 'La tabla «Gastos» se puede agregar, renombrar y apagar; la de «Ingresos» se llena sola.', ir: '.m-tabla-envoltura' },
      { texto: 'Toca el lápiz para renombrar o apagar una categoría; apagada deja de salir en los formularios.' },
      { texto: 'Solo se puede quitar una categoría que no tiene nada registrado.' },
    ],
  },
  {
    ruta: '/mundo',
    pasos: [
      { texto: 'En «Áreas que cuentan como Empresa» marca las áreas de Monterroso World que quieres traer.' },
      { texto: 'Elige en «Entran al negocio» y «Con la categoría» a dónde van esos gastos.', ir: '.c-herramientas' },
      { texto: 'Revisa la tabla «Gastos de Empresa por traer» y toca «Traer» para copiarlos a Gastos, una sola vez y sin duplicar.' },
      { texto: 'En modo de prueba esta conexión no está disponible.' },
    ],
  },
]
