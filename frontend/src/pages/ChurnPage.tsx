import { useState, ReactNode } from 'react'
import { useQuery }            from '@tanstack/react-query'
import {
  Store, TrendingUp, Building2, TrendingDown, Activity, Users,
} from 'lucide-react'
import {
  fetchPeriodAnalysis, PeriodInactiveStore, PeriodChainBreakdown,
} from '../api/client'
import { useFilters } from '../context/FilterContext'

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('da-DK')
}

function fmtPct(n: number) {
  return n.toFixed(1) + '%'
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

// ── Sub-components ────────────────────────────────────────────────────────────
function SummaryRow({
  active, pause, closed, new_stores
}: {
  active: number; pause: number; closed: number; new_stores: number
}) {
  const total = active + pause + closed
  
  return (
    <div className="text-xs text-slate-500 text-center py-3 border-t border-slate-800/50">
      {fmt(total)} i alt • {fmt(new_stores)} nye • {fmt(closed)} udgåede
    </div>
  )
}

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

function InactiveStoresTable({ stores }: { stores: PeriodInactiveStore[] }) {
  return (
    <table className="w-full text-xs">
      <thead className="bg-slate-800/80">
        <tr className="text-slate-600 uppercase tracking-widest text-[10px]">
          <th className="px-6 py-3 text-left font-bold">Butik</th>
          <th className="px-4 py-3 text-left font-bold">Kæde</th>
          <th className="px-4 py-3 text-right font-bold">Kardex</th>
          <th className="px-4 py-3 text-right font-bold">Sidste tilbud</th>
          <th className="px-4 py-3 text-right font-bold">Dage siden</th>
          <th className="px-4 py-3 text-right font-bold">Historiske tilbud</th>
          <th className="px-4 py-3 text-right font-bold">Gns. Ja Tak</th>
          <th className="px-4 py-3 text-right font-bold">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/80">
        {stores.map(store => {
          const color = chainColor(store.chain)
          return (
            <tr key={store.kardex_id} className="hover:bg-slate-700/40 transition-colors">
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-slate-200 font-medium">{store.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-400">{store.chain}</td>
              <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{store.kardex_id}</td>
              <td className="px-4 py-3 text-right text-slate-400">{store.last_offer_date || '–'}</td>
              <td className="px-4 py-3 text-right">
                <span className={`font-semibold tabular-nums ${
                  store.days_inactive >= 180 ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {store.days_inactive}
                </span>
                <span className="text-slate-600 ml-1">({store.months_inactive}m)</span>
              </td>
              <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{fmt(store.historical_offers)}</td>
              <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{store.avg_jatak.toFixed(1)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-col items-end gap-1">
                  {!store.is_registered && (
                    <span className="inline-block bg-red-900/40 text-red-300 border border-red-800/40 rounded-full px-2.5 py-0.5 font-semibold">
                      Lukket
                    </span>
                  )}
                  {store.has_hk && (
                    <span className="inline-block bg-blue-900/40 text-blue-300 border border-blue-800/40 rounded-full px-2.5 py-0.5 font-semibold">
                      HK
                    </span>
                  )}
                  {store.is_registered && !store.has_hk && (
                    <span className="inline-block bg-orange-900/40 text-orange-300 border border-orange-800/40 rounded-full px-2.5 py-0.5 font-semibold">
                      Reelt tabt
                    </span>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ChainOverview({ chains }: { chains: PeriodChainBreakdown[] }) {
  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'text-emerald-400'
    if (coverage >= 75) return 'text-amber-400'
    return 'text-slate-400'
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Aktivitet pr. kæde
        </h2>
        <span className="text-xs text-slate-500">Sorteret efter dækning</span>
      </div>
      
      <table className="w-full">
        <thead className="bg-slate-800/80">
          <tr className="text-slate-600 uppercase tracking-widest text-[10px]">
            <th className="px-6 py-3 text-left font-bold">Kæde</th>
            <th className="px-4 py-3 text-right font-bold">Ja Tak</th>
            <th className="px-4 py-3 text-right font-bold">Øvrig aktivitet</th>
            <th className="px-4 py-3 text-right font-bold">Aktive i alt</th>
            <th className="px-4 py-3 text-right font-bold">Til opfølgning</th>
            <th className="px-4 py-3 text-right font-bold">Andel med aktivitet</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {chains.map(chain => {
            const color = chainColor(chain.chain)
            const synlige = chain.active_stores + chain.hk_stores
            const total = synlige + chain.reelt_tabte
            const coverage = total > 0 ? (synlige / total * 100) : 0
            const coverageColor = getCoverageColor(coverage)
            
            return (
              <tr key={chain.chain} className="hover:bg-slate-700/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-slate-200 font-semibold">{chain.chain}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-lg font-semibold text-blue-400 tabular-nums">{fmt(chain.active_stores)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-lg font-semibold text-purple-400 tabular-nums">{fmt(chain.hk_stores)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-2xl font-bold text-emerald-400 tabular-nums">{fmt(synlige)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-base font-semibold text-slate-400 tabular-nums">{fmt(chain.reelt_tabte)}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className={`text-xl font-bold ${coverageColor} tabular-nums`}>{fmtPct(coverage)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ChurnPage() {
  const { filters } = useFilters()
  const [chainFilter, setChainFilter] = useState<string>('')

  // Fetch period analysis
  const { data, isLoading } = useQuery({
    queryKey: ['period-analysis', filters.date_from, filters.date_to, chainFilter],
    queryFn:  () => fetchPeriodAnalysis(filters, chainFilter || undefined),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading || !data) return <Spinner />

  const { kpis, inactive_list } = data
  
  // Filter to only show stores that truly need followup (no activity at all)
  // Exclude: closed stores (not registered) and stores with HK support
  const reeltTabteStores = inactive_list.filter(s => s.is_registered && !s.has_hk)
  
  // Get unique chains from stores needing followup
  const allChains = [...new Set(reeltTabteStores.map(s => s.chain))].sort()

  // Filter by selected chain
  const filteredStores = chainFilter 
    ? reeltTabteStores.filter(s => s.chain === chainFilter)
    : reeltTabteStores

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Butiksudvikling</h1>
        <p className="text-sm text-slate-400 mt-1">
          Periode-baseret analyse af butiksaktivitet • Standard: 6 måneder (Coops definition af inaktive butikker)
        </p>
      </div>

      {/* Primary Status — 4 large boxes */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 gap-4 p-4">
          <KpiCard
            label="Butikker med aktivitet"
            value={fmtPct((kpis.active_stores + kpis.hk_stores) / (kpis.active_stores + kpis.pause_stores + kpis.closed_stores) * 100)}
            sub={`${fmt(kpis.active_stores + kpis.hk_stores)} af ${fmt(kpis.active_stores + kpis.pause_stores + kpis.closed_stores)} butikker • Ja Tak, HK-støtte eller anden aktivitet`}
            icon={<Users size={20} className="text-emerald-400" />}
            color="text-emerald-400"
          />
          <KpiCard
            label="Ja Tak-aktive"
            value={fmt(kpis.active_stores)}
            sub="Laver egne Ja Tak tilbud"
            icon={<Store size={20} className="text-blue-400" />}
            color="text-blue-400"
          />
          <KpiCard
            label="Øvrig aktivitet"
            value={fmt(kpis.hk_stores)}
            sub="HK-støtte eller anden aktivitet"
            icon={<Building2 size={20} className="text-purple-400" />}
            color="text-purple-400"
          />
          <KpiCard
            label="Til opfølgning"
            value={fmt(kpis.reelt_tabte)}
            sub="Ingen aktivitet i perioden"
            icon={<Activity size={20} className="text-amber-400" />}
            color="text-amber-400"
          />
        </div>
        
        <SummaryRow
          active={kpis.active_stores}
          pause={kpis.pause_stores}
          closed={kpis.closed_stores}
          new_stores={kpis.new_stores}
        />
      </div>
      
      {/* Performance highlight */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl px-5 py-3 text-sm text-slate-300">
        <span className="text-emerald-400 font-semibold">
          {data.chain_breakdown.filter(c => {
            const synlige = c.active_stores + c.hk_stores
            const total = synlige + c.reelt_tabte
            return total > 0 && (synlige / total * 100) >= 90
          }).length} af {data.chain_breakdown.length} kæder har over 90 % butikker med aktivitet
        </span>
        {' • '}
        <span className="text-slate-400">
          {fmt(kpis.active_stores + kpis.hk_stores)} butikker når kunder via Facebook
        </span>
      </div>
      
      {/* Chain Overview */}
      {data.chain_breakdown.length > 0 && (
        <ChainOverview chains={data.chain_breakdown} />
      )}

      {/* Context */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl px-5 py-3 text-sm text-slate-300 leading-relaxed">
        <span className="font-semibold text-emerald-400">{fmtPct((kpis.active_stores + kpis.hk_stores) / (kpis.active_stores + kpis.pause_stores + kpis.closed_stores) * 100)}</span> af registrerede butikker har aktivitet i perioden.
        {' '}
        <span className="text-slate-400">{fmt(kpis.reelt_tabte)} butikker er til opfølgning.</span>
      </div>

      {/* ── Inaktive butikker ── */}
      {inactive_list.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Detaljeret liste — Butikker til opfølgning
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {fmt(filteredStores.length)} {chainFilter ? `(${chainFilter})` : 'butikker'} uden aktivitet i perioden
              </p>
            </div>
            
            {/* Chain filter dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Kæde:</label>
              <select
                value={chainFilter}
                onChange={(e) => setChainFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alle kæder</option>
                {allChains.map(chain => (
                  <option key={chain} value={chain}>{chain}</option>
                ))}
              </select>
            </div>
          </div>
          
          <InactiveStoresTable stores={filteredStores} />
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
