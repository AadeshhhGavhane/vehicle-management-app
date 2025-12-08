export interface VoiceMessage {
  id: string
  role: "user" | "assistant"
  text: string
  timestamp: Date
  isPartial?: boolean
}

export enum ConnectionState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  ERROR = "ERROR",
}

