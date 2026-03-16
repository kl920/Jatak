import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Calendar, ChevronRight,
  Copy, Check, TrendingUp, Star, Zap, ShoppingBag, Search, Tag, Store,
  Sparkles, ArrowRight,
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

function navigateToAI() {
  window.location.hash = '/ai-jatak'
}

function CopyBtn({ text, showLabel = false }: { text: string; showLabel?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button
      onClick={copy}
      title="Kopiér titel"
      className={`shrink-0 flex items-center gap-1.5 rounded-lg transition-colors text-xs font-medium
        ${copied
          ? 'text-green-400 bg-green-950/40 border border-green-500/30 px-2.5 py-1.5'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700 border border-slate-700/60 px-2.5 py-1.5'
        }`}
    >
      {copied
        ? <><Check size={12} />{showLabel && 'Kopieret'}</>
        : <><Copy size={12} />{showLabel && 'Kopiér'}</>}
    </button>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, color = 'text-blue-400' }: {
  icon: React.ElementType; title: string; subtitle?: string; color?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/80">
        <Icon size={17} className={color} />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Inline AI CTA strip ─────────────────────────────────────────────────────

function AICTAStrip({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-violet-500/20 bg-violet-950/20 px-5 py-3.5">
      <p className="text-sm text-slate-300">{message}</p>
      <button
        onClick={navigateToAI}
        className="shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
      >
        Lad AI skrive opslaget <ArrowRight size={13} />
      </button>
    </div>
  )
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ icon: Icon, label, value, note, accent }: {
  icon: React.ElementType; label: string; value: string; note: string; accent: string
}) {
  return (
    <div className={`rounded-2xl border bg-slate-900/70 p-5 flex flex-col gap-3 ${accent}`}>
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-slate-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-100 leading-none">{value}</p>
      <p className="text-xs text-slate-500 leading-snug">{note}</p>
    </div>
  )
}

function InsightsGrid({ tips }: { tips: InspirationTips }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <InsightCard
        icon={Zap}
        label="Emojis virker"
        value={`+${tips.emoji.delta_pct.toFixed(0)}%`}
        note="Opslag med emojis får typisk flere Ja Tak."
        accent="border-violet-500/25"
      />
      <InsightCard
        icon={TrendingUp}
        label="Tidspunkt virker"
        value={`+${tips.publish_time.delta_pct.toFixed(0)}%`}
        note="Opslag kl. 6–9 om morgenen får flest Ja Tak."
        accent="border-blue-500/25"
      />
      <InsightCard
        icon={ShoppingBag}
        label="Billige varer sælger"
        value={`${tips.price_bucket.under_50.toFixed(0)} Ja Tak`}
        note="Varer under 50 kr får typisk flest Ja Tak."
        accent="border-emerald-500/25"
      />
      <InsightCard
        icon={Star}
        label="Topkategori lige nu"
        value={tips.top_categories[0]?.category ?? '–'}
        note="Denne kategori performer stærkt denne måned."
        accent="border-amber-500/25"
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

// ─── Seasonal card ───────────────────────────────────────────────────────────

function SeasonalCard({ item, idx }: { item: SeasonalCategory; idx: number }) {
  const isTop3 = idx < 3
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-4 border transition-colors
      ${isTop3
        ? 'bg-slate-800/70 border-slate-600/50 hover:border-slate-500/70'
        : 'bg-slate-900/40 border-slate-700/30 hover:border-slate-600/40'
      }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`shrink-0 ${isTop3 ? 'text-xl' : 'text-sm text-slate-500 w-5 text-center'}`}>
          {medals[idx] ?? `#${idx + 1}`}
        </span>
        <div className="min-w-0">
          <p className={`font-bold truncate ${isTop3 ? 'text-base text-slate-100' : 'text-sm text-slate-300'}`}>
            {item.category}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {item.unique_stores} butikker · gns. {item.avg_price.toFixed(0)} kr
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-bold text-emerald-400 ${isTop3 ? 'text-2xl' : 'text-lg'}`}>
          {item.avg_jatak.toFixed(1)}
        </p>
        <p className="text-xs text-slate-500">Ja Tak</p>
      </div>
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
        title="Kategorier der performer lige nu"
        subtitle={`Baseret på ${MONTH_NAMES[month]}.`}
        color="text-blue-400"
      />

      <div className="mb-5">
        <MonthPicker value={month} onChange={setMonth} />
      </div>

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

// ─── Top title row ───────────────────────────────────────────────────────────

function TitleRow({ t }: { t: TopTitle }) {
  const rankStyles: Record<number, string> = {
    1: 'text-yellow-400 font-bold',
    2: 'text-slate-300 font-semibold',
    3: 'text-amber-600 font-semibold',
  }
  const rankColor = rankStyles[t.rank] ?? 'text-slate-600'

  return (
    <div className="flex items-center gap-3 bg-slate-800/50 rounded-2xl px-4 py-3.5 border border-slate-700/30 hover:border-slate-600/50 transition-colors group">
      <span className={`text-sm w-5 shrink-0 ${rankColor}`}>{t.rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-100 font-semibold leading-snug">{t.title}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs text-emerald-400 font-semibold">{Math.round(t.avg_jatak)} Ja Tak i snit</span>
          {t.avg_price > 0 && (
            <span className="text-xs text-slate-500">{t.avg_price.toFixed(0)} kr</span>
          )}
          {t.use_count > 1 && (
            <span className="text-xs text-slate-500">{t.use_count} butikker</span>
          )}
          {t.has_emoji && (
            <span className="text-xs text-violet-400/70">🎯 emojis</span>
          )}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyBtn text={t.title} showLabel />
      </div>
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
        title="Titler der ofte virker"
        subtitle="Kopier en titel eller brug den som inspiration."
        color="text-yellow-400"
      />

      <div className="flex flex-wrap gap-1.5 mb-5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              selectedCat === cat
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
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

// ─── Search result card ──────────────────────────────────────────────────────

function SearchResultCard({ r }: { r: OfferSearchResult }) {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/50 px-5 py-4 space-y-2 hover:border-slate-600/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-slate-100 leading-snug">{r.title}</p>
        <span className="shrink-0 text-xs font-bold text-emerald-400 bg-emerald-900/30 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
          {r.jatak_count} Ja Tak
        </span>
      </div>
      {r.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{r.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {r.price > 0 && (
          <span className="text-xs bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-lg">{r.price.toFixed(0)} kr</span>
        )}
        {r.category && (
          <span className="inline-flex items-center gap-1 text-xs bg-violet-900/20 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-lg">
            <Tag size={9} />{r.category}
          </span>
        )}
        {r.store_name && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
            <Store size={9} />{r.store_name.split(' ')[0]}
          </span>
        )}
        {r.created_date && (
          <span className="text-xs text-slate-600 ml-auto">{r.created_date.slice(0, 10)}</span>
        )}
      </div>
    </div>
  )
}

// ─── Search Panel ───────────────────────────────────────────────────────────

const SEARCH_SUGGESTIONS = ['kærnemælk', 'flæskesteg', 'kyllingebryst', 'jordbær', 'ost']

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
        title="Find opslag der virker"
        subtitle="Søg i 680.000+ tidligere Ja Tak opslag og se hvad andre butikker har solgt."
        color="text-sky-400"
      />

      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Prøv fx: kærnemælk, flæskesteg, kyllingebryst"
          className="w-full bg-slate-800 border border-slate-600/60 text-slate-100 placeholder:text-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40 transition"
        />
      </div>

      {!trimmed && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-600">Prøv:</span>
          {SEARCH_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="text-xs text-sky-400/80 hover:text-sky-300 bg-sky-950/30 hover:bg-sky-950/50 border border-sky-500/20 px-2.5 py-1 rounded-lg transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {trimmed.length >= 2 && isFetching && (
        <div className="space-y-2 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      )}
      {trimmed.length >= 2 && !isFetching && isError && (
        <p className="text-sm text-red-400 text-center py-6 mt-3">Søgningen fejlede — prøv igen</p>
      )}
      {trimmed.length >= 2 && !isFetching && !isError && results.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6 mt-3">Ingen opslag fundet for <span className="text-slate-300 font-medium">"{trimmed}"</span></p>
      )}
      {!isFetching && results.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-xs text-slate-500 mb-2">
            Top {results.length} for <span className="text-slate-300 font-medium">"{trimmed}"</span> — flest Ja Tak
          </p>
          {results.map((r, i) => <SearchResultCard key={i} r={r} />)}
          <div className="pt-2">
            <AICTAStrip message="Lad AI skrive dit næste opslag" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── "Det virker ofte" section ───────────────────────────────────────────────

const PRACTICAL_TIPS = [
  {
    icon: TrendingUp, color: 'text-emerald-400', accent: 'border-emerald-500/20',
    title: 'Post om morgenen',
    text: 'Opslag lagt op kl. 6–9 får i snit flest Ja Tak. Morgenkunder er aktive og konkurrencen om opmærksomhed er lavere.',
  },
  {
    icon: ShoppingBag, color: 'text-blue-400', accent: 'border-blue-500/20',
    title: 'Gør varen konkret',
    text: 'Skriv mærke, vægt og antal. "Tulip grillpølser 500g" konverterer bedre end bare "pølser".',
  },
  {
    icon: Star, color: 'text-violet-400', accent: 'border-violet-500/20',
    title: 'Brug en enkel titel',
    text: 'Korte, specifikke titler klarer sig bedst. Undgå lange sætninger og salgsargumenter i titlen.',
  },
  {
    icon: Calendar, color: 'text-amber-400', accent: 'border-amber-500/20',
    title: 'Brug kategori og timing rigtigt',
    text: 'Visse kategorier performer markant bedre i bestemte måneder. Tjek tabellen herunder.',
  },
  {
    icon: Zap, color: 'text-sky-400', accent: 'border-sky-500/20',
    title: 'Begrænsning kan skabe handling',
    text: 'Fx "Max 2 pr. kunde" eller "Kun fredag". Skaber urgency og kan løfte antal Ja Tak.',
  },
]

function BestPractices() {
  return (
    <div>
      <SectionHeader
        icon={Sparkles}
        title="Typisk noget der løfter et opslag"
        subtitle="Mønstre fra 680.000+ opslag du kan bruge med det samme."
        color="text-amber-400"
      />
      <div className="space-y-2">
        {PRACTICAL_TIPS.map(({ icon: Icon, color, accent, title, text }) => (
          <div key={title} className={`flex items-start gap-4 rounded-2xl border bg-slate-900/50 px-5 py-4 ${accent}`}>
            <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-slate-800 border border-slate-700/60">
              <Icon size={15} className={color} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100 mb-0.5">{title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>
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
    <div className="max-w-6xl mx-auto space-y-10">

      {/* ── Hero ── */}
      <div className="rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 px-8 py-10 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 leading-tight max-w-xl mb-3">
          Se hvad der virker<br />før du poster
        </h1>
        <p className="text-base text-slate-400 max-w-lg mb-6 leading-relaxed">
          680.000+ Ja Tak opslag analyseret. Brug data til at vælge bedre titel, pris og kategori.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={navigateToAI}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Sparkles size={15} />
            Åbn AI Generator
          </button>
          <button
            onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Søg i historiske opslag
          </button>
        </div>
      </div>

      {/* ── Søgning ── */}
      <div id="search-section">
        <SearchPanel />
      </div>

      {/* ── Data indsigter ── */}
      <div>
        <SectionHeader
          icon={Zap}
          title="Hvad virker ofte?"
          color="text-emerald-400"
        />
        {tips
          ? <InsightsGrid tips={tips} />
          : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          )
        }
      </div>

      {/* ── AI CTA mid-page ── */}
      <AICTAStrip message="Har du varen klar?" />

      {/* ── Det virker ofte ── */}
      <BestPractices />

      {/* ── Top titler + Sæson ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {categories.length > 0
          ? <TopTitlesPanel categories={categories} />
          : <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6 animate-pulse h-64" />
        }
        <SeasonalPanel />
      </div>

      {/* ── Bottom AI CTA ── */}
      <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-blue-950/20 px-8 py-8 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-100 mb-1">Klar til at lave dit næste opslag?</h3>
          <p className="text-sm text-slate-400">
            Skriv varen og prisen. AI laver resten på under 30 sekunder.
          </p>
        </div>
        <button
          onClick={navigateToAI}
          className="shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Sparkles size={15} />
          Åbn AI Generator
          <ChevronRight size={15} />
        </button>
      </div>

    </div>
  )
}
