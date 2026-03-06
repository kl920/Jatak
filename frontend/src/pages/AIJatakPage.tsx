import { useState, useEffect, useRef, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Sparkles, Copy, Check, Upload, X, ChevronDown, ChevronUp,
  KeyRound, Lightbulb, RefreshCw, ShieldCheck
} from 'lucide-react'
import { fetchAICategories, fetchSeasonal, suggestJatak, type Suggestion, type JatakExample } from '../api/client'

const LS_KEY = 'jatak_openai_key'

// ── Post Score ────────────────────────────────────────────────────────────────

interface ScoreCheck {
  key:     string
  label:   string
  detail:  string
  ok:      boolean
  points:  number
}

function PostScore({ checks }: { checks: ScoreCheck[] }) {
  const total   = checks.reduce((s, c) => s + c.points, 0)
  const earned  = checks.filter(c => c.ok).reduce((s, c) => s + c.points, 0)
  const pct     = Math.round(earned / total * 100)

  const color = pct >= 80
    ? { ring: 'border-emerald-500/60', bar: 'bg-emerald-500', label: 'text-emerald-400', badge: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/40', text: 'Klar til opslag!' }
    : pct >= 50
      ? { ring: 'border-amber-500/60',   bar: 'bg-amber-400',   label: 'text-amber-400',   badge: 'bg-amber-900/50 text-amber-300 border-amber-500/40',   text: 'God start...' }
      : { ring: 'border-red-500/40',     bar: 'bg-red-500',     label: 'text-red-400',     badge: 'bg-red-900/30 text-red-300 border-red-500/30',         text: 'Mangler info' }

  return (
    <div className={`rounded-2xl border ${color.ring} bg-slate-900/60 p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className={color.label} />
          <span className="text-sm font-bold text-slate-200">Opslag Score</span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${color.badge}`}>
          {pct}% · {color.text}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checks */}
      <div className="space-y-2">
        {checks.map(c => (
          <div key={c.key} className="flex items-start gap-2.5">
            <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
              c.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'
            }`}>
              {c.ok ? '✓' : '·'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold leading-tight ${c.ok ? 'text-slate-200' : 'text-slate-400'}`}>{c.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── small helpers ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
      title="Kopiér"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  )
}

function SuggestionCard({ s, index }: { s: Suggestion; index: number }) {
  const labels = ['Variant A', 'Variant B', 'Variant C']
  const colors = ['border-blue-500/40 bg-blue-950/20', 'border-violet-500/40 bg-violet-950/20', 'border-emerald-500/40 bg-emerald-950/20']
  return (
    <div className={`rounded-2xl border ${colors[index]} p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{labels[index]}</span>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs text-slate-500">Titel</span>
          <CopyButton text={s.title} />
        </div>
        <p className="text-slate-100 font-semibold text-sm leading-snug bg-slate-800 rounded-xl px-3 py-2">
          {s.title}
        </p>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs text-slate-500">Beskrivelse</span>
          <CopyButton text={s.description} />
        </div>
        <p className="text-slate-200 text-sm leading-relaxed bg-slate-800 rounded-xl px-3 py-2 whitespace-pre-line">
          {s.description}
        </p>
      </div>

      {/* Copy all */}
      <button
        onClick={() => navigator.clipboard.writeText(`${s.title}\n\n${s.description}`)}
        className="mt-1 flex items-center gap-2 text-xs text-slate-400 hover:text-slate-100 transition-colors self-start"
      >
        <Copy size={12} />
        Kopiér begge
      </button>
    </div>
  )
}

function ExampleCard({ ex }: { ex: JatakExample }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
      <div
        className="flex items-center justify-between cursor-pointer gap-2"
        onClick={() => setOpen(v => !v)}
      >
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

// ── Main page ────────────────────────────────────────────────────────────────

export default function AIJatakPage() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) ?? '')
  const [showKey, setShowKey] = useState(false)
  const [category, setCategory] = useState('')
  const [productName, setProductName] = useState('')
  const [price, setPrice] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Persist API key
  useEffect(() => {
    if (apiKey) localStorage.setItem(LS_KEY, apiKey)
    else localStorage.removeItem(LS_KEY)
  }, [apiKey])

  // Load categories
  const { data: cats = [] } = useQuery({
    queryKey: ['ai-categories'],
    queryFn: fetchAICategories,
    staleTime: Infinity,
  })

  // Seasonal data for current month (for score)
  const currentMonth = new Date().getMonth() + 1
  const { data: seasonal = [] } = useQuery({
    queryKey: ['seasonal', currentMonth],
    queryFn: () => fetchSeasonal(currentMonth),
    staleTime: 600_000,
  })

  // Auto-select first category once loaded
  useEffect(() => {
    if (cats.length && !category) setCategory(cats[0].category)
  }, [cats, category])

  // Mutation
  const mutation = useMutation({
    mutationFn: (fd: FormData) => suggestJatak(fd),
  })

  const handleImage = (file: File) => {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => { setImageFile(null); setImagePreview(null) }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleImage(f)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName.trim() || !category || !apiKey) return

    const fd = new FormData()
    fd.append('category', category)
    fd.append('product_name', productName.trim())
    fd.append('api_key', apiKey)
    if (price.trim()) fd.append('price', price.trim())
    if (extraInfo.trim()) fd.append('extra_info', extraInfo.trim())
    if (imageFile) fd.append('image', imageFile)

    mutation.mutate(fd)
  }

  const selectedCatInfo = cats.find(c => c.category === category)

  // ── Live score checks ──────────────────────────────────────────────────────
  const priceNum = parseFloat(price.replace(',', '.'))
  const seasonalTop3 = seasonal.slice(0, 3).map(s => s.category)
  const monthName = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'][currentMonth - 1]

  const scoreChecks = useMemo<ScoreCheck[]>(() => [
    {
      key:    'product',
      label:  'Produktnavn udfyldt',
      detail: 'Jo mere specifikt navn, jo bedre AI-forslag',
      ok:     productName.trim().length > 2,
      points: 20,
    },
    {
      key:    'price',
      label:  'Pris er angivet',
      detail: 'Opslag med pris i titlen får +34% flere Ja Tak',
      ok:     price.trim().length > 0 && !isNaN(priceNum),
      points: 25,
    },
    {
      key:    'price_range',
      label:  'Pris under 50 kr',
      detail: 'Varer under 50 kr får i snit 21 ja tak — over 50 kr falder det markant',
      ok:     price.trim().length > 0 && !isNaN(priceNum) && priceNum < 50,
      points: 20,
    },
    {
      key:    'seasonal',
      label:  `God sæsonkategori for ${monthName}`,
      detail: seasonalTop3.length
        ? `Top 3 i ${monthName}: ${seasonalTop3.join(', ')}`
        : `Henter sæsondata…`,
      ok:     seasonalTop3.includes(category),
      points: 20,
    },
    {
      key:    'extra',
      label:  'Ekstra info udfyldt',
      detail: 'Giver AI bedre kontekst — fx mængde, frist, begrænsning',
      ok:     extraInfo.trim().length > 2,
      points: 15,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [productName, price, priceNum, category, extraInfo, seasonalTop3.join(','), monthName])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
          <Sparkles size={22} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">AI Ja Tak Generator</h1>
          <p className="text-sm text-slate-400">
            Generér titre & beskrivelser baseret på top-performende tilbud i samme kategori
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* ── Left: form ── */}
        <div className="space-y-4">

          {/* API Key */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound size={15} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-300">OpenAI API-nøgle</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showKey ? 'Skjul' : 'Vis'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Din nøgle gemmes kun i din browser (localStorage). Den sendes direkte til OpenAI.
            </p>
          </div>

          {/* Product form */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 space-y-4">

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Kategori</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
              >
                {cats.map(c => (
                  <option key={c.category} value={c.category}>
                    {c.category} — {c.example_count.toLocaleString('da')} tilbud (median {c.median_jatak} ja tak)
                  </option>
                ))}
              </select>
            </div>

            {/* Product name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Produkt / tilbud navn *</label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="f.eks. Tulip Pølser 500g"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Price + extra info row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Pris (kr) — valgfri</label>
                <input
                  type="text"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="39,95"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Ekstra info — valgfri</label>
                <input
                  type="text"
                  value={extraInfo}
                  onChange={e => setExtraInfo(e.target.value)}
                  placeholder="Max 2 pr. kunde, frosne"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Produktbillede — valgfri
                <span className="ml-2 text-slate-500 font-normal text-xs">(bruges til at identificere produkt med GPT-4o Vision)</span>
              </label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="preview" className="h-24 w-24 object-cover rounded-xl border border-slate-700" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 hover:bg-red-400 transition-colors"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragging ? 'border-violet-500 bg-violet-950/20' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <Upload size={20} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400">Træk billede hertil eller <span className="text-violet-400 underline">vælg fil</span></p>
                  <p className="text-xs text-slate-600 mt-1">JPG, PNG, WEBP</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])}
                  />
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!productName.trim() || !category || !apiKey || mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Genererer forslag…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generer 3 forslag
                </>
              )}
            </button>

            {mutation.isError && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                {(mutation.error as any)?.response?.data?.detail ?? 'Der opstod en fejl. Kontrollér din API-nøgle og prøv igen.'}
              </div>
            )}
          </form>

          {/* Live score */}
          <PostScore checks={scoreChecks} />
        </div>

        {/* ── Right: results ── */}
        <div className="space-y-4">
          {mutation.data ? (
            <>
              {/* Suggestions */}
              <div className="space-y-3">
                {mutation.data.suggestions.map((s, i) => (
                  <SuggestionCard key={i} s={s} index={i} />
                ))}
              </div>

              {/* Inspiration examples toggle */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
                <button
                  onClick={() => setShowExamples(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb size={15} className="text-amber-400" />
                    <span className="text-sm font-semibold text-slate-300">
                      Inspiration brugt ({mutation.data.examples_used} tilbud)
                    </span>
                  </div>
                  {showExamples ? (
                    <ChevronUp size={15} className="text-slate-500" />
                  ) : (
                    <ChevronDown size={15} className="text-slate-500" />
                  )}
                </button>
                {showExamples && (
                  <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
                    {mutation.data.examples.map((ex, i) => (
                      <ExampleCard key={i} ex={ex} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="h-full min-h-64 rounded-2xl border border-slate-700/40 bg-slate-900/30 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/40">
                <Sparkles size={28} className="text-slate-500" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Ingen forslag endnu</p>
                <p className="text-slate-600 text-sm mt-1">
                  Udfyld formularen og tryk "Generer 3 forslag"
                </p>
              </div>
              {selectedCatInfo && (
                <div className="mt-2 text-xs text-slate-600">
                  <span className="text-slate-500">{selectedCatInfo.category}</span>:{' '}
                  {selectedCatInfo.example_count.toLocaleString('da')} tilbud tilgængelige som eksempler
                  {' '}(median {selectedCatInfo.median_jatak} ja tak)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
