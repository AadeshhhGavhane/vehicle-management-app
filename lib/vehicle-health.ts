import type { VehicleHealth, ConditionResult, ConditionStatus } from "./types"

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

export function evaluateVehicleCondition(health: VehicleHealth): ConditionResult {
  const metrics: MetricEvaluation[] = []

  if (typeof health.engineTemperature === "number") metrics.push(evaluateEngineTemperature(health.engineTemperature))
  if (typeof health.batteryLevel === "number") metrics.push(evaluateBatteryLevel(health.batteryLevel))
  if (typeof health.tirePressure === "number") metrics.push(evaluateTirePressure(health.tirePressure))
  if (typeof health.fuelLevel === "number") metrics.push(evaluateFuelLevel(health.fuelLevel))

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
