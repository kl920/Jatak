import { useQuery }       from '@tanstack/react-query'
import { useState }      from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  BarChart, LineChart,
} from 'recharts'
import { fetchWeeklyTrend, fetchMonthlyTrend } from '../api/client'
import { useFilters }       from '../context/FilterContext'
import type { MonthPoint }  from '../api/client'

function fmt(n: number) { return n.toLocaleString('da-DK') }

// ISO week label: "2026-04-07" → "W14"
function weekLabel(dateStr: string) {
  const d = new Date(dateStr)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return `W${weekNum}`
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#94a3b8', marginBottom: 4 },
}

export default function TrendPage() {
  const { filters } = useFilters()
  const { data = [], isLoading } = useQuery({
    queryKey: ['trend-weekly', filters],
    queryFn:  () => fetchWeeklyTrend(filters),
  })

  if (isLoading) return <Spinner />

  // Summaries for the top-3 badge strip
  const top3 = [...data]
    .sort((a, b) => b.total_jatak - a.total_jatak)
    .slice(0, 3)

  const chartData = data.map(d => ({
    ...d,
    week: weekLabel(d.week_start),
  }))

  // Custom dot to highlight top-3 weeks on the line
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (!payload.is_top3) return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" fillOpacity={0.5} />
    return (
      <>
        <circle cx={cx} cy={cy} r={7} fill="#f59e0b" fillOpacity={0.25} />
        <circle cx={cx} cy={cy} r={4} fill="#f59e0b" />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Ugentlig Trend</h1>

      {/* Top-3 weeks strip */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {top3.map((w, i) => (
            <div key={w.week_start} className="bg-slate-800 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400 font-bold text-xs">#{i + 1} TOP UGE</span>
                <span className="text-slate-400 text-xs">{weekLabel(w.week_start)} · {w.week_start}</span>
              </div>
              <p className="text-xl font-bold text-amber-300">{fmt(w.total_jatak)} Ja Tak</p>
              <p className="text-xs text-slate-500 mt-1">{fmt(w.offer_count)} tilbud · avg {w.avg_jatak} Ja Tak</p>
            </div>
          ))}
        </div>
      )}

      {/* Main chart: offers + Ja Tak per week */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wide">
          Tilbud & Ja Tak pr. uge <span className="text-amber-400 font-normal normal-case text-xs ml-2">● Top-3 uger markeret</span>
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left"  tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: any, name: string) => [fmt(v), name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
            />
            <Bar
              yAxisId="left"
              dataKey="offer_count"
              name="Tilbud"
              fill="#334155"
              radius={[3, 3, 0, 0]}
              maxBarSize={20}
            />
            <Line
              yAxisId="right"
              dataKey="total_jatak"
              name="Ja Tak"
              type="monotone"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: '#3b82f6' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: avg order size + sell-through */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Active stores per week */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wide">Aktive butikker pr. uge</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: any) => [`${fmt(Number(v))} butikker`, 'Aktive butikker']}
              />
              <Line
                dataKey="active_stores"
                name="Aktive butikker"
                type="monotone"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#34d399' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sell-through rate */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wide">Salgsprocent pr. uge (%)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis unit="%" tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Salgsprocent']}
              />
              <Line
                dataKey="sell_through"
                name="Salgsprocent"
                type="monotone"
                stroke="#a78bfa"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#a78bfa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year-over-year monthly comparison */}
      <YoYSection store={filters.store} />

    </div>
  )
}

// ── Year-over-year monthly comparison ────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec']

type YoYMetric = 'total_jatak' | 'offer_count' | 'active_stores' | 'sell_through' | 'avg_revenue'

const METRIC_OPTIONS: { key: YoYMetric; label: string; unit?: string }[] = [
  { key: 'total_jatak',    label: 'Totalt Ja Tak' },
  { key: 'offer_count',    label: 'Antal tilbud' },
  { key: 'active_stores',  label: 'Aktive butikker' },
  { key: 'sell_through',   label: 'Salgsprocent', unit: '%' },
  { key: 'avg_revenue',    label: 'Gns. omsætning pr. tilbud', unit: ' kr' },
]

function buildYoYData(months: MonthPoint[], metric: YoYMetric) {
  const byNum: Record<number, { y2024?: number; y2025?: number; y2026?: number }> = {}
  for (const m of months) {
    if (!byNum[m.month_num]) byNum[m.month_num] = {}
    if (m.year === 2024) byNum[m.month_num].y2024 = m[metric] as number
    if (m.year === 2025) byNum[m.month_num].y2025 = m[metric] as number
    if (m.year === 2026) byNum[m.month_num].y2026 = m[metric] as number
  }
  return Array.from({ length: 12 }, (_, i) => ({
    month: MONTH_NAMES[i],
    month_num: i + 1,
    y2024: byNum[i + 1]?.y2024 ?? null,
    y2025: byNum[i + 1]?.y2025 ?? null,
    y2026: byNum[i + 1]?.y2026 ?? null,
  }))
}

function YoYSection({ store }: { store?: string }) {
  const [metric, setMetric] = useState<YoYMetric>('total_jatak')
  // Always fetch all data for YoY (no date filter)
  const { data: months = [], isLoading } = useQuery({
    queryKey: ['monthly-trend-yoy', store],
    queryFn:  () => fetchMonthlyTrend({ store }),
    staleTime: 60_000,
  })

  if (isLoading) return null

  const chartData = buildYoYData(months, metric)
  const selectedMeta = METRIC_OPTIONS.find(m => m.key === metric)!
  const unit = selectedMeta.unit ?? ''

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            År-over-år sammenligning — månedlig
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="inline-block w-3 h-0.5 bg-blue-400 rounded mr-1 align-middle" />2024
            <span className="ml-3 inline-block w-3 h-0.5 bg-green-400 rounded mr-1 align-middle" />2025
            <span className="ml-3 inline-block w-3 h-0.5 bg-amber-400 rounded mr-1 align-middle" />2026 YTD
          </p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {METRIC_OPTIONS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                metric === m.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={v => unit === ' kr' ? `${(v/1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v: any, name: string) => [
              unit === ' kr'
                ? `${Number(v).toLocaleString('da-DK')} kr`
                : unit === '%'
                  ? `${Number(v).toFixed(1)}%`
                  : Number(v).toLocaleString('da-DK'),
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
          <Line
            dataKey="y2024"
            name="2024"
            type="monotone"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#3b82f6' }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            dataKey="y2025"
            name="2025"
            type="monotone"
            stroke="#4ade80"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#4ade80' }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            dataKey="y2026"
            name="2026 YTD"
            type="monotone"
            stroke="#fbbf24"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#fbbf24' }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
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
