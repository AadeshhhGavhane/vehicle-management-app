// Telemetry types for mock vehicle dashboard

export interface TelemetryPayload {
  code: string
  status: "on" | "off"
  lat: number
  lng: number
  label: string
  preset?: PresetType
  selectedCity?: string
  // Common health metrics
  batteryHealth?: number
  tyreHealth?: number
  brakeHealth?: number
  odometerKm?: number
  // Car specific
  carEngineHealth?: number
  carFuelLevelPercent?: number
  carRangeKm?: number
  carEngineTempC?: number
  // Bike specific
  bikeEngineHealth?: number
  bikeFuelLevelPercent?: number
  bikeChainHealth?: number
  bikeEngineTempC?: number
  // Scooter specific
  scooterBatteryHealth?: number
  scooterStateOfChargePercent?: number
  scooterRangeKm?: number
  scooterEngineHealth?: number
  scooterFuelLevelPercent?: number
  scooterEngineTempC?: number
}

export type VehicleType = "car" | "bike" | "scooter"
export type PresetType = "manual" | "best" | "average" | "bad"
export type HealthLevel = "good" | "average" | "bad"

export interface City {
  name: string
  lat: number
  lng: number
}

export const CITIES: City[] = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
]

// Thresholds for determining health level
export const THRESHOLDS = {
  // Common metrics (0-100 scale where higher is better)
  batteryHealth: { good: 70, average: 40 },
  tyreHealth: { good: 70, average: 40 },
  brakeHealth: { good: 70, average: 40 },
  // Car specific
  carEngineHealth: { good: 70, average: 40 },
  carFuelLevelPercent: { good: 50, average: 20 },
  carRangeKm: { good: 200, average: 100 },
  carEngineTempC: { good: 90, average: 100 }, // Lower is better, inverted
  // Bike specific
  bikeEngineHealth: { good: 70, average: 40 },
  bikeFuelLevelPercent: { good: 50, average: 20 },
  bikeChainHealth: { good: 70, average: 40 },
  bikeEngineTempC: { good: 80, average: 95 }, // Lower is better, inverted
  // Scooter specific
  scooterBatteryHealth: { good: 70, average: 40 },
  scooterStateOfChargePercent: { good: 50, average: 20 },
  scooterRangeKm: { good: 50, average: 25 },
  scooterEngineHealth: { good: 70, average: 40 },
  scooterFuelLevelPercent: { good: 50, average: 20 },
  scooterEngineTempC: { good: 80, average: 95 }, // Lower is better, inverted
}

// Preset values for each vehicle type
export const PRESETS: Record<VehicleType, Record<Exclude<PresetType, "manual">, Partial<TelemetryPayload>>> = {
  car: {
    best: {
      batteryHealth: 95,
      tyreHealth: 90,
      brakeHealth: 92,
      odometerKm: 15000,
      carEngineHealth: 95,
      carFuelLevelPercent: 85,
      carRangeKm: 450,
      carEngineTempC: 75,
    },
    average: {
      batteryHealth: 55,
      tyreHealth: 50,
      brakeHealth: 55,
      odometerKm: 75000,
      carEngineHealth: 60,
      carFuelLevelPercent: 35,
      carRangeKm: 180,
      carEngineTempC: 95,
    },
    bad: {
      batteryHealth: 25,
      tyreHealth: 20,
      brakeHealth: 30,
      odometerKm: 150000,
      carEngineHealth: 25,
      carFuelLevelPercent: 10,
      carRangeKm: 50,
      carEngineTempC: 115,
    },
  },
  bike: {
    best: {
      batteryHealth: 95,
      tyreHealth: 90,
      brakeHealth: 92,
      odometerKm: 8000,
      bikeEngineHealth: 95,
      bikeFuelLevelPercent: 85,
      bikeChainHealth: 90,
      bikeEngineTempC: 70,
    },
    average: {
      batteryHealth: 55,
      tyreHealth: 50,
      brakeHealth: 55,
      odometerKm: 40000,
      bikeEngineHealth: 55,
      bikeFuelLevelPercent: 35,
      bikeChainHealth: 50,
      bikeEngineTempC: 90,
    },
    bad: {
      batteryHealth: 25,
      tyreHealth: 20,
      brakeHealth: 30,
      odometerKm: 80000,
      bikeEngineHealth: 25,
      bikeFuelLevelPercent: 10,
      bikeChainHealth: 20,
      bikeEngineTempC: 110,
    },
  },
  scooter: {
    best: {
      batteryHealth: 95,
      tyreHealth: 90,
      brakeHealth: 92,
      odometerKm: 5000,
      scooterBatteryHealth: 95,
      scooterStateOfChargePercent: 90,
      scooterRangeKm: 80,
      scooterEngineHealth: 95,
      scooterFuelLevelPercent: 85,
      scooterEngineTempC: 70,
    },
    average: {
      batteryHealth: 55,
      tyreHealth: 50,
      brakeHealth: 55,
      odometerKm: 25000,
      scooterBatteryHealth: 55,
      scooterStateOfChargePercent: 40,
      scooterRangeKm: 35,
      scooterEngineHealth: 55,
      scooterFuelLevelPercent: 35,
      scooterEngineTempC: 90,
    },
    bad: {
      batteryHealth: 25,
      tyreHealth: 20,
      brakeHealth: 30,
      odometerKm: 60000,
      scooterBatteryHealth: 25,
      scooterStateOfChargePercent: 15,
      scooterRangeKm: 15,
      scooterEngineHealth: 25,
      scooterFuelLevelPercent: 10,
      scooterEngineTempC: 110,
    },
  },
}

