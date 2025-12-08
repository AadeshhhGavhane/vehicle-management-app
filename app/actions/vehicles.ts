"use server"

import { cookies } from "next/headers"
import {
  createVehicle as createVehicleDb,
  getUserVehicles as getUserVehiclesDb,
  deleteVehicle as deleteVehicleDb,
  regenerateVehicleCode as regenerateVehicleCodeDb,
} from "@/lib/vehicles-db"
import type { Vehicle } from "@/lib/types"

const SESSION_COOKIE = "vehicle_app_session"

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value || null
}

export async function createVehicleAction(
  type: "car" | "bike" | "scooter",
  model: string,
  vin: string,
  registrationNumber: string,
): Promise<{ success: boolean; vehicle?: Vehicle; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  return createVehicleDb(userId, type, model, vin, registrationNumber)
}

export async function getVehiclesAction(): Promise<Vehicle[]> {
  const userId = await getCurrentUserId()

  if (!userId) return []

  return getUserVehiclesDb(userId)
}

export async function deleteVehicleAction(vehicleId: string): Promise<boolean> {
  const userId = await getCurrentUserId()

  if (!userId) return false

  return deleteVehicleDb(vehicleId, userId)
}

export async function regenerateVehicleCodeAction(
  vehicleId: string,
): Promise<{ success: boolean; newCode?: string; error?: string }> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { success: false, error: "Not authenticated" }
  }

  return regenerateVehicleCodeDb(vehicleId, userId)
}
