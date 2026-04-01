import { createFileRoute } from '@tanstack/react-router'
import {
  fetchPlayerStats,
  filterToDivision,
  type NFLDartsCategoryType,
  type NFLDivision,
  DARTS_CATEGORY_CONFIG,
} from '#/api/getNFLData'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react';
import RouletteWheel from '#/components/RouletteWheel';

const START_SCORE = 1501
const WIN_MARGIN = 10

export const getNFLData = createServerFn({ method: 'GET' })
  .inputValidator((data: { playerName: string, year: number, category: NFLDartsCategoryType, division: NFLDivision }) => data)
  .handler(async ({ data }) => {
    const { scraper: gameType } = DARTS_CATEGORY_CONFIG[data.category]
    const res = await fetchPlayerStats(data.playerName, gameType)
    if (res.status !== 'ready') return res
    const filtered = filterToDivision(res.data, data.division).filter((s) => s.Year === data.year)
    return { status: 'ready' as const, data: filtered }
  })

export const Route = createFileRoute('/games/nfl/darts/')({
  component: RouteComponent,
})

const dartCategories: NFLDartsCategoryType[] = [
  "PPR Fantasy Points in a Season",
  "Rushing Yards in a Season",
  "Receiving Yards in a Season",
]

const nflDivisions: NFLDivision[] = [
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
]

interface Submission {
  playerName: string
  year: number
  category: NFLDartsCategoryType
  division: NFLDivision
  value: number | '?'
  scoreAfter: number | '?'
}

type GameState = 'playing' | 'won' | 'bust'

function resolveGameState(score: number): GameState {
  if (Math.abs(score) <= WIN_MARGIN) return 'won'
  if (score < -WIN_MARGIN) return 'bust'
  return 'playing'
}

function RouteComponent() {
  const [playerName, setPlayerName] = useState("")
  const [year, setYear] = useState<number>(2023)
  const [category, setCategory] = useState<NFLDartsCategoryType>("PPR Fantasy Points in a Season")
  const [division, setDivision] = useState<NFLDivision>("AFC East")
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [score, setScore] = useState(START_SCORE)
  const [gameState, setGameState] = useState<GameState>('playing')
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function applyValue(value: number, submissionIndex: number) {
    setScore((prev) => {
      const next = prev - value
      const state = resolveGameState(next)
      setGameState(state)
      setSubmissions((subs) =>
        subs.map((s, i) => (i === submissionIndex ? { ...s, value, scoreAfter: next } : s))
      )
      return next
    })
  }

  async function fetchAndResolve(
    params: { playerName: string; year: number; category: NFLDartsCategoryType; division: NFLDivision },
    submissionIndex: number
  ) {
    const res = await getNFLData({ data: params })
    if (res.status === 'processing') {
      retryRef.current = setTimeout(() => fetchAndResolve(params, submissionIndex), 10_000)
      return
    }
    const { field } = DARTS_CATEGORY_CONFIG[params.category]
    const season = res.data[0] as unknown as Record<string, unknown> | undefined
    const value = season != null ? (season[field] as number) : 0
    applyValue(value, submissionIndex)
  }

  async function handleFetch() {
    if (gameState !== 'playing') return
    const params = { playerName, year, category, division }
    const submissionIndex = submissions.length
    setSubmissions((prev) => [...prev, { ...params, value: '?', scoreAfter: '?' }])

    const res = await getNFLData({ data: params })
    if (res.status === 'processing') {
      retryRef.current = setTimeout(() => fetchAndResolve(params, submissionIndex), 10_000)
      return
    }
    const { field } = DARTS_CATEGORY_CONFIG[category]
    const season = res.data[0] as unknown as Record<string, unknown> | undefined
    const value = season != null ? (season[field] as number) : 0
    applyValue(value, submissionIndex)
  }

  function resetGame() {
    setSubmissions([])
    setScore(START_SCORE)
    setGameState('playing')
    if (retryRef.current) clearTimeout(retryRef.current)
  }

  useEffect(() => {
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>NFL Darts</h2>

      <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
        {score}
      </div>

      {gameState === 'won' && (
        <div style={{ color: 'green', fontWeight: 'bold', marginBottom: 8 }}>
          🎯 You win! Final score: {score}
        </div>
      )}
      {gameState === 'bust' && (
        <div style={{ color: 'red', fontWeight: 'bold', marginBottom: 8 }}>
          💥 Bust! You went {Math.abs(score)} past zero.
        </div>
      )}
      {gameState !== 'playing' && (
        <button onClick={resetGame} style={{ marginBottom: 16 }}>Play Again</button>
      )}

      {gameState === 'playing' && (
        <>
          <div>
            <label>Player Name</label>
            <br />
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Adam Thielen"
            />
          </div>

          <br />

          <div>
            <label>Year</label>
            <br />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              placeholder="2023"
            />
          </div>

          <br />

          <div className="flex justify-center items-start gap-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <label>Category: <strong>{category}</strong></label>
              <RouletteWheel
                options={dartCategories}
                onResult={(value) => setCategory(value as NFLDartsCategoryType)}
              />
            </div>

            <div className="flex flex-col items-center gap-2">
              <label>Division: <strong>{division}</strong></label>
              <RouletteWheel
                options={nflDivisions}
                onResult={(value) => setDivision(value as NFLDivision)}
              />
            </div>
          </div>

          <br />

          <button onClick={handleFetch}>Submit</button>
        </>
      )}

      {submissions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Submissions</h3>
          <ul>
            {submissions.map((s, i) => (
              <li key={i}>
                <strong>{s.playerName}</strong> — {s.year} — {s.category} — {s.division}:{' '}
                <strong>{s.value}</strong>
                {s.scoreAfter !== '?' && <span style={{ marginLeft: 8, color: 'gray' }}>(remaining: {s.scoreAfter})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