// Get health level for a metric value
export function getHealthLevel(metric: keyof typeof THRESHOLDS, value: number): HealthLevel {
  const threshold = THRESHOLDS[metric]

  // Special case for engine temperature (lower is better)
  if (metric === "carEngineTempC" || metric === "bikeEngineTempC" || metric === "scooterEngineTempC") {
    if (value <= threshold.good) return "good"
    if (value <= threshold.average) return "average"
    return "bad"
  }

  // Standard case (higher is better)
  if (value >= threshold.good) return "good"
  if (value >= threshold.average) return "average"
  return "bad"
}

// Get color class for health level
export function getHealthColor(level: HealthLevel): string {
  switch (level) {
    case "good":
      return "text-green-600 dark:text-green-400"
    case "average":
      return "text-yellow-600 dark:text-yellow-400"
    case "bad":
      return "text-red-600 dark:text-red-400"
  }
}

export function getHealthBorderColor(level: HealthLevel): string {
  switch (level) {
    case "good":
      return "border-green-500 focus:ring-green-500"
    case "average":
      return "border-yellow-500 focus:ring-yellow-500"
    case "bad":
      return "border-red-500 focus:ring-red-500"
  }
}

export function getHealthBgColor(level: HealthLevel): string {
  switch (level) {
    case "good":
      return "bg-green-50 dark:bg-green-950/30"
    case "average":
      return "bg-yellow-50 dark:bg-yellow-950/30"
    case "bad":
      return "bg-red-50 dark:bg-red-950/30"
  }
}

export function getHealthSliderColor(level: HealthLevel): string {
  switch (level) {
    case "good":
      return "[&_[data-slot=slider-range]]:bg-green-500 dark:[&_[data-slot=slider-range]]:bg-green-400 [&_[data-slot=slider-thumb]]:border-green-500 dark:[&_[data-slot=slider-thumb]]:border-green-400 [&_[data-slot=slider-thumb]]:bg-white dark:[&_[data-slot=slider-thumb]]:bg-background"
    case "average":
      return "[&_[data-slot=slider-range]]:bg-yellow-500 dark:[&_[data-slot=slider-range]]:bg-yellow-400 [&_[data-slot=slider-thumb]]:border-yellow-500 dark:[&_[data-slot=slider-thumb]]:border-yellow-400 [&_[data-slot=slider-thumb]]:bg-white dark:[&_[data-slot=slider-thumb]]:bg-background"
    case "bad":
      return "[&_[data-slot=slider-range]]:bg-red-500 dark:[&_[data-slot=slider-range]]:bg-red-400 [&_[data-slot=slider-thumb]]:border-red-500 dark:[&_[data-slot=slider-thumb]]:border-red-400 [&_[data-slot=slider-thumb]]:bg-white dark:[&_[data-slot=slider-thumb]]:bg-background"
  }
}
