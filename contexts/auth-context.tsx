"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { loginAction, signupAction, logoutAction, getCurrentUserAction, updateUserAction } from "@/app/actions/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (
    name: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    const currentUser = await getCurrentUserAction()
    setUser(currentUser)
  }

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const result = await loginAction(email, password)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return { success: result.success, error: result.error }
  }

  const signup = async (name: string, email: string, phone: string, password: string) => {
    const result = await signupAction(name, email, phone, password)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return { success: result.success, error: result.error }
  }

  const logout = async () => {
    await logoutAction()
    setUser(null)
  }

  const updateUser = async (updates: Partial<User>) => {
    const result = await updateUserAction({
      name: updates.name,
      phone: updates.phone,
      emailNotificationsEnabled: updates.emailNotificationsEnabled,
      phoneNotificationsEnabled: updates.phoneNotificationsEnabled,
      whatsappNotificationsEnabled: updates.whatsappNotificationsEnabled,
    })
    if (result.success && result.user) {
      setUser(result.user)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
