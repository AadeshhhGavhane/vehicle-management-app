export interface User {
  id: string
  name: string
  phone: string
  email: string
  password: string
}

export interface Vehicle {
  id: string
  userId: string
  type: "car" | "bike" | "scooter"
  model: string
  vin: string
  registrationNumber: string
  uniqueCode: string
  createdAt: string
  health: VehicleHealth
}

export interface VehicleHealth {
  engineTemperature: number // 0-150°C, good: <90, warning: 90-110, bad: >110
  batteryLevel: number // 0-100%, good: >50, warning: 20-50, bad: <20
  oilPressure?: number // 0-100 psi, good: 25-65, warning: 15-25 or 65-80, bad: <15 or >80
  tirePressure: number // 0-50 psi, good: 30-35, warning: 25-30 or 35-40, bad: <25 or >40
  fuelLevel: number // 0-100%, good: >25, warning: 10-25, bad: <10
  mileage: number // km
  lastServiceDate?: string
  isActive: boolean
  location: string
  condition?: ConditionResult
}

export type ConditionStatus = "good" | "warning" | "bad"

export interface ConditionResult {
  overall: ConditionStatus
  problematicMetrics: {
    name: string
    value: number
    status: ConditionStatus
    unit: string
  }[]
}

export const VEHICLE_MODELS = {
  cars: [
    "Maruti Brezza",
    "Hyundai Creta",
    "Tata Punch",
    "Tata Nexon",
    "Mahindra Scorpio-N",
    "Kia Seltos",
    "Maruti Swift",
    "Hyundai Venue",
    "Mahindra Thar",
    "Hyundai i20",
  ],
  bikes: [
    "Royal Enfield Classic 350",
    "Royal Enfield Hunter 350",
    "Bajaj Pulsar N160",
    "TVS Apache RTR 160 4V",
    "Hero Splendor Plus",
    "Yamaha MT-15",
    "Yamaha R15 V4",
    "KTM Duke 200",
    "Bajaj Pulsar 220F",
    "Honda SP 125",
  ],
  scooters: [
    "Honda Activa 6G",
    "TVS Jupiter",
    "Honda Dio",
    "TVS NTorq 125",
    "Ola S1 Pro",
    "Ather 450X",
    "Suzuki Access 125",
    "Suzuki Burgman Street",
    "Hero Maestro Edge",
    "Bounce Infinity E1",
  ],
}
