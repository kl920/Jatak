import { createContext, useContext, useState, ReactNode } from 'react'
import type { Filters } from '../api/client'

interface FilterCtx {
  filters:    Filters
  setFilters: (f: Filters) => void
}

const Ctx = createContext<FilterCtx>({
  filters:    {},
  setFilters: () => {},
})

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>({})
  return <Ctx.Provider value={{ filters, setFilters }}>{children}</Ctx.Provider>
}

export const useFilters = () => useContext(Ctx)
