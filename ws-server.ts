import { WebSocketServer } from 'ws'
import type { WebSocket } from 'ws'
import { randomUUID } from 'node:crypto'

const PORT = 3002

interface Category {
  id: string
  label: string
  scraper: string
  field: string
}

const NFL_CATEGORIES: Category[] = [
  { id: 'ppr',  label: 'PPR Fantasy Points',  scraper: 'PPRFantasyFootball', field: 'FantPt'       },
  { id: 'rush', label: 'Rushing Yards',        scraper: 'FootballYardage',   field: 'RushingYds'   },
  { id: 'rec',  label: 'Receiving Yards',      scraper: 'FootballYardage',   field: 'ReceivingYds' },
  { id: 'tot',  label: 'Passing Touchdowns',   scraper: 'FootballTDs',       field: 'PassingTDs'   },
]

const NFL_DIVISIONS = [
  'AFC East', 'AFC North', 'AFC South', 'AFC West',
  'NFC East', 'NFC North', 'NFC South', 'NFC West',
]

interface PlayerState {
  id: string
  name: string
  ready: boolean
  submitted: boolean
  ws: WebSocket
}

interface Room {
  id: string
  hostId: string
  players: Map<string, PlayerState>
  gameConfig: { categoryIds: string[]; year: number }
  gameState: 'lobby' | 'playing' | 'scoring'
  category?: Category
  division?: string
  submissions: Map<string, { playerName: string; names: string[] }>
}

const rooms = new Map<string, Room>()

function send(ws: WebSocket, msg: object) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg))
}

function broadcastRoomState(room: Room) {
  const msg = JSON.stringify({
    type: 'room_state',
    roomId: room.id,
    hostId: room.hostId,
    gameState: room.gameState,
    gameConfig: room.gameConfig,
    category: room.category ?? null,
    division: room.division ?? null,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      submitted: p.submitted,
    })),
  })
  room.players.forEach(p => { if (p.ws.readyState === 1) p.ws.send(msg) })
}

function startGame(room: Room) {
  const cats = NFL_CATEGORIES.filter(c => room.gameConfig.categoryIds.includes(c.id))
  const category = cats[Math.floor(Math.random() * cats.length)]
  const division = NFL_DIVISIONS[Math.floor(Math.random() * NFL_DIVISIONS.length)]
  room.category = category
  room.division = division
  room.gameState = 'playing'
  room.submissions.clear()
  room.players.forEach(p => { p.submitted = false; p.ready = false })
  broadcastRoomState(room)
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  const playerId = randomUUID()
  let room: Room | null = null

  ws.on('message', (data) => {
    let msg: Record<string, unknown>
    try { msg = JSON.parse(data.toString()) as Record<string, unknown> }
    catch { return }

    switch (msg.type) {
      case 'create_room': {
        const roomId = (msg.roomId as string) || randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
        room = {
          id: roomId,
          hostId: playerId,
          players: new Map(),
          gameConfig: {
            categoryIds: (msg.categoryIds as string[]) ?? [],
            year: (msg.year as number) ?? 2023,
          },
          gameState: 'lobby',
          submissions: new Map(),
        }
        rooms.set(roomId, room)
        room.players.set(playerId, {
          id: playerId,
          name: msg.playerName as string,
          ready: false,
          submitted: false,
          ws,
        })
        send(ws, { type: 'joined', roomId, playerId, isHost: true })
        broadcastRoomState(room)
        break
      }

      case 'join_room': {
        const r = rooms.get(msg.roomId as string)
        if (!r) { send(ws, { type: 'error', message: 'Room not found' }); break }
        if (r.gameState !== 'lobby') { send(ws, { type: 'error', message: 'Game already started' }); break }
        room = r
        room.players.set(playerId, {
          id: playerId,
          name: msg.playerName as string,
          ready: false,
          submitted: false,
          ws,
        })
        send(ws, { type: 'joined', roomId: r.id, playerId, isHost: r.hostId === playerId })
        broadcastRoomState(room)
        break
      }

      case 'ready': {
        if (!room) break
        const p = room.players.get(playerId)
        if (!p) break
        p.ready = !p.ready
        broadcastRoomState(room)
        // Auto-start when all players ready (min 2)
        const all = room.players.size >= 2 && [...room.players.values()].every(x => x.ready)
        if (all && room.gameState === 'lobby') startGame(room)
        break
      }

      case 'submit_names': {
        if (!room || room.gameState !== 'playing') break
        const p = room.players.get(playerId)
        if (!p || p.submitted) break
        p.submitted = true
        room.submissions.set(playerId, {
          playerName: p.name,
          names: (msg.names as string[]).slice(0, 5),
        })
        broadcastRoomState(room)
        const allDone = [...room.players.values()].every(x => x.submitted)
        if (allDone) {
          room.gameState = 'scoring'
          const reveal = JSON.stringify({
            type: 'all_submitted',
            submissions: [...room.submissions.entries()].map(([id, s]) => ({
              playerId: id,
              playerName: s.playerName,
              names: s.names,
            })),
            category: room.category,
            division: room.division,
            year: room.gameConfig.year,
          })
          room.players.forEach(p2 => { if (p2.ws.readyState === 1) p2.ws.send(reveal) })
          broadcastRoomState(room)
        }
        break
      }

      case 'play_again': {
        if (!room || room.hostId !== playerId) break
        room.gameState = 'lobby'
        room.category = undefined
        room.division = undefined
        room.submissions.clear()
        room.players.forEach(p => { p.ready = false; p.submitted = false })
        broadcastRoomState(room)
        break
      }
    }
  })

  ws.on('close', () => {
    if (!room) return
    room.players.delete(playerId)
    if (room.players.size === 0) {
      rooms.delete(room.id)
    } else {
      if (room.hostId === playerId) {
        room.hostId = room.players.keys().next().value!
      }
      broadcastRoomState(room)
    }
  })
})

console.log(`Scattegory WS server on ws://localhost:${PORT}`)
