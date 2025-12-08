import { sql } from "@/lib/db"
import { evaluateVehicleCondition } from "@/lib/vehicle-health"
import type { VehicleHealth } from "@/lib/types"
import { type NextRequest, NextResponse } from "next/server"
import { broadcastUpdate } from "./stream/route"
import { TelemetryEmailTemplate } from "@/components/telemetry-email-template"
import { Resend } from "resend"
import { render } from "@react-email/render"
import twilio from "twilio"

const resend = new Resend(process.env.RESEND_API_KEY)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// Helper function to format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "")
  // If it's a 10-digit Indian number, add +91 prefix
  if (digits.length === 10) {
    return `+91${digits}`
  }
  // If it already starts with +, return as is
  if (phone.startsWith("+")) {
    return phone
  }
  // Otherwise return with + prefix
  return `+${digits}`
}

// Escape XML special characters for TwiML
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// Generate TwiML message for vehicle issues
function generateTwiMLMessage(
  vehicleName: string,
  vehicleType: string,
  condition: string,
  issues: Array<{ name: string; value: number; unit: string }>,
): string {
  let message = `Your vehicle ${vehicleName}, a ${vehicleType}, has ${condition === "bad" ? "critical" : "warning"} issues. `
  
  if (issues.length > 0) {
    message += "Issues detected: "
    const issueList = issues.slice(0, 3).map((issue) => {
      return `${issue.name} is ${issue.value}${issue.unit}`
    }).join(", ")
    message += issueList
    if (issues.length > 3) {
      message += ` and ${issues.length - 3} more issue${issues.length - 3 > 1 ? "s" : ""}`
    }
    message += ". "
  }
  
  message += "Please take immediate action. Visit your dashboard for more details. Thank you."
  
  return escapeXml(message)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    const { code, status, lat, lng, label, ...healthMetrics } = payload

    if (!code) {
      return NextResponse.json({ success: false, error: "Vehicle code is required" }, { status: 400 })
    }

    // Check if vehicle exists
    const existingVehicle = await sql`
      SELECT id, type, health, user_id, model FROM vehicles WHERE unique_code = ${code}
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

    // Determine engine temperature based on vehicle type
    let engineTemp: number | undefined
    if (vehicle.type === "car") {
      engineTemp = healthMetrics.carEngineTempC ?? existingHealth.engineTemperature
    } else if (vehicle.type === "bike") {
      engineTemp = healthMetrics.bikeEngineTempC ?? existingHealth.engineTemperature ?? 70
    } else if (vehicle.type === "scooter") {
      engineTemp = healthMetrics.scooterEngineTempC ?? existingHealth.engineTemperature ?? 70
    }

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
      engineTemperature: engineTemp,
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

    // Insert into telemetry_logs for history
    await sql`
      INSERT INTO telemetry_logs (vehicle_id, status, lat, lng, label, health_data)
      VALUES (${result[0].id}, ${status || "off"}, ${lat || null}, ${lng || null}, ${label || null}, ${JSON.stringify(healthWithCondition)})
    `

    const updatedVehicle = {
      id: result[0].id,
      code: result[0].unique_code,
      type: result[0].type,
      status: result[0].status,
      lat: result[0].lat,
      lng: result[0].lng,
      label: result[0].label,
      health: result[0].health,
      lastTelemetryAt: result[0].last_telemetry_at,
    }

    // Broadcast update to all connected SSE clients
    broadcastUpdate({
      type: "vehicle_updated",
      vehicle: updatedVehicle,
    })

    // Send email and phone notifications if enabled
    try {
      const vehicle = existingVehicle[0]
      const user = await sql`
        SELECT id, name, email, phone, email_notifications_enabled, phone_notifications_enabled
        FROM users
        WHERE id = ${vehicle.user_id}
      `

      if (user.length > 0) {
        const userData = user[0]
        const conditionOverall = condition.overall || "unknown"
        const vehicleName = vehicle.model || `${vehicle.type}`
        const location = label || updatedHealth.location || "Unknown"
        const issues = condition.problematicMetrics || []

        // Send email notification if enabled
        if (userData.email_notifications_enabled && userData.email) {
          try {
            const emailHtml = await render(
              TelemetryEmailTemplate({
                vehicleName,
                vehicleType: vehicle.type,
                condition: conditionOverall,
                location,
                issues,
              }),
            )

            await resend.emails.send({
              from: "VehicleHub <onboarding@resend.dev>",
              to: [userData.email],
              subject: `Vehicle Telemetry Update: ${vehicleName} - ${conditionOverall.toUpperCase()}`,
              html: emailHtml,
            })
          } catch (emailError) {
            console.error("Failed to send telemetry email notification:", emailError)
          }
        }

        // Send phone call notification if enabled and condition is warning or bad
        if (
          userData.phone_notifications_enabled &&
          userData.phone &&
          (conditionOverall === "warning" || conditionOverall === "bad") &&
          twilioClient &&
          process.env.TWILIO_FROM_NUMBER
        ) {
          try {
            const twimlMessage = generateTwiMLMessage(vehicleName, vehicle.type, conditionOverall, issues)
            const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${twimlMessage}</Say></Response>`

            const formattedPhone = formatPhoneNumber(userData.phone)
            await twilioClient.calls.create({
              to: formattedPhone,
              from: process.env.TWILIO_FROM_NUMBER,
              twiml: twiml,
            })
          } catch (callError) {
            console.error("Failed to send telemetry phone call notification:", callError)
          }
        }
      }
    } catch (notificationError) {
      // Don't fail the telemetry request if notifications fail
      console.error("Failed to send telemetry notifications:", notificationError)
    }

    return NextResponse.json({
      success: true,
      message: "Telemetry received successfully",
      vehicle: updatedVehicle,
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
