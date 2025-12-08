"use server"

import { cookies } from "next/headers"
import { createUser, verifyUser, getUserById, updateUser as updateUserDb } from "@/lib/auth"
import type { User } from "@/lib/types"

const SESSION_COOKIE = "vehicle_app_session"

export async function signupAction(
  name: string,
  email: string,
  phone: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const result = await createUser(name, email, phone, password)

  if (result.success && result.user) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, result.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  }

  return result
}

export async function loginAction(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  const result = await verifyUser(email, password)

  if (result.success && result.user) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, result.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  }

  return result
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUserAction(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionId) return null

  return getUserById(sessionId)
}

export async function updateUserAction(updates: { name?: string; phone?: string }): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionId) {
    return { success: false, error: "Not authenticated" }
  }

  const user = await updateUserDb(sessionId, updates)

  if (!user) {
    return { success: false, error: "Failed to update user" }
  }

  return { success: true, user }
}
