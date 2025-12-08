import type { VehicleHealth, ConditionResult, ConditionStatus } from "./types"
import { THRESHOLDS } from "./telemetry-types"

interface MetricEvaluation {
  name: string
  value: number
  status: ConditionStatus
  unit: string
}

function evaluateEngineTemperature(temp: number): MetricEvaluation {
  let status: ConditionStatus = "good"
  if (temp > 110) status = "bad"
  else if (temp >= 90) status = "warning"
  return { name: "Engine Temperature", value: temp, status, unit: "°C" }
}

function evaluateBatteryLevel(level: number): MetricEvaluation {
  let status: ConditionStatus = "good"
  if (level < 20) status = "bad"
  else if (level <= 50) status = "warning"
  return { name: "Battery Level", value: level, status, unit: "%" }
}

function evaluateTirePressure(pressure: number): MetricEvaluation {
  let status: ConditionStatus = "good"
  if (pressure < 25 || pressure > 40) status = "bad"
  else if (pressure < 30 || pressure > 35) status = "warning"
  return { name: "Tire Pressure", value: pressure, status, unit: "psi" }
}

function evaluateFuelLevel(level: number): MetricEvaluation {
  let status: ConditionStatus = "good"
  if (level < 10) status = "bad"
  else if (level <= 25) status = "warning"
  return { name: "Fuel Level", value: level, status, unit: "%" }
}

function evaluateHealthMetric(value: number, thresholds: { good: number; average: number }, inverted = false): ConditionStatus {
  if (inverted) {
    // For metrics where lower is better (like engine temp)
    if (value <= thresholds.good) return "good"
    if (value <= thresholds.average) return "warning"
    return "bad"
  } else {
    // For metrics where higher is better
    if (value >= thresholds.good) return "good"
    if (value >= thresholds.average) return "warning"
    return "bad"
  }
}

export function evaluateVehicleCondition(health: VehicleHealth): ConditionResult {
  const metrics: MetricEvaluation[] = []

  // Common metrics
  if (typeof health.engineTemperature === "number") metrics.push(evaluateEngineTemperature(health.engineTemperature))
  if (typeof health.batteryLevel === "number") metrics.push(evaluateBatteryLevel(health.batteryLevel))
  if (typeof health.tirePressure === "number") metrics.push(evaluateTirePressure(health.tirePressure))
  if (typeof health.fuelLevel === "number") metrics.push(evaluateFuelLevel(health.fuelLevel))

  // Vehicle-specific metrics from telemetry
  const telemetry = health.telemetry || {}

  // Car-specific metrics
  if (typeof telemetry.carEngineHealth === "number") {
    const status = evaluateHealthMetric(telemetry.carEngineHealth, THRESHOLDS.carEngineHealth)
    metrics.push({ name: "Car Engine Health", value: telemetry.carEngineHealth, status, unit: "%" })
  }

  // Bike-specific metrics
  if (typeof telemetry.bikeEngineHealth === "number") {
    const status = evaluateHealthMetric(telemetry.bikeEngineHealth, THRESHOLDS.bikeEngineHealth)
    metrics.push({ name: "Bike Engine Health", value: telemetry.bikeEngineHealth, status, unit: "%" })
  }
  if (typeof telemetry.bikeChainHealth === "number") {
    const status = evaluateHealthMetric(telemetry.bikeChainHealth, THRESHOLDS.bikeChainHealth)
    metrics.push({ name: "Bike Chain Health", value: telemetry.bikeChainHealth, status, unit: "%" })
  }

  // Scooter-specific metrics
  if (typeof telemetry.scooterBatteryHealth === "number") {
    const status = evaluateHealthMetric(telemetry.scooterBatteryHealth, THRESHOLDS.scooterBatteryHealth)
    metrics.push({ name: "Scooter Battery Health", value: telemetry.scooterBatteryHealth, status, unit: "%" })
  }
  if (typeof telemetry.scooterStateOfChargePercent === "number") {
    const status = evaluateHealthMetric(telemetry.scooterStateOfChargePercent, THRESHOLDS.scooterStateOfChargePercent)
    metrics.push({ name: "Scooter State of Charge", value: telemetry.scooterStateOfChargePercent, status, unit: "%" })
  }
  if (typeof telemetry.scooterEngineHealth === "number") {
    const status = evaluateHealthMetric(telemetry.scooterEngineHealth, THRESHOLDS.scooterEngineHealth)
    metrics.push({ name: "Scooter Engine Health", value: telemetry.scooterEngineHealth, status, unit: "%" })
  }

  // Additional health metrics (batteryHealth, tyreHealth, brakeHealth from telemetry)
  if (typeof telemetry.batteryHealth === "number" && !metrics.find((m) => m.name === "Battery Level")) {
    const status = evaluateHealthMetric(telemetry.batteryHealth, THRESHOLDS.batteryHealth)
    metrics.push({ name: "Battery Health", value: telemetry.batteryHealth, status, unit: "%" })
  }
  if (typeof telemetry.tyreHealth === "number") {
    const status = evaluateHealthMetric(telemetry.tyreHealth, THRESHOLDS.tyreHealth)
    metrics.push({ name: "Tyre Health", value: telemetry.tyreHealth, status, unit: "%" })
  }
  if (typeof telemetry.brakeHealth === "number") {
    const status = evaluateHealthMetric(telemetry.brakeHealth, THRESHOLDS.brakeHealth)
    metrics.push({ name: "Brake Health", value: telemetry.brakeHealth, status, unit: "%" })
  }

  const problematicMetrics = metrics.filter((m) => m.status !== "good")

  let overall: ConditionStatus = "good"
  if (problematicMetrics.some((m) => m.status === "bad")) {
    overall = "bad"
  } else if (problematicMetrics.some((m) => m.status === "warning")) {
    overall = "warning"
  }

  return { overall, problematicMetrics }
}

export function generateRandomHealth(): VehicleHealth {
  const locations = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Pune", "Hyderabad"]
  const randomDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)

  return {
    engineTemperature: Math.floor(Math.random() * 130) + 20,
    batteryLevel: Math.floor(Math.random() * 100),
    oilPressure: Math.floor(Math.random() * 90) + 10,
    tirePressure: Math.floor(Math.random() * 25) + 20,
    fuelLevel: Math.floor(Math.random() * 100),
    mileage: Math.floor(Math.random() * 100000),
    lastServiceDate: randomDate.toISOString().split("T")[0],
    isActive: Math.random() > 0.3,
    location: locations[Math.floor(Math.random() * locations.length)],
  }
}
