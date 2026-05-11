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
  // Default: 6 months back (Coop's inactive store definition)
  const getDefaultDates = () => {
    const today = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(today.getMonth() - 6)
    
    return {
      date_from: sixMonthsAgo.toISOString().split('T')[0],
      date_to:   today.toISOString().split('T')[0]
    }
  }

  const [filters, setFilters] = useState<Filters>(getDefaultDates())
  return <Ctx.Provider value={{ filters, setFilters }}>{children}</Ctx.Provider>
}

export const useFilters = () => useContext(Ctx)
