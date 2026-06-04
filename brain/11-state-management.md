# 11 – State Management

## Approach

Minimal state management. Three concerns:

1. **Server state** — TanStack React Query
2. **Global UI state** — React Context (FilterContext)
3. **Local UI state** — `useState` per component

## 1. Server state (React Query)

All API data is managed by `@tanstack/react-query`:

```tsx
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
})
```

- **staleTime:** 5 minutes (data refetches after 5 min on window focus)
- **retry:** 1 (one retry on failure, then error state)
- **cacheTime:** default (5 min garbage collection)
- No global `onError` handler
- No devtools enabled

## 2. Global filter state (FilterContext)

Single context providing store and date range filters:

```tsx
// FilterContext.tsx
interface Filters {
  store?: string
  date_from?: string   // YYYY-MM-DD
  date_to?: string     // YYYY-MM-DD
}

const [filters, setFilters] = useState<Filters>({})
```

Used by: `GlobalFilter` (writes), `DashboardPage`, `CategoriesPage`, `ChurnPage` (reads)

Not used by: `ButiksuniversPage`, `AIJatakPage`

## 3. Local state examples

| Component | State | Purpose |
|-----------|-------|---------|
| `ChurnPage` | `openChain` | Which chain accordion is expanded |
| `ButiksuniversPage > TopTitlesPanel` | `selectedCat` | Current category tab |
| `ButiksuniversPage > SeasonalPanel` | `month` | Selected month for seasonal data |
| `ButiksuniversPage > SearchPanel` | `query` | Search input text |
| `AIJatakPage` | `apiKey`, `category`, `productName`, `price`, `extraInfo`, `imageFile` | Form state |
| `AIJatakPage` | `keyOpen`, `showKey`, `showExamples`, `dragging` | UI toggles |
| `PasswordGate` | `authed`, `error` | Login state (persisted in `sessionStorage`) |
| `AIJatakPage` | `apiKey` | OpenAI key (persisted in `localStorage`) |

## Persistence

| Data | Storage | Scope |
|------|---------|-------|
| Authentication state | `sessionStorage['jatak_auth']` | Current tab only |
| OpenAI API key | `localStorage['jatak_openai_key']` | Permanent per browser |
| Filters | In-memory only | Lost on page refresh |

## No external state library

No Redux, Zustand, MobX, Jotai, or Recoil. React Query + Context + local state covers everything.
