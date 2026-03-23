import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Check, Search, Tag, Store } from 'lucide-react'
import { searchOffers, type OfferSearchResult } from '../api/client'

// ─── CopyBtn ──────────────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Kopiér opslag' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center justify-center gap-2 rounded-xl font-semibold text-sm px-4 py-2.5 w-full transition-colors
        ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
    >
      {copied
        ? <><Check size={14} /> Kopieret!</>
        : <><Copy size={14} /> {label}</>}
    </button>
  )
}

// ─── "Klar til i dag" hardcoded cards ────────────────────────────────────────

const READY_TODAY = [
  {
    product: 'Kyllingebryst 1 kg',
    price: '49 kr',
    angle: 'God hverdagsvare med bred appel',
    post: `🔥 JA TAK TILBUD 🔥\nKyllingebryst 1 kg – kun 49 kr\nPerfekt til aftensmad.\nMax 2 pr. kunde.\n\nSkriv JA TAK + antal i kommentaren.`,
  },
  {
    product: 'Arla Letmælk 2 × 2 L',
    price: '18 kr',
    angle: 'Sælges hurtigt – opkøbsvare alle kender',
    post: `🥛 JA TAK TIL MÆLK 🥛\nArla Letmælk 2 × 2 L – kun 18 kr\nTag til dig – spar i dag.\nMax 2 sæt pr. kunde.\n\nSkriv JA TAK + antal i kommentaren.`,
  },
  {
    product: 'Hakket oksekød 500 g',
    price: '29 kr',
    angle: 'Klassiker – købes altid når prisen er lav',
    post: `🥩 JA TAK TILBUD 🥩\nHakket oksekød 500 g – kun 29 kr\n10% fedt – perfekt til frikadeller eller pasta.\nMax 3 stk. pr. kunde.\n\nSkriv JA TAK + antal i kommentaren.`,
  },
  {
    product: 'Kaffe 400 g',
    price: '34 kr',
    angle: 'Bred appel – kaffe sælges næsten altid',
    post: `☕ JA TAK TIL KAFFE ☕\nKaffe 400 g – kun 34 kr\nFå morgenen godt i gang.\nMax 2 stk. pr. kunde.\n\nSkriv JA TAK + antal i kommentaren.`,
  },
  {
    product: 'Bacon 500 g',
    price: '25 kr',
    angle: 'Weekend-vare med høj reaktion',
    post: `🥓 JA TAK TIL BACON 🥓\nBacon 500 g – kun 25 kr\nPerfekt til weekendmorgenmaden.\nMax 2 stk. pr. kunde.\n\nSkriv JA TAK + antal i kommentaren.`,
  },
]

function ReadyCard({ item }: { item: (typeof READY_TODAY)[number] }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5 flex flex-col gap-4">
      <div>
        <p className="text-base font-bold text-slate-100">{item.product}</p>
        <p className="text-2xl font-bold text-emerald-400 mt-1">{item.price}</p>
        <p className="text-xs text-slate-500 mt-1.5">{item.angle}</p>
      </div>
      <div className="flex-1 bg-slate-900/70 rounded-xl border border-slate-700/40 px-4 py-3">
        <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{item.post}</p>
      </div>
      <CopyBtn text={item.post} />
    </div>
  )
}

// ─── Search chips (mapped to known static search terms) ───────────────────────

const SEARCH_CHIPS = [
  { label: 'Mælk',       query: 'mælk'       },
  { label: 'Kærnemælk',  query: 'kærnemælk'  },
  { label: 'Kaffe',      query: 'kaffe'       },
  { label: 'Flæskesteg', query: 'flæskesteg' },
  { label: 'Ost',        query: 'ost'         },
]

// ─── Search result card ───────────────────────────────────────────────────────

function SearchCard({ r }: { r: OfferSearchResult }) {
  const postText = r.description
    ? `${r.title}\n\n${r.description}\n\nSkriv JA TAK + antal i kommentaren.`
    : `${r.title}\n\nSkriv JA TAK + antal i kommentaren.`
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/40 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-slate-100 leading-snug">{r.title}</p>
        {r.price > 0 && (
          <span className="shrink-0 text-sm font-bold text-emerald-400">{r.price.toFixed(0)} kr</span>
        )}
      </div>
      {r.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{r.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {r.category && (
          <span className="inline-flex items-center gap-1 text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-lg">
            <Tag size={9} />{r.category}
          </span>
        )}
        {r.store_name && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
            <Store size={9} />{r.store_name.split(' ')[0]}
          </span>
        )}
        <span className="ml-auto text-xs font-semibold text-emerald-400/80">{r.jatak_count} Ja Tak</span>
      </div>
      <CopyBtn text={postText} />
    </div>
  )
}

