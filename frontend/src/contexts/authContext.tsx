import { createContext, useState, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { loginUser, type LoginCredentials } from '../api'

const USE_COOKIE_AUTH = (import.meta.env.VITE_COOKIE_AUTH ?? 'false').toLowerCase() === 'true'

type AuthContextType = { token: string | null; login: (c: LoginCredentials) => Promise<void>; logout: () => void; isLoading: boolean }
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => USE_COOKIE_AUTH ? null : localStorage.getItem('planify_token'))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!USE_COOKIE_AUTH) {
      if (token) localStorage.setItem('planify_token', token)
      else localStorage.removeItem('planify_token')
    }
  }, [token])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const { token } = await loginUser(credentials)
      setToken(token || null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('planify_token')
  }

  return <AuthContext.Provider value={{ token, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}