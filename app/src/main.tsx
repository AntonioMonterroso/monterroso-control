import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './marca.css'
import './app.css'
import './erp.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

if (import.meta.env.DEV) void import('./lib/marcaExport')
