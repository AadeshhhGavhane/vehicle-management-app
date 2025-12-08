"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import {
  CITIES,
  PRESETS,
  type THRESHOLDS,
  getHealthLevel,
  getHealthBorderColor,
  getHealthBgColor,
  type VehicleType,
  type PresetType,
  type TelemetryPayload,
} from "@/lib/telemetry-types"
import { Eye, EyeOff, Send, RotateCcw, MapPin, Gauge } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const ADMIN_EMAIL = "admin@admin.com"
const ADMIN_PASSWORD = "admin1234"
const AUTH_KEY = "mockVehicleAuth"

export default function MockVehiclePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Form state
  const [vehicleCode, setVehicleCode] = useState("")
  const [vehicleType, setVehicleType] = useState<VehicleType>("car")
  const [status, setStatus] = useState<"on" | "off">("off")
  const [selectedCity, setSelectedCity] = useState("")
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [label, setLabel] = useState("")
  const [preset, setPreset] = useState<PresetType>("manual")

  // Common health metrics
  const [batteryHealth, setBatteryHealth] = useState(75)
  const [tyreHealth, setTyreHealth] = useState(75)
  const [brakeHealth, setBrakeHealth] = useState(75)
  const [odometerKm, setOdometerKm] = useState(25000)

  // Car specific
  const [carEngineHealth, setCarEngineHealth] = useState(75)
  const [carFuelLevelPercent, setCarFuelLevelPercent] = useState(60)
  const [carRangeKm, setCarRangeKm] = useState(300)
  const [carEngineTempC, setCarEngineTempC] = useState(85)

  // Bike specific
  const [bikeEngineHealth, setBikeEngineHealth] = useState(75)
  const [bikeFuelLevelPercent, setBikeFuelLevelPercent] = useState(60)
  const [bikeChainHealth, setBikeChainHealth] = useState(75)

  // Scooter specific
  const [scooterBatteryHealth, setScooterBatteryHealth] = useState(75)
  const [scooterStateOfChargePercent, setScooterStateOfChargePercent] = useState(60)
  const [scooterRangeKm, setScooterRangeKm] = useState(50)
  const [scooterEngineHealth, setScooterEngineHealth] = useState(75)
  const [scooterFuelLevelPercent, setScooterFuelLevelPercent] = useState(60)

  // Response state
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle city selection
  useEffect(() => {
    if (selectedCity) {
      const city = CITIES.find((c) => c.name === selectedCity)
      if (city) {
        setLat(city.lat)
        setLng(city.lng)
        setLabel(city.name)
      }
    }
  }, [selectedCity])

  // Handle preset selection
  useEffect(() => {
    if (preset !== "manual") {
      const presetValues = PRESETS[vehicleType][preset]
      if (presetValues.batteryHealth !== undefined) setBatteryHealth(presetValues.batteryHealth)
      if (presetValues.tyreHealth !== undefined) setTyreHealth(presetValues.tyreHealth)
      if (presetValues.brakeHealth !== undefined) setBrakeHealth(presetValues.brakeHealth)
      if (presetValues.odometerKm !== undefined) setOdometerKm(presetValues.odometerKm)

      if (vehicleType === "car") {
        if (presetValues.carEngineHealth !== undefined) setCarEngineHealth(presetValues.carEngineHealth)
        if (presetValues.carFuelLevelPercent !== undefined) setCarFuelLevelPercent(presetValues.carFuelLevelPercent)
        if (presetValues.carRangeKm !== undefined) setCarRangeKm(presetValues.carRangeKm)
        if (presetValues.carEngineTempC !== undefined) setCarEngineTempC(presetValues.carEngineTempC)
      } else if (vehicleType === "bike") {
        if (presetValues.bikeEngineHealth !== undefined) setBikeEngineHealth(presetValues.bikeEngineHealth)
        if (presetValues.bikeFuelLevelPercent !== undefined) setBikeFuelLevelPercent(presetValues.bikeFuelLevelPercent)
        if (presetValues.bikeChainHealth !== undefined) setBikeChainHealth(presetValues.bikeChainHealth)
      } else if (vehicleType === "scooter") {
        if (presetValues.scooterBatteryHealth !== undefined) setScooterBatteryHealth(presetValues.scooterBatteryHealth)
        if (presetValues.scooterStateOfChargePercent !== undefined)
          setScooterStateOfChargePercent(presetValues.scooterStateOfChargePercent)
        if (presetValues.scooterRangeKm !== undefined) setScooterRangeKm(presetValues.scooterRangeKm)
        if (presetValues.scooterEngineHealth !== undefined) setScooterEngineHealth(presetValues.scooterEngineHealth)
        if (presetValues.scooterFuelLevelPercent !== undefined)
          setScooterFuelLevelPercent(presetValues.scooterFuelLevelPercent)
      }
    }
  }, [preset, vehicleType])

  // Load last state from DB when vehicle code changes
  useEffect(() => {
    if (!vehicleCode) return
    const controller = new AbortController()

    const loadState = async () => {
      try {
        const res = await fetch(`/api/telemetry?code=${encodeURIComponent(vehicleCode)}`, { signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        const vehicle = data.vehicle
        if (!vehicle) return
        const telemetry = vehicle.telemetry || {}

        setVehicleType((vehicle.type as VehicleType) || "car")
        setStatus((vehicle.status as "on" | "off") || "off")
        const matchedCity =
          telemetry.selectedCity ||
          (vehicle.label ? CITIES.find((c) => c.name.toLowerCase() === String(vehicle.label).toLowerCase())?.name : "")

        setSelectedCity(matchedCity ?? "")

        const nextLat = vehicle.lat !== null && vehicle.lat !== undefined ? Number(vehicle.lat) : null
        const nextLng = vehicle.lng !== null && vehicle.lng !== undefined ? Number(vehicle.lng) : null

        setLat(nextLat)
        setLng(nextLng)
        setLabel(vehicle.label ?? "")
        setPreset((telemetry.preset as PresetType) || "manual")
        setBatteryHealth(telemetry.batteryHealth ?? 75)
        setTyreHealth(telemetry.tyreHealth ?? 75)
        setBrakeHealth(telemetry.brakeHealth ?? 75)
        setOdometerKm(telemetry.odometerKm ?? 25000)
        setCarEngineHealth(telemetry.carEngineHealth ?? 75)
        setCarFuelLevelPercent(telemetry.carFuelLevelPercent ?? 60)
        setCarRangeKm(telemetry.carRangeKm ?? 300)
        setCarEngineTempC(telemetry.carEngineTempC ?? 85)
        setBikeEngineHealth(telemetry.bikeEngineHealth ?? 75)
        setBikeFuelLevelPercent(telemetry.bikeFuelLevelPercent ?? 60)
        setBikeChainHealth(telemetry.bikeChainHealth ?? 75)
        setScooterBatteryHealth(telemetry.scooterBatteryHealth ?? 75)
        setScooterStateOfChargePercent(telemetry.scooterStateOfChargePercent ?? 60)
        setScooterRangeKm(telemetry.scooterRangeKm ?? 50)
        setScooterEngineHealth(telemetry.scooterEngineHealth ?? 75)
        setScooterFuelLevelPercent(telemetry.scooterFuelLevelPercent ?? 60)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error("Failed to load vehicle state", err)
      }
    }

    loadState()
    return () => controller.abort()
  }, [vehicleCode])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_KEY, "true")
      }
      setLoginError("")
    } else {
      setLoginError("Invalid credentials")
    }
  }

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_KEY)
    }
    setIsAuthenticated(false)
  }

  // Restore auth state on load
  useEffect(() => {
    if (typeof window === "undefined") return
    const authed = localStorage.getItem(AUTH_KEY)
    if (authed === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const buildPayload = (): TelemetryPayload => {
    const payload: TelemetryPayload = {
      code: vehicleCode,
      status,
      lat: lat!,
      lng: lng!,
      label,
      preset,
      selectedCity,
      batteryHealth,
      tyreHealth,
      brakeHealth,
      odometerKm,
    }

    if (vehicleType === "car") {
      payload.carEngineHealth = carEngineHealth
      payload.carFuelLevelPercent = carFuelLevelPercent
      payload.carRangeKm = carRangeKm
      payload.carEngineTempC = carEngineTempC
    } else if (vehicleType === "bike") {
      payload.bikeEngineHealth = bikeEngineHealth
      payload.bikeFuelLevelPercent = bikeFuelLevelPercent
      payload.bikeChainHealth = bikeChainHealth
    } else if (vehicleType === "scooter") {
      payload.scooterBatteryHealth = scooterBatteryHealth
      payload.scooterStateOfChargePercent = scooterStateOfChargePercent
      payload.scooterRangeKm = scooterRangeKm
      payload.scooterEngineHealth = scooterEngineHealth
      payload.scooterFuelLevelPercent = scooterFuelLevelPercent
    }

    // Filter out non-finite numbers
    return Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => {
        if (typeof v === "number") return Number.isFinite(v)
        return v !== undefined && v !== null && v !== ""
      }),
    ) as TelemetryPayload
  }

  const handleSendTelemetry = async () => {
    if (!vehicleCode) {
      setError("Vehicle code is required")
      return
    }
    if (lat === null || lng === null) {
      setError("Please select a city")
      return
    }

    setIsSubmitting(true)
    setError("")
    setResponse(null)

    try {
      const payload = buildPayload()
      const res = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setResponse(data)
      if (!data.success) {
        setError(data.error || "Unknown error")
      }
    } catch (err) {
      setError("Failed to send telemetry")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setVehicleCode("")
    setVehicleType("car")
    setStatus("off")
    setSelectedCity("")
    setLat(null)
    setLng(null)
    setLabel("")
    setPreset("manual")
    setBatteryHealth(75)
    setTyreHealth(75)
    setBrakeHealth(75)
    setOdometerKm(25000)
    setCarEngineHealth(75)
    setCarFuelLevelPercent(60)
    setCarRangeKm(300)
    setCarEngineTempC(85)
    setBikeEngineHealth(75)
    setBikeFuelLevelPercent(60)
    setBikeChainHealth(75)
    setScooterBatteryHealth(75)
    setScooterStateOfChargePercent(60)
    setScooterRangeKm(50)
    setScooterEngineHealth(75)
    setScooterFuelLevelPercent(60)
    setResponse(null)
    setError("")
  }

  // Health metric input component with color coding
  const HealthInput = ({
    label,
    value,
    onChange,
    metricKey,
    unit = "",
    min = 0,
    max = 100,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    metricKey: keyof typeof THRESHOLDS
    unit?: string
    min?: number
    max?: number
  }) => {
    const level = getHealthLevel(metricKey, value)
    return (
      <div className={`space-y-2 p-3 rounded-lg ${getHealthBgColor(level)}`}>
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">{label}</Label>
          <span
            className={`text-sm font-mono font-semibold ${getHealthBorderColor(level).replace("border-", "text-").replace(" focus:ring-", " ")}`}
          >
            {value}
            {unit}
          </span>
        </div>
        <Slider
          value={[value]}
          onValueChange={([v]) => {
            onChange(v)
            setPreset("manual")
          }}
          min={min}
          max={max}
          step={1}
          className="w-full"
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Mock Vehicle</CardTitle>
              <ThemeToggle />
            </div>
            <CardDescription>Admin login to send telemetry data</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@admin.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mock Vehicle Dashboard</h1>
            <p className="text-sm text-muted-foreground">Send telemetry data to test vehicle tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vehicleCode">Vehicle Code</Label>
                  <Input
                    id="vehicleCode"
                    value={vehicleCode}
                    onChange={(e) => setVehicleCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC12345"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="bike">Bike</SelectItem>
                      <SelectItem value="scooter">Scooter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as "on" | "off")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preset</Label>
                  <Select value={preset} onValueChange={(v) => setPreset(v as PresetType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="best">Best</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="bad">Bad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Location Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Location label" />
                </div>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input value={typeof lat === "number" ? lat.toFixed(4) : ""} readOnly className="bg-muted font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input value={typeof lng === "number" ? lng.toFixed(4) : ""} readOnly className="bg-muted font-mono" />
                </div>
              </CardContent>
            </Card>

            {/* Health Metrics Section */}
            <Card>
              <CardHeader>
                <CardTitle>Common Health Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <HealthInput
                  label="Battery Health"
                  value={batteryHealth}
                  onChange={setBatteryHealth}
                  metricKey="batteryHealth"
                  unit="%"
                />
                <HealthInput
                  label="Tyre Health"
                  value={tyreHealth}
                  onChange={setTyreHealth}
                  metricKey="tyreHealth"
                  unit="%"
                />
                <HealthInput
                  label="Brake Health"
                  value={brakeHealth}
                  onChange={setBrakeHealth}
                  metricKey="brakeHealth"
                  unit="%"
                />
                <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Odometer</Label>
                    <span className="text-sm font-mono font-semibold">{odometerKm.toLocaleString()} km</span>
                  </div>
                  <Slider
                    value={[odometerKm]}
                    onValueChange={([v]) => {
                      setOdometerKm(v)
                      setPreset("manual")
                    }}
                    min={0}
                    max={300000}
                    step={1000}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle-specific metrics */}
            {vehicleType === "car" && (
              <Card>
                <CardHeader>
                  <CardTitle>Car-Specific Metrics</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <HealthInput
                    label="Engine Health"
                    value={carEngineHealth}
                    onChange={setCarEngineHealth}
                    metricKey="carEngineHealth"
                    unit="%"
                  />
                  <HealthInput
                    label="Fuel Level"
                    value={carFuelLevelPercent}
                    onChange={setCarFuelLevelPercent}
                    metricKey="carFuelLevelPercent"
                    unit="%"
                  />
                  <HealthInput
                    label="Range"
                    value={carRangeKm}
                    onChange={setCarRangeKm}
                    metricKey="carRangeKm"
                    unit=" km"
                    max={600}
                  />
                  <HealthInput
                    label="Engine Temperature"
                    value={carEngineTempC}
                    onChange={setCarEngineTempC}
                    metricKey="carEngineTempC"
                    unit="°C"
                    max={150}
                  />
                </CardContent>
              </Card>
            )}

            {vehicleType === "bike" && (
              <Card>
                <CardHeader>
                  <CardTitle>Bike-Specific Metrics</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <HealthInput
                    label="Engine Health"
                    value={bikeEngineHealth}
                    onChange={setBikeEngineHealth}
                    metricKey="bikeEngineHealth"
                    unit="%"
                  />
                  <HealthInput
                    label="Fuel Level"
                    value={bikeFuelLevelPercent}
                    onChange={setBikeFuelLevelPercent}
                    metricKey="bikeFuelLevelPercent"
                    unit="%"
                  />
                  <HealthInput
                    label="Chain Health"
                    value={bikeChainHealth}
                    onChange={setBikeChainHealth}
                    metricKey="bikeChainHealth"
                    unit="%"
                  />
                </CardContent>
              </Card>
            )}

            {vehicleType === "scooter" && (
              <Card>
                <CardHeader>
                  <CardTitle>Scooter-Specific Metrics</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <HealthInput
                    label="Battery Health"
                    value={scooterBatteryHealth}
                    onChange={setScooterBatteryHealth}
                    metricKey="scooterBatteryHealth"
                    unit="%"
                  />
                  <HealthInput
                    label="State of Charge"
                    value={scooterStateOfChargePercent}
                    onChange={setScooterStateOfChargePercent}
                    metricKey="scooterStateOfChargePercent"
                    unit="%"
                  />
                  <HealthInput
                    label="Range"
                    value={scooterRangeKm}
                    onChange={setScooterRangeKm}
                    metricKey="scooterRangeKm"
                    unit=" km"
                    max={150}
                  />
                  <HealthInput
                    label="Engine Health"
                    value={scooterEngineHealth}
                    onChange={setScooterEngineHealth}
                    metricKey="scooterEngineHealth"
                    unit="%"
                  />
                  <HealthInput
                    label="Fuel Level"
                    value={scooterFuelLevelPercent}
                    onChange={setScooterFuelLevelPercent}
                    metricKey="scooterFuelLevelPercent"
                    unit="%"
                  />
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={handleSendTelemetry} disabled={isSubmitting} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send Telemetry"}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Response Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Response</CardTitle>
                <CardDescription>Last API response</CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">{error}</div>}
                {response ? (
                  <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-96 font-mono">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">No response yet. Send telemetry to see the result.</p>
                )}
              </CardContent>
            </Card>

            {/* Payload Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Payload Preview</CardTitle>
                <CardDescription>Data that will be sent</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-auto max-h-64 font-mono">
                  {JSON.stringify(buildPayload(), null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
