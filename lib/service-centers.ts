// Service centers data structure
export interface ServiceCenter {
  name: string
  lat: number
  lng: number
}

export interface Garage {
  name: string
  lat: number
  lng: number
}

export interface FuelStation {
  name: string
  lat: number
  lng: number
  fuels: {
    petrol: boolean
    diesel: boolean
    cng: boolean
  }
}

export interface CityInfrastructure {
  city: string
  latitude: number
  longitude: number
  service_centers: ServiceCenter[]
  garages: Garage[]
  fuel_stations: FuelStation[]
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Load service centers data
export async function getServiceCentersData(): Promise<CityInfrastructure[]> {
  // In a real app, this would be an API call or database query
  // For now, we'll import the JSON file
  const data = await import("@/mock-dataset/indian_city_vehicle_infra_mock_small.json")
  return data.default as CityInfrastructure[]
}

