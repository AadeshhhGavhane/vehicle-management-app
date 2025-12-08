// VIN validation: Indian VIN format (17 characters, alphanumeric)
export function validateVIN(vin: string): { valid: boolean; error?: string } {
  if (!vin) return { valid: false, error: "VIN is required" }
  if (vin.length !== 17) return { valid: false, error: "VIN must be 17 characters" }
  if (!/^[A-Z0-9]+$/i.test(vin)) return { valid: false, error: "VIN must contain only letters and numbers" }
  return { valid: true }
}

// Indian license plate validation
export function validateRegistrationNumber(regNum: string): { valid: boolean; error?: string } {
  if (!regNum) return { valid: false, error: "Registration number is required" }
  // Format: XX00XX0000 (state code, district, series, number)
  const pattern = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i
  if (!pattern.test(regNum)) {
    return { valid: false, error: "Invalid format (e.g., MH12AB1234)" }
  }
  return { valid: true }
}

// Phone number validation (Indian format)
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) return { valid: false, error: "Phone number is required" }
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length !== 10) return { valid: false, error: "Phone must be 10 digits" }
  if (!/^[6-9]/.test(cleaned)) return { valid: false, error: "Invalid Indian phone number" }
  return { valid: true }
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: "Email is required" }
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!pattern.test(email)) return { valid: false, error: "Invalid email format" }
  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: "Password is required" }
  if (password.length < 6) return { valid: false, error: "Password must be at least 6 characters" }
  return { valid: true }
}
