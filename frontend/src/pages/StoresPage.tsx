import { useQuery }          from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { fetchStoreRanking, fetchHeatmap } from '../api/client'
import { useFilters }          from '../context/FilterContext'

function fmt(n: number) { return n.toLocaleString('da-DK') }

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#94a3b8' },
}

// Chain → colour
const CHAIN_COLORS: Record<string, string> = {
  'Kvickly':           '#f59e0b',
  'Superbrugsen':      '#3b82f6',
  "Dagli'Brugsen":     '#34d399',
  'FK':                '#a78bfa',
  '365discount':       '#f472b6',
  'FaktaGermany':      '#94a3b8',
}
function chainColor(chain: string) { return CHAIN_COLORS[chain] ?? '#475569' }

// Colour scale: blue opacity proportional to value
function heatColor(val: number, max: number) {
  if (max === 0) return 'rgba(59,130,246,0.1)'
  const t = val / max
  return `rgba(59,130,246,${(0.1 + t * 0.85).toFixed(2)})`
}

export default function StoresPage() {
  const { filters } = useFilters()
  const noStore = { date_from: filters.date_from, date_to: filters.date_to }

  const { data: ranking = [], isLoading: l1, isError: e1 } = useQuery({ queryKey: ['store-rank', noStore], queryFn: () => fetchStoreRanking(noStore, 20) })
  const { data: heatmap = [], isLoading: l2, isError: e2 } = useQuery({ queryKey: ['heatmap',    noStore], queryFn: () => fetchHeatmap(noStore) })

  if (l1 || l2) return <Spinner />

  const maxHeat = Math.max(...heatmap.map(h => h.avg_jatak), 0)

  // Unique chains in the ranking for the legend
  const chains = [...new Set(ranking.map(r => r.chain))]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Butik Benchmark</h1>

      {/* Chain legend */}
      {chains.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {chains.map(c => (
            <div key={c} className="flex items-center gap-1.5 text-xs text-slate-300">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: chainColor(c) }} />
              {c}
            </div>
          ))}
        </div>
      )}

      {/* Top 20 individual stores (kardex level) */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Top 20 butikker – Ja Tak</h2>
          <span className="text-xs text-slate-500">pr. butik (kardex-niveau)</span>
        </div>
        {e1 || ranking.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            {e1 ? 'Kunne ikke hente butiksdata – prøv igen.' : 'Ingen butiksdata for det valgte filter.'}
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={520}>
          <BarChart
            data={ranking}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => fmt(v)} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              width={155}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs space-y-1">
                    <p className="font-semibold text-slate-200">{d.label}</p>
                    <p className="text-blue-300">Ja Tak: <span className="font-bold">{fmt(d.total_jatak)}</span></p>
                    <p className="text-slate-400">Gns. Ja Tak: {d.avg_jatak}</p>
                    <p className="text-slate-400">Tilbud: {fmt(d.offer_count)}</p>
                    <p className="text-slate-400">Salgsprocent: {d.sell_through}%</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="total_jatak" name="Ja Tak" radius={[0, 4, 4, 0]} maxBarSize={16}>
              {ranking.map((r, i) => (
                <Cell key={i} fill={i === 0 ? '#f59e0b' : chainColor(r.chain)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Hour heatmap */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">
          Publiceringstidspunkt — gns. Ja Tak pr. time
        </h2>
        <p className="text-xs text-slate-500 mb-5">Mørkere blå = højere gennemsnit · Hover for detaljer</p>

        <div className="grid grid-cols-12 gap-1.5">
          {heatmap.map(h => (
            <div
              key={h.hour}
              title={`${h.hour}:00\nGns. Ja Tak: ${h.avg_jatak}\nTilbud: ${fmt(h.offer_count)}`}
              className="rounded-lg p-2 text-center cursor-default transition-transform hover:scale-105"
              style={{ background: heatColor(h.avg_jatak, maxHeat) }}
            >
              <p className="text-xs font-semibold text-slate-300">{String(h.hour).padStart(2, '0')}</p>
              <p className="text-xs text-slate-400 mt-0.5">{h.avg_jatak.toFixed(1)}</p>
              <p className="text-[10px] text-slate-600">{h.offer_count > 0 ? fmt(h.offer_count) : '–'}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-slate-500">Lavt</span>
          <div className="flex gap-0.5">
            {[0.05, 0.2, 0.4, 0.6, 0.8, 1.0].map(t => (
              <div key={t} className="w-6 h-3 rounded" style={{ background: `rgba(59,130,246,${t})` }} />
            ))}
          </div>
          <span className="text-xs text-slate-500">Højt</span>
        </div>
      </div>
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