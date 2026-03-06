import { useQuery }           from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { fetchCategoryPerf, fetchPricePoints } from '../api/client'
import { useFilters }           from '../context/FilterContext'
import type { CategoryPerf }    from '../api/client'

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#94a3b8' },
}

// Short display names for chart axes
const SHORT: Record<string, string> = {
  'Kød & Slagter':            'Kød',
  'Bageri':                   'Bageri',
  'Mejeri & Ost':             'Mejeri',
  'Drikkevarer':              'Drikke',
  'Is & Dessert':             'Is/Dessert',
  'Kolonial':                 'Kolonial',
  'Non-food: Køkken & Hjem':  'Køkken',
  'Non-food: Gave & Andet':   'Gave',
  'Other':                    'Andet',
}
function shortName(cat: string) {
  return SHORT[cat] ?? cat.slice(0, 10)
}

// Category → colour
const CAT_COLORS: Record<string, string> = {
  'Kød & Slagter':            '#f59e0b',
  'Bageri':                   '#fb923c',
  'Mejeri & Ost':             '#facc15',
  'Drikkevarer':              '#38bdf8',
  'Is & Dessert':             '#c084fc',
  'Kolonial':                 '#4ade80',
  'Non-food: Køkken & Hjem':  '#94a3b8',
  'Non-food: Gave & Andet':   '#f472b6',
  'Other':                    '#475569',
}
function catColor(cat: string) { return CAT_COLORS[cat] ?? '#3b82f6' }

function fmt(n: number)    { return n.toLocaleString('da-DK') }
function fmtDKK(n: number) { return `${n.toFixed(0)} kr` }

