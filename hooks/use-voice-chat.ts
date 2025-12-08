"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai"
import { ConnectionState, VoiceMessage } from "./voice-chat-types"
import { createPCMBlob, decodeAudioData, base64ToUint8Array } from "@/lib/audio-utils"
import type { Vehicle } from "@/lib/types"

async function buildSystemInstruction(vehicle: Vehicle): Promise<string> {
  if (!vehicle) {
    return "You are a helpful vehicle health and maintenance assistant."
  }

  try {
    const response = await fetch(`/api/voice-chat-system-prompt?vehicleId=${vehicle.id}`)
    if (response.ok) {
      const data = await response.json()
      return data.systemPrompt
    }
  } catch (e) {
    console.error("Error fetching system prompt:", e)
  }

  // Fallback system instruction
  return `You are a helpful vehicle health and maintenance assistant. Keep your responses concise and spoken-word friendly.`
}

export function useVoiceChat(selectedVehicle: Vehicle | null) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [audioInputAnalyser, setAudioInputAnalyser] = useState<AnalyserNode | null>(null)
  const [audioOutputAnalyser, setAudioOutputAnalyser] = useState<AnalyserNode | null>(null)

  const aiRef = useRef<GoogleGenAI | null>(null)
  const sessionPromiseRef = useRef<Promise<any> | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const inputContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

  const nextStartTimeRef = useRef<number>(0)
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())

  // Current transcription buffers
  const currentInputTransRef = useRef<string>("")
  const currentOutputTransRef = useRef<string>("")

  const disconnect = useCallback(async () => {
    // 1. Close session
    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current
      if (session && typeof session.close === "function") {
        session.close()
      }
      sessionPromiseRef.current = null
    }

    // 2. Stop audio contexts
    if (audioContextRef.current) {
      await audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (inputContextRef.current) {
      await inputContextRef.current.close()
      inputContextRef.current = null
    }

    // 3. Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // 4. Cleanup nodes
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    // 5. Stop playing audio
    scheduledSourcesRef.current.forEach((s) => {
      try {
        s.stop()
      } catch (e) {
        // Ignore
      }
    })
    scheduledSourcesRef.current.clear()

    setConnectionState(ConnectionState.DISCONNECTED)
    setAudioInputAnalyser(null)
    setAudioOutputAnalyser(null)
    nextStartTimeRef.current = 0
    currentInputTransRef.current = ""
    currentOutputTransRef.current = ""
    setMessages([])
  }, [])

  const connect = useCallback(async () => {
    try {
      if (!selectedVehicle) {
        throw new Error("Please select a vehicle first")
      }

      setConnectionState(ConnectionState.CONNECTING)

      // Initialize API
      // In Next.js, client-side env vars need NEXT_PUBLIC_ prefix
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY
      if (!apiKey) {
        throw new Error("Gemini API Key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.")
      }
      aiRef.current = new GoogleGenAI({ apiKey })

      // Build system instruction with vehicle context
      const systemInstruction = await buildSystemInstruction(selectedVehicle)

      // Setup Audio Contexts
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 })

      // Setup Analysers for Visuals
      const inAnalyser = inputContextRef.current.createAnalyser()
      inAnalyser.fftSize = 256
      setAudioInputAnalyser(inAnalyser)

      const outAnalyser = audioContextRef.current.createAnalyser()
      outAnalyser.fftSize = 256
      setAudioOutputAnalyser(outAnalyser)

      // Connect to Mic
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      sourceRef.current = inputContextRef.current.createMediaStreamSource(streamRef.current)
      sourceRef.current.connect(inAnalyser)

      // Connect to Gemini Live
      const sessionPromise = aiRef.current.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Session Opened")
            setConnectionState(ConnectionState.CONNECTED)

            // Start processing audio input
            if (!inputContextRef.current || !sourceRef.current) return

            processorRef.current = inputContextRef.current.createScriptProcessor(4096, 1, 1)
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0)
              const pcmBlob = createPCMBlob(inputData)
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob })
              })
            }

            sourceRef.current.connect(processorRef.current)
            processorRef.current.connect(inputContextRef.current.destination)
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              currentOutputTransRef.current += message.serverContent.outputTranscription.text
              // Update partial assistant message
              setMessages((prev) => {
                const last = prev[prev.length - 1]
                if (last && last.role === "assistant" && last.isPartial) {
                  return [...prev.slice(0, -1), { ...last, text: currentOutputTransRef.current }]
                } else {
                  return [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      role: "assistant",
                      text: currentOutputTransRef.current,
                      timestamp: new Date(),
                      isPartial: true,
                    },
                  ]
                }
              })
            }

            if (message.serverContent?.inputTranscription) {
              currentInputTransRef.current += message.serverContent.inputTranscription.text
              // Update partial user message
              setMessages((prev) => {
                const last = prev[prev.length - 1]
                if (last && last.role === "user" && last.isPartial) {
                  return [...prev.slice(0, -1), { ...last, text: currentInputTransRef.current }]
                } else {
                  return [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      role: "user",
                      text: currentInputTransRef.current,
                      timestamp: new Date(),
                      isPartial: true,
                    },
                  ]
                }
              })
            }

            if (message.serverContent?.turnComplete) {
              // Finalize messages
              setMessages((prev) => {
                return prev.map((m) => (m.isPartial ? { ...m, isPartial: false } : m))
              })
              currentInputTransRef.current = ""
              currentOutputTransRef.current = ""
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current
              // Ensure we don't drift too far behind or start too early
              const now = ctx.currentTime
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now)

              const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), ctx, 24000, 1)

              const source = ctx.createBufferSource()
              source.buffer = audioBuffer

              // Connect to visualiser then destination
              if (audioOutputAnalyser) {
                source.connect(audioOutputAnalyser)
                audioOutputAnalyser.connect(ctx.destination)
              } else {
                source.connect(ctx.destination)
              }

              source.start(nextStartTimeRef.current)
              nextStartTimeRef.current += audioBuffer.duration

              scheduledSourcesRef.current.add(source)
              source.onended = () => {
                scheduledSourcesRef.current.delete(source)
              }
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Interrupted")
              scheduledSourcesRef.current.forEach((s) => s.stop())
              scheduledSourcesRef.current.clear()
              nextStartTimeRef.current = 0
              currentOutputTransRef.current = "" // Clear ongoing transcription
            }
          },
          onclose: () => {
            console.log("Session Closed")
            disconnect()
          },
          onerror: (err) => {
            console.error("Session Error", err)
            disconnect()
            setConnectionState(ConnectionState.ERROR)
          },
        },
      })

      sessionPromiseRef.current = sessionPromise
    } catch (error) {
      console.error("Connection failed", error)
      setConnectionState(ConnectionState.ERROR)
      disconnect()
    }
  }, [disconnect, selectedVehicle, audioOutputAnalyser])

  return {
    connect,
    disconnect,
    connectionState,
    messages,
    audioInputAnalyser,
    audioOutputAnalyser,
  }
}
