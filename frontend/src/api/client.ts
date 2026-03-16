import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

// ── Filter params ────────────────────────────────────────────────────────────
export interface Filters {
  store?: string
  date_from?: string
  date_to?: string
}

// Normalize any date string to YYYY-MM-DD (handles DD/MM/YYYY and MM/DD/YYYY)
function toISODate(d: string): string {
  if (!d) return d
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  // DD/MM/YYYY or MM/DD/YYYY → parse via Date using ISO-ish
  const parts = d.split('/')
  if (parts.length === 3) {
    const [a, b, y] = parts
    // Assume DD/MM/YYYY (Danish locale)
    return `${y}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`
  }
  return d
}

function qs(f: Filters): string {
  const p = new URLSearchParams()
  if (f.store)     p.set('store',     f.store)
  if (f.date_from) p.set('date_from', toISODate(f.date_from))
  if (f.date_to)   p.set('date_to',   toISODate(f.date_to))
  const s = p.toString()
  return s ? `?${s}` : ''
}

// ── KPI ──────────────────────────────────────────────────────────────────────
export interface KPISummary {
  total_offers:    number
  total_jatak:     number
  total_sold:      number
  total_turnover:  number
  avg_basket_qty:   number
  avg_basket_value: number
  total_stores:    number
  fb_pct:          number
  sms_pct:         number
  coop_pct:        number
  fb_orders:       number
  sms_orders:      number
  coop_orders:     number
}

export const fetchKPISummary = (f: Filters = {}) =>
  api.get<KPISummary>(`/kpi${qs(f)}`).then(r => r.data)

export const fetchStoreList = () =>
  api.get<string[]>('/kpi/stores').then(r => r.data)

export const fetchDateRange = () =>
  api.get<{ date_min: string; date_max: string }>('/kpi/date-range').then(r => r.data)

// ── Trend ────────────────────────────────────────────────────────────────────
export interface WeekPoint {
  week_start:     string
  offer_count:    number
  total_jatak:    number
  avg_jatak:      number
  active_stores:  number
  is_top3?:       boolean
}

export const fetchWeeklyTrend = (f: Filters = {}) =>
  api.get<WeekPoint[]>(`/trend/weekly${qs(f)}`).then(r => r.data)

// ── Stores ───────────────────────────────────────────────────────────────────
export interface StoreRank {
  kardex_id:      string
  chain:          string
  label:          string
  offer_count:    number
  total_jatak:    number
  avg_jatak:      number
  total_turnover: number
}

export const fetchStoreRanking = (f: Filters = {}, limit = 20) =>
  api.get<StoreRank[]>(`/stores/ranking?limit=${limit}${qs(f) ? '&' + qs(f).slice(1) : ''}`).then(r => r.data)

// ── Categories ───────────────────────────────────────────────────────────────
export interface CategoryPerf {
  category:    string
  offer_count: number
  total_jatak: number
  avg_jatak:   number
  avg_price:   number
  avg_revenue: number
}

export interface PricePoint {
  bucket:      string
  offer_count: number
  avg_jatak:   number
  avg_price:   number
  avg_revenue: number
}

export const fetchCategoryPerf = (f: Filters = {}) =>
  api.get<CategoryPerf[]>(`/categories/performance${qs(f)}`).then(r => r.data)

export const fetchPricePoints = (f: Filters = {}) =>
  api.get<PricePoint[]>(`/categories/pricepoints${qs(f)}`).then(r => r.data)

// ── AI Ja Tak ────────────────────────────────────────────────────────────────

export interface JatakExample {
  title:       string
  description: string
  jatak_count: number
  price:       number
  has_emoji:   boolean
}

export interface Suggestion {
  title:       string
  description: string
}

export interface SuggestResponse {
  suggestions:   Suggestion[]
  examples_used: number
  examples:      JatakExample[]
}

export interface AICategoryInfo {
  category:      string
  example_count: number
  median_jatak:  number
}

export const fetchAICategories = () =>
  api.get<AICategoryInfo[]>('/ai/categories').then(r => r.data)

export const suggestJatak = (formData: FormData) =>
  api.post<SuggestResponse>('/ai/suggest', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

// ── Inspiration (Butiksunivers) ───────────────────────────────────────────────

export interface TopTitle {
  rank:               number
  title:              string
  avg_jatak:          number
  use_count:          number
  avg_price:          number
  has_emoji:          boolean
  sample_description: string
}

export interface SeasonalCategory {
  rank:          number
  category:      string
  avg_jatak:     number
  offer_count:   number
  avg_price:     number
  unique_stores: number
  pct_of_total:  number
}

export interface InspirationTips {
  emoji: { with: number; without: number; delta_pct: number }
  publish_time: { morning: number; midday: number; delta_pct: number }
  price_bucket: { under_50: number; '50_to_100': number; over_100: number }
  top_categories: { category: string; avg_jatak: number }[]
}

export const fetchTopTitles = (category: string, limit = 15) =>
  api.get<TopTitle[]>(`/inspiration/top-titles?category=${encodeURIComponent(category)}&limit=${limit}`).then(r => r.data)

export const fetchSeasonal = (month?: number) =>
  api.get<SeasonalCategory[]>(`/inspiration/seasonal${month ? `?month=${month}` : ''}`).then(r => r.data)

export const fetchInspirationTips = () =>
  api.get<InspirationTips>(`/inspiration/tips`).then(r => r.data)

export const fetchInspirationCategories = () =>
  api.get<string[]>('/inspiration/categories').then(r => r.data)

export interface OfferSearchResult {
  title:         string
  description:   string
  category:      string
  jatak_count:   number
  total_sold:    number
  initial_stock: number
  items_unsold:  number
  price:         number
  store_name:    string
  created_date:  string
}

export const searchOffers = (q: string, limit = 10) =>
  api.get<OfferSearchResult[]>(`/inspiration/search?q=${encodeURIComponent(q)}&limit=${limit}`).then(r => r.data)

// ── Churn (Butiksudvikling) ───────────────────────────────────────────────────

export interface ChurnChain {
  chain:             string
  count:             number
  total_opslag_2025: number
  avg_jatak_2025:    number
  ophoert_count:     number
  pause_count:       number
  hk_count:           number
  ikke_aktive_count:  number
  reelt_tabt_count:   number
}

export interface ChurnSummary {
  total_active_2025:  number
  total_offers_2025:  number
  total_inactive:     number
  ophoert_count:      number
  pause_count:        number
  hk_count:           number
  ikke_aktive:        number
  reelt_tabt:         number
  new_stores_2026:    number
  tabt_opslag_2025:   number
  chains:             ChurnChain[]
}

export interface ChurnStore {
  kardex_id:      string
  name:           string
  offer_count:    number
  avg_jatak:      number
  seneste_opslag: string
  status:         'Ophørt' | 'Pause'
  hk_opslag:      boolean
}

export const fetchChurnSummary = () =>
  api.get<ChurnSummary>('/stores/churn/summary').then(r => r.data)

export const fetchChurnStores = (chain: string) =>
  api.get<ChurnStore[]>(`/stores/churn/stores?chain=${encodeURIComponent(chain)}`).then(r => r.data)

// ── Legacy ───────────────────────────────────────────────────────────────────
export interface KPI {
  total_offers: number
  total_stores: number
  total_jatak: number
  avg_jatak_per_offer: number
  top_category: string
  growth_pct: number
}
export const fetchKPIs = () => api.get<KPI>('/overview').then(r => r.data)
