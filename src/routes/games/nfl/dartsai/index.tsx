import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react'
import {
  fetchPlayerStats,
  filterToDivision,
  type NFLDartsCategoryType,
  type NFLDivision,
  DARTS_CATEGORY_CONFIG,
} from '#/api/getNFLData'
import SpinWheelCard from './SpinWheelCard'
import SubmissionBetForm from './SubmissionBetForm'
import HistoryCard, { type HistoryEntry } from './HistoryCard'

const START_SCORE = 1501
const WIN_MARGIN = 10

const DART_CATEGORIES: NFLDartsCategoryType[] = [
  'PPR Fantasy Points in a Season',
  'Rushing Yards in a Season',
  'Receiving Yards in a Season',
]

const ALL_DIVISIONS: NFLDivision[] = [
  'AFC East',
  'AFC North',
  'AFC South',
  'AFC West',
  'NFC East',
  'NFC North',
  'NFC South',
  'NFC West',
]

type GameState = 'playing' | 'won' | 'bust' | 'out'

function resolveGameState(score: number, limitsLeft: number): GameState {
  if (Math.abs(score) <= WIN_MARGIN) return 'won'
  if (score < -WIN_MARGIN) return 'bust'
  if (limitsLeft === 0) return 'out'
  return 'playing'
}

export const getNFLData = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { playerName: string; year: number; category: NFLDartsCategoryType; division: NFLDivision }) => data,
  )
  .handler(async ({ data }) => {
    const { scraper: gameType } = DARTS_CATEGORY_CONFIG[data.category]
    const res = await fetchPlayerStats(data.playerName, gameType)
    if (res.status !== 'ready') return res
    const filtered = filterToDivision(res.data, data.division).filter((s) => s.Year === data.year)
    return { status: 'ready' as const, data: filtered }
  })

