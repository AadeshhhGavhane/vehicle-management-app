"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getVehiclesAction } from "@/app/actions/vehicles"
import type { Vehicle } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface TelemetryLog {
  id: string
  timestamp: string
  vehicle: {
    id: string
    model: string
    type: string
    code: string
    registrationNumber: string
  }
  location: {
    lat: number | null
    lng: number | null
    label: string | null
  }
  status: string
  health: any
}

type SortField = "created_at" | "model" | "label" | "status"
type SortOrder = "asc" | "desc"

export default function LogsPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [logs, setLogs] = useState<TelemetryLog[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadVehicles() {
      if (user) {
        const data = await getVehiclesAction()
        setVehicles(data)
      }
    }
    loadVehicles()
  }, [user])

  useEffect(() => {
    async function loadLogs() {
      if (!user) return

      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          sortBy,
          sortOrder,
          page: page.toString(),
        })
        if (selectedVehicleId !== "all") {
          params.append("vehicleId", selectedVehicleId)
        }

        const res = await fetch(`/api/telemetry/logs?${params}`)
        const data = await res.json()

        if (data.success) {
          setLogs(data.logs)
          setTotalPages(data.pagination.totalPages)
        }
      } catch (error) {
        console.error("Failed to load logs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLogs()
  }, [user, selectedVehicleId, sortBy, sortOrder, page])

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    )
  }

  const getConditionBadge = (health: any) => {
    const condition = health?.condition?.overall || "good"
    return (
      <Badge
        variant="outline"
        className={cn(
          condition === "good" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500",
          condition === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500",
          condition === "bad" && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500",
        )}
      >
        {condition === "good" ? "Healthy" : condition === "warning" ? "Needs Attention" : "Critical"}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Telemetry Logs</h1>
        <p className="text-muted-foreground mt-1">View historical vehicle telemetry data</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Logs</CardTitle>
              <CardDescription>Filter and sort telemetry history</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedVehicleId} onValueChange={(value) => {
                setSelectedVehicleId(value)
                setPage(1)
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} ({vehicle.uniqueCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">No logs found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Telemetry logs will appear here once vehicles send data</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 -ml-2"
                        onClick={() => handleSort("created_at")}
                      >
                        Timestamp
                        {getSortIcon("created_at")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 -ml-2"
                        onClick={() => handleSort("model")}
                      >
                        Vehicle
                        {getSortIcon("model")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 -ml-2"
                        onClick={() => handleSort("label")}
                      >
                        Location
                        {getSortIcon("label")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 -ml-2"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        {getSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead>Health Condition</TableHead>
                    <TableHead className="w-[100px]">Raw Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow className="cursor-pointer" onClick={() => toggleRow(log.id)}>
                        <TableCell className="font-mono text-sm">{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.vehicle.model}</div>
                            <div className="text-sm text-muted-foreground">{log.vehicle.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.location.label || (
                            <span className="text-muted-foreground">
                              {log.location.lat?.toFixed(4)}, {log.location.lng?.toFixed(4)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.status === "on" ? "default" : "secondary"}>
                            {log.status === "on" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getConditionBadge(log.health)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation()
                            toggleRow(log.id)
                          }}>
                            {expandedRows.has(log.id) ? "Hide" : "Show"}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(log.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <pre className="p-4 rounded-lg bg-background text-sm overflow-auto max-h-96 font-mono">
                              {JSON.stringify(log.health, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

