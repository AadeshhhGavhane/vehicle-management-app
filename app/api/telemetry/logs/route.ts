import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const SESSION_COOKIE = "vehicle_app_session"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get(SESSION_COOKIE)?.value

    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const vehicleId = searchParams.get("vehicleId")
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 50
    const offset = (page - 1) * limit

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ["created_at", "model", "label", "status"]
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at"
    const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC"

    // Build queries with proper column mapping
    let logsQuery
    let countQuery

    if (vehicleId) {
      if (sortBy === "created_at") {
        logsQuery = order === "ASC"
          ? sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
            ORDER BY tl.created_at ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `
          : sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
            ORDER BY tl.created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
      } else if (sortBy === "model") {
        logsQuery = order === "ASC"
          ? sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
            ORDER BY v.model ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `
          : sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
            ORDER BY v.model DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
      } else if (sortBy === "label") {
        logsQuery = order === "ASC"
          ? sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
            ORDER BY tl.label ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `
          : sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
            ORDER BY tl.label DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
      } else {
        logsQuery = order === "ASC"
          ? sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
            ORDER BY tl.status ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `
          : sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
            ORDER BY tl.status DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
      }

      countQuery = sql`
        SELECT COUNT(*) as total
        FROM telemetry_logs tl
        INNER JOIN vehicles v ON tl.vehicle_id = v.id
        WHERE v.user_id = ${userId} AND v.id = ${vehicleId}
      `
    } else {
      if (sortBy === "created_at") {
        logsQuery = order === "ASC"
          ? sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId}
            ORDER BY tl.created_at ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `
          : sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId}
            ORDER BY tl.created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
      } else if (sortBy === "model") {
        logsQuery = order === "ASC"
          ? sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId}
            ORDER BY v.model ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `
          : sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId}
            ORDER BY v.model DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
      } else if (sortBy === "label") {
        logsQuery = order === "ASC"
          ? sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId}
            ORDER BY tl.label ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `
          : sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId}
            ORDER BY tl.label DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
      } else {
        logsQuery = order === "ASC"
          ? sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId}
            ORDER BY tl.status ASC
            LIMIT ${limit}
            OFFSET ${offset}
          `
          : sql`
            SELECT 
              tl.id,
              tl.status,
              tl.lat,
              tl.lng,
              tl.label,
              tl.health_data,
              tl.created_at,
              v.id as vehicle_id,
              v.model,
              v.type,
              v.unique_code,
              v.registration_number
            FROM telemetry_logs tl
            INNER JOIN vehicles v ON tl.vehicle_id = v.id
            WHERE v.user_id = ${userId}
            ORDER BY tl.status DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
      }

      countQuery = sql`
        SELECT COUNT(*) as total
        FROM telemetry_logs tl
        INNER JOIN vehicles v ON tl.vehicle_id = v.id
        WHERE v.user_id = ${userId}
      `
    }

    const logs = await logsQuery
    const countResult = await countQuery
    const total = parseInt(countResult[0].total)

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.created_at,
        vehicle: {
          id: log.vehicle_id,
          model: log.model,
          type: log.type,
          code: log.unique_code,
          registrationNumber: log.registration_number,
        },
        location: {
          lat: log.lat,
          lng: log.lng,
          label: log.label,
        },
        status: log.status,
        health: log.health_data,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Logs fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch logs: " + String(error) },
      { status: 500 },
    )
  }
}

