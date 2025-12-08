import { NextRequest } from "next/server"
import Groq from "groq-sdk"
import { cookies } from "next/headers"
import { getUserVehicles } from "@/lib/vehicles-db"
import { getServiceCentersData } from "@/lib/service-centers"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const SESSION_COOKIE = "vehicle_app_session"

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value || null
}

function formatVehicleData(vehicle: any) {
  const health = vehicle.health || {}
  const telemetry = health.telemetry || {}
  const condition = health.condition || {}

  return {
    id: vehicle.id,
    type: vehicle.type,
    model: vehicle.model,
    vin: vehicle.vin,
    registrationNumber: vehicle.registrationNumber,
    uniqueCode: vehicle.uniqueCode,
    status: vehicle.status || "off",
    location: {
      city: health.location || "Unknown",
      lat: vehicle.lat,
      lng: vehicle.lng,
      label: vehicle.label,
    },
    health: {
      overall: condition.overall || "unknown",
      problematicMetrics: condition.problematicMetrics || [],
      engineTemperature: health.engineTemperature,
      batteryLevel: health.batteryLevel,
      tirePressure: health.tirePressure,
      fuelLevel: health.fuelLevel,
      mileage: health.mileage,
      isActive: health.isActive,
    },
    telemetry: telemetry,
  }
}

