"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getVehiclesAction } from "@/app/actions/vehicles"
import type { Vehicle } from "@/lib/types"
import { VehicleDashboardCard } from "@/components/dashboard/vehicle-dashboard-card"
import { VehicleHealthModal } from "@/components/dashboard/vehicle-health-modal"
import { Car, Bike, Zap } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadVehicles() {
      if (user) {
        setIsLoading(true)
        const data = await getVehiclesAction()
        setVehicles(data)
        setIsLoading(false)
      }
    }
    loadVehicles()

    // Connect to SSE for real-time updates
    if (user) {
      const eventSource = new EventSource("/api/telemetry/stream")

      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === "vehicle_updated") {
            // Reload vehicles to get the latest data
            const updatedVehicles = await getVehiclesAction()
            setVehicles(updatedVehicles)
            
            // Update selected vehicle if it's the one that was updated
            setSelectedVehicle((prevSelected) => {
              if (prevSelected && prevSelected.id === data.vehicle.id) {
                const updatedVehicle = updatedVehicles.find((v) => v.id === data.vehicle.id)
                return updatedVehicle || prevSelected
              }
              return prevSelected
            })
          }
        } catch (error) {
          console.error("Error processing SSE message:", error)
        }
      }

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error)
        // EventSource will automatically reconnect
      }

      return () => {
        eventSource.close()
      }
    }
  }, [user])

  const stats = {
    total: vehicles.length,
    cars: vehicles.filter((v) => v.type === "car").length,
    bikes: vehicles.filter((v) => v.type === "bike").length,
    scooters: vehicles.filter((v) => v.type === "scooter").length,
    active: vehicles.filter((v) => v.health?.isActive).length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name?.split(" ")[0]}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Vehicles" value={stats.total} icon={<Car className="h-5 w-5" />} />
        <StatCard title="Cars" value={stats.cars} icon={<Car className="h-5 w-5" />} />
        <StatCard title="Bikes" value={stats.bikes} icon={<Bike className="h-5 w-5" />} />
        <StatCard title="Scooters" value={stats.scooters} icon={<Zap className="h-5 w-5" />} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Your Vehicles</h2>
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No vehicles yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first vehicle to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.slice(0, 5).map((vehicle) => (
              <VehicleDashboardCard key={vehicle.id} vehicle={vehicle} onClick={() => setSelectedVehicle(vehicle)} />
            ))}
            {vehicles.length > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                And {vehicles.length - 5} more vehicle{vehicles.length - 5 > 1 ? "s" : ""}...
              </p>
            )}
          </div>
        )}
      </div>

      <VehicleHealthModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}
