import { useState, useMemo }   from 'react'
import { useQuery }            from '@tanstack/react-query'
import { fetchCategoryPerf }   from '../api/client'
import { useFilters }          from '../context/FilterContext'
import type { CategoryPerf }   from '../api/client'

type SortKey = 'category' | 'offer_count' | 'total_jatak' | 'total_sold' | 'avg_revenue' | 'avg_price' | 'avg_jatak' | 'conversion_rate' | 'total_revenue'
type SortDir = 'asc' | 'desc'

// ── Lookup maps ───────────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Mejeri & Køl':              '#facc15',
  'Mejeri & Ost':              '#facc15',
  'Kød & Slagter':             '#f59e0b',
  'Bageri':                    '#fb923c',
  'Slik & Chokolade':          '#f472b6',
  'Is':                        '#c084fc',
  'Is & Dessert':              '#c084fc',
  'Sodavand & Juice':          '#38bdf8',
  'Drikkevarer':               '#38bdf8',
  'Kolonial & Tørvarer':       '#4ade80',
  'Kolonial':                  '#4ade80',
  'Krydderier & Saucer':       '#a3e635',
  'Snacks':                    '#fbbf24',
  'Frostvarer':                '#67e8f9',
  'Kager & Desserter':         '#f9a8d4',
  'Pølser':                    '#fca5a1',
  'Frugt & Grønt':             '#86efac',
  'Fjerkræ':                   '#fed7aa',
  'Kød':                       '#f59e0b',
  'Personlig Pleje':           '#818cf8',
  'Pålæg':                     '#e2e8f0',
  'Fisk & Skaldyr':            '#7dd3fc',
  'Baby & Børn':               '#fbcfe8',
  'Sundhed & Pleje':           '#a5b4fc',
  'Brød & Bagværk':            '#d97706',
  'Have & Planter':            '#4ade80',
  'Andre':                     '#64748b',
  'Vin':                       '#c084fc',
  'Færdigretter':              '#fdba74',
  'Elektronik':                '#38bdf8',
  'Belysning':                 '#fde68a',
  'Spiritus':                  '#f87171',
  'Bolig & Hjem':              '#94a3b8',
  'Kæledyr':                   '#86efac',
  'Non-food: Køkken & Hjem':   '#94a3b8',
  'Non-food: Gave & Andet':    '#f472b6',
  'Rengøring & Husholdning':   '#5eead4',
  'Unknown':                   '#475569',
  'Other':                     '#475569',
}
function catColor(cat: string) { return CAT_COLORS[cat] ?? '#6366f1' }

const CAT_ICONS: Record<string, string> = {
  'Mejeri & Køl':              '🧀',
  'Mejeri & Ost':              '🧀',
  'Kød & Slagter':             '🥩',
  'Bageri':                    '🥖',
  'Slik & Chokolade':          '🍫',
  'Is':                        '🍦',
  'Is & Dessert':              '🍦',
  'Sodavand & Juice':          '🥤',
  'Drikkevarer':               '🍺',
  'Kolonial & Tørvarer':       '🛒',
  'Kolonial':                  '🛒',
  'Krydderier & Saucer':       '🌶️',
  'Snacks':                    '🍿',
  'Frostvarer':                '🧊',
  'Kager & Desserter':         '🎂',
  'Pølser':                    '🌭',
  'Frugt & Grønt':             '🥬',
  'Fjerkræ':                   '🍗',
  'Kød':                       '🥩',
  'Personlig Pleje':           '🧴',
  'Pålæg':                     '🥪',
  'Fisk & Skaldyr':            '🐟',
  'Baby & Børn':               '👶',
  'Sundhed & Pleje':           '💊',
  'Brød & Bagværk':            '🍞',
  'Have & Planter':            '🌱',
  'Vin':                       '🍷',
  'Færdigretter':              '🍱',
  'Elektronik':                '📱',
  'Belysning':                 '💡',
  'Spiritus':                  '🥃',
  'Bolig & Hjem':              '🏠',
  'Kæledyr':                   '🐾',
  'Rengøring & Husholdning':   '🧹',
  'Non-food: Køkken & Hjem':   '🏠',
  'Non-food: Gave & Andet':    '🎁',
  'Andre':                     '📦',
  'Unknown':                   '❓',
  'Other':                     '📦',
}
function catIcon(cat: string) { return CAT_ICONS[cat] ?? '📊' }

