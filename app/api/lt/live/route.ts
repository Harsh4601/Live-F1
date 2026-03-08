import { NextResponse } from 'next/server'
import WebSocket from 'ws'
import { inflateRawSync, inflateSync } from 'zlib'

const SIGNALR_BASE = 'https://livetiming.formula1.com/signalr'

const TOPICS = [
  'TimingData',
  'DriverList',
  'LapCount',
  'TimingAppData',
  'WeatherData',
  'TrackStatus',
  'RaceControlMessages',
  'SessionInfo',
  'SessionStatus',
  'ExtrapolatedClock',
  'Position.z',
]

interface CarPosition {
  X: number
  Y: number
  Z: number
  Status: string
}

interface PositionFrame {
  timestamp: string
  entries: Record<string, CarPosition>
}

interface LTStore {
  ws: WebSocket | null
  connected: boolean
  connecting: boolean
  data: Record<string, any>
  positions: PositionFrame[]
  trackPath: Array<{ x: number; y: number }>
  lastUpdate: number
  error: string | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
}

const MAX_POSITION_FRAMES = 30

const g = globalThis as unknown as { __ltSignalR?: LTStore }

function store(): LTStore {
  if (!g.__ltSignalR) {
    g.__ltSignalR = {
      ws: null,
      connected: false,
      connecting: false,
      data: {},
      positions: [],
      trackPath: [],
      lastUpdate: 0,
      error: null,
      reconnectTimer: null,
    }
  }
  return g.__ltSignalR
}

function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) return target
  if (typeof source !== 'object' || Array.isArray(source)) return source
  if (target === null || target === undefined) return source

  // When target is an array and source is an object with numeric keys,
  // merge into the array (SignalR sends array-index updates as objects)
  if (Array.isArray(target)) {
    const result = [...target]
    for (const key of Object.keys(source)) {
      const idx = parseInt(key)
      if (!isNaN(idx)) {
        while (result.length <= idx) result.push({})
        result[idx] = deepMerge(result[idx], source[key])
      }
    }
    return result
  }

  if (typeof target !== 'object') return source

  const result = { ...target }
  for (const key of Object.keys(source)) {
    result[key] = deepMerge(result[key], source[key])
  }
  return result
}

function decompressZ(b64: string): any {
  try {
    const buf = Buffer.from(b64, 'base64')
    // Try raw deflate first, then zlib with header
    let inflated: Buffer
    try {
      inflated = inflateRawSync(buf)
    } catch {
      inflated = inflateSync(buf)
    }
    return JSON.parse(inflated.toString('utf-8'))
  } catch {
    return null
  }
}

function processPositionData(raw: any) {
  const s = store()
  if (!raw?.Position || !Array.isArray(raw.Position)) return

  for (const frame of raw.Position) {
    if (!frame.Entries) continue
    const entries: Record<string, CarPosition> = {}
    for (const [num, pos] of Object.entries<any>(frame.Entries)) {
      if (pos.X !== undefined && pos.Y !== undefined) {
        entries[num] = {
          X: pos.X,
          Y: pos.Y,
          Z: pos.Z ?? 0,
          Status: pos.Status || 'OnTrack',
        }
      }
    }
    if (Object.keys(entries).length > 0) {
      s.positions.push({ timestamp: frame.Timestamp || '', entries })
      // Build track path from leader's positions for the outline
      const firstDriver = Object.values(entries)[0]
      if (firstDriver && s.trackPath.length < 2000) {
        s.trackPath.push({ x: firstDriver.X, y: firstDriver.Y })
      }
    }
  }

  // Keep only recent frames
  if (s.positions.length > MAX_POSITION_FRAMES) {
    s.positions = s.positions.slice(-MAX_POSITION_FRAMES)
  }
}

