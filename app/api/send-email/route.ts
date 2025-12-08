import { EmailTemplate } from "@/components/email-template"
import { Resend } from "resend"
import { getCurrentUserAction } from "@/app/actions/auth"
import { render } from "@react-email/render"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
  try {
    // Get current user
    const user = await getCurrentUserAction()
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.email) {
      return Response.json({ error: "User email not found" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: "RESEND_API_KEY not configured" }, { status: 500 })
    }

    // Extract first name from user's name
    const firstName = user.name?.split(" ")[0] || user.name || "there"

    // Render React component to HTML
    const emailHtml = await render(EmailTemplate({ firstName }))

    const { data, error } = await resend.emails.send({
      from: "VehicleHub <onboarding@resend.dev>",
      to: [user.email],
      subject: "Test Email from VehicleHub",
      html: emailHtml,
    })

    if (error) {
      console.error("Resend error:", error)
      return Response.json({ error: error.message || "Failed to send email" }, { status: 500 })
    }

    return Response.json({ success: true, data })
  } catch (error) {
    console.error("Email send error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}

