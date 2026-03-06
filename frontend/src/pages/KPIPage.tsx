import { useQuery }         from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'
import { fetchKPISummary, fetchYearlyKPI }  from '../api/client'
import { useFilters }       from '../context/FilterContext'
import type { YearlyKPI }   from '../api/client'

// ── Helper components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false }: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? 'bg-blue-600/20 border-blue-500/40' : 'bg-slate-800 border-slate-700'}`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-blue-300' : 'text-slate-100'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function fmt(n: number) { return n.toLocaleString('da-DK') }
function fmtDKK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M kr`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} k kr`
  return `${n.toFixed(0)} kr`
}

const RADIAN = Math.PI / 180

// Label inside donut slice
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.05) return null
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CHANNEL_COLORS = ['#3b82f6', '#a78bfa', '#34d399']  // FB, SMS, COOP

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KPIPage() {
  const { filters }   = useFilters()
  const { data, isLoading, error } = useQuery({
    queryKey: ['kpi', filters],
    queryFn:  () => fetchKPISummary(filters),
  })

  if (isLoading) return <LoadingState />
  if (error || !data) return <ErrorState />

  // Basket value ring — fill proportional to 500 kr reference
  const basketFill = Math.min((data.avg_basket_value / 500) * 100, 100)
  const basketData = [
    { name: 'Kurv',  value: basketFill,          fill: '#3b82f6' },
    { name: 'Rest',  value: 100 - basketFill,     fill: '#1e293b' },
  ]

  // Channel donut
  const channelData = [
    { name: 'Facebook', value: data.fb_orders  },
    { name: 'SMS',      value: data.sms_orders },
    { name: 'COOP',     value: data.coop_orders },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">KPI Oversigt</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Tilbud"           value={fmt(data.total_offers)}    />
        <StatCard label="Ja Tak"           value={fmt(data.total_jatak)}     accent />
        <StatCard label="Solgte varer"     value={fmt(data.total_sold)}      />
        <StatCard label="Omsætning"        value={fmtDKK(data.total_turnover)} />
        <StatCard label="Gns. kurv"         value={`${data.avg_basket_qty.toFixed(2)} stk`} sub="pr. ordre" accent />
        <StatCard label="Aktive butikker"  value={fmt(data.total_stores)}    />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Basket ring */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Gns. kurvværdi pr. ordre</h2>
          <div className="flex items-center gap-8">
            <div className="relative" style={{ width: 200, height: 200 }}>
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={basketData}
                    cx={95}
                    cy={95}
                    innerRadius={65}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {basketData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-blue-300">{data.avg_basket_value.toFixed(0)} kr</span>
                <span className="text-xs text-slate-500">pr. ordre</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Gns. antal stk</p>
                <p className="text-xl font-semibold text-blue-300">{data.avg_basket_qty.toFixed(2)} stk</p>
                <p className="text-xs text-slate-500">pr. ordre</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Gns. kurvværdi</p>
                <p className="text-xl font-semibold text-green-400">{data.avg_basket_value.toFixed(0)} kr</p>
                <p className="text-xs text-slate-500">pr. ordre</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Solgt i alt</p>
                <p className="text-lg font-semibold text-slate-100">{fmt(data.total_sold)} stk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Channel split donut */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Kanal-fordeling (ordrer)</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx={95}
                  cy={95}
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                  strokeWidth={2}
                  stroke="#0f172a"
                >
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v: any) => [fmt(v), 'Ordrer']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {channelData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: CHANNEL_COLORS[i] }} />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{d.name}</p>
                    <p className="text-xs text-slate-500">{fmt(d.value)} ordrer</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">Procenter</p>
                <p className="text-sm text-slate-200">
                  FB {data.fb_pct}% · SMS {data.sms_pct}% · COOP {data.coop_pct}%
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Year-over-year comparison */}
      <YearComparison store={filters.store} />

    </div>
  )
}

// ── Year-over-year comparison ─────────────────────────────────────────────────

function delta(a: number, b: number) {
  if (a === 0) return null
  return ((b - a) / a) * 100
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const up = pct >= 0
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${up ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function YearComparison({ store }: { store?: string }) {
  const { data: years = [], isLoading } = useQuery({
    queryKey: ['yearly-kpi', store],
    queryFn:  () => fetchYearlyKPI(store),
    staleTime: 60_000,
  })

  if (isLoading) return null

  const y24 = years.find(y => y.year === 2024)
  const y25 = years.find(y => y.year === 2025)
  const y26 = years.find(y => y.year === 2026)

  if (!y24 && !y25 && !y26) return null

  const rows: { label: string; key: keyof YearlyKPI; fmt: (v: number) => string }[] = [
    { label: 'Tilbud',            key: 'total_offers',     fmt: v => fmt(v) },
    { label: 'Ja Tak',            key: 'total_jatak',      fmt: v => fmt(v) },
    { label: 'Solgte varer',      key: 'total_sold',       fmt: v => fmt(v) },
    { label: 'Gns. kurv (stk)',   key: 'avg_basket_qty',   fmt: v => `${v.toFixed(2)} stk` },
    { label: 'Gns. kurvværdi',    key: 'avg_basket_value', fmt: v => `${v.toFixed(0)} kr` },
    { label: 'Salgsprocent',      key: 'sell_through',     fmt: v => `${v.toFixed(1)}%` },
    { label: 'Aktive butikker',   key: 'total_stores',     fmt: v => fmt(v) },
    { label: 'FB andel',          key: 'fb_pct',           fmt: v => `${v}%` },
    { label: 'SMS andel',         key: 'sms_pct',          fmt: v => `${v}%` },
    { label: 'COOP andel',        key: 'coop_pct',         fmt: v => `${v}%` },
  ]

  // Note for 2026: data is partial (ytd), show a warning
  const has2026 = !!y26

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Årssammenligning</h2>
        {has2026 && (
          <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5">
            2026 er delår (jan–mar)
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 pr-6 text-xs text-slate-500 font-medium uppercase tracking-wide w-44">Metric</th>
              <th className="text-right py-2 px-3 text-xs text-blue-400 font-semibold uppercase tracking-wide">2024</th>
              <th className="text-right py-2 px-3 text-xs text-green-400 font-semibold uppercase tracking-wide">2025</th>
              <th className="text-right py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wide">24→25</th>
              {has2026 && <th className="text-right py-2 px-3 text-xs text-amber-400 font-semibold uppercase tracking-wide">2026 YTD</th>}
              {has2026 && <th className="text-right py-2 pl-3 text-xs text-slate-400 font-medium uppercase tracking-wide">25→26</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {rows.map(r => {
              const v24 = y24 ? (y24[r.key] as number) : null
              const v25 = y25 ? (y25[r.key] as number) : null
              const v26 = y26 ? (y26[r.key] as number) : null
              const d2425 = v24 !== null && v25 !== null ? delta(v24, v25) : null
              const d2526 = v25 !== null && v26 !== null ? delta(v25, v26) : null
              return (
                <tr key={r.key} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-2.5 pr-6 text-slate-400">{r.label}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-blue-300">
                    {v24 !== null ? r.fmt(v24) : '–'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-green-300">
                    {v25 !== null ? r.fmt(v25) : '–'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <DeltaBadge pct={d2425} />
                  </td>
                  {has2026 && (
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-300">
                      {v26 !== null ? r.fmt(v26) : '–'}
                    </td>
                  )}
                  {has2026 && (
                    <td className="py-2.5 pl-3 text-right">
                      <DeltaBadge pct={d2526} />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoadingState() {
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

function ErrorState() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      Kunne ikke hente data — er backend kørende på port 8000?
    </div>
  )
}
