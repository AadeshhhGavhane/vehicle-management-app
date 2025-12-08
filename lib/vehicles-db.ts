import { sql } from "./db"
import type { Vehicle, VehicleHealth } from "./types"
import { generateRandomHealth } from "./vehicle-health"

function generateUniqueCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function mapRowToVehicle(row: any): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    model: row.model,
    vin: row.vin,
    registrationNumber: row.registration_number,
    uniqueCode: row.unique_code,
    createdAt: row.created_at,
    health: row.health as VehicleHealth,
  }
}

export async function createVehicle(
  userId: string,
  type: "car" | "bike" | "scooter",
  model: string,
  vin: string,
  registrationNumber: string,
): Promise<{ success: boolean; vehicle?: Vehicle; error?: string }> {
  try {
    const uniqueCode = generateUniqueCode()
    const health = generateRandomHealth()

    const result = await sql`
      INSERT INTO vehicles (user_id, type, model, vin, registration_number, unique_code, health)
      VALUES (${userId}, ${type}, ${model}, ${vin}, ${registrationNumber}, ${uniqueCode}, ${JSON.stringify(health)})
      RETURNING *
    `

    return { success: true, vehicle: mapRowToVehicle(result[0]) }
  } catch (error) {
    console.error("Error creating vehicle:", error)
    return { success: false, error: "Failed to create vehicle" }
  }
}

export async function getUserVehicles(userId: string): Promise<Vehicle[]> {
  try {
    const result = await sql`
      SELECT * FROM vehicles
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return result.map(mapRowToVehicle)
  } catch (error) {
    console.error("Error getting vehicles:", error)
    return []
  }
}

export async function deleteVehicle(vehicleId: string, userId: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM vehicles
      WHERE id = ${vehicleId} AND user_id = ${userId}
      RETURNING id
    `
    return result.length > 0
  } catch (error) {
    console.error("Error deleting vehicle:", error)
    return false
  }
}

export async function regenerateVehicleCode(
  vehicleId: string,
  userId: string,
): Promise<{ success: boolean; newCode?: string; error?: string }> {
  try {
    const newCode = generateUniqueCode()
    const newHealth = generateRandomHealth()

    const result = await sql`
      UPDATE vehicles
      SET unique_code = ${newCode}, health = ${JSON.stringify(newHealth)}, updated_at = NOW()
      WHERE id = ${vehicleId} AND user_id = ${userId}
      RETURNING unique_code
    `

    if (result.length === 0) {
      return { success: false, error: "Vehicle not found" }
    }

    return { success: true, newCode: result[0].unique_code }
  } catch (error) {
    console.error("Error regenerating code:", error)
    return { success: false, error: "Failed to regenerate code" }
  }
}
