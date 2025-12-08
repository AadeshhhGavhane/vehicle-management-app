"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getVehiclesAction } from "@/app/actions/vehicles"
import type { Vehicle } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Car } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVoiceChat } from "@/hooks/use-voice-chat"
import { ConnectionState } from "@/hooks/voice-chat-types"
import { Waveform } from "@/components/dashboard/waveform"

export default function VoiceChatPage() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null

  const { connect, disconnect, connectionState, messages, audioInputAnalyser, audioOutputAnalyser } =
    useVoiceChat(selectedVehicle)

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
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleToggleConnect = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect()
    } else {
      if (!selectedVehicle) {
        alert("Please select a vehicle first")
        return
      }
      connect()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-md shadow-sm border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif text-xl shadow-lg">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">VehicleHub</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Voice Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {selectedVehicle && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedVehicle.model}</Badge>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                connectionState === ConnectionState.CONNECTED
                  ? "bg-emerald-500 animate-pulse"
                  : connectionState === ConnectionState.CONNECTING
                    ? "bg-amber-500 animate-pulse"
                    : "bg-slate-300",
              )}
            ></span>
            <span className="text-sm font-medium text-muted-foreground">
              {connectionState === ConnectionState.CONNECTED
                ? "Live"
                : connectionState === ConnectionState.CONNECTING
                  ? "Connecting..."
                  : "Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-4 overflow-hidden">
        {/* Left Panel: Vehicle Selector & Visuals */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-8 min-h-[300px]">
          {/* Vehicle Selector */}
          <div className="w-full max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Vehicle</label>
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
                disabled={connectionState === ConnectionState.CONNECTED}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vehicle.model}</span>
                        <Badge variant="outline" className="text-xs">
                          {vehicle.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedVehicle && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedVehicle.model}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Type: {selectedVehicle.type}</p>
                  <p>Status: {selectedVehicle.status || "off"}</p>
                  {selectedVehicle.health?.location && <p>Location: {selectedVehicle.health.location}</p>}
                </div>
              </Card>
            )}
          </div>

          {/* Audio Visualizers */}
          <div className="w-full max-w-md space-y-4">
            {/* Output Visualizer (AI Speaking) */}
            <div className="bg-card/60 backdrop-blur rounded-xl p-3 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider text-center">
                AI Assistant Voice
              </p>
              <Waveform analyser={audioOutputAnalyser} isActive={connectionState === ConnectionState.CONNECTED} color="#6366f1" />
            </div>

            {/* Input Visualizer (User Speaking) */}
            <div className="bg-card/60 backdrop-blur rounded-xl p-3 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider text-center">
                Your Microphone
              </p>
              <Waveform analyser={audioInputAnalyser} isActive={connectionState === ConnectionState.CONNECTED} color="#f43f5e" />
            </div>
          </div>
        </div>

        {/* Right Panel: Chat Transcript */}
        <div className="flex-1 flex flex-col bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-border overflow-hidden h-full md:h-auto">
          <div className="p-4 border-b border-border bg-card/50">
            <h2 className="text-sm font-semibold text-foreground">Conversation Transcript</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground mt-10">
                <Phone className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="mb-2 text-lg">Ready to chat!</p>
                <p className="text-sm">Select a vehicle and start the call to begin speaking.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground border border-border rounded-tl-none",
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.isPartial && (
                    <span className="inline-block w-2 h-2 ml-1 bg-current rounded-full animate-bounce"></span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="p-6 bg-card border-t border-border flex justify-center items-center">
            <Button
              onClick={handleToggleConnect}
              disabled={connectionState === ConnectionState.CONNECTING || (!selectedVehicle && connectionState !== ConnectionState.CONNECTED)}
              className={cn(
                "relative group px-8 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl flex items-center space-x-3",
                connectionState === ConnectionState.CONNECTED
                  ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                  : "bg-primary hover:bg-primary/90 shadow-primary/20",
                "disabled:opacity-70 disabled:cursor-not-allowed",
              )}
            >
              {connectionState === ConnectionState.CONNECTING ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : connectionState === ConnectionState.CONNECTED ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>End Call</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <span>Start Voice Call</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
