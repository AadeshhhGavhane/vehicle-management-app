import { sql } from "./db"
import type { User } from "./types"
import bcrypt from "bcryptjs"

export async function createUser(
  name: string,
  email: string,
  phone: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email})`
    if (existing.length > 0) {
      return { success: false, error: "Email already registered" }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const result = await sql`
      INSERT INTO users (name, email, phone, password_hash)
      VALUES (${name}, ${email}, ${phone}, ${passwordHash})
      RETURNING id, name, email, phone
    `

    const user: User = {
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      phone: result[0].phone,
      password: "", // Don't return password
    }

    return { success: true, user }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function verifyUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const result = await sql`
      SELECT id, name, email, phone, password_hash
      FROM users
      WHERE LOWER(email) = LOWER(${email})
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    const isValid = await bcrypt.compare(password, result[0].password_hash)
    if (!isValid) {
      return { success: false, error: "Invalid password" }
    }

    const user: User = {
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      phone: result[0].phone,
      password: "",
    }

    return { success: true, user }
  } catch (error) {
    console.error("Error verifying user:", error)
    return { success: false, error: "Failed to verify user" }
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, name, email, phone
      FROM users
      WHERE id = ${id}
    `

    if (result.length === 0) return null

    return {
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      phone: result[0].phone,
      password: "",
    }
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function updateUser(id: string, updates: { name?: string; phone?: string }): Promise<User | null> {
  try {
    const result = await sql`
      UPDATE users
      SET 
        name = COALESCE(${updates.name}, name),
        phone = COALESCE(${updates.phone}, phone),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, phone
    `

    if (result.length === 0) return null

    return {
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      phone: result[0].phone,
      password: "",
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}
