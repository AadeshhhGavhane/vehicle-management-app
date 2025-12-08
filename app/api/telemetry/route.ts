import { sql } from "@/lib/db"
import { evaluateVehicleCondition } from "@/lib/vehicle-health"
import type { VehicleHealth } from "@/lib/types"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    const { code, status, lat, lng, label, ...healthMetrics } = payload

    if (!code) {
      return NextResponse.json({ success: false, error: "Vehicle code is required" }, { status: 400 })
    }

    // Check if vehicle exists
    const existingVehicle = await sql`
      SELECT id, type, health FROM vehicles WHERE unique_code = ${code}
    `

    if (existingVehicle.length === 0) {
      return NextResponse.json({ success: false, error: "Vehicle not found with code: " + code }, { status: 404 })
    }

    const vehicle = existingVehicle[0]

    // Merge existing health with new telemetry health metrics
    const existingHealth = vehicle.health || {}
    const mappedTirePressure =
      healthMetrics.tyreHealth === undefined
        ? existingHealth.tirePressure
        : 30 + (Math.min(Math.max(healthMetrics.tyreHealth, 0), 100) / 100) * 5

    const updatedHealth: VehicleHealth = {
      ...existingHealth,
      ...healthMetrics,
      // Map new telemetry fields to existing health structure
      batteryLevel: healthMetrics.batteryHealth ?? existingHealth.batteryLevel,
      tirePressure: mappedTirePressure ?? 35,
      fuelLevel:
        healthMetrics.carFuelLevelPercent ??
        healthMetrics.bikeFuelLevelPercent ??
        healthMetrics.scooterFuelLevelPercent ??
        existingHealth.fuelLevel,
      engineTemperature: healthMetrics.carEngineTempC ?? existingHealth.engineTemperature,
      mileage: healthMetrics.odometerKm ?? existingHealth.mileage,
      isActive: status === "on",
      location: label || existingHealth.location,
      // Store all raw telemetry metrics
      telemetry: healthMetrics,
    }

    // Remove non-mock fields if not provided
    if (healthMetrics.oilPressure === undefined) {
      delete (updatedHealth as any).oilPressure
    }
    if (healthMetrics.lastServiceDate === undefined) {
      delete (updatedHealth as any).lastServiceDate
    }

    const condition = evaluateVehicleCondition(updatedHealth)
    const healthWithCondition = { ...updatedHealth, condition }

    // Update vehicle with telemetry data
    const result = await sql`
      UPDATE vehicles
      SET 
        status = ${status || "off"},
        lat = ${lat || null},
        lng = ${lng || null},
        label = ${label || null},
        health = ${JSON.stringify(healthWithCondition)},
        last_telemetry_at = NOW(),
        updated_at = NOW()
      WHERE unique_code = ${code}
      RETURNING id, unique_code, type, status, lat, lng, label, health, last_telemetry_at
    `

    return NextResponse.json({
      success: true,
      message: "Telemetry received successfully",
      vehicle: {
        id: result[0].id,
        code: result[0].unique_code,
        type: result[0].type,
        status: result[0].status,
        lat: result[0].lat,
        lng: result[0].lng,
        label: result[0].label,
        health: result[0].health,
        lastTelemetryAt: result[0].last_telemetry_at,
      },
    })
  } catch (error) {
    console.error("Telemetry error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process telemetry: " + String(error) },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")

    if (!code) {
      return NextResponse.json({ success: false, error: "Vehicle code is required" }, { status: 400 })
    }

    const result = await sql`
      SELECT id, unique_code, type, status, lat, lng, label, health, last_telemetry_at
      FROM vehicles
      WHERE unique_code = ${code}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Vehicle not found with code: " + code }, { status: 404 })
    }

    const vehicle = result[0]
    const telemetry = vehicle.health?.telemetry || {}

    const condition =
      vehicle.health?.condition || evaluateVehicleCondition((vehicle.health || {}) as VehicleHealth)

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        code: vehicle.unique_code,
        type: vehicle.type,
        status: vehicle.status,
        lat: vehicle.lat,
        lng: vehicle.lng,
        label: vehicle.label,
        telemetry,
        condition,
        lastTelemetryAt: vehicle.last_telemetry_at,
      },
    })
  } catch (error) {
    console.error("Telemetry fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch telemetry: " + String(error) },
      { status: 500 },
    )
  }
}
