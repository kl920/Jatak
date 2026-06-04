# 06 – Node Dependencies

## package.json

### Runtime dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `react-router-dom` | ^6.23.1 | Client-side routing |
| `recharts` | ^2.12.7 | Charting (Bar, Pie, Line, Composed) |
| `axios` | ^1.7.2 | HTTP client (live API calls) |
| `clsx` | ^2.1.1 | Conditional classNames |
| `lucide-react` | ^0.395.0 | SVG icon library |
| `@tanstack/react-query` | ^5.45.0 | Server state management |
| `date-fns` | ^3.6.0 | Date utilities |

### Dev dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/react` | ^18.3.3 | React type definitions |
| `@types/react-dom` | ^18.3.0 | ReactDOM type definitions |
| `@vitejs/plugin-react` | ^4.3.1 | React Fast Refresh for Vite |
| `autoprefixer` | ^10.4.19 | CSS vendor prefixing |
| `postcss` | ^8.4.39 | CSS processing pipeline |
| `tailwindcss` | ^3.4.4 | Utility-first CSS framework |
| `typescript` | ^5.4.5 | TypeScript compiler |
| `vite` | ^5.3.1 | Build tool + dev server |

### Potentially unused

| Package | Evidence |
|---------|----------|
| `date-fns` | Imported in `package.json` but no usage found in source files. Week number calculation in `DashboardPage.tsx` uses manual math instead of `date-fns`. |

### Missing (good to have)

| Package | Why |
|---------|-----|
| `vitest` or `jest` | No test framework at all |
| `eslint` + `@typescript-eslint/*` | No linter configured |
| `prettier` | No formatter configured |

## Bundle size notes

| Package | Approximate size |
|---------|-----------------|
| `recharts` | ~300 KB min+gzip (largest dependency) |
| `axios` | ~14 KB min+gzip |
| `lucide-react` | Tree-shakes — only imported icons |
| `date-fns` | Tree-shakes — but currently unused |

## Recommendation

- Remove `date-fns` (unused)
- Add linting and test tooling for quality assurance
