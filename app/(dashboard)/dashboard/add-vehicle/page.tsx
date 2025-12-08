"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createVehicleAction } from "@/app/actions/vehicles"
import { validateVIN, validateRegistrationNumber } from "@/lib/validation"
import { VEHICLE_MODELS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Car, Bike, Zap, ArrowRight, ArrowLeft, Check, Copy } from "lucide-react"

type VehicleType = "car" | "bike" | "scooter"

const vehicleTypes = [
  { type: "car" as const, label: "Car", icon: Car },
  { type: "bike" as const, label: "Bike", icon: Bike },
  { type: "scooter" as const, label: "Scooter", icon: Zap },
]

export default function AddVehiclePage() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null)
  const [model, setModel] = useState("")
  const [vin, setVin] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successModal, setSuccessModal] = useState<{ open: boolean; code: string }>({ open: false, code: "" })
  const [copied, setCopied] = useState(false)

  const models = vehicleType ? VEHICLE_MODELS[`${vehicleType}s` as keyof typeof VEHICLE_MODELS] : []

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!vehicleType) {
      setError("Please select a vehicle type")
      return
    }
    if (!model) {
      setError("Please select a model")
      return
    }
    setStep(2)
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const vinValidation = validateVIN(vin.toUpperCase())
    if (!vinValidation.valid) {
      setError(vinValidation.error || "Invalid VIN")
      return
    }

    const regValidation = validateRegistrationNumber(registrationNumber.toUpperCase())
    if (!regValidation.valid) {
      setError(regValidation.error || "Invalid registration number")
      return
    }

    if (!user) return

    setIsLoading(true)

    const result = await createVehicleAction(vehicleType!, model, vin.toUpperCase(), registrationNumber.toUpperCase())

    setIsLoading(false)

    if (result.success && result.vehicle) {
      setSuccessModal({ open: true, code: result.vehicle.uniqueCode })
    } else {
      setError(result.error || "Failed to add vehicle")
    }
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(successModal.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setStep(1)
    setVehicleType(null)
    setModel("")
    setVin("")
    setRegistrationNumber("")
    setError("")
    setSuccessModal({ open: false, code: "" })
    setCopied(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Add Vehicle</h1>
        <p className="text-muted-foreground mt-1">Register a new vehicle to your account</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        <StepIndicator step={1} currentStep={step} label="Type & Model" />
        <div className="h-px w-8 bg-border" />
        <StepIndicator step={2} currentStep={step} label="Details" />
      </div>

      <Card className="max-w-2xl">
        {step === 1 ? (
          <form onSubmit={handleStep1Submit}>
            <CardHeader>
              <CardTitle>Select Vehicle Type & Model</CardTitle>
              <CardDescription>Choose the type of vehicle and select a model from the list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

              <div className="space-y-3">
                <Label>Vehicle Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {vehicleTypes.map((vt) => (
                    <button
                      key={vt.type}
                      type="button"
                      onClick={() => {
                        setVehicleType(vt.type)
                        setModel("")
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        vehicleType === vt.type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50",
                      )}
                    >
                      <vt.icon
                        className={cn("h-8 w-8", vehicleType === vt.type ? "text-primary" : "text-muted-foreground")}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          vehicleType === vt.type ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {vt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {vehicleType && (
                <div className="space-y-3">
                  <Label>Select Model</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                    {models.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        className={cn(
                          "text-left px-4 py-3 rounded-lg border transition-all text-sm",
                          model === m
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border hover:border-muted-foreground/50 text-foreground",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={!vehicleType || !model}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit}>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
              <CardDescription>Enter the VIN and registration number for your {model}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                {vehicleType === "car" ? (
                  <Car className="h-5 w-5 text-muted-foreground" />
                ) : vehicleType === "bike" ? (
                  <Bike className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Zap className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">{model}</p>
                  <p className="text-sm text-muted-foreground capitalize">{vehicleType}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
                <Input
                  id="vin"
                  type="text"
                  placeholder="MA1TA2B3C4D567890"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  maxLength={17}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">17-character alphanumeric code</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration">Registration Number</Label>
                <Input
                  id="registration"
                  type="text"
                  placeholder="MH12AB1234"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">Indian vehicle registration format</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Adding Vehicle..." : "Add Vehicle"}
                </Button>
              </div>
            </CardContent>
          </form>
        )}
      </Card>

      <Dialog open={successModal.open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
              <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-center">Vehicle Added Successfully</DialogTitle>
            <DialogDescription className="text-center">
              Your {model} has been registered. Here is your unique vehicle code:
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 py-4">
            <code className="text-2xl font-mono font-bold tracking-widest text-foreground bg-muted px-4 py-2 rounded-lg">
              {successModal.code}
            </code>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={copyCode} variant="outline" className="w-full bg-transparent">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </Button>
            <Button onClick={resetForm} className="w-full">
              Add Another Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StepIndicator({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
  const isActive = currentStep >= step
  const isComplete = currentStep > step

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
          isComplete
            ? "bg-primary text-primary-foreground"
            : isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
        )}
      >
        {isComplete ? <Check className="h-4 w-4" /> : step}
      </div>
      <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  )
}
