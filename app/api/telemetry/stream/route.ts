import { type NextRequest } from "next/server"

// Store connected clients (in-memory, works per Vercel instance)
const clients = new Set<ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add client to the set
      clients.add(controller)

      // Send initial connection message
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`))

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        clients.delete(controller)
        try {
          controller.close()
        } catch (e) {
          // Client already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}

// Broadcast function to send updates to all connected clients
export function broadcastUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`
  const encoder = new TextEncoder()
  const encoded = encoder.encode(message)

  const disconnected: ReadableStreamDefaultController[] = []

  clients.forEach((controller) => {
    try {
      controller.enqueue(encoded)
    } catch (error) {
      // Client disconnected, mark for removal
      disconnected.push(controller)
    }
  })

  // Remove disconnected clients
  disconnected.forEach((controller) => clients.delete(controller))
}

