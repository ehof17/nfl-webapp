import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react'
import { NFL_CATEGORIES } from '#/lib/dartsConfig'
import { fetchPlayerStats, filterToDivision, type NFLDivision } from '#/api/getNFLData'

// ---------------------------------------------------------------------------
// Server fn — fetch a single player's stat for scoring
// ---------------------------------------------------------------------------
const fetchScattegoryResult = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { playerName: string; year: number; categoryId: string; division: string }) => data,
  )
  .handler(async ({ data }) => {
    const category = NFL_CATEGORIES.find(c => c.id === data.categoryId)
    if (!category) return { value: 0 }
    const res = await fetchPlayerStats(data.playerName, category.scraper)
    if (res.status !== 'ready') return { value: 0 }
    const filtered = filterToDivision(res.data, data.division as NFLDivision).filter(
      s => s.Year === data.year,
    )
    const season = filtered[0] as unknown as Record<string, unknown> | undefined
    const value = season != null ? (season[category.field] as number) ?? 0 : 0
    return { value }
  })

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export const Route = createFileRoute('/games/scattegory/$roomId')({
  validateSearch: (raw: Record<string, unknown>) => ({
    name: typeof raw.name === 'string' ? raw.name : '',
    year: typeof raw.year === 'number' ? raw.year : 2023,
    cats: Array.isArray(raw.cats) ? (raw.cats as string[]) : [],
    host: raw.host === true || raw.host === 'true',
  }),
  component: RoomPage,
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Player {
  id: string
  name: string
  ready: boolean
  submitted: boolean
}

interface Category {
  id: string
  label: string
  scraper: string
  field: string
}

interface RoomState {
  roomId: string
  hostId: string
  gameState: 'lobby' | 'playing' | 'scoring'
  gameConfig: { categoryIds: string[]; year: number }
  category: Category | null
  division: string | null
  players: Player[]
}

interface Submission {
  playerId: string
  playerName: string
  names: string[]
}

interface ScoreEntry {
  name: string
  value: number | null
  blocked: boolean
}

interface PlayerScore {
  playerId: string
  playerName: string
  entries: ScoreEntry[]
  total: number | null
}

function getWsUrl() {
  if (typeof window === 'undefined') return 'ws://localhost:3002'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function RoomPage() {
  const { roomId } = Route.useParams()
  const { name: initName, year: initYear, cats: initCats, host: isCreator } = Route.useSearch()

  const [myName, setMyName] = useState(initName)
  const [nameInput, setNameInput] = useState('')
  const [myId, setMyId] = useState('')
  const [room, setRoom] = useState<RoomState | null>(null)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)

  // Playing phase
  const [nameInputs, setNameInputs] = useState<string[]>(['', '', '', '', ''])
  const [submitted, setSubmitted] = useState(false)

  // Scoring phase
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([])
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([])
  const [loadingScores, setLoadingScores] = useState(false)
  const [scoresDone, setScoresDone] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const scoresFetchedRef = useRef(false)

  // ------------------------------------------------------------------
  // Connect to WS
  // ------------------------------------------------------------------
  function connect(name: string) {
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      if (isCreator) {
        ws.send(JSON.stringify({
          type: 'create_room',
          roomId,
          playerName: name,
          categoryIds: initCats,
          year: initYear,
        }))
      } else {
        ws.send(JSON.stringify({ type: 'join_room', roomId, playerName: name }))
      }
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data) as Record<string, unknown>

      if (msg.type === 'joined') {
        setMyId(msg.playerId as string)
      }

      if (msg.type === 'room_state') {
        setRoom(msg as unknown as RoomState)
        setError('')
      }

      if (msg.type === 'all_submitted') {
        const subs = msg.submissions as Submission[]
        const cat = msg.category as Category
        const div = msg.division as string
        const yr = msg.year as number
        setAllSubmissions(subs)
        fetchAllScores(subs, cat, div, yr)
      }

      if (msg.type === 'error') {
        setError(msg.message as string)
      }
    }

    ws.onclose = () => {
      setConnected(false)
    }

    ws.onerror = () => {
      setError('Could not connect to game server. Make sure it is running.')
    }
  }

  // Auto-connect if name is pre-filled
  useEffect(() => {
    if (initName) {
      connect(initName)
    }
    return () => { wsRef.current?.close() }
  }, [])

  function handleNameSubmit() {
    const n = nameInput.trim()
    if (!n) return
    setMyName(n)
    connect(n)
  }

  // ------------------------------------------------------------------
  // Scoring
  // ------------------------------------------------------------------
  async function fetchAllScores(subs: Submission[], cat: Category, div: string, yr: number) {
    if (scoresFetchedRef.current) return
    scoresFetchedRef.current = true
    setLoadingScores(true)

    // Names submitted by more than one player are blocked (score 0, no fetch)
    const nameCount = new Map<string, number>()
    for (const sub of subs) {
      for (const name of sub.names) {
        const key = name.trim().toLowerCase()
        if (key) nameCount.set(key, (nameCount.get(key) ?? 0) + 1)
      }
    }
    const blocked = new Set<string>([...nameCount.entries()].filter(([, n]) => n > 1).map(([k]) => k))

    const results: PlayerScore[] = await Promise.all(
      subs.map(async sub => {
        const entries: ScoreEntry[] = await Promise.all(
          sub.names.map(async name => {
            const key = name.trim().toLowerCase()
            if (!key) return { name, value: null, blocked: false }
            if (blocked.has(key)) return { name, value: 0, blocked: true }
            try {
              const res = await fetchScattegoryResult({
                data: { playerName: name.trim(), year: yr, categoryId: cat.id, division: div },
              })
              return { name, value: res.value, blocked: false }
            } catch {
              return { name, value: null, blocked: false }
            }
          }),
        )
        const total = entries.reduce((sum, e) => sum + (!e.blocked ? (e.value ?? 0) : 0), 0)
        return { playerId: sub.playerId, playerName: sub.playerName, entries, total }
      }),
    )

    results.sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    setPlayerScores(results)
    setLoadingScores(false)
    setScoresDone(true)
  }

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  function sendReady() {
    wsRef.current?.send(JSON.stringify({ type: 'ready' }))
  }

  function sendSubmit() {
    const names = nameInputs.map(n => n.trim()).filter(Boolean)
    if (names.length === 0) return
    wsRef.current?.send(JSON.stringify({ type: 'submit_names', names }))
    setSubmitted(true)
  }

  function sendPlayAgain() {
    scoresFetchedRef.current = false
    setAllSubmissions([])
    setPlayerScores([])
    setScoresDone(false)
    setLoadingScores(false)
    setSubmitted(false)
    setNameInputs(['', '', '', '', ''])
    wsRef.current?.send(JSON.stringify({ type: 'play_again' }))
  }

  function copyLink() {
    const url = `${window.location.origin}/games/scattegory/${roomId}`
    navigator.clipboard.writeText(url)
  }

  // ------------------------------------------------------------------
  // Render gating
  // ------------------------------------------------------------------
  if (!myName && !connected) {
    return (
      <div className="bg-[#131313] min-h-screen text-[#e5e2e1] flex items-center justify-center px-4">
        <div className="bg-[#1c1b1b] border border-[#2e2d2d] rounded-2xl p-8 w-full max-w-sm">
          <p className="font-['Lexend'] font-black text-xl uppercase tracking-tighter mb-6 text-[#a5d0b9]">
            Join Room <span className="text-[#8b938d] text-sm">{roomId}</span>
          </p>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
            placeholder="Your name"
            maxLength={20}
            className="w-full bg-[#131313] border border-[#2e2d2d] rounded-xl px-4 py-3 font-['Lexend'] font-bold text-[#e5e2e1] placeholder-[#4a4a4a] focus:outline-none focus:border-[#a5d0b9] mb-4"
          />
          <button
            onClick={handleNameSubmit}
            disabled={!nameInput.trim()}
            className="w-full py-3 rounded-full font-['Lexend'] font-black text-[#0d2018] uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #a5d0b9 0%, #1a5c38 100%)' }}
          >
            Join
          </button>
          {error && <p className="text-red-400 text-sm font-['Lexend'] mt-4">{error}</p>}
        </div>
      </div>
    )
  }

  if (!connected || !room) {
    return (
      <div className="bg-[#131313] min-h-screen text-[#e5e2e1] flex items-center justify-center">
        <div className="text-center">
          <p className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter text-[#8b938d] mb-2">
            Connecting…
          </p>
          {error && <p className="text-red-400 text-sm font-['Lexend'] mt-2">{error}</p>}
        </div>
      </div>
    )
  }

  const me = room.players.find(p => p.id === myId)
  const isHost = room.hostId === myId
  const allReady = room.players.length >= 2 && room.players.every(p => p.ready)

  // ------------------------------------------------------------------
  // Lobby phase
  // ------------------------------------------------------------------
  if (room.gameState === 'lobby') {
    return (
      <div className="bg-[#131313] min-h-screen text-[#e5e2e1]">
        <main className="pt-12 pb-32 px-4 max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <span className="text-[#a5d0b9] font-['Lexend'] font-bold uppercase tracking-[0.2em] text-sm mb-2 block">
              Room Lobby
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="font-['Lexend'] font-black text-5xl uppercase tracking-tighter text-[#e5e2e1]">
                {roomId}
              </h1>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1c1b1b] border border-[#2e2d2d] hover:border-[#a5d0b9] transition-colors font-['Lexend'] font-bold text-xs uppercase tracking-widest text-[#8b938d] hover:text-[#a5d0b9]"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                Copy Link
              </button>
            </div>
            <p className="text-[#8b938d] text-sm font-['Lexend'] mt-2">
              Share the room code or link so friends can join.
            </p>
          </div>

          {/* Game config */}
          <div className="bg-[#1c1b1b] border border-[#2e2d2d] rounded-xl p-5 mb-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#8b938d] font-['Lexend'] font-bold uppercase tracking-widest text-[10px] mb-1">Season</p>
              <p className="font-['Lexend'] font-black text-[#e5e2e1] text-lg">{room.gameConfig.year}</p>
            </div>
            <div>
              <p className="text-[#8b938d] font-['Lexend'] font-bold uppercase tracking-widest text-[10px] mb-1">Categories</p>
              <p className="font-['Lexend'] font-bold text-[#a5d0b9]">
                {room.gameConfig.categoryIds
                  .map(id => NFL_CATEGORIES.find(c => c.id === id)?.label)
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>

          {/* Players */}
          <div className="mb-8">
            <h2 className="font-['Lexend'] font-black text-xs uppercase tracking-widest text-[#8b938d] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">group</span>
              Players ({room.players.length})
            </h2>
            <div className="space-y-3">
              {room.players.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all ${
                    p.ready
                      ? 'bg-[#0d2018] border-[#a5d0b9]/40'
                      : 'bg-[#1c1b1b] border-[#2e2d2d]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${p.ready ? 'bg-[#a5d0b9]' : 'bg-[#2e2d2d]'}`} />
                    <span className="font-['Lexend'] font-bold text-[#e5e2e1]">{p.name}</span>
                    {room.hostId === p.id && (
                      <span className="text-[10px] font-['Lexend'] font-black uppercase tracking-widest bg-[#a5d0b9]/20 text-[#a5d0b9] px-2 py-0.5 rounded-full">
                        Host
                      </span>
                    )}
                    {p.id === myId && (
                      <span className="text-[10px] font-['Lexend'] font-black uppercase tracking-widest bg-[#2e2d2d] text-[#8b938d] px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-['Lexend'] font-bold uppercase tracking-widest ${p.ready ? 'text-[#a5d0b9]' : 'text-[#4a4a4a]'}`}>
                    {p.ready ? 'Ready' : 'Waiting'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status / action */}
          {room.players.length < 2 && (
            <p className="text-[#8b938d] font-['Lexend'] font-bold text-sm uppercase tracking-widest mb-6 text-center">
              Waiting for more players…
            </p>
          )}

          {me && !me.ready && (
            <button
              onClick={sendReady}
              className="w-full py-4 rounded-full font-['Lexend'] font-black text-[#0d2018] text-xl uppercase tracking-tighter shadow-lg hover:brightness-110 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #a5d0b9 0%, #1a5c38 100%)' }}
            >
              Ready Up
            </button>
          )}

          {me && me.ready && !allReady && (
            <div className="text-center">
              <p className="text-[#a5d0b9] font-['Lexend'] font-black text-lg uppercase tracking-tighter mb-3">
                You're Ready!
              </p>
              <p className="text-[#8b938d] font-['Lexend'] text-sm">
                Waiting for everyone else…
              </p>
              <button
                onClick={sendReady}
                className="mt-4 px-6 py-2 rounded-full font-['Lexend'] font-bold text-xs uppercase tracking-widest text-[#8b938d] border border-[#2e2d2d] hover:border-[#e5e2e1] transition-colors"
              >
                Unready
              </button>
            </div>
          )}

        </main>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Playing phase
  // ------------------------------------------------------------------
  if (room.gameState === 'playing') {
    const submittedCount = room.players.filter(p => p.submitted).length
    const myPlayer = room.players.find(p => p.id === myId)
    const iHaveSubmitted = myPlayer?.submitted ?? submitted

    return (
      <div className="bg-[#131313] min-h-screen text-[#e5e2e1]">
        <main className="pt-12 pb-32 px-4 max-w-2xl mx-auto">

          {/* Round info banner */}
          <div className="bg-[#0d2018] border border-[#a5d0b9]/30 rounded-2xl p-6 mb-10">
            <p className="text-[#a5d0b9] font-['Lexend'] font-bold uppercase tracking-[0.2em] text-xs mb-3">
              This Round
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[#8b938d] font-['Lexend'] text-[10px] uppercase tracking-widest mb-1">Stat</p>
                <p className="font-['Lexend'] font-black text-[#a5d0b9] text-lg leading-tight">
                  {room.category?.label}
                </p>
              </div>
              <div>
                <p className="text-[#8b938d] font-['Lexend'] text-[10px] uppercase tracking-widest mb-1">Division</p>
                <p className="font-['Lexend'] font-black text-[#e5e2e1] text-lg leading-tight">
                  {room.division}
                </p>
              </div>
              <div>
                <p className="text-[#8b938d] font-['Lexend'] text-[10px] uppercase tracking-widest mb-1">Season</p>
                <p className="font-['Lexend'] font-black text-[#e5e2e1] text-lg leading-tight">
                  {room.gameConfig.year}
                </p>
              </div>
            </div>
          </div>

          {/* Submission progress */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-1.5 bg-[#2e2d2d] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#a5d0b9] transition-all duration-500"
                style={{ width: `${(submittedCount / room.players.length) * 100}%` }}
              />
            </div>
            <span className="text-[#8b938d] font-['Lexend'] font-bold text-xs uppercase tracking-widest shrink-0">
              {submittedCount}/{room.players.length} submitted
            </span>
          </div>

          {iHaveSubmitted ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-[#a5d0b9] mb-4 block">check_circle</span>
              <p className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter text-[#e5e2e1] mb-2">
                Names Locked In!
              </p>
              <p className="text-[#8b938d] font-['Lexend']">
                Waiting for {room.players.length - submittedCount} more player{room.players.length - submittedCount !== 1 ? 's' : ''}…
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter mb-6">
                Name <span className="text-[#a5d0b9]">5 Players</span>
              </h2>
              <p className="text-[#8b938d] font-['Lexend'] text-sm mb-6">
                Enter NFL players who played for a team in the <strong className="text-[#e5e2e1]">{room.division}</strong> in {room.gameConfig.year}.
                Their <strong className="text-[#a5d0b9]">{room.category?.label}</strong> for that season will be your score.
              </p>

              <div className="space-y-3 mb-8">
                {nameInputs.map((val, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#2e2d2d] flex items-center justify-center font-['Lexend'] font-black text-sm text-[#8b938d] shrink-0">
                      {i + 1}
                    </span>
                    <input
                      value={val}
                      onChange={e => {
                        const next = [...nameInputs]
                        next[i] = e.target.value
                        setNameInputs(next)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && i < 4) {
                          const nextEl = document.getElementById(`name-input-${i + 1}`)
                          nextEl?.focus()
                        }
                      }}
                      id={`name-input-${i}`}
                      placeholder={`Player ${i + 1}`}
                      className="flex-1 bg-[#1c1b1b] border border-[#2e2d2d] rounded-xl px-4 py-3 font-['Lexend'] font-bold text-[#e5e2e1] placeholder-[#4a4a4a] focus:outline-none focus:border-[#a5d0b9] transition-colors"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={sendSubmit}
                disabled={nameInputs.every(n => !n.trim())}
                className="w-full py-4 rounded-full font-['Lexend'] font-black text-[#0d2018] text-xl uppercase tracking-tighter shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #a5d0b9 0%, #1a5c38 100%)' }}
              >
                Lock In Names
                <span className="material-symbols-outlined">lock</span>
              </button>
              <p className="text-[#4a4a4a] font-['Lexend'] text-xs text-center mt-3">
                You can submit fewer than 5 — blanks score 0.
              </p>
            </>
          )}

        </main>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Scoring phase
  // ------------------------------------------------------------------
  const winner = playerScores[0]

  return (
    <div className="bg-[#131313] min-h-screen text-[#e5e2e1]">
      <main className="pt-12 pb-32 px-4 max-w-3xl mx-auto">

        {/* Header */}
        <section className="mb-10">
          <span className="text-[#a5d0b9] font-['Lexend'] font-bold uppercase tracking-[0.2em] text-sm mb-2 block">
            Results
          </span>
          <h1 className="font-['Lexend'] font-black text-5xl uppercase tracking-tighter text-[#e5e2e1] leading-none">
            {room.category?.label}<br />
            <span className="text-[#8b938d] text-3xl">in {room.division} · {room.gameConfig.year}</span>
          </h1>
        </section>

        {loadingScores && (
          <div className="text-center py-16">
            <p className="font-['Lexend'] font-black text-xl uppercase tracking-tighter text-[#8b938d] animate-pulse">
              Fetching stats…
            </p>
          </div>
        )}

        {scoresDone && winner && (
          <div className="bg-[#0d2018] border border-[#a5d0b9]/40 rounded-2xl p-6 mb-8 flex items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-[#a5d0b9]">emoji_events</span>
            <div>
              <p className="text-[#8b938d] font-['Lexend'] font-bold text-xs uppercase tracking-widest mb-0.5">Winner</p>
              <p className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter text-[#a5d0b9]">
                {winner.playerName}
              </p>
              <p className="text-[#e5e2e1] font-['Lexend'] font-bold text-sm">
                {winner.total?.toFixed(1)} total {room.category?.label}
              </p>
            </div>
          </div>
        )}

        {/* Player scorecards */}
        {scoresDone && (
          <div className="space-y-6 mb-10">
            {playerScores.map((ps, rank) => (
              <div
                key={ps.playerId}
                className={`bg-[#1c1b1b] rounded-2xl border overflow-hidden ${
                  rank === 0 ? 'border-[#a5d0b9]/40' : 'border-[#2e2d2d]'
                }`}
              >
                {/* Scorecard header */}
                <div className={`px-6 py-4 flex items-center justify-between ${rank === 0 ? 'bg-[#0d2018]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-['Lexend'] font-black text-sm ${
                      rank === 0 ? 'bg-[#a5d0b9] text-[#0d2018]' : 'bg-[#2e2d2d] text-[#8b938d]'
                    }`}>
                      {rank + 1}
                    </span>
                    <span className="font-['Lexend'] font-black text-xl uppercase tracking-tighter text-[#e5e2e1]">
                      {ps.playerName}
                    </span>
                    {ps.playerId === myId && (
                      <span className="text-[10px] font-['Lexend'] font-black uppercase tracking-widest bg-[#2e2d2d] text-[#8b938d] px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <span className={`font-['Lexend'] font-black text-xl ${rank === 0 ? 'text-[#a5d0b9]' : 'text-[#e5e2e1]'}`}>
                    {ps.total !== null ? ps.total.toFixed(1) : '—'}
                  </span>
                </div>

                {/* Name entries */}
                <div className="divide-y divide-[#2e2d2d]/50">
                  {ps.entries.map((entry, i) => (
                    <div key={i} className={`px-6 py-3 flex items-center justify-between ${entry.blocked ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#2e2d2d] flex items-center justify-center font-['Lexend'] font-black text-[10px] text-[#8b938d] shrink-0">
                          {i + 1}
                        </span>
                        <span className={`font-['Lexend'] font-bold text-sm ${
                          !entry.name ? 'text-[#4a4a4a] italic' : entry.blocked ? 'text-[#8b938d] line-through' : 'text-[#e5e2e1]'
                        }`}>
                          {entry.name || 'blank'}
                        </span>
                        {entry.blocked && (
                          <span className="text-[10px] font-['Lexend'] font-black uppercase tracking-widest bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">
                            Duplicate
                          </span>
                        )}
                      </div>
                      <span className={`font-['Lexend'] font-bold text-sm ${
                        entry.blocked ? 'text-red-400' : entry.value && entry.value > 0 ? 'text-[#a5d0b9]' : 'text-[#4a4a4a]'
                      }`}>
                        {entry.blocked ? '0' : entry.value !== null ? entry.value.toFixed(1) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Play again (host only) */}
        {isHost && scoresDone && (
          <button
            onClick={sendPlayAgain}
            className="w-full py-4 rounded-full font-['Lexend'] font-black text-[#0d2018] text-xl uppercase tracking-tighter shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, #a5d0b9 0%, #1a5c38 100%)' }}
          >
            Play Again
            <span className="material-symbols-outlined">refresh</span>
          </button>
        )}

        {!isHost && scoresDone && (
          <p className="text-[#8b938d] font-['Lexend'] font-bold text-sm uppercase tracking-widest text-center">
            Waiting for host to start a new round…
          </p>
        )}

        {loadingScores && (
          <div className="space-y-4">
            {allSubmissions.map(sub => (
              <div key={sub.playerId} className="bg-[#1c1b1b] border border-[#2e2d2d] rounded-xl p-5">
                <p className="font-['Lexend'] font-black text-lg uppercase tracking-tighter text-[#e5e2e1] mb-3">{sub.playerName}</p>
                <div className="space-y-1">
                  {sub.names.map((n, i) => (
                    <p key={i} className="text-[#8b938d] font-['Lexend'] text-sm">{i + 1}. {n || '—'}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