export const Route = createFileRoute('/games/nfl/dartsai/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [playerName, setPlayerName] = useState('')
  const [year, setYear] = useState(2023)
  const [category, setCategory] = useState<NFLDartsCategoryType>('PPR Fantasy Points in a Season')
  const [availableDivisions, setAvailableDivisions] = useState<NFLDivision[]>(ALL_DIVISIONS)
  const [division, setDivision] = useState<NFLDivision>('AFC East')
  const [submissions, setSubmissions] = useState<HistoryEntry[]>([])
  const [score, setScore] = useState(START_SCORE)
  const [gameState, setGameState] = useState<GameState>('playing')
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function applyValue(value: number, index: number, usedDivision: NFLDivision) {
    setScore((prev) => {
      const next = prev - value
      setSubmissions((subs) => subs.map((s, i) => (i === index ? { ...s, value, scoreAfter: next } : s)))
      setAvailableDivisions((divs) => {
        const remaining = divs.filter((d) => d !== usedDivision)
        setGameState(resolveGameState(next, remaining.length))
        return remaining
      })
      return next
    })
  }

  async function fetchAndResolve(
    params: { playerName: string; year: number; category: NFLDartsCategoryType; division: NFLDivision },
    index: number,
  ) {
    const res = await getNFLData({ data: params })
    if (res.status === 'processing') {
      retryRef.current = setTimeout(() => fetchAndResolve(params, index), 10_000)
      return
    }
    const { field } = DARTS_CATEGORY_CONFIG[params.category]
    const season = res.data[0] as unknown as Record<string, unknown> | undefined
    applyValue(season != null ? (season[field] as number) : 0, index, params.division)
  }

  async function handleSubmit() {
    if (gameState !== 'playing') return
    const params = { playerName, year, category, division }
    const index = submissions.length
    setSubmissions((prev) => [
      ...prev,
      { playerName, year, category, limit: division, limitLabel: 'Division', value: '?', scoreAfter: '?' },
    ])

    const res = await getNFLData({ data: params })
    if (res.status === 'processing') {
      retryRef.current = setTimeout(() => fetchAndResolve(params, index), 10_000)
      return
    }
    const { field } = DARTS_CATEGORY_CONFIG[category]
    const season = res.data[0] as unknown as Record<string, unknown> | undefined
    applyValue(season != null ? (season[field] as number) : 0, index, division)
  }

  function resetGame() {
    setSubmissions([])
    setScore(START_SCORE)
    setGameState('playing')
    setAvailableDivisions(ALL_DIVISIONS)
    if (retryRef.current) clearTimeout(retryRef.current)
  }

  useEffect(() => {
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [])

  const throwsUsed = ALL_DIVISIONS.length - availableDivisions.length
  const throwsLeft = availableDivisions.length

  const statusLabel =
    gameState === 'playing'
      ? `${throwsLeft} throw${throwsLeft !== 1 ? 's' : ''} remaining`
      : gameState === 'won'
        ? '🎯 You Win!'
        : gameState === 'bust'
          ? '💥 Bust!'
          : '❌ Out of Throws'

  return (
    <div className="bg-[#131313] min-h-screen text-[#e5e2e1]">
      <main className="pt-12 pb-32 px-4 max-w-7xl mx-auto">
        {/* Hero */}
        <section className="relative mb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <span className="text-[#ffb693] font-['Lexend'] font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
              Current Challenge
            </span>
            <h1 className="font-['Lexend'] font-black text-6xl md:text-8xl leading-none uppercase tracking-tighter text-[#e5e2e1]">
              NFL <span className="text-[#ffb693] italic">1501</span>
            </h1>
          </div>
          <div className="lg:col-span-4 bg-[#1c1b1b] p-6 border-l-4 border-[#a5d0b9]">
            <p className="text-[#a5d0b9] font-['Lexend'] font-bold text-xl uppercase mb-1">
              {statusLabel}
            </p>
            <p className="text-[#c1c8c2] text-sm font-medium">
              {gameState === 'playing'
                ? 'Spin the wheels to lock in your category and division. Name the legend to score points.'
                : `Final score: ${score}`}
            </p>
            {gameState !== 'playing' && (
              <button
                onClick={resetGame}
                className="mt-4 bg-[#ffb693] text-[#561f00] font-['Lexend'] font-black px-6 py-2 rounded-full text-sm uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
              >
                Play Again
              </button>
            )}
          </div>
        </section>

        {/* Score + pips */}
        <div className="mb-8 text-center">
          <p className="font-['Lexend'] font-black text-7xl text-[#ffb693]">{score}</p>
          <p className="text-[#8b938d] font-['Lexend'] font-bold text-sm uppercase tracking-widest mt-1">
            Remaining
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {ALL_DIVISIONS.map((_, i) => (
              <span
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${i < throwsUsed ? 'bg-[#ffb693]' : 'bg-[#2e2d2d]'}`}
              />
            ))}
          </div>
          <p className="text-[#8b938d] text-xs font-['Lexend'] mt-2 uppercase tracking-widest">
            {throwsUsed} / {ALL_DIVISIONS.length} throws used
          </p>
        </div>

        {/* Spin Wheels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <SpinWheelCard
            title="Stat Category"
            icon="analytics"
            options={DART_CATEGORIES}
            currentValue={category}
            colorScheme="primary"
            onResult={(v) => setCategory(v as NFLDartsCategoryType)}
          />
          <SpinWheelCard
            title="NFL Division"
            icon="shield"
            options={availableDivisions}
            currentValue={division}
            colorScheme="secondary"
            onResult={(v) => setDivision(v as NFLDivision)}
          />
        </div>

        {/* Bet Form */}
        <SubmissionBetForm
          playerName={playerName}
          year={year}
          onPlayerNameChange={setPlayerName}
          onYearChange={setYear}
          onSubmit={handleSubmit}
          disabled={gameState !== 'playing'}
        />

        {/* History */}
        {submissions.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-8 border-b border-[#414844]/15 pb-4">
              <h2 className="font-['Lexend'] font-black text-3xl uppercase tracking-tighter">
                History <span className="text-[#a5d0b9] opacity-50 font-light">REEL</span>
              </h2>
            </div>
            <div className="space-y-4">
              {submissions.map((s, i) => (
                <HistoryCard key={i} {...s} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Desktop FAB */}
      <div className="hidden md:block fixed bottom-8 right-8">
        <button className="bg-[#ffb693] text-[#561f00] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group relative">
          <span className="material-symbols-outlined text-3xl">add</span>
          <span className="absolute right-20 bg-[#353534] text-[#e5e2e1] font-['Lexend'] font-bold py-2 px-4 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            CHALLENGE FRIEND
          </span>
        </button>
      </div>
    </div>
  )
}
