"use client"

import type { Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Car, Bike, Zap, Wrench } from "lucide-react"

interface VehicleHealthModalProps {
  vehicle: Vehicle | null
  onClose: () => void
}

export function VehicleHealthModal({ vehicle, onClose }: VehicleHealthModalProps) {
  const router = useRouter()
  if (!vehicle) return null

  const condition =
    vehicle.health.condition ||
    ({
      overall: "good",
      problematicMetrics: [],
    } as const)
  const VehicleIcon = vehicle.type === "car" ? Car : vehicle.type === "bike" ? Bike : Zap

  // Determine recommended service type based on issues
  const getRecommendedServiceType = (): string => {
    const issues = condition.problematicMetrics.map((m) => m.name.toLowerCase())
    
    // Check for fuel-related issues
    if (issues.some((i) => i.includes("fuel"))) {
      return "fuel_stations"
    }
    
    // Check for engine/battery/chain issues (needs service center)
    if (
      issues.some((i) => i.includes("engine") || i.includes("battery") || i.includes("chain"))
    ) {
      return "service_centers"
    }
    
    // Check for tire/tyre/brake issues (needs garage)
    if (issues.some((i) => i.includes("tire") || i.includes("tyre") || i.includes("brake"))) {
      return "garages"
    }
    
    // Default to service centers for any other issues
    return "service_centers"
  }

  const handleFindServices = () => {
    const recommendedTab = getRecommendedServiceType()
    const city = vehicle.health?.location || ""
    const params = new URLSearchParams({
      vehicleId: vehicle.id,
      tab: recommendedTab,
    })
    if (city) {
      params.append("city", city)
    }
    router.push(`/dashboard/service-centers?${params.toString()}`)
    onClose()
  }

  const healthMetrics = [
    { key: "engineTemperature", label: "Engine Temperature", value: vehicle.health.engineTemperature, unit: "°C" },
    { key: "batteryLevel", label: "Battery Level", value: vehicle.health.batteryLevel, unit: "%" },
    { key: "tirePressure", label: "Tire Pressure", value: vehicle.health.tirePressure, unit: "psi" },
    { key: "fuelLevel", label: "Fuel Level", value: vehicle.health.fuelLevel, unit: "%" },
    { key: "mileage", label: "Mileage", value: vehicle.health.mileage?.toLocaleString?.() ?? vehicle.health.mileage, unit: "km" },
  ].filter((metric) => metric.value !== undefined && metric.value !== null)

  const telemetry = (vehicle.health as any).telemetry || {}
  const baseKeys = new Set(healthMetrics.map((m) => m.key))

  const unitMap: Record<string, string> = {
    batteryHealth: "%",
    tyreHealth: "%",
    brakeHealth: "%",
    carRangeKm: "km",
    odometerKm: "km",
    carEngineHealth: "%",
    carFuelLevelPercent: "%",
    carEngineTempC: "°C",
    scooterBatteryHealth: "%",
    scooterStateOfChargePercent: "%",
    scooterRangeKm: "km",
    scooterEngineHealth: "%",
    scooterFuelLevelPercent: "%",
    bikeEngineHealth: "%",
    bikeFuelLevelPercent: "%",
    bikeChainHealth: "%",
  }

  const labelFromKey = (key: string) =>
    key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace("Tyre", "Tyre") // keep UK spelling

  const hiddenKeys = new Set([
    "selectedCity",
    "preset",
    // Telemetry fields already represented by base health metrics
    "batteryHealth", // shown as Battery Level
    "tyreHealth", // shown as Tire Pressure
    "carFuelLevelPercent",
    "bikeFuelLevelPercent",
    "scooterFuelLevelPercent", // shown as Fuel Level
    "carEngineTempC", // shown as Engine Temperature
    "odometerKm", // shown as Mileage
  ])

  const extraTelemetryMetrics = Object.entries(telemetry)
    .filter(
      ([key, value]) =>
        !baseKeys.has(key) && !hiddenKeys.has(key) && value !== undefined && value !== null,
    )
    .map(([key, value]) => ({
      key,
      label: labelFromKey(key),
      value: typeof value === "number" ? value : String(value),
      unit: unitMap[key] || "",
    }))

  return (
    <Dialog open={!!vehicle} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <VehicleIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>{vehicle.model}</DialogTitle>
              <DialogDescription>{vehicle.registrationNumber}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm font-medium text-foreground">Overall Condition</span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                condition.overall === "good" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                condition.overall === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                condition.overall === "bad" && "bg-red-500/10 text-red-600 dark:text-red-400",
              )}
            >
              {condition.overall === "good"
                ? "Healthy"
                : condition.overall === "warning"
                  ? "Needs Attention"
                  : "Critical"}
            </span>
          </div>

          {condition.problematicMetrics.length > 0 && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground mb-2">Issues Detected</p>
              <div className="space-y-1">
                {condition.problematicMetrics.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.name}</span>
                    <span
                      className={cn(
                        "font-medium",
                        metric.status === "warning" && "text-amber-600 dark:text-amber-400",
                        metric.status === "bad" && "text-red-600 dark:text-red-400",
                      )}
                    >
                      {metric.value} {metric.unit}
                    </span>
                  </div>
                ))}
              </div>
              {(condition.overall === "warning" || condition.overall === "bad") && (
                <Button
                  onClick={handleFindServices}
                  className="w-full mt-4"
                  variant={condition.overall === "bad" ? "default" : "outline"}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Find Nearby Services
                </Button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Raw Health Data</p>
            <div className="rounded-lg border border-border divide-y divide-border">
              {healthMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium text-foreground">
                    {metric.value} {metric.unit}
                  </span>
                </div>
              ))}
              {extraTelemetryMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium text-foreground">
                    {metric.value} {metric.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
