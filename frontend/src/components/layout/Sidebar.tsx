import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Store, Tag, Sparkles, ShoppingBag } from 'lucide-react'
import clsx from 'clsx'

const links = [
  { to: '/',              icon: LayoutDashboard, label: 'KPI Oversigt',     group: 'analyse' },
  { to: '/trend',         icon: TrendingUp,      label: 'Ugentlig Trend',   group: 'analyse' },
  { to: '/butikker',      icon: Store,           label: 'Butik Benchmark',  group: 'analyse' },
  { to: '/kategorier',    icon: Tag,             label: 'Kategorier',       group: 'analyse' },
  { to: '/butiksunivers', icon: ShoppingBag,     label: 'Butiksunivers',    group: 'butik'   },
  { to: '/ai-jatak',      icon: Sparkles,        label: 'AI Ja Tak',        group: 'butik'   },
]

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-slate-900 border-r border-slate-800 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <span className="text-blue-400 font-bold text-xl">✅</span>
        <span className="font-semibold text-sm leading-tight text-slate-100">
          Jatakportalen
          <span className="block font-normal text-slate-400 text-xs">Dashboard 2026</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Analyse</p>
        {links.filter(l => l.group === 'analyse').map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
        <p className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Butikværktøjer</p>
        {links.filter(l => l.group === 'butik').map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-slate-600 border-t border-slate-800">
        47,002 tilbud · 453 butikker
      </div>
    </aside>
  )
}

