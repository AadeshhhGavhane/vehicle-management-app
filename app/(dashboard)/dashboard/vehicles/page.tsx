"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getVehiclesAction, deleteVehicleAction, regenerateVehicleCodeAction } from "@/app/actions/vehicles"
import type { Vehicle } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Car, Bike, Zap, Copy, Check, RefreshCw, Trash2 } from "lucide-react"

export default function VehiclesPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; vehicle: Vehicle | null }>({
    open: false,
    vehicle: null,
  })
  const [regenerateModal, setRegenerateModal] = useState<{ open: boolean; vehicle: Vehicle | null; newCode: string }>({
    open: false,
    vehicle: null,
    newCode: "",
  })

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
  }, [user])

  const copyCode = async (vehicleId: string, code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(vehicleId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async () => {
    if (deleteModal.vehicle) {
      const success = await deleteVehicleAction(deleteModal.vehicle.id)
      if (success) {
        setVehicles(vehicles.filter((v) => v.id !== deleteModal.vehicle!.id))
      }
      setDeleteModal({ open: false, vehicle: null })
    }
  }

  const handleRegenerate = async (vehicle: Vehicle) => {
    const result = await regenerateVehicleCodeAction(vehicle.id)
    if (result.success && result.newCode) {
      setRegenerateModal({ open: true, vehicle, newCode: result.newCode })
      // Refresh vehicles list
      const data = await getVehiclesAction()
      setVehicles(data)
    }
  }

  const VehicleIcon = ({ type }: { type: string }) => {
    if (type === "car") return <Car className="h-5 w-5" />
    if (type === "bike") return <Bike className="h-5 w-5" />
    return <Zap className="h-5 w-5" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Vehicles</h1>
        <p className="text-muted-foreground mt-1">Manage and track all your registered vehicles</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Loading vehicles...</p>
          </CardContent>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No vehicles registered</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first vehicle to get started</p>
            <Button className="mt-4" asChild>
              <a href="/dashboard/add-vehicle">Add Vehicle</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <VehicleIcon type={vehicle.type} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{vehicle.model}</CardTitle>
                      <CardDescription className="capitalize">{vehicle.type}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteModal({ open: true, vehicle })}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete vehicle</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Registration</p>
                    <p className="font-medium text-foreground">{vehicle.registrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">VIN</p>
                    <p className="font-medium text-foreground font-mono text-xs">{vehicle.vin}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Unique Code</p>
                    <code className="text-sm font-mono font-bold tracking-wider text-foreground">
                      {vehicle.uniqueCode}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(vehicle.id, vehicle.uniqueCode)}
                      className="h-8 gap-1.5"
                    >
                      {copiedId === vehicle.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === vehicle.id ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerate(vehicle)}
                      className="h-8 gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open, vehicle: deleteModal.vehicle })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium">{deleteModal.vehicle?.model}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={regenerateModal.open} onOpenChange={(open) => setRegenerateModal({ ...regenerateModal, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Code Regenerated</DialogTitle>
            <DialogDescription>
              The unique code for your {regenerateModal.vehicle?.model} has been regenerated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <code className="text-2xl font-mono font-bold tracking-widest text-foreground bg-muted px-4 py-2 rounded-lg">
              {regenerateModal.newCode}
            </code>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                copyCode("regenerated", regenerateModal.newCode)
                setRegenerateModal({ open: false, vehicle: null, newCode: "" })
              }}
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
