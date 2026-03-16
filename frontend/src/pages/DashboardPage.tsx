import { useQuery } from '@tanstack/react-query'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  LineChart,
} from 'recharts'
import { fetchKPISummary, fetchWeeklyTrend } from '../api/client'
import { useFilters } from '../context/FilterContext'

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean
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
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mia. kr`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mio. kr`
  return `${n.toLocaleString('da-DK', { maximumFractionDigits: 0 })} kr`
}

const RADIAN = Math.PI / 180

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CHANNEL_COLORS = ['#3b82f6', '#a78bfa', '#34d399']

function weekLabel(dateStr: string) {
  const d = new Date(dateStr)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return `W${weekNum}`
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8', marginBottom: 4 },
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { filters } = useFilters()

  const { data: kpi, isLoading: kpiLoading, error: kpiError } = useQuery({
    queryKey: ['kpi', filters],
    queryFn: () => fetchKPISummary(filters),
  })

  const { data: trend = [], isLoading: trendLoading } = useQuery({
    queryKey: ['trend-weekly', filters],
    queryFn: () => fetchWeeklyTrend(filters),
  })

  if (kpiLoading || trendLoading) return <LoadingState />
  if (kpiError || !kpi) return <ErrorState />

  // KPI charts data
  const basketFill = Math.min((kpi.avg_basket_value / 500) * 100, 100)
  const basketData = [
    { name: 'Kurv', value: basketFill, fill: '#3b82f6' },
    { name: 'Rest', value: 100 - basketFill, fill: '#1e293b' },
  ]

  const channelData = [
    { name: 'Facebook', value: kpi.fb_orders },
    { name: 'SMS', value: kpi.sms_orders },
    { name: 'COOP', value: kpi.coop_orders },
  ].filter(d => d.value > 0)

  // Trend charts data
  const chartData = trend.map(d => ({
    ...d,
    week: weekLabel(d.week_start),
  }))



  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>

      {/* ── KPI Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Tilbud"          value={fmt(kpi.total_offers)} />
        <StatCard label="Ja Tak"          value={fmt(kpi.total_jatak)} accent />
        <StatCard label="Omsætning"       value={fmtDKK(kpi.total_turnover)} />
        <StatCard label="Gns. kurv"       value={`${kpi.avg_basket_qty.toFixed(2)} stk`} sub="pr. ordre" accent />
        <StatCard label="Gns. kurvværdi"  value={`${kpi.avg_basket_value.toFixed(0)} kr`} sub="pr. ordre" />
        <StatCard label="Aktive butikker" value={fmt(kpi.total_stores)} />
      </div>

      {/* ── Kanal-fordeling ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">Kanal-fordeling (ordrer)</h2>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={channelData}
                cx={95} cy={95}
                innerRadius={55} outerRadius={85}
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
                FB {kpi.fb_pct}% · SMS {kpi.sms_pct}% · COOP {kpi.coop_pct}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tilbud & Ja Tak pr. uge ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wide">
          Tilbud & Ja Tak pr. uge
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: any, name: string) => [fmt(v), name]} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
            <Bar yAxisId="left" dataKey="offer_count" name="Tilbud" fill="#334155" radius={[3, 3, 0, 0]} maxBarSize={20} />
            <Line yAxisId="right" dataKey="total_jatak" name="Ja Tak" type="monotone" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6', fillOpacity: 0.5 }} activeDot={{ r: 5, fill: '#3b82f6' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Aktive butikker pr. uge ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5 uppercase tracking-wide">Aktive butikker pr. uge</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${fmt(Number(v))} butikker`, 'Aktive butikker']} />
            <Line dataKey="active_stores" name="Aktive butikker" type="monotone" stroke="#34d399" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#34d399' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Loading / Error states ────────────────────────────────────────────────────

function LoadingState() {
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

function ErrorState() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      Kunne ikke hente data — prøv at genindlæse siden
    </div>
  )
}
