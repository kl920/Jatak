import { useState, ReactNode } from 'react'
import { useQuery }            from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  ChevronDown, ChevronRight, Store,
  AlertTriangle, Clock, TrendingDown, Building2,
} from 'lucide-react'
import {
  fetchChurnSummary, fetchChurnStores, fetchStoreRanking,
  ChurnChain, ChurnStore,
} from '../api/client'
import { useFilters } from '../context/FilterContext'

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('da-DK')
}

const CHAIN_COLORS: Record<string, string> = {
  'Kvickly':                '#f59e0b',
  'Superbrugsen':           '#3b82f6',
  "Dagli'Brugsen":          '#34d399',
  'Brugseni Coop Grønland': '#a78bfa',
  '365discount':            '#f472b6',
  'FK':                     '#a78bfa',
  'FaktaGermany':           '#94a3b8',
}
function chainColor(chain: string) {
  return CHAIN_COLORS[chain] ?? '#475569'
}

const RANKING_TOOLTIP = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon, color, highlight = false,
}: {
  label: string; value: string; sub?: string
  icon: ReactNode; color: string; highlight?: boolean
}) {
  return (
    <div className={`bg-slate-800 rounded-2xl p-5 border ${highlight ? 'border-amber-700/40' : 'border-slate-700'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function StoreTable({ stores }: { stores: ChurnStore[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-slate-600 uppercase tracking-widest text-[10px] border-b border-slate-700">
          <th className="px-6 py-2.5 text-left font-bold">Butik</th>
          <th className="px-4 py-2.5 text-right font-bold">Kardex</th>
          <th className="px-4 py-2.5 text-right font-bold">Opslag 2025</th>
          <th className="px-4 py-2.5 text-right font-bold">Gns. Ja Tak</th>
          <th className="px-4 py-2.5 text-right font-bold">Sidst set</th>
          <th className="px-4 py-2.5 text-right font-bold">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/80">
        {stores.map(store => (
          <tr key={store.kardex_id} className="hover:bg-slate-800/40 transition-colors">
            <td className="px-6 py-3 text-slate-200 font-medium">{store.name}</td>
            <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{store.kardex_id}</td>
            <td className="px-4 py-3 text-right text-slate-200 tabular-nums font-medium">{fmt(store.offer_count)}</td>
            <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{store.avg_jatak.toFixed(1)}</td>
            <td className="px-4 py-3 text-right text-slate-400">{store.seneste_opslag}</td>
            <td className="px-4 py-3 text-right">
              <div className="flex flex-col items-end gap-1">
                {store.status === 'Ophørt' ? (
                  <span className="inline-block bg-red-900/40 text-red-300 border border-red-800/40 rounded-full px-2.5 py-0.5 font-semibold">
                    Ophørt
                  </span>
                ) : (
                  <span className="inline-block bg-amber-900/40 text-amber-300 border border-amber-800/40 rounded-full px-2.5 py-0.5 font-semibold">
                    Pause
                  </span>
                )}
                {store.hk_opslag && (
                  <span className="inline-block bg-blue-900/40 text-blue-300 border border-blue-800/40 rounded-full px-2.5 py-0.5 font-semibold">
                    HK-opslag
                  </span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ChainRow({
  chain, isOpen, onToggle, stores, loadingStores,
}: {
  chain: ChurnChain
  isOpen: boolean
  onToggle: () => void
  stores: ChurnStore[]
  loadingStores: boolean
}) {
  const color = chainColor(chain.chain)
  return (
    <div>
      <button
        className="w-full grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-700/40 transition-colors items-center text-left border-t border-slate-700/60"
        onClick={onToggle}
      >
        {/* Arrow */}
        <div className="col-span-1 flex items-center">
          {isOpen
            ? <ChevronDown size={14} className="text-slate-400" />
            : <ChevronRight size={14} className="text-slate-600" />
          }
        </div>

        {/* Chain name */}
        <div className="col-span-3 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-sm font-semibold text-slate-200">{chain.chain}</span>
        </div>

        {/* Count badge */}
        <div className="col-span-2 flex justify-end">
          <span
            className="inline-flex items-center justify-center min-w-[1.75rem] h-7 rounded-full text-xs font-bold px-2"
            style={{ background: color + '22', color }}
          >
            {chain.count}
          </span>
        </div>

        {/* Total opslag */}
        <div className="col-span-2 text-right text-sm text-slate-300 tabular-nums font-medium">
          {fmt(chain.total_opslag_2025)}
        </div>

        {/* Avg jatak */}
        <div className="col-span-2 text-right text-sm text-slate-400">
          {chain.avg_jatak_2025.toFixed(1)}
        </div>

        {/* Ophørt / Pause */}
        <div className="col-span-2 flex gap-1.5 justify-end flex-wrap">
          {chain.ophoert_count > 0 && (
            <span className="inline-block bg-red-900/30 text-red-300 text-[10px] rounded px-1.5 py-0.5 font-medium">
              {chain.ophoert_count} lukket
            </span>
          )}
          {chain.pause_count > 0 && (
            <span className="inline-block bg-amber-900/30 text-amber-300 text-[10px] rounded px-1.5 py-0.5 font-medium">
              {chain.pause_count} pause
            </span>
          )}
          {chain.hk_count > 0 && (
            <span className="inline-block bg-blue-900/30 text-blue-300 text-[10px] rounded px-1.5 py-0.5 font-medium">
              {chain.hk_count} HK
            </span>
          )}
          {chain.ikke_aktive_count > 0 && (
            <span className="inline-block bg-orange-900/30 text-orange-300 text-[10px] rounded px-1.5 py-0.5 font-medium">
              {chain.ikke_aktive_count} ikke aktive
            </span>
          )}
        </div>
      </button>

      {/* Expanded store list */}
      {isOpen && (
        <div className="bg-slate-900/60 border-t border-slate-700/60">
          {loadingStores ? (
            <div className="flex justify-center py-6">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <StoreTable stores={stores} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ChurnPage() {
  const [openChain, setOpenChain] = useState<string | null>(null)
  const { filters } = useFilters()
  const noStore = { date_from: filters.date_from, date_to: filters.date_to }

  const { data: summary, isLoading } = useQuery({
    queryKey: ['churn-summary'],
    queryFn:  fetchChurnSummary,
    staleTime: 5 * 60 * 1000,
  })

  const { data: chainStores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['churn-stores', openChain],
    queryFn:  () => fetchChurnStores(openChain!),
    enabled:  !!openChain,
    staleTime: 5 * 60 * 1000,
  })

  const { data: ranking = [] } = useQuery({
    queryKey: ['store-rank', noStore],
    queryFn:  () => fetchStoreRanking(noStore, 20),
  })

  // Current-week date range (Monday–Sunday)
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((day + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const weekFrom = mon.toISOString().slice(0, 10)
  const weekTo   = sun.toISOString().slice(0, 10)

  const { data: weekRanking = [] } = useQuery({
    queryKey: ['store-rank-week', weekFrom, weekTo],
    queryFn:  () => fetchStoreRanking({ date_from: weekFrom, date_to: weekTo }, 10),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading || !summary) return <Spinner />

  const s = summary
  const inactivePct    = ((s.total_inactive    / s.total_active_2025 ) * 100).toFixed(1)
  const tabtPct        = ((s.tabt_opslag_2025  / s.total_offers_2025 ) * 100).toFixed(1)
  const ikkeAktivPct   = ((s.ikke_aktive       / s.total_active_2025 ) * 100).toFixed(1)
  const nyePct         = ((s.new_stores_2026   / s.total_active_2025 ) * 100).toFixed(1)

  const toggleChain = (chain: string) =>
    setOpenChain(prev => prev === chain ? null : chain)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Butiksudvikling</h1>
        <p className="text-sm text-slate-400 mt-1">
          Aktivitet pr. butik, kæde-status og ugentlige topscorer
        </p>
      </div>

      {/* KPI cards — 3 × 2 */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Aktive butikker 2025"
          value={fmt(s.total_active_2025)}
          icon={<Store size={17} className="text-blue-400" />}
          color="text-blue-400"
        />
        <KpiCard
          label="Ikke set i 2026 endnu"
          value={fmt(s.total_inactive)}
          sub={`${inactivePct}% af alle aktive`}
          icon={<Clock size={17} className="text-amber-400" />}
          color="text-amber-400"
          highlight
        />
        <KpiCard
          label="Nye butikker i 2026"
          value={fmt(s.new_stores_2026)}
          sub={`+${nyePct}% ift. antal aktive 2025`}
          icon={<Store size={17} className="text-emerald-400" />}
          color="text-emerald-400"
        />
        <KpiCard
          label="Lukket (ophørt)"
          value={fmt(s.ophoert_count)}
          sub="ikke i aktive butiksliste"
          icon={<AlertTriangle size={17} className="text-red-400" />}
          color="text-red-400"
          highlight
        />
        <KpiCard
          label="Modtager via HK"
          value={fmt(s.hk_count)}
          sub="pause-butikker — HK sender på deres vegne"
          icon={<Building2 size={17} className="text-blue-400" />}
          color="text-blue-400"
        />
        <KpiCard
          label="Ikke aktive (reelt tabt)"
          value={fmt(s.ikke_aktive)}
          sub={`${ikkeAktivPct}% af aktive 2025-butikker`}
          icon={<AlertTriangle size={17} className="text-orange-400" />}
          color="text-orange-400"
          highlight
        />
      </div>

      {/* Context */}
      <div className="bg-amber-950/25 border border-amber-800/35 rounded-xl px-5 py-4 text-sm text-amber-200/75 leading-relaxed">
        <span className="font-semibold text-amber-300">Oversigt: </span>
        {fmt(s.total_inactive)} butikker var aktive i 2025 men har ingen egne opslag i 2026 endnu.
        Heraf er <span className="font-semibold text-red-300">{fmt(s.ophoert_count)} lukket</span> (ikke i den officielle aktive butiksliste)
        og <span className="font-semibold text-blue-300">{fmt(s.hk_count)} modtager stadig opslag via HK</span> (poster ikke selv).
        Det efterlader <span className="font-semibold text-orange-300">{fmt(s.ikke_aktive)} butikker som reelt ikke er aktive</span> ({ikkeAktivPct}% af alle aktive 2025-butikker) — hverken egne opslag eller via HK.
        Til gengæld er <span className="font-semibold text-emerald-300">{fmt(s.new_stores_2026)} nye butikker</span> kommet til i 2026 (+{nyePct}%).
      </div>

      {/* HK-opslag insight */}
      {s.hk_count > 0 && (
        <div className="bg-blue-950/25 border border-blue-800/35 rounded-xl px-5 py-4 text-sm text-blue-200/80 leading-relaxed">
          <span className="font-semibold text-blue-300">Hovedkontor-opslag: </span>
          <span className="font-semibold text-blue-300">{fmt(s.hk_count)}</span> af pause-butikkerne er registreret på den officielle 2026-butiksliste —
          det betyder, at Coop/HK sender FB-opslag på deres vegne, selv om butikken ikke selv poster.
          Disse butikker er markeret med et blåt <span className="font-semibold">HK-opslag</span>-badge i kæde-tabellen nedenfor.
        </div>
      )}

      {/* ── Denne uges mest aktive butikker – Top 10 ── */}
      {weekRanking.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Denne uges mest aktive butikker – Top 10</h2>
            <span className="text-xs text-slate-500">uge {weekFrom.slice(5)} → {weekTo.slice(5)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
            {[...new Set(weekRanking.map((r: any) => r.chain))].map((chain: string) => (
              <span key={chain} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: chainColor(chain) }} />
                {chain}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weekRanking} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => fmt(v)} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} width={155} />
              <Tooltip
                {...RANKING_TOOLTIP}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{d.label}</p>
                      <p className="text-blue-300">Ja Tak: <span className="font-bold">{fmt(d.total_jatak)}</span></p>
                      <p className="text-slate-400">Gns. Ja Tak: {d.avg_jatak}</p>
                      <p className="text-slate-400">Tilbud: {fmt(d.offer_count)}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="total_jatak" name="Ja Tak" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {weekRanking.map((r: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? '#f59e0b' : chainColor(r.chain)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chain accordion */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-800/80">
          <div className="col-span-1" />
          <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Kæde</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right">Butikker</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right">Opslag 2025</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right">Gns. Ja Tak</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right">Status</div>
        </div>

        {s.chains.map(chain => (
          <ChainRow
            key={chain.chain}
            chain={chain}
            isOpen={openChain === chain.chain}
            onToggle={() => toggleChain(chain.chain)}
            stores={openChain === chain.chain ? chainStores : []}
            loadingStores={openChain === chain.chain && storesLoading}
          />
        ))}
      </div>

      {/* ── Top 20 butikker ── */}
      {ranking.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Top 20 butikker – Ja Tak</h2>
            <span className="text-xs text-slate-500">pr. butik (kardex-niveau)</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
            {[...new Set(ranking.map((r: any) => r.chain))].map((chain: string) => (
              <span key={chain} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: chainColor(chain) }} />
                {chain}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={520}>
            <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => fmt(v)} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} width={155} />
              <Tooltip
                {...RANKING_TOOLTIP}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{d.label}</p>
                      <p className="text-blue-300">Ja Tak: <span className="font-bold">{fmt(d.total_jatak)}</span></p>
                      <p className="text-slate-400">Gns. Ja Tak: {d.avg_jatak}</p>
                      <p className="text-slate-400">Tilbud: {fmt(d.offer_count)}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="total_jatak" name="Ja Tak" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {ranking.map((r: any, i: number) => (
                  <Cell key={i} fill={i === 0 ? '#f59e0b' : chainColor(r.chain)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