function fmt(n: number)    { return n.toLocaleString('da-DK') }
function fmtDKK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mio. kr`
  return `${Math.round(n).toLocaleString('da-DK')} kr`
}

function ListItem({ cat, rank, maxJatak, isActive, onClick }: {
  cat: CategoryPerf; rank: number; maxJatak: number; isActive: boolean; onClick: () => void
}) {
  const color = catColor(cat.category)
  const pct   = (cat.avg_jatak / maxJatak) * 100
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl px-3 py-2.5 transition-all duration-150 group ${
        isActive
          ? 'bg-slate-800 border border-slate-600 shadow-lg'
          : 'border border-transparent hover:bg-slate-800/60 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-base leading-none w-5 text-center flex-shrink-0">{catIcon(cat.category)}</span>
        <span className={`text-xs font-semibold leading-tight flex-1 min-w-0 truncate ${isActive ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-100'}`}>
          {cat.category}
        </span>
        <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color }}>
          {cat.avg_jatak.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center gap-2 pl-7">
        <div className="flex-1 bg-slate-800 rounded-full h-1">
          <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }} />
        </div>
        <span className="text-[10px] text-slate-600 tabular-nums w-8 text-right">#{rank}</span>
      </div>
    </button>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div
      className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-colors"
      style={accent ? { borderTopColor: accent, borderTopWidth: 2 } : {}}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{label}</p>
      <p className="text-2xl font-black tabular-nums text-slate-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
    </div>
  )
}

