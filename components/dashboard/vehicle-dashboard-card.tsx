"use client"

import type React from "react"

import { useState } from "react"
import type { Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Car, Bike, Zap, Copy, Check, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VehicleDashboardCardProps {
  vehicle: Vehicle
  onClick: () => void
}

export function VehicleDashboardCard({ vehicle, onClick }: VehicleDashboardCardProps) {
  const [copied, setCopied] = useState(false)
  const condition =
    vehicle.health.condition ||
    ({
      overall: "good",
      problematicMetrics: [],
    } as const)

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(vehicle.uniqueCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const VehicleIcon = vehicle.type === "car" ? Car : vehicle.type === "bike" ? Bike : Zap

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <VehicleIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{vehicle.model}</p>
          <p className="text-sm text-muted-foreground">{vehicle.registrationNumber}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <StatusPill status={vehicle.health.isActive ? "active" : "inactive"}>
            {vehicle.health.isActive ? "Active" : "Inactive"}
          </StatusPill>
          <StatusPill status="neutral" icon={<MapPin className="h-3 w-3" />}>
            {vehicle.health.location}
          </StatusPill>
          <StatusPill status={condition.overall}>
            {condition.overall === "good" ? "Healthy" : condition.overall === "warning" ? "Warning" : "Critical"}
          </StatusPill>
        </div>

        <Button variant="ghost" size="sm" onClick={copyCode} className="h-8 gap-1.5 text-xs">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {vehicle.uniqueCode}
        </Button>
      </div>
    </div>
  )
}

function StatusPill({
  children,
  status,
  icon,
}: {
  children: React.ReactNode
  status: "active" | "inactive" | "good" | "warning" | "bad" | "neutral"
  icon?: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "active" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        status === "inactive" && "bg-muted text-muted-foreground",
        status === "good" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        status === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        status === "bad" && "bg-red-500/10 text-red-600 dark:text-red-400",
        status === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      {icon}
      {children}
    </span>
  )
}
