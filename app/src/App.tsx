import { BrowserRouter, Route, Routes } from 'react-router-dom'
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
import Reportes from './pantallas/Reportes'
import Salario from './pantallas/Salario'
import Tienda from './pantallas/tienda/Tienda'
import ResumenTienda from './pantallas/tienda/Resumen'
import PagosTienda from './pantallas/tienda/Pagos'

function Cargando() {
  return <div className="m-cargando"><img className="c-carga-iso" src="/marca/studio-isotipo.svg" alt="" /><div className="m-cargando-linea"><span /></div></div>
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
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/clientes/:id" element={<ClienteFicha />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/proyectos/:id" element={<ProyectoFicha />} />
        <Route path="/desarrollo" element={<Desarrollo />} />
        <Route path="/cobros" element={<Cobros />} />
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
  const { listo, correo, prueba } = useSesion()
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
