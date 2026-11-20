import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ProveedorAvisos } from './componentes/Avisos'
import Marco from './componentes/Marco'
import { ProveedorDatos, useDatos } from './lib/datos'
import { ProveedorSesion, useSesion } from './lib/sesion'
import Acceso from './pantallas/Acceso'
import ClienteFicha from './pantallas/ClienteFicha'
import Clientes from './pantallas/Clientes'
import Cobros from './pantallas/cobros/Cobros'
import Contratos from './pantallas/contratos/Contratos'
import Deudas from './pantallas/Deudas'
import Gastos from './pantallas/gastos/Gastos'
import Impuestos from './pantallas/Impuestos'
import Inicio from './pantallas/Inicio'
import Mundo from './pantallas/Mundo'
import Negocios from './pantallas/Negocios'
import Precios from './pantallas/Precios'
import Categorias from './pantallas/presupuesto/Categorias'
import Presupuestos from './pantallas/presupuesto/Presupuestos'
import Proyectos from './pantallas/Proyectos'
import ProyectoFicha from './pantallas/ProyectoFicha'
import Desarrollo from './pantallas/desarrollo/Desarrollo'
import FichaSA from './pantallas/sa/Ficha'
import Documentos from './pantallas/documentos/Documentos'
import MiMarca from './pantallas/marca/MiMarca'
import SociosSA from './pantallas/sa/Socios'
import UtilidadesSA from './pantallas/sa/Utilidades'
import BancosSA from './pantallas/sa/Bancos'
import EstadosSA from './pantallas/sa/Estados'
import TramitesSA from './pantallas/sa/Tramites'
import RecordatoriosSA from './pantallas/sa/Recordatorios'
import Reportes from './pantallas/Reportes'
import Salario from './pantallas/Salario'
import Tienda from './pantallas/tienda/Tienda'
import ResumenTienda from './pantallas/tienda/Resumen'
import PagosTienda from './pantallas/tienda/Pagos'
import PagosRecibidos from './pantallas/pagos/PagosRecibidos'
import Cuentas from './pantallas/pagos/Cuentas'
import SaldoAFavor from './pantallas/pagos/SaldoAFavor'
import DocumentoWeb from './pantallas/web/DocumentoWeb'
import AplicarSolo from './pantallas/pagos/AplicarSolo'

function Cargando() {
  return <div className="c-carga" role="status" aria-label="Leyendo los datos"><img className="c-carga-iso" src="/marca/studio-isotipo.svg" alt="" /><div className="c-esqueleto-kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="c-esqueleto c-esqueleto-kpi" />)}</div><div className="c-esqueleto-tarjetas">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="c-esqueleto" />)}</div></div>
}

function Contenido() {
  const { cargando, error, recargar } = useDatos()
  if (cargando) return <Cargando />
  if (error) return (
    <Marco>
      <div className="m-vacio m-tarjeta">
        <b>No se pudo leer la base</b>
        <span>{error}</span>
        <button type="button" className="m-btn m-btn-primario" onClick={() => void recargar()} title="Volver a intentar">Intentar otra vez</button>
      </div>
    </Marco>
  )
  return (
    <Marco>
      <AplicarSolo />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<ClienteFicha />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/proyectos/:id" element={<ProyectoFicha />} />
        <Route path="/desarrollo" element={<Desarrollo />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/marca" element={<MiMarca />} />
        <Route path="/sa" element={<FichaSA />} />
        <Route path="/sa/socios" element={<SociosSA />} />
        <Route path="/sa/utilidades" element={<UtilidadesSA />} />
        <Route path="/sa/bancos" element={<BancosSA />} />
        <Route path="/sa/estados" element={<EstadosSA />} />
        <Route path="/sa/tramites" element={<TramitesSA />} />
        <Route path="/sa/recordatorios" element={<RecordatoriosSA />} />
        <Route path="/cobros" element={<Cobros />} />
        <Route path="/pagos" element={<PagosRecibidos />} />
        <Route path="/cuentas" element={<Cuentas />} />
        <Route path="/saldo-a-favor" element={<SaldoAFavor />} />
        <Route path="/tienda/recibidos" element={<PagosRecibidos key="r-canela" negocioClave="canela" />} />
        <Route path="/salario/recibidos" element={<PagosRecibidos key="r-salario" negocioClave="salario" />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/tienda" element={<ResumenTienda />} />
        <Route path="/tienda/pedidos" element={<Tienda fija="pedidos" />} />
        <Route path="/tienda/pagos" element={<PagosTienda />} />
        <Route path="/tienda/productos" element={<Tienda fija="productos" />} />
        <Route path="/tienda/gastos" element={<Gastos key="g-canela" negocioClave="canela" />} />
        <Route path="/tienda/presupuesto" element={<Presupuestos key="p-canela" negocioClave="canela" />} />
        <Route path="/salario" element={<Salario />} />
        <Route path="/salario/gastos" element={<Gastos key="g-salario" negocioClave="salario" />} />
        <Route path="/salario/presupuesto" element={<Presupuestos key="p-salario" negocioClave="salario" />} />
        <Route path="/gastos" element={<Gastos key="g-todos" />} />
        <Route path="/deudas" element={<Deudas />} />
        <Route path="/presupuestos" element={<Presupuestos key="p-todos" />} />
        <Route path="/impuestos" element={<Impuestos />} />
        <Route path="/precios" element={<Precios />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/negocios" element={<Negocios />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/mundo" element={<Mundo />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </Marco>
  )
}

function Puerta() {
  const lugar = useLocation()
  const { listo, correo, prueba } = useSesion()
  if (lugar.pathname.startsWith('/d/')) return <Routes><Route path="/d/:codigo" element={<DocumentoWeb />} /><Route path="*" element={<DocumentoWeb />} /></Routes>
  if (!listo) return <Cargando />
  if (!correo) return <Acceso />
  return <ProveedorDatos key={prueba ? 'prueba' : correo} prueba={prueba}><Contenido /></ProveedorDatos>
}

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <ProveedorAvisos>
          <Puerta />
        </ProveedorAvisos>
      </ProveedorSesion>
    </BrowserRouter>
  )
}
