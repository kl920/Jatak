import { Routes, Route } from 'react-router-dom'
import Sidebar      from './components/layout/Sidebar'
import GlobalFilter from './components/layout/GlobalFilter'
import { FilterProvider } from './context/FilterContext'
import KPIPage         from './pages/KPIPage'
import TrendPage       from './pages/TrendPage'
import StoresPage      from './pages/StoresPage'
import CategoriesPage  from './pages/CategoriesPage'
import AIJatakPage        from './pages/AIJatakPage'
import ButiksuniversPage  from './pages/ButiksuniversPage'

export default function App() {
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
              <Route path="/"           element={<KPIPage />}        />
              <Route path="/trend"      element={<TrendPage />}      />
              <Route path="/butikker"   element={<StoresPage />}     />
              <Route path="/kategorier" element={<CategoriesPage />} />
              <Route path="/ai-jatak"        element={<AIJatakPage />}       />
              <Route path="/butiksunivers"    element={<ButiksuniversPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </FilterProvider>
  )
}
