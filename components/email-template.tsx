import * as React from "react"

interface EmailTemplateProps {
  firstName: string
}

export function EmailTemplate({ firstName }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ color: "#333", fontSize: "24px", marginBottom: "20px" }}>Hi {firstName}!</h1>
      <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6" }}>
        This is a test email from your Vehicle Management App. 🚗
      </p>
      <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6", marginTop: "20px" }}>
        If you received this email, your email configuration is working correctly!
      </p>
    </div>
  )
}

