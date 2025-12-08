import type { User, Vehicle } from "./types"
import { generateRandomHealth } from "./vehicle-health"

const USERS_KEY = "vehicle_app_users"
const CURRENT_USER_KEY = "vehicle_app_current_user"
const VEHICLES_KEY = "vehicle_app_vehicles"

// User functions
export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(USERS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveUser(user: User): void {
  const users = getUsers()
  const existingIndex = users.findIndex((u) => u.id === user.id)
  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem(CURRENT_USER_KEY)
  return data ? JSON.parse(data) : null
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(CURRENT_USER_KEY)
  }
}

export function updateCurrentUser(updates: Partial<User>): User | null {
  const user = getCurrentUser()
  if (!user) return null
  const updatedUser = { ...user, ...updates }
  saveUser(updatedUser)
  setCurrentUser(updatedUser)
  return updatedUser
}

// Vehicle functions
export function getVehicles(): Vehicle[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(VEHICLES_KEY)
  return data ? JSON.parse(data) : []
}

export function getUserVehicles(userId: string): Vehicle[] {
  return getVehicles().filter((v) => v.userId === userId)
}

export function saveVehicle(vehicle: Vehicle): void {
  const vehicles = getVehicles()
  const existingIndex = vehicles.findIndex((v) => v.id === vehicle.id)
  if (existingIndex >= 0) {
    vehicles[existingIndex] = vehicle
  } else {
    vehicles.push(vehicle)
  }
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles))
}

export function deleteVehicle(vehicleId: string): void {
  const vehicles = getVehicles().filter((v) => v.id !== vehicleId)
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles))
}

export function generateUniqueCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function regenerateVehicleCode(vehicleId: string): string {
  const vehicles = getVehicles()
  const vehicle = vehicles.find((v) => v.id === vehicleId)
  if (!vehicle) return ""
  const newCode = generateUniqueCode()
  vehicle.uniqueCode = newCode
  vehicle.health = generateRandomHealth()
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles))
  return newCode
}
