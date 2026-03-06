import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Flame, Lightbulb, Calendar, ChevronRight,
  Copy, Check, TrendingUp, Star, Zap, ShoppingBag, Search, Tag, Store
} from 'lucide-react'
import {
  fetchTopTitles, fetchSeasonal, fetchInspirationTips,
  fetchInspirationCategories, searchOffers,
  type TopTitle, type SeasonalCategory, type InspirationTips, type OfferSearchResult,
} from '../api/client'

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  '', 'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December',
]

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button
      onClick={copy}
      title="Kopiér"
      className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
    >
      {copied
        ? <Check size={13} className="text-green-400" />
        : <Copy size={13} />}
    </button>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, color = 'text-blue-400' }: {
  icon: React.ElementType; title: string; subtitle?: string; color?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-xl bg-slate-800 border border-slate-700`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Seasonal card ───────────────────────────────────────────────────────────

function SeasonalCard({ item, idx }: { item: SeasonalCategory; idx: number }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="flex items-center justify-between gap-3 bg-slate-800/60 rounded-2xl px-5 py-4 border border-slate-700/40 hover:border-slate-600/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">{medals[idx] ?? `#${idx + 1}`}</span>
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-100 truncate">{item.category}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {item.unique_stores} butikker brugte denne kategori · gns. pris {item.avg_price.toFixed(0)} kr
          </p>
          <p className="text-xs text-blue-400/80 mt-0.5">
            {item.pct_of_total.toFixed(0)}% af alle opslag denne måned er i denne kategori
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <p className="text-2xl font-bold text-emerald-400">{item.avg_jatak.toFixed(1)}</p>
        <p className="text-xs text-slate-400 leading-tight">kunder skriver</p>
        <p className="text-xs text-slate-400 leading-tight">Ja Tak i snit</p>
      </div>
    </div>
  )
}

// ─── Top title row ───────────────────────────────────────────────────────────

function TitleRow({ t }: { t: TopTitle }) {
  const rankColor = t.rank === 1
    ? 'text-yellow-400 font-bold'
    : t.rank === 2
      ? 'text-slate-300 font-semibold'
      : t.rank === 3
        ? 'text-amber-600 font-semibold'
        : 'text-slate-500'

  return (
    <div className="flex items-start gap-4 bg-slate-800/50 rounded-2xl px-5 py-4 border border-slate-700/30 hover:border-slate-600/50 transition-colors group">
      <span className={`text-base w-6 shrink-0 mt-0.5 ${rankColor}`}>{t.rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-base text-slate-100 font-semibold leading-snug break-words">{t.title}</p>
        {t.sample_description && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-1">{t.sample_description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg">
            ⭐ {Math.round(t.avg_jatak)} kunder skrev Ja Tak i snit
          </span>
          {t.avg_price > 0 && (
            <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-lg">{t.avg_price.toFixed(0)} kr</span>
          )}
          {t.use_count > 1 && (
            <span className="text-xs text-blue-300/80 bg-blue-900/30 border border-blue-500/20 px-2 py-1 rounded-lg">brugt af {t.use_count} butikker</span>
          )}
          {t.has_emoji && (
            <span className="text-xs text-violet-300/80 bg-violet-900/20 border border-violet-500/20 px-2 py-1 rounded-lg">🎯 har emojis</span>
          )}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
        <CopyBtn text={t.title} />
      </div>
    </div>
  )
}

// ─── Tips panel ─────────────────────────────────────────────────────────────

function TipCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className={`rounded-2xl border bg-slate-900/60 p-4 flex flex-col gap-2 ${color}`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className="shrink-0" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 leading-relaxed">{sub}</p>
    </div>
  )
}

function TipsSection({ tips }: { tips: InspirationTips }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <TipCard
        icon={Zap}
        label="Emojis"
        value={`+${tips.emoji.delta_pct.toFixed(0)}%`}
        sub={`Tilbud med emojis får ${tips.emoji.with.toFixed(1)} ja tak mod ${tips.emoji.without.toFixed(1)} uden`}
        color="border-violet-500/30"
      />
      <TipCard
        icon={TrendingUp}
        label="Vis prisen"
        value={`+${tips.price_shown.delta_pct.toFixed(0)}%`}
        sub={`Med pris: ${tips.price_shown.with.toFixed(1)} ja tak · Uden pris: ${tips.price_shown.without.toFixed(1)} ja tak`}
        color="border-blue-500/30"
      />
      <TipCard
        icon={ShoppingBag}
        label="Billigste varer"
        value={`${tips.price_bucket.under_50.toFixed(1)} ja tak`}
        sub={`Varer under 50 kr klarer sig bedst vs ${tips.price_bucket['50_to_100'].toFixed(1)} (50-100 kr) og ${tips.price_bucket.over_100.toFixed(1)} (100+ kr)`}
        color="border-emerald-500/30"
      />
      <TipCard
        icon={Star}
        label="Top kategori"
        value={tips.top_categories[0]?.category ?? '–'}
        sub={`${tips.top_categories.map(c => `${c.category} (${c.avg_jatak.toFixed(1)})`).join(' · ')}`}
        color="border-amber-500/30"
      />
    </div>
  )
}