// ─── Search Panel ─────────────────────────────────────────────────────────────

function SearchPanel() {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['offer-search', trimmed],
    queryFn: () => searchOffers(trimmed, 10),
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Prøv fx mælk, kærnemælk, kaffe, ost"
          className="w-full bg-slate-800 border border-slate-600/60 text-slate-100 placeholder:text-slate-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition"
        />
      </div>

      {!trimmed && (
        <div className="flex flex-wrap gap-2">
          {SEARCH_CHIPS.map(({ label, query: q }) => (
            <button
              key={label}
              onClick={() => setQuery(q)}
              className="text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 px-3.5 py-1.5 rounded-xl transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {trimmed.length >= 2 && isFetching && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      )}

      {!isFetching && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {results.slice(0, 6).map((r, i) => <SearchCard key={i} r={r} />)}
        </div>
      )}

      {trimmed.length >= 2 && !isFetching && results.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-6">
          Ingen opslag fundet for <span className="text-slate-300">"{trimmed}"</span>
        </p>
      )}
    </div>
  )
}

// ─── "Det virker ofte" tips ───────────────────────────────────────────────────

const TIPS = [
  { title: 'Vis prisen',           text: 'Opslag med pris er lettere at reagere på.' },
  { title: 'Vær konkret',          text: 'Skriv præcis hvad varen er — mærke, vægt og antal.' },
  { title: 'Hold titlen kort',     text: 'Korte titler er lettere at afkode hurtigt.' },
  { title: 'Brug en begrænsning',  text: 'Fx "Max 2 pr. kunde" — skaber reaktion.' },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ButiksuniversPage() {
  const { data: moreOffers = [] } = useQuery({
    queryKey: ['offer-search', 'mælk'],
    queryFn: () => searchOffers('mælk', 10),
    staleTime: Infinity,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-14">

      {/* ── HERO ── */}
      <div className="rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20 px-8 py-12 sm:py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 leading-tight mb-3">
          Hvad kan du poste i dag?
        </h1>
        <p className="text-base text-slate-400 max-w-lg mx-auto mb-5 leading-relaxed">
          Få idéer og færdige opslag, du kan kopiere med det samme.
        </p>
        <p className="text-xs text-slate-600">
          Baseret på historiske Ja Tak opslag fra danske butikker
        </p>
      </div>

      {/* ── KLAR TIL I DAG ── */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Klar til i dag</h2>
          <p className="text-sm text-slate-500 mt-1">Her er varer og opslag, du hurtigt kan bruge i dag.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {READY_TODAY.map(item => <ReadyCard key={item.product} item={item} />)}
        </div>
      </div>

      {/* ── FIND NOGET DER LIGNER DIN VARE ── */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Find noget der ligner din vare</h2>
          <p className="text-sm text-slate-500 mt-1">Søg og se opslag, du kan bruge som inspiration.</p>
        </div>
        <SearchPanel />
      </div>

      {/* ── DET VIRKER OFTE ── */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Det virker ofte</h2>
          <p className="text-sm text-slate-500 mt-1">Korte råd der ofte løfter et opslag.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIPS.map(tip => (
            <div key={tip.title} className="flex gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/50 px-5 py-4">
              <div className="shrink-0 w-2 h-2 rounded-full bg-blue-400 mt-2" />
              <div>
                <p className="text-sm font-semibold text-slate-100">{tip.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{tip.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FLERE OPSLAG DU KAN BRUGE ── */}
      {moreOffers.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100">Flere opslag du kan bruge</h2>
            <p className="text-sm text-slate-500 mt-1">Kopiér direkte eller brug dem som inspiration.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {moreOffers.slice(0, 6).map((r, i) => <SearchCard key={i} r={r} />)}
          </div>
        </div>
      )}

      {/* ── BUND CTA ── */}
      <div className="rounded-3xl border border-slate-700/50 bg-slate-900/60 px-8 py-10 text-center">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Klar til at poste?</h3>
        <p className="text-sm text-slate-400 mb-6">Vælg et opslag ovenfor og kopier det direkte.</p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Tilbage til toppen
        </button>
      </div>

    </div>
  )
}
