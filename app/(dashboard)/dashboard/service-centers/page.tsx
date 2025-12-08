"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSearchParams } from "next/navigation"
import { getVehiclesAction } from "@/app/actions/vehicles"
import type { Vehicle } from "@/lib/types"
import {
  getServiceCentersData,
  calculateDistance,
  type CityInfrastructure,
  type ServiceCenter,
  type Garage,
  type FuelStation,
} from "@/lib/service-centers"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Wrench, Car, Fuel, Sparkles } from "lucide-react"

export default function ServiceCentersPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [citiesData, setCitiesData] = useState<CityInfrastructure[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("service_centers")

  // Read query params on mount
  useEffect(() => {
    const vehicleIdParam = searchParams.get("vehicleId")
    const tabParam = searchParams.get("tab")
    const cityParam = searchParams.get("city")

    if (vehicleIdParam) {
      setSelectedVehicleId(vehicleIdParam)
    }
    if (tabParam) {
      setActiveTab(tabParam)
    }
    if (cityParam) {
      setSelectedCity(cityParam)
    }
  }, [searchParams])

  useEffect(() => {
    async function loadData() {
      if (user) {
        const [vehiclesData, cities] = await Promise.all([
          getVehiclesAction(),
          getServiceCentersData(),
        ])
        setVehicles(vehiclesData)
        setCitiesData(cities)

        // Auto-select city if vehicle is selected
        if (selectedVehicleId) {
          const vehicle = vehiclesData.find((v) => v.id === selectedVehicleId)
          if (vehicle?.health?.location) {
            const city = cities.find(
              (c) => c.city.toLowerCase() === vehicle.health.location.toLowerCase(),
            )
            if (city) {
              setSelectedCity(city.city)
            }
          }
        }
      }
    }
    loadData()
  }, [user, selectedVehicleId])

  const selectedCityData = citiesData.find((c) => c.city === selectedCity)
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)

  // Get vehicle location for distance calculation
  const vehicleLocation =
    selectedVehicle?.health?.lat && selectedVehicle?.health?.lng
      ? { lat: selectedVehicle.health.lat, lng: selectedVehicle.health.lng }
      : null

  const sortByDistance = <T extends { lat: number; lng: number }>(items: T[]): T[] => {
    if (!vehicleLocation) return items
    return [...items].sort((a, b) => {
      const distA = calculateDistance(vehicleLocation.lat, vehicleLocation.lng, a.lat, a.lng)
      const distB = calculateDistance(vehicleLocation.lat, vehicleLocation.lng, b.lat, b.lng)
      return distA - distB
    })
  }

  const formatDistance = (distance: number): string => {
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  // Determine if services are recommended based on vehicle issues
  const isRecommended = (tabType: string): boolean => {
    if (!selectedVehicle) return false
    const condition = selectedVehicle.health?.condition
    
    // If condition exists and has problematic metrics, use it
    if (condition && condition.problematicMetrics && condition.problematicMetrics.length > 0) {
      const issues = condition.problematicMetrics.map((m) => m.name.toLowerCase())

      if (tabType === "fuel_stations") {
        return issues.some((i) => i.includes("fuel"))
      }
      if (tabType === "service_centers") {
        return issues.some((i) => i.includes("engine") || i.includes("battery") || i.includes("chain"))
      }
      if (tabType === "garages") {
        return issues.some((i) => i.includes("tire") || i.includes("tyre") || i.includes("brake"))
      }
    }
    
    // Fallback: check raw health data if condition is missing
    const health = selectedVehicle.health
    if (!health) return false
    
    const telemetry = health.telemetry || {}
    
    if (tabType === "fuel_stations") {
      const fuelLevel = health.fuelLevel || telemetry.carFuelLevelPercent || telemetry.bikeFuelLevelPercent
      return fuelLevel !== undefined && fuelLevel < 25
    }
    if (tabType === "service_centers") {
      const hasEngineIssue = 
        (health.engineTemperature && health.engineTemperature > 90) ||
        (telemetry.carEngineHealth && telemetry.carEngineHealth < 50) ||
        (telemetry.bikeEngineHealth && telemetry.bikeEngineHealth < 50) ||
        (telemetry.scooterEngineHealth && telemetry.scooterEngineHealth < 50)
      const hasBatteryIssue = 
        (health.batteryLevel && health.batteryLevel < 50) ||
        (telemetry.batteryHealth && telemetry.batteryHealth < 50) ||
        (telemetry.scooterBatteryHealth && telemetry.scooterBatteryHealth < 50)
      const hasChainIssue = telemetry.bikeChainHealth && telemetry.bikeChainHealth < 50
      return hasEngineIssue || hasBatteryIssue || hasChainIssue
    }
    if (tabType === "garages") {
      const hasTireIssue = 
        (health.tirePressure && (health.tirePressure < 30 || health.tirePressure > 35)) ||
        (telemetry.tyreHealth && telemetry.tyreHealth < 50)
      const hasBrakeIssue = telemetry.brakeHealth && telemetry.brakeHealth < 50
      return hasTireIssue || hasBrakeIssue
    }
    
    return false
  }

  const serviceCenters = selectedCityData ? sortByDistance(selectedCityData.service_centers) : []
  const garages = selectedCityData ? sortByDistance(selectedCityData.garages) : []
  const fuelStations = selectedCityData ? sortByDistance(selectedCityData.fuel_stations) : []

  const showRecommendationBanner = selectedVehicle && selectedVehicle.health?.condition?.overall !== "good"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Service Centers</h1>
        <p className="text-muted-foreground mt-1">Find nearby service centers, garages, and fuel stations</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <CardTitle>Location</CardTitle>
              <CardDescription>Select a city or vehicle to find nearby services</CardDescription>
            </div>
            <div className="flex gap-4">
              <Select value={selectedVehicleId || undefined} onValueChange={(value) => setSelectedVehicleId(value || "")}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {citiesData.map((city) => (
                    <SelectItem key={city.city} value={city.city}>
                      {city.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedCity ? (
            <div className="py-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">Select a city</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a city from the dropdown above to view available service centers, garages, and fuel stations
              </p>
            </div>
          ) : (
            <>
              {showRecommendationBanner && (
                <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    Showing services recommended for <strong>{selectedVehicle?.model}</strong> based on detected issues.
                    {isRecommended(activeTab) && (
                      <span className="block mt-1 text-sm">
                        This tab is recommended for your vehicle's current issues.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="service_centers">
                    <Wrench className="h-4 w-4 mr-2" />
                    Service Centers ({serviceCenters.length})
                    {isRecommended("service_centers") && (
                      <Badge variant="secondary" className="ml-2 text-xs">Recommended</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="garages">
                    <Car className="h-4 w-4 mr-2" />
                    Garages ({garages.length})
                    {isRecommended("garages") && (
                      <Badge variant="secondary" className="ml-2 text-xs">Recommended</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="fuel_stations">
                    <Fuel className="h-4 w-4 mr-2" />
                    Fuel Stations ({fuelStations.length})
                    {isRecommended("fuel_stations") && (
                      <Badge variant="secondary" className="ml-2 text-xs">Recommended</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="service_centers" className="mt-6">
                {serviceCenters.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No service centers found in {selectedCity}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {serviceCenters.map((center, index) => {
                      const distance = vehicleLocation
                        ? calculateDistance(vehicleLocation.lat, vehicleLocation.lng, center.lat, center.lng)
                        : null
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{center.name}</CardTitle>
                              {distance !== null && (
                                <Badge variant="outline">{formatDistance(distance)}</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="garages" className="mt-6">
                {garages.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No garages found in {selectedCity}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {garages.map((garage, index) => {
                      const distance = vehicleLocation
                        ? calculateDistance(vehicleLocation.lat, vehicleLocation.lng, garage.lat, garage.lng)
                        : null
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{garage.name}</CardTitle>
                              {distance !== null && (
                                <Badge variant="outline">{formatDistance(distance)}</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {garage.lat.toFixed(4)}, {garage.lng.toFixed(4)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="fuel_stations" className="mt-6">
                {fuelStations.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No fuel stations found in {selectedCity}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {fuelStations.map((station, index) => {
                      const distance = vehicleLocation
                        ? calculateDistance(vehicleLocation.lat, vehicleLocation.lng, station.lat, station.lng)
                        : null
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{station.name}</CardTitle>
                              {distance !== null && (
                                <Badge variant="outline">{formatDistance(distance)}</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {station.fuels.petrol && (
                                  <Badge variant="secondary" className="text-xs">
                                    Petrol
                                  </Badge>
                                )}
                                {station.fuels.diesel && (
                                  <Badge variant="secondary" className="text-xs">
                                    Diesel
                                  </Badge>
                                )}
                                {station.fuels.cng && (
                                  <Badge variant="secondary" className="text-xs">
                                    CNG
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

