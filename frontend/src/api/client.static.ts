/**
 * Static-mode API client — serves pre-baked JSON from /data/ folder.
 * Used in GitHub Pages production build (VITE_STATIC=true).
 * Falls back to the live API client when VITE_STATIC is not set.
 */
const BASE = import.meta.env.BASE_URL + 'data'

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
  ChurnChain, ChurnSummary, ChurnStore, KPI,
} from './client'

// ── Static implementations ───────────────────────────────────────────────────
import type { Filters, KPISummary, WeekPoint, StoreRank, CategoryPerf, PricePoint, AICategoryInfo, TopTitle, SeasonalCategory, InspirationTips, OfferSearchResult, ChurnSummary, ChurnStore, SuggestResponse } from './client'

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

// Legacy
export const fetchKPIs = () => load<any>('kpi')

// Dummy api object (some components may import it)
export const api = { get: () => Promise.reject('Static mode'), post: () => Promise.reject('Static mode') } as any
