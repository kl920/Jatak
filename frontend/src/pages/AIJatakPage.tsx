import { useState, useEffect, useRef, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Sparkles, Copy, Check, Upload, X, ChevronDown, ChevronUp,
  KeyRound, RefreshCw, ChevronRight, ArrowLeft,
} from 'lucide-react'
import { fetchAICategories, fetchSeasonal, suggestJatak, type Suggestion, type JatakExample } from '../api/client'

const LS_KEY = 'jatak_openai_key'

// ── AI Vurdering ──────────────────────────────────────────────────────────────

interface ScoreCheck {
  key:    string
  label:  string
  detail: string
  ok:     boolean
  points: number
}

function AIVurdering({ checks }: { checks: ScoreCheck[] }) {
  const total  = checks.reduce((s, c) => s + c.points, 0)
  const earned = checks.filter(c => c.ok).reduce((s, c) => s + c.points, 0)
  const pct    = Math.round(earned / total * 100)

  const barColor   = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-slate-600'
  const label      = pct >= 80 ? 'Godt opslag' : pct >= 50 ? 'Kan forbedres' : 'Mangler info'
  const labelColor = pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-slate-500'

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-violet-400/70" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Opslags-vurdering</span>
        </div>
        <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-2.5">
        {checks.map(c => (
          <div key={c.key} className="flex items-start gap-2.5">
            <div className={`shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
              c.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
            }`}>
              {c.ok ? '✓' : '·'}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-medium ${c.ok ? 'text-slate-200' : 'text-slate-500'}`}>{c.label}</span>
              {!c.ok && <p className="text-xs text-slate-600 mt-0.5">{c.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text, label = false }: { text: string; label?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 rounded-lg transition-colors text-xs font-medium px-2.5 py-1.5 ${
        copied
          ? 'text-green-400 bg-green-950/40 border border-green-500/30'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700 border border-slate-700/60'
      }`}
      title="Kopiér tekst"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {label && (copied ? 'Kopieret' : 'Kopiér tekst')}
    </button>
  )
}

const STYLE_LABELS = ['Direkte', 'Mere energisk', 'Salgsfokuseret'] as const
const CARD_COLORS  = [
  'border-blue-500/30 bg-blue-950/15',
  'border-violet-500/30 bg-violet-950/15',
  'border-emerald-500/30 bg-emerald-950/15',
] as const
const BADGE_COLORS = [
  'bg-blue-900/40 text-blue-300 border-blue-500/30',
  'bg-violet-900/40 text-violet-300 border-violet-500/30',
  'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
] as const

function SuggestionCard({ s, index, onReset }: { s: Suggestion; index: number; onReset: () => void }) {
  const full = `${s.title}\n\n${s.description}`
  const [usedThis, setUsedThis] = useState(false)

  return (
    <div className={`rounded-2xl border ${CARD_COLORS[index]} p-5 space-y-4`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Forslag {index + 1}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${BADGE_COLORS[index]}`}>
            {STYLE_LABELS[index]}
          </span>
        </div>
        <CopyButton text={full} label />
      </div>

      {/* Title */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Titel</p>
        <div className="flex items-start gap-2">
          <p className="flex-1 text-slate-100 font-semibold text-sm leading-snug bg-slate-800/80 rounded-xl px-3 py-2.5">
            {s.title}
          </p>
          <CopyButton text={s.title} />
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Opslag</p>
        <div className="flex items-start gap-2">
          <p className="flex-1 text-slate-200 text-sm leading-relaxed bg-slate-800/80 rounded-xl px-3 py-2.5 whitespace-pre-line">
            {s.description}
          </p>
          <CopyButton text={s.description} />
        </div>
      </div>

      {/* Use this */}
      <button
        onClick={() => { navigator.clipboard.writeText(full); setUsedThis(true) }}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
          usedThis
            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
        }`}
      >
        {usedThis ? <><Check size={12} /> Kopieret til udklipsholder</> : 'Brug dette opslag'}
      </button>
      <button
        onClick={onReset}
        className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
      >
        Genererér nyt
      </button>
    </div>
  )
}

function ExampleCard({ ex }: { ex: JatakExample }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
      <div className="flex items-center justify-between cursor-pointer gap-2" onClick={() => setOpen(v => !v)}>
        <p className="text-sm text-slate-200 font-medium truncate flex-1">{ex.title}</p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">{ex.jatak_count} ja tak</span>
          <span className="text-xs text-slate-500">{ex.price.toFixed(0)} kr</span>
          {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </div>
      {open && (
        <p className="mt-2 text-xs text-slate-400 leading-relaxed whitespace-pre-line border-t border-slate-700/50 pt-2">
          {ex.description}
        </p>
      )}
    </div>
  )
}

// ── Loading state ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1 py-2">
        <RefreshCw size={13} className="text-violet-400 animate-spin" />
        <span className="text-sm text-violet-300 font-medium">AI er i gang… laver 3 forslag</span>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-700/40 bg-slate-900/30 p-5 space-y-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-16 rounded bg-slate-700" />
            <div className="h-3.5 w-12 rounded bg-slate-700/60" />
          </div>
          <div className="h-4 w-3/4 rounded bg-slate-700/60" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-slate-800" />
            <div className="h-3 w-5/6 rounded bg-slate-800" />
            <div className="h-3 w-4/5 rounded bg-slate-800" />
          </div>
          <div className="h-8 w-full rounded-xl bg-slate-800/60" />
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-900/30 p-8 flex flex-col items-center text-center gap-4">
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/40">
        <Sparkles size={26} className="text-violet-400/60" />
      </div>
      <div>
        <p className="text-slate-300 font-semibold text-sm">Dine AI-forslag vises her</p>
        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
          Udfyld varen og tryk på "Generer opslag"
        </p>
      </div>
      {/* Mock preview */}
      <div className="w-full max-w-xs rounded-xl border border-slate-700/30 bg-slate-800/40 p-3 text-left space-y-2 opacity-40 pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-blue-400/30" />
          <div className="h-3 w-12 rounded bg-blue-400/20" />
        </div>
        <div className="h-4 w-3/4 rounded bg-slate-600/60" />
        <div className="h-3 w-full rounded bg-slate-700/60" />
        <div className="h-3 w-5/6 rounded bg-slate-700/60" />
        <div className="h-3 w-2/3 rounded bg-slate-700/60" />
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AIJatakPage() {
  const [apiKey, setApiKey]         = useState(() => localStorage.getItem(LS_KEY) ?? '')
  const [showKey, setShowKey]       = useState(false)
  const [keyOpen, setKeyOpen]       = useState(!localStorage.getItem(LS_KEY))
  const [category, setCategory]     = useState('')
  const [productName, setProductName] = useState('')
  const [price, setPrice]           = useState('')
  const [extraInfo, setExtraInfo]   = useState('')
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(false)
  const [dragging, setDragging]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (apiKey) { localStorage.setItem(LS_KEY, apiKey); setKeyOpen(false) }
    else localStorage.removeItem(LS_KEY)
  }, [apiKey])

  const { data: cats = [] } = useQuery({
    queryKey: ['ai-categories'],
    queryFn:  fetchAICategories,
    staleTime: Infinity,
  })

  const currentMonth = new Date().getMonth() + 1
  const { data: seasonal = [] } = useQuery({
    queryKey: ['seasonal', currentMonth],
    queryFn:  () => fetchSeasonal(currentMonth),
    staleTime: 600_000,
  })

  useEffect(() => {
    if (cats.length && !category) setCategory(cats[0].category)
  }, [cats, category])

  const mutation = useMutation({ mutationFn: (fd: FormData) => suggestJatak(fd) })

  const handleImage = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }
  const removeImage = () => { setImageFile(null); setImagePreview(null) }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) handleImage(f)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim() || !category || !apiKey) return
    const fd = new FormData()
    fd.append('category', category)
    fd.append('product_name', productName.trim())
    fd.append('api_key', apiKey)
    if (price.trim())     fd.append('price', price.trim())
    if (extraInfo.trim()) fd.append('extra_info', extraInfo.trim())
    if (imageFile)        fd.append('image', imageFile)
    mutation.mutate(fd)
  }

  const handleReset = () => {
    mutation.reset(); setProductName(''); setPrice(''); setExtraInfo(''); removeImage()
  }

  const priceNum      = parseFloat(price.replace(',', '.'))
  const seasonalTop3  = seasonal.slice(0, 3).map(s => s.category)
  const monthName     = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'][currentMonth - 1]

  const scoreChecks = useMemo<ScoreCheck[]>(() => [
    {
      key: 'product', label: 'Produktnavn udfyldt',
      detail: 'Skriv et specifikt navn for bedre forslag',
      ok: productName.trim().length > 2, points: 20,
    },
    {
      key: 'price', label: 'Pris angivet',
      detail: 'Pris synlig i opslaget',
      ok: price.trim().length > 0 && !isNaN(priceNum), points: 25,
    },
    {
      key: 'price_range', label: 'Under 50 kr',
      detail: 'Billige varer konverterer bedst',
      ok: price.trim().length > 0 && !isNaN(priceNum) && priceNum < 50, points: 20,
    },
    {
      key: 'seasonal', label: `God kategori for ${monthName}`,
      detail: seasonalTop3.length ? `Stærke kategorier: ${seasonalTop3.join(', ')}` : 'Henter data…',
      ok: seasonalTop3.includes(category), points: 20,
    },
    {
      key: 'extra', label: 'Ekstra info tilføjet',
      detail: 'Fx mængde, frist eller begrænsning',
      ok: extraInfo.trim().length > 2, points: 15,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [productName, price, priceNum, category, extraInfo, seasonalTop3.join(','), monthName])

  const canSubmit = productName.trim() && category && apiKey && !mutation.isPending

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Hero ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => { window.location.hash = '/butiksunivers' }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={12} /> Brug for inspiration først? Gå til Butiksunivers.
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-1.5">
          Lav et Ja Tak opslag på få sekunder
        </h1>
        <p className="text-sm text-slate-400">
          Skriv varen og prisen. AI laver 3 forslag baseret på hvad der virker.
        </p>
      </div>

      {/* ── API-nøgle (collapsible) ── */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setKeyOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <KeyRound size={14} className={apiKey ? 'text-emerald-400' : 'text-slate-400'} />
            <span className="text-sm font-medium text-slate-300">
              {apiKey ? 'OpenAI API-nøgle tilsluttet' : 'Tilslut OpenAI API-nøgle'}
            </span>
            {apiKey && <span className="text-xs text-emerald-400/70 bg-emerald-900/30 border border-emerald-500/25 px-2 py-0.5 rounded-md">Klar</span>}
            {!apiKey && <span className="text-xs text-amber-400/80 bg-amber-900/20 border border-amber-500/25 px-2 py-0.5 rounded-md">Mangler</span>}
          </div>
          {keyOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </button>
        {keyOpen && (
          <div className="px-5 pb-4 border-t border-slate-700/40 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showKey ? 'Skjul' : 'Vis'}
              </button>
            </div>
            <p className="text-xs text-slate-600">Gemmes kun i din browser. Sendes direkte til OpenAI.</p>
          </div>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">

        {/* ── Left: form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 space-y-5">

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition"
              >
                {cats.map(c => (
                  <option key={c.category} value={c.category}>{c.category}</option>
                ))}
              </select>
            </div>

            {/* Product name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hvad sælger du?</label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="Fx Tulip grillpølser 500g"
                required
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition"
              />
            </div>

            {/* Price + extra */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pris</label>
                <input
                  type="text"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Fx 39,95"
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ekstra info <span className="text-slate-600 normal-case font-normal">(valgfrit)</span></label>
                <input
                  type="text"
                  value={extraInfo}
                  onChange={e => setExtraInfo(e.target.value)}
                  placeholder="Fx max 2 pr. kunde eller afhentning fredag"
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition"
                />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Produktbillede <span className="text-slate-600 normal-case font-normal">(valgfrit)</span>
              </label>
              <p className="text-xs text-slate-500 mb-2">Upload et billede hvis du vil hjælpe AI med at forstå varen.</p>
              {imagePreview ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-slate-700" />
                    <button type="button" onClick={removeImage} className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 hover:bg-red-400 transition-colors">
                      <X size={11} className="text-white" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{imageFile?.name}</p>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    dragging ? 'border-violet-500 bg-violet-950/20' : 'border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  <Upload size={18} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400">Træk billede hertil eller <span className="text-violet-400">vælg fil</span></p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-base transition-all shadow-lg shadow-violet-900/25 disabled:shadow-none"
          >
            {mutation.isPending ? (
              <><RefreshCw size={15} className="animate-spin" /> AI skriver forslag…</>
            ) : (
              <><Sparkles size={15} /> Generer opslag</>
            )}
          </button>

          {mutation.isError && (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
              {(mutation.error as any)?.response?.data?.detail ?? 'Der opstod en fejl. Kontrollér din API-nøgle og prøv igen.'}
            </div>
          )}

          {/* AI vurdering */}
          <AIVurdering checks={scoreChecks} />
        </form>

        {/* ── Right: results ── */}
        <div className="space-y-4">
          {mutation.isPending ? (
            <LoadingState />
          ) : mutation.data ? (
            <>
              {/* Context banner */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <Sparkles size={12} className="text-violet-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium truncate">{productName}</span>
                {price && <span className="shrink-0 text-xs font-bold text-emerald-400 bg-emerald-900/30 border border-emerald-500/25 px-2 py-0.5 rounded-md">{price} kr</span>}
                {category && <span className="shrink-0 text-xs text-slate-500">{category}</span>}
              </div>

              <div className="space-y-3">
                {mutation.data.suggestions.map((s, i) => (
                  <SuggestionCard key={i} s={s} index={i} onReset={handleReset} />
                ))}
              </div>

              {/* Inspiration toggle */}
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
                <button
                  onClick={() => setShowExamples(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-xs text-slate-400">Inspiration ({mutation.data.examples_used} historiske opslag)</span>
                  {showExamples ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                </button>
                {showExamples && (
                  <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto border-t border-slate-700/40">
                    {mutation.data.examples.map((ex, i) => <ExampleCard key={i} ex={ex} />)}
                  </div>
                )}
              </div>

              {/* Bottom reset CTA */}
              <div className="rounded-2xl border border-slate-700/40 bg-slate-900/30 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Har du flere varer?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Lav et nyt opslag på få sekunder</p>
                </div>
                <button
                  onClick={handleReset}
                  className="shrink-0 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  <RefreshCw size={12} />
                  Lav et nyt opslag
                </button>
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}