// ── Shared horizontal bar chart ───────────────────────────────────────────────
function HBar({
  data, dataKey, unit = '', color,
}: {
  data: (CategoryPerf & { short: string })[]
  dataKey: string
  unit?: string
  color: (d: CategoryPerf) => string
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 55, left: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={v => unit ? `${v}${unit}` : String(v)}
        />
        <YAxis
          type="category"
          dataKey="short"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          width={70}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v: any, _name: string, props: any) => {
            const d: CategoryPerf = props.payload
            return [
              unit === ' kr' ? fmtDKK(Number(v)) : Number(v).toFixed(1),
              d.category,
            ]
          }}
        />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
          {data.map((d, i) => <Cell key={i} fill={color(d)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { filters } = useFilters()

  const { data: cats   = [], isLoading: l1, isError: e1 } = useQuery({ queryKey: ['cat-perf',    filters], queryFn: () => fetchCategoryPerf(filters) })
  const { data: prices = [], isLoading: l2 }               = useQuery({ queryKey: ['pricepoints', filters], queryFn: () => fetchPricePoints(filters) })

  if (l1 || l2) return <Spinner />
  if (e1 || cats.length === 0) return <Empty />

  const sorted    = [...cats].sort((a, b) => b.avg_jatak - a.avg_jatak)
  const chartData = sorted.map(c => ({ ...c, short: shortName(c.category) }))
  const best      = sorted[0]
  const priciest  = [...cats].sort((a, b) => b.avg_price - a.avg_price)[0]
  const richest   = [...cats].sort((a, b) => b.avg_revenue - a.avg_revenue)[0]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Kategorier & Priser</h1>

      {/* Highlight cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sorted.slice(0, 4).map(c => (
          <div key={c.category} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: catColor(c.category) }} />
              <p className="text-xs text-slate-400 font-medium truncate">{c.category}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: catColor(c.category) }}>{c.avg_jatak.toFixed(1)}</p>
            <p className="text-xs text-slate-500">gns. Ja Tak</p>
            <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-500 space-y-0.5">
              <div>{fmtDKK(c.avg_price)} gns. pris</div>
              <div className="text-green-400">{fmtDKK(c.avg_revenue)} gns. omsætning</div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary insight */}
      {best && priciest && richest && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl px-5 py-3 text-sm text-slate-300">
          <span className="font-semibold text-blue-300">{best.category}</span> har flest Ja Tak ({best.avg_jatak.toFixed(1)} gns.) · {' '}
          <span className="font-semibold text-amber-300">{priciest.category}</span> har den højeste gennemsnitspris ({fmtDKK(priciest.avg_price)}) · {' '}
          <span className="font-semibold text-green-300">{richest.category}</span> genererer mest omsætning pr. tilbud ({fmtDKK(richest.avg_revenue)})
        </div>
      )}

      {/* Three charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wide">Gns. Ja Tak pr. tilbud</h2>
          <HBar data={chartData} dataKey="avg_jatak" color={d => catColor(d.category)} />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wide">Gns. Tilbudspris (kr)</h2>
          <HBar data={chartData} dataKey="avg_price" unit=" kr" color={() => '#38bdf8'} />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Gns. Omsætning pr. tilbud (kr)</h2>
          <p className="text-xs text-slate-500 mb-3">= gns. solgt stk × stk­pris</p>
          <HBar data={chartData} dataKey="avg_revenue" unit=" kr" color={() => '#4ade80'} />
        </div>

      </div>

      {/* Price bucket analysis */}
      {prices.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">Prisniveauer</h2>
          <p className="text-xs text-slate-500 mb-5">Tilbud grupperet efter produktpris · kun tilbud med pris &gt; 0 kr</p>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Avg Ja Tak */}
            <div>
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Gns. Ja Tak</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={prices} margin={{ top: 4, right: 10, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [Number(v).toFixed(1), 'Gns. Ja Tak']} />
                  <Bar dataKey="avg_jatak" radius={[4, 4, 0, 0]} maxBarSize={50} isAnimationActive={false}>
                    {prices.map((_, i) => <Cell key={i} fill={['#3b82f6','#6366f1','#8b5cf6','#a78bfa'][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Avg Price */}
            <div>
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Gns. Pris (kr)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={prices} margin={{ top: 4, right: 10, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${Number(v).toFixed(0)} kr`, 'Gns. Pris']} />
                  <Bar dataKey="avg_price" radius={[4, 4, 0, 0]} maxBarSize={50} fill="#38bdf8" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Avg Revenue */}
            <div>
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Gns. Omsætning (kr)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={prices} margin={{ top: 4, right: 10, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${Number(v).toFixed(0)} kr`, 'Gns. Omsætning']} />
                  <Bar dataKey="avg_revenue" radius={[4, 4, 0, 0]} maxBarSize={50} fill="#4ade80" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Summary table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 pr-4 text-slate-500 font-medium text-xs uppercase">Prisgruppe</th>
                  <th className="text-right py-2 pr-4 text-slate-500 font-medium text-xs uppercase">Tilbud</th>
                  <th className="text-right py-2 pr-4 text-slate-500 font-medium text-xs uppercase">Gns. Ja Tak</th>
                  <th className="text-right py-2 pr-4 text-slate-500 font-medium text-xs uppercase">Gns. Pris</th>
                  <th className="text-right py-2      text-slate-500 font-medium text-xs uppercase">Gns. Omsætning</th>
                </tr>
              </thead>
              <tbody>
                {prices.map(p => (
                  <tr key={p.bucket} className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
                    <td className="py-2 pr-4 text-slate-200 font-medium">{p.bucket}</td>
                    <td className="py-2 pr-4 text-right text-slate-400">{fmt(p.offer_count)}</td>
                    <td className="py-2 pr-4 text-right text-blue-300 font-semibold">{p.avg_jatak.toFixed(1)}</td>
                    <td className="py-2 pr-4 text-right text-sky-300">{fmtDKK(p.avg_price)}</td>
                    <td className="py-2      text-right text-green-400 font-semibold">{fmtDKK(p.avg_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-2">
        {[0,1,2].map(i => (
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
