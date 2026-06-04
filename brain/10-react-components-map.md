# 10 – React Components Map

## Component tree

```
<React.StrictMode>
  <QueryClientProvider>
    <BrowserRouter basename="/Jatak/">
      <App>
        <PasswordGate>           (only when VITE_STATIC=true)
          <Shell>
            <FilterProvider>
              <div.flex>
                <Sidebar />
                <div.main>
                  <header>
                    <GlobalFilter />
                  </header>
                  <main>
                    <Routes>
                      / → <DashboardPage />
                      /kategorier → <CategoriesPage />
                      /butiksudvikling → <ChurnPage />
                      /butiksunivers → <ButiksuniversPage />
                      /ai-jatak → <AIJatakPage />
                    </Routes>
                  </main>
                </div>
              </div>
            </FilterProvider>
          </Shell>
        </PasswordGate>
      </App>
    </BrowserRouter>
  </QueryClientProvider>
</React.StrictMode>
```

## Components by file

### Layout components

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| `Sidebar` | `components/layout/Sidebar.tsx` | ~65 | Fixed left nav with 5 links, grouped (Analyse / Butikværktøjer) |
| `GlobalFilter` | `components/layout/GlobalFilter.tsx` | ~100 | Year tabs, store dropdown, date pickers, reset button |
| `PasswordGate` | `components/PasswordGate.tsx` | ~65 | Client-side login form (sessionStorage) |

### Page components

| Component | File | Lines | Internal components |
|-----------|------|-------|-------------------|
| `DashboardPage` | `pages/DashboardPage.tsx` | ~230 | `StatCard`, `CustomLabel`, `LoadingState`, `ErrorState` |
| `CategoriesPage` | `pages/CategoriesPage.tsx` | ~265 | `HBar`, `Spinner`, `Empty` |
| `ChurnPage` | `pages/ChurnPage.tsx` | ~500 | `KpiCard`, `StoreTable`, `ChainRow`, `Spinner` |
| `ButiksuniversPage` | `pages/ButiksuniversPage.tsx` | ~600 | `CopyBtn`, `SectionHeader`, `AICTAStrip`, `InsightCard`, `InsightsGrid`, `MonthPicker`, `SeasonalCard`, `SeasonalPanel`, `TitleRow`, `TopTitlesPanel`, `SearchResultCard`, `SearchPanel`, `BestPractices` |
| `AIJatakPage` | `pages/AIJatakPage.tsx` | ~570 | `AIVurdering`, `CopyButton`, `SuggestionCard`, `ExampleCard`, `LoadingState`, `EmptyState` |

### Shared patterns

- **No shared chart components** — `charts/` directory exists but is empty
- **No shared card/layout components** — each page defines its own cards inline
- **Copy button** duplicated: `CopyBtn` in ButiksuniversPage, `CopyButton` in AIJatakPage

## Data flow per page

| Page | Queries | Filter-aware? |
|------|---------|---------------|
| DashboardPage | `fetchKPISummary`, `fetchWeeklyTrend` | Yes (store, dates) |
| CategoriesPage | `fetchCategoryPerf`, `fetchPricePoints` | Yes (store, dates) |
| ChurnPage | `fetchChurnSummary`, `fetchChurnStores`, `fetchStoreRanking` (×2) | Partial (ranking uses dates, churn is fixed) |
| ButiksuniversPage | `fetchInspirationTips`, `fetchInspirationCategories`, `fetchTopTitles`, `fetchSeasonal`, `searchOffers` | No |
| AIJatakPage | `fetchAICategories`, `fetchSeasonal`, `suggestJatak` (mutation) | No |
