import { useQuery } from '@tanstack/react-query'
import { fetchStoreList, fetchDateRange } from '../../api/client'
import { useFilters }                    from '../../context/FilterContext'
import { Filter, X }                    from 'lucide-react'

const YEAR_RANGES: Record<string, { date_from: string; date_to: string; label: string }> = {
  '2024': { date_from: '2024-01-01', date_to: '2024-12-31', label: '2024' },
  '2025': { date_from: '2025-01-01', date_to: '2025-12-31', label: '2025' },
  '2026': { date_from: '2026-01-01', date_to: '2026-12-31', label: '2026' },
  'all':  { date_from: '', date_to: '', label: 'Alle år' },
}

export default function GlobalFilter() {
  const { filters, setFilters } = useFilters()
  const { data: stores = [] }   = useQuery({ queryKey: ['storeList'],  queryFn: fetchStoreList,  staleTime: Infinity })
  const { data: range }         = useQuery({ queryKey: ['dateRange'],  queryFn: fetchDateRange,  staleTime: Infinity })

  const active = !!(filters.store || filters.date_from || filters.date_to)

  // Detect which year tab is active
  function activeYear(): string | null {
    if (filters.date_from === '2024-01-01' && filters.date_to === '2024-12-31') return '2024'
    if (filters.date_from === '2025-01-01' && filters.date_to === '2025-12-31') return '2025'
    if (!filters.date_from && !filters.date_to) return 'all'
    return null
  }

  function selectYear(key: string) {
    const yr = YEAR_RANGES[key]
    setFilters({
      ...filters,
      date_from: yr.date_from || undefined,
      date_to:   yr.date_to   || undefined,
    })
  }

  const currentYear = activeYear()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Filter className="w-4 h-4 text-slate-400" />

      {/* Year quick-select tabs */}
      <div className="flex rounded-lg overflow-hidden border border-slate-700">
        {Object.entries(YEAR_RANGES).map(([key, yr]) => (
          <button
            key={key}
            onClick={() => selectYear(key)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              currentYear === key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {yr.label}
          </button>
        ))}
      </div>

      {/* Store dropdown */}
      <select
        value={filters.store ?? ''}
        onChange={e => setFilters({ ...filters, store: e.target.value || undefined })}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Alle kæder</option>
        {stores.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Date from */}
      <input
        type="date"
        value={filters.date_from ?? (range?.date_min ?? '')}
        min={range?.date_min}
        max={range?.date_max}
        onChange={e => {
          const v = e.target.value
          setFilters({ ...filters, date_from: v || undefined })
        }}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <span className="text-slate-500 text-sm">→</span>

      {/* Date to */}
      <input
        type="date"
        value={filters.date_to ?? (range?.date_max ?? '')}
        min={range?.date_min}
        max={range?.date_max}
        onChange={e => {
          const v = e.target.value
          setFilters({ ...filters, date_to: v || undefined })
        }}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* Reset */}
      {active && (
        <button
          onClick={() => setFilters({})}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          <X className="w-3 h-3" /> Nulstil
        </button>
      )}
    </div>
  )
}
