/**
 * Static-mode API client — serves pre-baked JSON from /data/ folder.
 * Used in GitHub Pages production build (VITE_STATIC=true).
 * Falls back to the live API client when VITE_STATIC is not set.
 */
const BASE = import.meta.env.BASE_URL + 'data'

export function setCredentials(_username: string, _password: string) {
  // Static GitHub Pages build does not send API requests, but PasswordGate
  // still expects this function to exist.
}

async function load<T>(name: string): Promise<T> {
  const r = await fetch(`${BASE}/${name}.json`)
  if (!r.ok) throw new Error(`Static data not found: ${name}.json`)
  return r.json()
}

function catSlug(cat: string) {
  return cat.toLowerCase().replace(/ /g, '_').replace(/\//g, '_').replace(/:/g, '').replace(/&/g, 'and')
}

function chainSlug(chain: string) {
  return chain.toLowerCase().replace(/'/g, '').replace(/ /g, '_')
}

// ── Re-export types from the real client ─────────────────────────────────────
export type {
  Filters, KPISummary, WeekPoint, StoreRank,
  CategoryPerf, PricePoint,
  JatakExample, Suggestion, SuggestResponse, AICategoryInfo,
  TopTitle, SeasonalCategory, InspirationTips, OfferSearchResult,
  ChurnChain, ChurnSummary, ChurnStore,
} from './client'

// ── Static implementations ───────────────────────────────────────────────────
import type {
  Filters, KPISummary, WeekPoint, StoreRank, CategoryPerf, PricePoint,
  AICategoryInfo, TopTitle, SeasonalCategory, InspirationTips,
  OfferSearchResult, ChurnSummary, ChurnStore, SuggestResponse,
  PeriodInactiveStore, PeriodChainBreakdown,
} from './client'

interface PeriodAnalysis {
  period: {
    date_from: string
    date_to: string
  }
  kpis: {
    active_stores: number
    pause_stores: number
    closed_stores: number
    new_stores: number
    hk_stores: number
    reelt_tabte: number
    activity_rate: number
  }
  chain_breakdown: PeriodChainBreakdown[]
  inactive_list: PeriodInactiveStore[]
}

export const fetchKPISummary   = (_f?: Filters) => load<KPISummary>('kpi')
export const fetchStoreList    = ()             => load<string[]>('stores')
export const fetchDateRange    = ()             => load<{ date_min: string; date_max: string }>('date_range')
export const fetchWeeklyTrend  = (_f?: Filters) => load<WeekPoint[]>('trend_weekly')
export const fetchStoreRanking = (_f?: Filters, limit = 20) =>
  load<StoreRank[]>(limit <= 10 ? 'ranking_week' : 'ranking_20')

export const fetchCategoryPerf  = (_f?: Filters) => load<CategoryPerf[]>('categories_perf')
export const fetchPricePoints   = (_f?: Filters) => load<PricePoint[]>('categories_prices')

export const fetchAICategories = () => load<AICategoryInfo[]>('ai_categories')
export const suggestJatak      = (_fd: FormData): Promise<SuggestResponse> =>
  Promise.reject(new Error('AI Generator kræver lokal backend — kør start.ps1'))

export const fetchTopTitles = (cat: string, _limit = 15) =>
  load<TopTitle[]>(`titles_${catSlug(cat)}`)
export const fetchSeasonal = (month?: number) =>
  load<SeasonalCategory[]>(month ? `seasonal_${month}` : 'seasonal_default')
export const fetchInspirationTips       = () => load<InspirationTips>('inspiration_tips')
export const fetchInspirationCategories = () => load<string[]>('inspiration_categories')

// Static search: pre-baked queries, returns empty for unknown
const SEARCH_MAP: Record<string, string> = {
  'kærnemælk': 'search_kaernemaelk', 'flæskesteg': 'search_flaeskesteg',
  'kaffe': 'search_kaffe', 'æg': 'search_aeg', 'mælk': 'search_maelk',
  'ost': 'search_ost', 'brød': 'search_broed', 'slik': 'search_slik',
  'øl': 'search_oel', 'vin': 'search_vin',
}
export const searchOffers = (q: string, _limit = 10) => {
  const key = q.toLowerCase().trim()
  const file = SEARCH_MAP[key]
  return file ? load<OfferSearchResult[]>(file) : Promise.resolve([] as OfferSearchResult[])
}

export const fetchChurnSummary = () => load<ChurnSummary>('churn_summary')
export const fetchChurnStores  = (chain: string) =>
  load<ChurnStore[]>(`churn_stores_${chainSlug(chain)}`)

export async function fetchPeriodAnalysis(_filters: Filters, chain?: string): Promise<PeriodAnalysis> {
  const summary = await fetchChurnSummary()
  const chainNames = chain ? [chain] : summary.chains.map(c => c.chain)

  const lists = await Promise.all(chainNames.map(name => fetchChurnStores(name)))
  const inactive_list = lists.flatMap((stores, index) =>
    stores.map((store) => ({
      kardex_id: store.kardex_id,
      name: store.name,
      chain: chainNames[index],
      last_offer_date: store.seneste_opslag,
      days_inactive: 0,
      months_inactive: 0,
      historical_offers: store.offer_count,
      avg_jatak: store.avg_jatak,
      is_registered: true,
      has_hk: !!store.hk_opslag,
      status: store.hk_opslag ? 'HK-support' : 'Registreret',
    }))
  )

  const chain_breakdown = summary.chains.map((c) => ({
    chain: c.chain,
    active_stores: c.count - c.pause_count,
    pause_stores: c.pause_count,
    hk_stores: c.hk_count,
    reelt_tabte: c.reelt_tabt_count,
    activity_rate: c.count > 0 ? Math.round(((c.count - c.pause_count) / c.count) * 1000) / 10 : 0,
  }))

  const active_stores = Math.max(0, summary.total_active_2025 - summary.total_inactive)
  const hk_stores = summary.hk_count
  const reelt_tabte = summary.reelt_tabt
  const pause_stores = Math.max(0, summary.total_inactive - summary.ophoert_count)

  return {
    period: {
      date_from: '',
      date_to: '',
    },
    kpis: {
      active_stores,
      pause_stores,
      closed_stores: summary.ophoert_count,
      new_stores: summary.new_stores_2026,
      hk_stores,
      reelt_tabte,
      activity_rate: (active_stores + hk_stores) > 0
        ? Math.round(((active_stores + hk_stores) / (active_stores + pause_stores)) * 1000) / 10
        : 0,
    },
    chain_breakdown,
    inactive_list,
  }
}


