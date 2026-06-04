import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUp, ArrowDown, TrendingUp, Target, ShoppingCart, Award, Sparkles, ChevronRight } from 'lucide-react'

// ── API Client ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function fetchStoresList(dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)
  const res = await fetch(`${API_BASE}/api/stores/list?${params}`)
  if (!res.ok) throw new Error('Failed to fetch stores list')
  return res.json()
}

async function fetchStoreOverview(kardexId: number, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  params.append('kardex_id', kardexId.toString())
  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)
  const res = await fetch(`${API_BASE}/api/stores/overview?${params}`)
  if (!res.ok) throw new Error('Failed to fetch store overview')
  return res.json()
}

async function fetchTopOffers(kardexId: number, dateFrom?: string, dateTo?: string, limit = 5) {
  const params = new URLSearchParams()
  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)
  params.append('limit', limit.toString())
  const res = await fetch(`${API_BASE}/api/stores/${kardexId}/top-offers?${params}`)
  if (!res.ok) throw new Error('Failed to fetch top offers')
  return res.json()
}

async function fetchCategoryPerformance(kardexId: number, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)
  const res = await fetch(`${API_BASE}/api/stores/${kardexId}/category-performance?${params}`)
  if (!res.ok) throw new Error('Failed to fetch category performance')
  return res.json()
}

async function fetchInsights(kardexId: number, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams()
  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)
  const res = await fetch(`${API_BASE}/api/stores/${kardexId}/insights?${params}`)
  if (!res.ok) throw new Error('Failed to fetch insights')
  return res.json()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('da-DK') }