function KpiPanel({ cat, rank, total }: { cat: CategoryPerf; rank: number; total: number }) {
  const color        = catColor(cat.category)
  const totalRevenue = cat.offer_count * cat.avg_revenue
  const basketQty    = cat.total_jatak > 0 ? cat.total_sold / cat.total_jatak : 0
  return (
    <div className="space-y-6">
      <div
        className="relative rounded-2xl p-6 overflow-hidden border border-slate-800"
        style={{ background: `linear-gradient(135deg, ${color}12 0%, transparent 60%)` }}
      >
        <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-10" style={{ background: `radial-gradient(circle at 90% 10%, ${color}, transparent 50%)` }} />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}33` }}>
            {catIcon(cat.category)}
          </div>
          <div>
            <p className="text-2xl font-black text-slate-100 leading-tight">{cat.category}</p>
            <p className="text-sm text-slate-400 mt-0.5">
              Rang <span className="font-bold" style={{ color }}>#{rank}</span> ud af {total} kategorier
              &nbsp;·&nbsp;
              <span className="font-semibold" style={{ color }}>{cat.avg_jatak.toFixed(1)}</span> gns. Ja Tak
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Oprettede tilbud"   value={fmt(cat.offer_count)}  sub="Ja Tak-opslag i perioden"       accent={color}     />
        <KpiCard label="Ordrer gennemført"  value={fmt(cat.total_jatak)}  sub="Kunder der svarede Ja Tak"      accent="#6366f1"   />
        <KpiCard label="Varer solgt"        value={fmt(cat.total_sold)}   sub="Stk. på tværs af alle ordrer"   accent="#4ade80"   />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Samlet omsætning"          value={fmtDKK(totalRevenue)}                              sub="tilbud × gns. omsætning"       accent="#22d3ee"  />
        <KpiCard label="Gns. ordreværdi"           value={`${cat.avg_price.toFixed(1)} kr`}                  sub="Gennemsnitlig tilbudspris"      accent="#f59e0b"  />
        <KpiCard label="Gns. kurvstørrelse"        value={`${basketQty.toFixed(1)} stk`}                     sub="Solgte varer ÷ ordrer"          accent="#c084fc"  />
        <KpiCard label="Gns. omsætning pr. tilbud" value={`${Math.round(cat.avg_revenue).toLocaleString('da-DK')} kr`} sub="Gns. revenue per opslag"  accent="#f472b6"  />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Salgs-konvertering</p>
          <span className="text-sm font-black tabular-nums" style={{ color }}>{cat.conversion_rate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div className="h-2 rounded-full" style={{ width: `${Math.min(cat.conversion_rate, 100)}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }} />
        </div>
        <p className="text-[10px] text-slate-600 mt-2">{fmt(cat.total_sold)} solgte varer ud af {fmt(cat.total_jatak)} Ja Tak-svar</p>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const { filters }             = useFilters()
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [view, setView]         = useState<'panel' | 'table'>('panel')

  const { data: cats = [], isLoading, isError } = useQuery({
    queryKey: ['cat-perf', filters],
    queryFn:  () => fetchCategoryPerf(filters),
  })

  if (isLoading) return <Spinner />
  if (isError || cats.length === 0) return <Empty />

  const sorted   = [...cats].sort((a, b) => b.avg_jatak - a.avg_jatak)
  const maxJatak = sorted[0]?.avg_jatak ?? 1
  const filtered = sorted.filter(c => c.category.toLowerCase().includes(search.toLowerCase()))

  const activeName = selected ?? sorted[0]?.category
  const activeCat  = sorted.find(c => c.category === activeName)
  const activeRank = sorted.findIndex(c => c.category === activeName) + 1

  if (view === 'table') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-100 tracking-tight">Kategorier</h1>
          <p className="text-xs text-slate-500">Alle kategorier · klik kolonneheader for at sortere</p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>
      <SortableTable cats={sorted} />
    </div>
  )

  return (
    <div className="flex gap-5" style={{ height: 'calc(100vh - 112px)' }}>

      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-100 tracking-tight">Kategorier</h1>
            <p className="text-xs text-slate-500">{sorted.length} kategorier · vælg for detaljer</p>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Søg kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">✕</button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 -mr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-600 text-center pt-8">Ingen match</p>
          ) : (
            filtered.map(c => (
              <ListItem
                key={c.category}
                cat={c}
                rank={sorted.indexOf(c) + 1}
                maxJatak={maxJatak}
                isActive={c.category === activeName}
                onClick={() => setSelected(c.category)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-w-0">
        {activeCat ? (
          <KpiPanel cat={activeCat} rank={activeRank} total={sorted.length} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">Vælg en kategori i listen</div>
        )}
      </div>

    </div>
  )
}
// ── View toggle ───────────────────────────────────────────────────────────────
function ViewToggle({ view, onChange }: { view: 'panel' | 'table'; onChange: (v: 'panel' | 'table') => void }) {
  return (
    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 flex-shrink-0">
      <button
        onClick={() => onChange('panel')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          view === 'panel' ? 'bg-slate-600 text-slate-100 shadow' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        ⊞ Panel
      </button>
      <button
        onClick={() => onChange('table')}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          view === 'table' ? 'bg-slate-600 text-slate-100 shadow' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        ≡ Tabel
      </button>
    </div>
  )
}
// ── Sortable table ───────────────────────────────────────────────────────────
function SortableTable({ cats }: { cats: CategoryPerf[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('avg_jatak')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch]  = useState('')

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const rows = useMemo(() => {
    const filtered = cats.filter(c =>
      c.category.toLowerCase().includes(search.toLowerCase())
    ).map(c => ({ ...c, total_revenue: c.offer_count * c.avg_revenue }))

    return [...filtered].sort((a: any, b: any) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [cats, sortKey, sortDir, search])

  function Th({ k, label, right }: { k: SortKey; label: string; right?: boolean }) {
    const active = sortKey === k
    return (
      <th
        onClick={() => handleSort(k)}
        className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer select-none whitespace-nowrap transition-colors ${
          active ? 'text-slate-200' : 'text-slate-500 hover:text-slate-300'
        } ${right ? 'text-right' : 'text-left'}`}
      >
        {label}
        <span className="ml-1 opacity-60">
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </th>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Søg kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">✕</button>
          )}
        </div>
        <p className="text-xs text-slate-500">{rows.length} kategorier</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <Th k="category"        label="Kategori"          />
                <Th k="offer_count"     label="Tilbud"       right />
                <Th k="total_jatak"     label="Ordrer"       right />
                <Th k="total_sold"      label="Varer solgt"  right />
                <Th k="total_revenue"   label="Omsætning"    right />
                <Th k="avg_price"       label="Gns. pris"    right />
                <Th k="avg_jatak"       label="Gns. Ja Tak"  right />
                <Th k="avg_revenue"     label="Gns. pr. tilbud" right />
                <Th k="conversion_rate" label="Konv. %"      right />
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => {
                const color = catColor(c.category)
                const isEven = i % 2 === 0
                return (
                  <tr
                    key={c.category}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${
                      isEven ? '' : 'bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-sm leading-none">{catIcon(c.category)}</span>
                        <span className="text-sm font-semibold text-slate-200 whitespace-nowrap">{c.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300 tabular-nums text-sm">{fmt(c.offer_count)}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-sm font-semibold" style={{ color }}>{fmt(c.total_jatak)}</td>
                    <td className="py-3 px-4 text-right text-slate-300 tabular-nums text-sm">{fmt(c.total_sold)}</td>
                    <td className="py-3 px-4 text-right text-cyan-300 tabular-nums text-sm font-semibold">{fmtDKK((c as any).total_revenue)}</td>
                    <td className="py-3 px-4 text-right text-slate-400 tabular-nums text-sm">{c.avg_price.toFixed(1)} kr</td>
                    <td className="py-3 px-4 text-right tabular-nums text-sm">
                      <span className="font-black" style={{ color }}>{c.avg_jatak.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-green-400 tabular-nums text-sm font-semibold">{Math.round(c.avg_revenue).toLocaleString('da-DK')} kr</td>
                    <td className="py-3 px-4 text-right tabular-nums text-sm">
                      <span className={`font-semibold ${
                        c.conversion_rate >= 50 ? 'text-green-400' :
                        c.conversion_rate >= 20 ? 'text-amber-400' : 'text-slate-400'
                      }`}>{c.conversion_rate.toFixed(1)}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2">
      <p>Ingen kategoridata – er backend kørende på port 8000?</p>
    </div>
  )
}