function formatServicesData(cityData: any, vehicleLocation: { lat: number; lng: number } | null) {
  if (!cityData) return null

  // Calculate distances if vehicle location is available
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const formatDistance = (distance: number): string => {
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  let serviceCenters = cityData.service_centers?.slice(0, 10) || []
  let garages = cityData.garages?.slice(0, 10) || []
  let fuelStations = cityData.fuel_stations?.slice(0, 10) || []

  // Sort by distance if vehicle location is available
  if (vehicleLocation) {
    const sortByDistance = <T extends { lat: number; lng: number }>(items: T[]): T[] => {
      return [...items].sort((a, b) => {
        const distA = calculateDistance(vehicleLocation.lat, vehicleLocation.lng, a.lat, a.lng)
        const distB = calculateDistance(vehicleLocation.lat, vehicleLocation.lng, b.lat, b.lng)
        return distA - distB
      })
    }

    serviceCenters = sortByDistance(serviceCenters)
    garages = sortByDistance(garages)
    fuelStations = sortByDistance(fuelStations)
  }

  return {
    city: cityData.city,
    serviceCenters: serviceCenters.map((sc: any) => ({
      name: sc.name,
      lat: sc.lat,
      lng: sc.lng,
      distance: vehicleLocation ? formatDistance(calculateDistance(vehicleLocation.lat, vehicleLocation.lng, sc.lat, sc.lng)) : null,
    })),
    garages: garages.map((g: any) => ({
      name: g.name,
      lat: g.lat,
      lng: g.lng,
      distance: vehicleLocation ? formatDistance(calculateDistance(vehicleLocation.lat, vehicleLocation.lng, g.lat, g.lng)) : null,
    })),
    fuelStations: fuelStations.map((fs: any) => ({
      name: fs.name,
      lat: fs.lat,
      lng: fs.lng,
      fuels: fs.fuels || {},
      distance: vehicleLocation ? formatDistance(calculateDistance(vehicleLocation.lat, vehicleLocation.lng, fs.lat, fs.lng)) : null,
    })),
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const body = await request.json()
    const { vehicleId, messages } = body

    if (!vehicleId) {
      return new Response(JSON.stringify({ error: "Vehicle ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch vehicle data
    const vehicles = await getUserVehicles(userId)
    const vehicle = vehicles.find((v) => v.id === vehicleId)

    if (!vehicle) {
      return new Response(JSON.stringify({ error: "Vehicle not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch services data for vehicle location
    const citiesData = await getServiceCentersData()
    const vehicleCity = vehicle.health?.location
    const cityData = vehicleCity
      ? citiesData.find((c) => c.city.toLowerCase() === vehicleCity.toLowerCase())
      : null

    const vehicleData = formatVehicleData(vehicle)
    const servicesData = formatServicesData(cityData, vehicle.lat && vehicle.lng ? { lat: Number(vehicle.lat), lng: Number(vehicle.lng) } : null)

    // Build system prompt
    const systemPrompt = `You are a helpful vehicle health and maintenance assistant acting as a help desk. Your role is to:
1. Explain vehicle health situations clearly and in simple terms
2. Suggest practical solutions based on the vehicle's current state
3. Recommend appropriate service centers, garages, or fuel stations when needed
4. Answer questions about vehicle telemetry, health metrics, and maintenance

IMPORTANT: Use emojis appropriately throughout your responses to make them more engaging and friendly. Use emojis like 🚗 🏍️ 🛵 ⚠️ ✅ ❌ 🔧 ⛽ 🔋 🛞 📍 💡 etc. to enhance your explanations. Format your responses using markdown (bold, lists, code blocks when needed).

Current Vehicle Information:
- Type: ${vehicleData.type}
- Model: ${vehicleData.model}
- VIN: ${vehicleData.vin}
- Registration: ${vehicleData.registrationNumber}
- Status: ${vehicleData.status}
- Location: ${vehicleData.location.city}${vehicleData.location.lat && vehicleData.location.lng ? ` (${vehicleData.location.lat}, ${vehicleData.location.lng})` : ""}

Current Vehicle Health:
- Overall Condition: ${vehicleData.health.overall}
- Engine Temperature: ${vehicleData.health.engineTemperature || "N/A"}°C
- Battery Level: ${vehicleData.health.batteryLevel || "N/A"}%
- Tire Pressure: ${vehicleData.health.tirePressure || "N/A"} psi
- Fuel Level: ${vehicleData.health.fuelLevel || "N/A"}%
- Mileage: ${vehicleData.health.mileage || "N/A"} km
- Active: ${vehicleData.health.isActive ? "Yes" : "No"}

${vehicleData.health.problematicMetrics.length > 0 ? `Issues Detected:\n${vehicleData.health.problematicMetrics.map((m: any) => `- ${m.name}: ${m.value}${m.unit} (${m.status})`).join("\n")}` : "No issues detected - vehicle is healthy"}

${vehicleData.telemetry && Object.keys(vehicleData.telemetry).length > 0 ? `Raw Telemetry Data:\n${JSON.stringify(vehicleData.telemetry, null, 2)}` : ""}

${servicesData ? `Available Services in ${servicesData.city}:

Service Centers (${servicesData.serviceCenters.length}):
${servicesData.serviceCenters.map((sc: any, idx: number) => `${idx + 1}. ${sc.name}${sc.distance ? ` - ${sc.distance} away` : ""} (${sc.lat}, ${sc.lng})`).join("\n")}

Garages (${servicesData.garages.length}):
${servicesData.garages.map((g: any, idx: number) => `${idx + 1}. ${g.name}${g.distance ? ` - ${g.distance} away` : ""} (${g.lat}, ${g.lng})`).join("\n")}

Fuel Stations (${servicesData.fuelStations.length}):
${servicesData.fuelStations.map((fs: any, idx: number) => {
  const fuels = []
  if (fs.fuels?.petrol) fuels.push("Petrol")
  if (fs.fuels?.diesel) fuels.push("Diesel")
  if (fs.fuels?.cng) fuels.push("CNG")
  return `${idx + 1}. ${fs.name}${fs.distance ? ` - ${fs.distance} away` : ""}${fuels.length > 0 ? ` - Available: ${fuels.join(", ")}` : ""} (${fs.lat}, ${fs.lng})`
}).join("\n")}

When recommending services, mention specific names and distances when available.` : "No service data available for this location"}

Be conversational, helpful, and provide actionable advice. When suggesting services, mention the type (service center, garage, or fuel station) that would be most appropriate.`

    // Prepare messages for Groq
    const groqMessages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...messages,
    ]

    // Create streaming response
    const stream = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    })

    // Create a readable stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("AI Chat error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