function fmtKr(n: number) {
  if (!n || isNaN(n)) return '0 kr'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mio. kr`
  if (n >= 100_000) return `${Math.round(n / 1000)} t.kr`
  return `${Math.round(n).toLocaleString('da-DK')} kr`
}

function ComparisonBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (Math.abs(value) < 0.5) {
    return <span className="text-slate-400 text-xs">→ samme niveau</span>
  }
  const isPositive = value > 0
  const Icon = isPositive ? ArrowUp : ArrowDown
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      <Icon size={14} />
      {isPositive ? '+' : ''}{value.toFixed(0)}{suffix}
    </span>
  )
}

function RankingBadge({ percentile }: { percentile: number }) {
  let color = 'bg-slate-700 text-slate-300'
  let label = 'Gennemsnit'
  
  if (percentile >= 80) {
    color = 'bg-green-600 text-white'
    const topPct = Math.round(100 - percentile)
    if (topPct === 0) {
      label = '🟢 Blandt de allerbedste'
    } else {
      label = `🟢 Blandt top ${topPct}%`
    }
  } else if (percentile >= 60) {
    color = 'bg-blue-600 text-white'
    label = 'Over gennemsnit'
  } else if (percentile < 40) {
    color = 'bg-amber-600 text-white'
    label = 'Under gennemsnit'
  }
  
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}

function CategoryStatusIcon({ status }: { status: string }) {
  if (status === 'top') return <span className="text-green-400 text-lg">⭐</span>
  if (status === 'below') return <span className="text-red-400 text-lg">🔴</span>
  return <span className="text-yellow-400 text-lg">🟡</span>
}

// ── Components ────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-slate-400">Indlæser butiksoverblik...</div>
    </div>
  )
}

function ErrorState({ message = 'Kunne ikke indlæse data' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-400 bg-red-950/20 border border-red-800 rounded-xl px-6 py-4">
        {message}
      </div>
    </div>
  )
}

type PeriodOption = 'this_week' | 'last_week' | 'last_6_months' | 'last_year'

function getDateRangeFromPeriod(period: PeriodOption): { from: string; to: string } {
  const today = new Date()
  const to = today.toISOString().split('T')[0]
  
  let from = ''
  switch (period) {
    case 'this_week': {
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      from = monday.toISOString().split('T')[0]
      break
    }
    case 'last_week': {
      const dayOfWeek = today.getDay()
      const lastMonday = new Date(today)
      lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7)
      const lastSunday = new Date(lastMonday)
      lastSunday.setDate(lastMonday.getDate() + 6)
      from = lastMonday.toISOString().split('T')[0]
      return { from, to: lastSunday.toISOString().split('T')[0] }
    }
    case 'last_6_months': {
      const sixMonthsAgo = new Date(today)
      sixMonthsAgo.setMonth(today.getMonth() - 6)
      from = sixMonthsAgo.toISOString().split('T')[0]
      break
    }
    case 'last_year': {
      const oneYearAgo = new Date(today)
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      from = oneYearAgo.toISOString().split('T')[0]
      break
    }
  }
  
  return { from, to }
}

function StoreSelector({ stores, selected, onChange }: any) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-400 mb-2">Vælg din butik</label>
      <select
        value={selected || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full max-w-md bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Vælg butik --</option>
        {stores.map((store: any) => (
          <option key={store.kardex_id} value={store.kardex_id}>
            {store.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function PeriodSelector({ value, onChange }: { value: PeriodOption; onChange: (p: PeriodOption) => void }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-400 mb-2">Periode</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PeriodOption)}
        className="w-full max-w-md bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="this_week">Denne uge</option>
        <option value="last_week">Sidste uge</option>
        <option value="last_6_months">Sidste 6 måneder</option>
        <option value="last_year">Sidste år</option>
      </select>
    </div>
  )
}

function KPICards({ data }: { data: any }) {
  const { kpis, comparison, benchmark, store } = data
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Tilbud */}
      <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Target className="text-blue-400" size={24} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ja Tak Tilbud</h3>
        </div>
        <p className="text-3xl font-bold text-slate-100 mb-2">{fmt(kpis.total_offers)}</p>
        <p className="text-sm text-slate-400 mb-1">Oprettet i perioden</p>
        <p className="text-xs text-slate-500">Gnm. per butik: {benchmark.chain_avg_offers.toFixed(0)}</p>
      </div>

      {/* Card 2: Gns. Ordre */}
      <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/10 border border-violet-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="text-violet-400" size={24} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Gns. Ordre</h3>
        </div>
        <p className="text-3xl font-bold text-slate-100 mb-2">{fmt(kpis.avg_jatak)}</p>
        <p className="text-sm text-slate-400 mb-1">pr. Ja Tak</p>
        <p className="text-xs text-slate-500">Gnm. per butik: {benchmark.chain_avg_jatak.toFixed(1)}</p>
      </div>

      {/* Card 3: Omsætning */}
      <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <ShoppingCart className="text-green-400" size={24} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Omsætning</h3>
        </div>
        <p className="text-3xl font-bold text-slate-100 mb-2">{fmtKr(kpis.total_turnover || 0)}</p>
        <p className="text-sm text-slate-400 mb-1">{fmt(kpis.total_sold)} varer solgt</p>
        <p className="text-xs text-slate-500">Gnm. per butik: {fmtKr(benchmark.chain_avg_turnover || 0)}</p>
      </div>

      {/* Card 4: Din Score */}
      <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/10 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Award className="text-amber-400" size={24} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Din Score</h3>
        </div>
        <p className="text-3xl font-bold text-slate-100 mb-2">{kpis.overall_score} / 10</p>
        <p className="text-sm text-slate-400 mb-1">Samlet præstation</p>
        <RankingBadge percentile={kpis.ranking_pct} />
      </div>
    </div>
  )
}

function BenchmarkChart({ overview }: { overview: any }) {
  const { kpis, benchmark } = overview
  
  const data = [
    { metric: 'Gns. Ja Tak', store: kpis.avg_jatak, chain: benchmark.chain_avg_jatak, top10: benchmark.top10_avg_jatak },
    { metric: 'Andel af lager', store: kpis.sell_through_pct, chain: benchmark.chain_avg_sellthrough, top10: benchmark.chain_avg_sellthrough * 1.3 },
  ]
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
      <div className="space-y-6">
        {data.map((item) => (
          <div key={item.metric}>
            <p className="text-sm font-medium text-slate-300 mb-2">{item.metric}</p>
            <div className="flex items-center gap-4">
              {/* Store */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Din butik</span>
                  <span className="text-sm font-bold text-blue-400">{item.store.toFixed(1)}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min((item.store / item.top10) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              {/* Chain avg */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Kæde-gns.</span>
                  <span className="text-sm font-bold text-slate-400">{item.chain.toFixed(1)}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-slate-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min((item.chain / item.top10) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              {/* Top 10% */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">⭐ Top 10%</span>
                  <span className="text-sm font-bold text-amber-400">{item.top10.toFixed(1)}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopOffersTable({ offers }: { offers: any[] }) {
  if (!offers || offers.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-4">🏆 Dine mest succesfulde tilbud</h2>
        <p className="text-slate-400 text-sm">Ingen tilbud i denne periode</p>
      </div>
    )
  }
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-bold text-slate-100 mb-4">🏆 Dine mest succesfulde tilbud i perioden</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 font-semibold text-slate-400">Titel</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-400">Kategori</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-400">Ja Tak</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-400">Solgt</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-400">Sell-through</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer, idx) => (
              <tr key={idx} className="border-b border-slate-800 hover:bg-slate-700/30 transition-colors">
                <td className="py-3 px-4 text-slate-100 font-medium max-w-xs truncate">{offer.title}</td>
                <td className="py-3 px-4 text-slate-300">{offer.category}</td>
                <td className="py-3 px-4 text-right text-blue-400 font-semibold">{fmt(offer.jatak_count)}</td>
                <td className="py-3 px-4 text-right text-slate-300">{fmt(offer.total_sold)}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-semibold ${offer.sell_through_pct >= 70 ? 'text-green-400' : 'text-slate-400'}`}>
                    {offer.sell_through_pct.toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InsightCards({ insights }: { insights: any }) {
  if (!insights || !insights.strengths || insights.strengths.length === 0) return null
  
  return (
    <div className="mb-8">
      {/* Strengths only */}
      <div className="bg-gradient-to-br from-green-900/30 to-green-950/20 border border-green-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
          ✅ Det går godt
        </h3>
        <ul className="space-y-3">
          {insights.strengths.map((item: any, idx: number) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-green-400 mt-0.5">•</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function CategoryPerformanceGrid({ categories }: { categories: any[] }) {
  if (!categories || categories.length === 0) return null
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
        <Target size={20} className="text-violet-400" />
        Kategori-performance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-4 border transition-all hover:scale-105 ${
              cat.status === 'top'
                ? 'bg-green-900/20 border-green-700/50'
                : cat.status === 'below'
                ? 'bg-red-900/20 border-red-700/50'
                : 'bg-slate-900/50 border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-100">{cat.category}</h3>
              <CategoryStatusIcon status={cat.status} />
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-slate-400">
                <span className="font-medium text-slate-300">{cat.offer_count}</span> tilbud
              </p>
              <p className="text-slate-400">
                Gns. <span className="font-medium text-blue-400">{cat.avg_jatak}</span> Ja Tak
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActions() {
  return (
    <div className="bg-gradient-to-br from-violet-600/20 to-blue-600/10 border border-violet-500/30 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
        <Sparkles size={20} className="text-violet-400" />
        Handlinger
      </h2>
      <div className="space-y-3">
        <button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-between group">
          <span className="flex items-center gap-2">
            <Sparkles size={18} />
            Opret tilbud med AI
          </span>
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-between group">
          <span className="flex items-center gap-2">
            💡 Se bedste praksis
          </span>
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ButikDashboardPage() {
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [period, setPeriod] = useState<PeriodOption>('last_6_months')
  
  const dateRange = getDateRangeFromPeriod(period)
  
  // Fetch stores list
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['stores-list', dateRange.from, dateRange.to],
    queryFn: () => fetchStoresList(dateRange.from, dateRange.to),
  })
  
  // Fetch overview data
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['store-overview', selectedStore, dateRange.from, dateRange.to],
    queryFn: () => fetchStoreOverview(selectedStore!, dateRange.from, dateRange.to),
    enabled: !!selectedStore,
  })
  
  // Fetch top offers
  const { data: topOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['store-top-offers', selectedStore, dateRange.from, dateRange.to],
    queryFn: () => fetchTopOffers(selectedStore!, dateRange.from, dateRange.to),
    enabled: !!selectedStore,
  })
  
  // Fetch category performance
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['store-categories', selectedStore, dateRange.from, dateRange.to],
    queryFn: () => fetchCategoryPerformance(selectedStore!, dateRange.from, dateRange.to),
    enabled: !!selectedStore,
  })
  
  // Fetch insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['store-insights', selectedStore, dateRange.from, dateRange.to],
    queryFn: () => fetchInsights(selectedStore!, dateRange.from, dateRange.to),
    enabled: !!selectedStore,
  })
  
  if (storesLoading) return <LoadingState />
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Butiksoverblik</h1>
        <p className="text-slate-400">
          Få indsigt i din butiks præstation og find forbedringsmuligheder
        </p>
      </div>
      
      {/* Period selector */}
      <PeriodSelector value={period} onChange={setPeriod} />
      
      {/* Store selector */}
      <StoreSelector stores={stores} selected={selectedStore} onChange={setSelectedStore} />
      
      {/* Content */}
      {!selectedStore ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Vælg din butik</h2>
          <p className="text-slate-400">
            Vælg en butik i dropdown'en ovenfor for at se detaljeret overblik
          </p>
        </div>
      ) : overviewLoading || offersLoading || categoriesLoading || insightsLoading ? (
        <LoadingState />
      ) : overviewError ? (
        <ErrorState message="Kunne ikke indlæse butiksdata" />
      ) : overview ? (
        <>
          {/* KPI Cards */}
          <KPICards data={overview} />
          
          {/* Top Offers */}
          <TopOffersTable offers={topOffers} />
          
          {/* Category Performance */}
          <CategoryPerformanceGrid categories={categories} />
          
          {/* Quick Actions */}
          <QuickActions />
        </>
      ) : null}
    </div>
  )
}
