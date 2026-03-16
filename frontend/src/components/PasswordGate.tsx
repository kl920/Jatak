import { useState, FormEvent } from 'react'

const EXPECTED_USER = 'Coop'
const EXPECTED_PASS = 'Jatak12+'

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('jatak_auth') === '1'
  )
  const [error, setError] = useState(false)

  if (authed) return <>{children}</>

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const user = (fd.get('user') as string).trim()
    const pass = fd.get('pass') as string
    if (user === EXPECTED_USER && pass === EXPECTED_PASS) {
      sessionStorage.setItem('jatak_auth', '1')
      setAuthed(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-80 space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-100">Jatakportalen</h1>
          <p className="text-xs text-slate-500 mt-1">Log ind for at se dashboardet</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Brugernavn</label>
          <input
            name="user"
            autoFocus
            autoComplete="username"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Adgangskode</label>
          <input
            name="pass"
            type="password"
            autoComplete="current-password"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-xs text-red-400">Forkert brugernavn eller adgangskode</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          Log ind
        </button>
      </form>
    </div>
  )
}