// ─── Month picker ────────────────────────────────────────────────────────────

function MonthPicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MONTH_NAMES.slice(1).map((name, i) => {
        const m = i + 1
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              value === m
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700'
            }`}
          >
            {name.slice(0, 3)}
          </button>
        )
      })}
    </div>
  )
}

// ─── Top Titles Panel ────────────────────────────────────────────────────────

function TopTitlesPanel({ categories }: { categories: string[] }) {
  const [selectedCat, setSelectedCat] = useState(categories[0] ?? '')

  const { data: titles = [], isLoading } = useQuery({
    queryKey: ['top-titles', selectedCat],
    queryFn: () => fetchTopTitles(selectedCat, 5),
    enabled: !!selectedCat,
    staleTime: 300_000,
  })

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
      <SectionHeader
        icon={Trophy}
        title="Top 5 mest populære titler"
        subtitle="Titler fra butikker der har fået flest kunder — klik på en titel for at kopiere den direkte"
        color="text-yellow-400"
      />

      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              selectedCat === cat
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : titles.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">Ingen data i denne kategori</p>
      ) : (
        <div className="space-y-2">
          {titles.map(t => <TitleRow key={t.rank} t={t} />)}
        </div>
      )}
    </div>
  )
}

// ─── Seasonal Panel ──────────────────────────────────────────────────────────

function SeasonalPanel() {
  const currentMonth = new Date().getMonth() + 1
  const [month, setMonth] = useState(currentMonth)

  const { data: seasonal = [], isLoading } = useQuery({
    queryKey: ['seasonal', month],
    queryFn: () => fetchSeasonal(month),
    staleTime: 300_000,
  })

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
      <SectionHeader
        icon={Calendar}
        title="Sæsonkategorier"
        subtitle="Vælg en måned og se hvilke kategorier der historisk får flest kunder til at skrive Ja Tak"
        color="text-blue-400"
      />

      <div className="mb-5">
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
        <Flame size={12} className="text-orange-400" />
        Topkategorier i <span className="text-slate-300 ml-1 font-semibold">{MONTH_NAMES[month]}</span>
        <span className="ml-1 text-slate-600">— tal = gns. kunder der skriver Ja Tak per opslag</span>
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {seasonal.map((s, i) => <SeasonalCard key={s.category} item={s} idx={i} />)}
        </div>
      )}
    </div>
  )
}

// ─── Search Panel ───────────────────────────────────────────────────────────

function SearchResultCard({ r }: { r: OfferSearchResult }) {
  const sellPct = r.initial_stock > 0 ? Math.round((r.total_sold / r.initial_stock) * 100) : null

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/50 px-5 py-4 space-y-2 hover:border-slate-600/60 transition-colors">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-bold text-slate-100 leading-snug">{r.title}</p>
        <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg">
          ⭐ {r.jatak_count} Ja Tak
        </span>
      </div>

      {/* Description */}
      {r.description && (
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{r.description}</p>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {r.price > 0 && (
          <span className="text-xs bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-lg font-medium">{r.price.toFixed(0)} kr</span>
        )}
        {r.total_sold > 0 && (
          <span className="text-xs bg-blue-900/30 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded-lg">
            {r.total_sold} solgt{sellPct !== null ? ` (${sellPct}% af lager)` : ''}
          </span>
        )}
        {r.category && (
          <span className="inline-flex items-center gap-1 text-xs bg-violet-900/30 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-lg">
            <Tag size={10} />{r.category}
          </span>
        )}
        {r.store_name && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Store size={10} />{r.store_name.split(' ')[0]}
          </span>
        )}
        {r.created_date && (
          <span className="text-xs text-slate-600 ml-auto">{r.created_date.slice(0, 10)}</span>
        )}
      </div>
    </div>
  )
}

function SearchPanel() {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ['offer-search', trimmed],
    queryFn: () => searchOffers(trimmed, 10),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  })

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
      <SectionHeader
        icon={Search}
        title="Søg i historiske opslag"
        subtitle="Find hvad der virkede for et produkt — og se top-resultater med Ja Tak, solgte varer og pris"
        color="text-sky-400"
      />

      {/* Input */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Eks. Stjerneskud, Gulerødder, Mælk …"
          className="w-full bg-slate-800 border border-slate-600/60 text-slate-100 placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition"
        />
      </div>

      {/* States */}
      {trimmed.length < 2 && (
        <p className="text-sm text-slate-500 text-center py-6">Skriv mindst 2 tegn for at søge</p>
      )}
      {trimmed.length >= 2 && isFetching && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      )}
      {trimmed.length >= 2 && !isFetching && isError && (
        <p className="text-sm text-red-400 text-center py-6">Søgningen fejlede — prøv igen</p>
      )}
      {trimmed.length >= 2 && !isFetching && !isError && results.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">Ingen opslag fundet for <span className="text-slate-300 font-medium">"{trimmed}"</span></p>
      )}
      {!isFetching && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-3">Top {results.length} opslag for <span className="text-slate-300 font-semibold">"{trimmed}"</span> — sorteret efter flest Ja Tak</p>
          {results.map((r, i) => <SearchResultCard key={i} r={r} />)}
        </div>
      )}
    </div>
  )
}

// ─── Inspiration banner ───────────────────────────────────────────────────────

function InspirationBanner() {
  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-violet-950/30 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 self-start sm:self-auto shrink-0">
        <Lightbulb size={24} className="text-blue-300" />
      </div>
      <div>
        <h3 className="font-bold text-slate-100 mb-1">Maksimer dine Ja Tak med data</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Som de eneste i Danmark har vi fuld historik på alle Ja Tak-opslag.
          Brug inspirationen herunder til at vælge den rigtige kategori, pris og titel —
          og øg dine chancer for et godt salg markant.
          Du kan også springe direkte til <span className="text-violet-300 font-medium">AI Ja Tak Generatoren</span> for at få forslag skrevet automatisk.
        </p>
      </div>
      <a
        href="#/ai-jatak"
        className="shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        onClick={e => { e.preventDefault(); window.location.hash = '/ai-jatak' }}
      >
        AI Generator <ChevronRight size={15} />
      </a>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ButiksuniversPage() {
  const { data: tips } = useQuery({
    queryKey: ['inspiration-tips'],
    queryFn: fetchInspirationTips,
    staleTime: 600_000,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['inspiration-categories'],
    queryFn: fetchInspirationCategories,
    staleTime: Infinity,
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/30">
          <ShoppingBag size={26} className="text-blue-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Butiksunivers</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Din datadrevne guide til bedre Ja Tak-tilbud — baseret på 680.000+ historiske opslag
          </p>
        </div>
      </div>

      {/* Banner */}
      <InspirationBanner />

      {/* Smart tips */}
      <div>
        <SectionHeader
          icon={Zap}
          title="Smarte råd fra data"
          subtitle="Hvad der faktisk virker — opgjort på tværs af alle butikker og år"
          color="text-emerald-400"
        />
        {tips
          ? <TipsSection tips={tips} />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          )
        }
      </div>

      {/* Product search */}
      <SearchPanel />

      {/* Quick checklist */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6">
        <SectionHeader
          icon={Star}
          title="Tjekliste til dit næste opslag"
          subtitle="Gå igennem disse punkter inden du poster"
          color="text-amber-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Er prisen med i titlen?', note: '+34% mere Ja Tak når prisen fremgår', done: 'border-emerald-500/30 bg-emerald-950/10' },
            { label: 'Bruger du emojis?', note: 'Tilføjer +5% engagement konsekvent', done: 'border-violet-500/30 bg-violet-950/10' },
            { label: 'Er varen under 50 kr?', note: 'Billige varer konverterer bedst (21 ja tak)', done: 'border-blue-500/30 bg-blue-950/10' },
            { label: 'Passer kategorien til måneden?', note: 'Check Sæsonkortet — Mejeri & Is er stærkt i marts', done: 'border-amber-500/30 bg-amber-950/10' },
            { label: 'Er lageret realistisk?', note: 'Oversold tilbud skader fremtidigt engagement', done: 'border-red-500/30 bg-red-950/10' },
            { label: 'Klar til AI-generering?', note: 'Hop til AI-generatoren for 3 færdige forslag', done: 'border-slate-600/60 bg-slate-800/30' },
          ].map(item => (
            <div key={item.label} className={`rounded-xl border ${item.done} p-4`}>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded border border-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns: top titles + seasonal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {categories.length > 0
          ? <TopTitlesPanel categories={categories} />
          : <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6 animate-pulse h-64" />
        }
        <SeasonalPanel />
      </div>
    </div>
  )
}
