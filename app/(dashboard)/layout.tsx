import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  )
}