function processMessage(raw: string) {
  const s = store()
  const parts = raw.split('\x1e').filter(Boolean)

  for (const part of parts) {
    try {
      const msg = JSON.parse(part)

      if (msg.R && typeof msg.R === 'object') {
        for (const [topic, topicData] of Object.entries(msg.R)) {
          if (topic.endsWith('.z') && typeof topicData === 'string') {
            const decoded = decompressZ(topicData)
            if (decoded) {
              if (topic === 'Position.z') processPositionData(decoded)
              s.data[topic.replace('.z', '')] = decoded
            }
          } else {
            s.data[topic] = topicData
          }
        }
        s.lastUpdate = Date.now()
      }

      if (Array.isArray(msg.M)) {
        for (const m of msg.M) {
          if (m.M === 'feed' && Array.isArray(m.A) && m.A.length >= 2) {
            const topic = m.A[0] as string
            const update = m.A[1]

            if (topic.endsWith('.z') && typeof update === 'string') {
              const decoded = decompressZ(update)
              if (decoded) {
                if (topic === 'Position.z') processPositionData(decoded)
              }
            } else {
              s.data[topic] = deepMerge(s.data[topic] ?? {}, update)
            }
          }
        }
        s.lastUpdate = Date.now()
      }
    } catch {
      // skip malformed frames
    }
  }
}

function scheduleReconnect() {
  const s = store()
  if (s.reconnectTimer) return
  s.reconnectTimer = setTimeout(async () => {
    s.reconnectTimer = null
    try {
      await connect()
    } catch {
      scheduleReconnect()
    }
  }, 5000)
}

async function connect(): Promise<void> {
  const s = store()
  if (s.connected || s.connecting) return

  s.connecting = true
  s.error = null

  try {
    const negUrl =
      `${SIGNALR_BASE}/negotiate?` +
      `connectionData=${encodeURIComponent(JSON.stringify([{ name: 'streaming' }]))}` +
      `&clientProtocol=1.5`

    const negRes = await fetch(negUrl)
    if (!negRes.ok) throw new Error(`Negotiate failed: ${negRes.status}`)

    const { ConnectionToken } = await negRes.json()

    const wsUrl =
      `wss://livetiming.formula1.com/signalr/connect?` +
      `transport=webSockets` +
      `&connectionToken=${encodeURIComponent(ConnectionToken)}` +
      `&connectionData=${encodeURIComponent(JSON.stringify([{ name: 'streaming' }]))}` +
      `&clientProtocol=1.5`

    const ws = new WebSocket(wsUrl)
    s.ws = ws

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close()
        s.connecting = false
        reject(new Error('Connection timeout'))
      }, 15000)

      ws.on('open', () => {
        clearTimeout(timeout)
        s.connected = true
        s.connecting = false

        // Subscribe to ALL topics in one call (including .z)
        ws.send(
          JSON.stringify({
            H: 'Streaming',
            M: 'Subscribe',
            A: [TOPICS],
            I: 1,
          })
        )
        resolve()
      })

      ws.on('message', (buf) => processMessage(buf.toString()))

      ws.on('close', () => {
        s.connected = false
        s.connecting = false
        s.ws = null
        scheduleReconnect()
      })

      ws.on('error', (err) => {
        clearTimeout(timeout)
        s.connected = false
        s.connecting = false
        s.ws = null
        s.error = err.message
        scheduleReconnect()
        reject(err)
      })
    })
  } catch (err: any) {
    s.connecting = false
    s.error = err.message
    throw err
  }
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const s = store()

  if (!s.connected && !s.connecting) {
    try {
      await connect()
      await new Promise((r) => setTimeout(r, 2500))
    } catch (err: any) {
      return NextResponse.json(
        { connected: false, error: err.message, data: {} },
        { status: 502 }
      )
    }
  }

  if (s.connecting) {
    await new Promise((r) => setTimeout(r, 3000))
  }

  // Latest position frame for each car
  const latestPositions: Record<string, CarPosition> =
    s.positions.length > 0 ? s.positions[s.positions.length - 1].entries : {}

  return NextResponse.json(
    {
      connected: s.connected,
      topics: Object.keys(s.data),
      lastUpdate: s.lastUpdate,
      data: s.data,
      carPositions: latestPositions,
      trackPath: s.trackPath,
    },
    { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
  )
}

export async function DELETE() {
  const s = store()
  if (s.reconnectTimer) clearTimeout(s.reconnectTimer)
  s.reconnectTimer = null
  if (s.ws) {
    s.ws.close()
    s.ws = null
  }
  s.connected = false
  s.connecting = false
  s.data = {}
  s.positions = []
  s.trackPath = []
  s.lastUpdate = 0
  s.error = null

  return NextResponse.json({ disconnected: true })
}
