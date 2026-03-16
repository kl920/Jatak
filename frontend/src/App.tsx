import { Routes, Route } from 'react-router-dom'
import Sidebar      from './components/layout/Sidebar'
import GlobalFilter from './components/layout/GlobalFilter'
import { FilterProvider } from './context/FilterContext'
import PasswordGate    from './components/PasswordGate'
import DashboardPage   from './pages/DashboardPage'
import CategoriesPage  from './pages/CategoriesPage'
import AIJatakPage        from './pages/AIJatakPage'
import ButiksuniversPage  from './pages/ButiksuniversPage'
import ChurnPage          from './pages/ChurnPage'

const IS_STATIC = import.meta.env.VITE_STATIC === 'true'

function Shell() {
  return (
    <FilterProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />

        <div className="ml-56 flex-1 flex flex-col min-h-screen">
          {/* Global filter bar */}
          <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-8 py-3">
            <GlobalFilter />
          </header>

          <main className="flex-1 p-8 overflow-auto">
            <Routes>
              <Route path="/"           element={<DashboardPage />}  />
              <Route path="/kategorier" element={<CategoriesPage />} />
              <Route path="/butiksudvikling"    element={<ChurnPage />}         />
              <Route path="/butiksunivers"      element={<ButiksuniversPage />} />
              <Route path="/ai-jatak"          element={<AIJatakPage />}       />
            </Routes>
          </main>
        </div>
      </div>
    </FilterProvider>
  )
}

export default function App() {
  return IS_STATIC ? <PasswordGate><Shell /></PasswordGate> : <Shell />
}
