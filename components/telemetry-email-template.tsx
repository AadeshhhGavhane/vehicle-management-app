import * as React from "react"

interface TelemetryEmailTemplateProps {
  vehicleName: string
  vehicleType: string
  condition: string
  location: string
  issues?: Array<{ name: string; value: number; unit: string; status: string }>
}

export function TelemetryEmailTemplate({
  vehicleName,
  vehicleType,
  condition,
  location,
  issues = [],
}: TelemetryEmailTemplateProps) {
  const getConditionEmoji = (cond: string) => {
    if (cond === "good") return "✅"
    if (cond === "warning") return "⚠️"
    if (cond === "bad") return "❌"
    return "ℹ️"
  }

  const getConditionColor = (cond: string) => {
    if (cond === "good") return "#10b981"
    if (cond === "warning") return "#f59e0b"
    if (cond === "bad") return "#ef4444"
    return "#6b7280"
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ color: "#333", fontSize: "24px", marginBottom: "20px" }}>
        🚗 Vehicle Telemetry Update
      </h1>

      <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <h2 style={{ color: "#111", fontSize: "18px", marginBottom: "10px", marginTop: 0 }}>
          {vehicleName}
        </h2>
        <p style={{ color: "#666", fontSize: "14px", margin: "5px 0" }}>
          <strong>Type:</strong> {vehicleType}
        </p>
        <p style={{ color: "#666", fontSize: "14px", margin: "5px 0" }}>
          <strong>Location:</strong> {location}
        </p>
        <p style={{ color: "#666", fontSize: "14px", margin: "5px 0" }}>
          <strong>Overall Condition:</strong>{" "}
          <span
            style={{
              color: getConditionColor(condition),
              fontWeight: "bold",
            }}
          >
            {getConditionEmoji(condition)} {condition.toUpperCase()}
          </span>
        </p>
      </div>

      {issues.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#ef4444", fontSize: "16px", marginBottom: "10px" }}>
            ⚠️ Issues Detected:
          </h3>
          <ul style={{ color: "#666", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" }}>
            {issues.map((issue, index) => (
              <li key={index}>
                <strong>{issue.name}:</strong> {issue.value}
                {issue.unit} ({issue.status})
              </li>
            ))}
          </ul>
        </div>
      )}

      {issues.length === 0 && (
        <div style={{ backgroundColor: "#d1fae5", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
          <p style={{ color: "#065f46", fontSize: "14px", margin: 0 }}>
            ✅ No issues detected - Your vehicle is in good condition!
          </p>
        </div>
      )}

      <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.6", marginTop: "20px" }}>
        This is an automated notification from your Vehicle Management App. You can view more details in your
        dashboard.
      </p>
    </div>
  )
}

