import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react'
import { fetchPlayerStats, filterToDivision, type NFLDivision } from '#/api/getNFLData'
import {fuzzySearchPlayers, type FuzzyMatchPlayer} from '#/api/fuzzymatch'
import { GAME_PRESETS, NFL_CATEGORIES, type DartsCategory, type DartsPreset } from '#/lib/dartsConfig'
import SpinWheelCard from '../../nfl/dartsai/SpinWheelCard'
import SubmissionBetForm from '../../nfl/dartsai/SubmissionBetForm'
import HistoryCard, { type HistoryEntry } from '../../nfl/dartsai/HistoryCard'

// ---------------------------------------------------------------------------
// Server fn — extend the if/else when NBA or other sports are added
// ---------------------------------------------------------------------------
const fetchDartsResult = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { playerName: string; year: number; preset: string; categoryId: string; limit: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const category = NFL_CATEGORIES.find((c) => c.id === data.categoryId)
    if (!category) throw new Error(`Unknown category id: ${data.categoryId}`)

    const res = await fetchPlayerStats(data.playerName, category.scraper)
    if (res.status !== 'ready') return { status: 'processing' as const, value: 0 }

    const filtered = filterToDivision(res.data, data.limit as NFLDivision).filter(
      (s) => s.Year === data.year,
    )
    const season = filtered[0] as Record<string, unknown> | undefined
    const value = season != null ? (season[category.field] as number) : 0
    return { status: 'ready' as const, value }
  })
const fetchFuzzyMatchResult = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { query: string }) => data,
  )
  .handler(async ({ data }) => {
    return await fuzzySearchPlayers(data.query)
  })
// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export const Route = createFileRoute('/games/1501/play/')({
  validateSearch: (raw: Record<string, unknown>) => ({
    preset: typeof raw.preset === 'string' ? raw.preset : 'nfl',
    categories: Array.isArray(raw.categories) ? (raw.categories as string[]) : undefined,
  }),
  component: RouteComponent,
})

type GameState = 'playing' | 'won' | 'bust' | 'out'

function resolveGameState(score: number, winMargin: number, limitsLeft: number): GameState {
  if (Math.abs(score) <= winMargin) return 'won'
  if (score < -winMargin) return 'bust'
  if (limitsLeft === 0) return 'out'
  return 'playing'
}

function buildConfig(presetId: string, selectedCategoryIds: string[] | undefined): DartsPreset {
  const base = GAME_PRESETS.find((p) => p.id === presetId) ?? GAME_PRESETS[0]
  if (!selectedCategoryIds || selectedCategoryIds.length === 0) return base
  return {
    ...base,
    categories: base.categories.filter((c) => selectedCategoryIds.includes(c.id)),
  }
}

function RouteComponent() {
  const navigate = useNavigate()
  const { preset: presetId, categories: selectedCategoryIds } = Route.useSearch()
  const config = buildConfig(presetId, selectedCategoryIds)

  const [playerName, setPlayerName] = useState('')
  const [year, setYear] = useState(2023)
  const [category, setCategory] = useState<DartsCategory>(config.categories[0])
  const [availableLimits, setAvailableLimits] = useState<string[]>(config.limits)
  const [currentLimit, setCurrentLimit] = useState<string>(config.limits[0])
  const [submissions, setSubmissions] = useState<HistoryEntry[]>([])
  const [score, setScore] = useState(config.startScore)
  const [gameState, setGameState] = useState<GameState>('playing')
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)


  const [fuzzyResults, setFuzzyResults] = useState<FuzzyMatchPlayer[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Spin state — must spin before every submission
  const [spinKey, setSpinKey] = useState(0)
  const [spinPhase, setSpinPhase] = useState<'idle' | 'spinning' | 'ready'>('idle')
  const wheelsDoneRef = useRef(0)

  function triggerSpin() {
    if (spinPhase !== 'idle' || gameState !== 'playing') return
    wheelsDoneRef.current = 0
    setSpinPhase('spinning')
    setSpinKey((k) => k + 1)
  }

  function onWheelDone(type: 'category' | 'limit', value: string) {
    if (type === 'category') {
      const found = config.categories.find((c) => c.label === value)
      if (found) setCategory(found)
    } else {
      setCurrentLimit(value)
    }
    wheelsDoneRef.current += 1
    if (wheelsDoneRef.current >= 2) setSpinPhase('ready')
  }

  function applyValue(value: number, index: number, usedLimit: string) {
    setScore((prev) => {
      const next = prev - value
      setSubmissions((subs) =>
        subs.map((s, i) => (i === index ? { ...s, value, scoreAfter: next } : s)),
      )
      setAvailableLimits((limits) => {
        const remaining = limits.filter((l) => l !== usedLimit)
        setGameState(resolveGameState(next, config.winMargin, remaining.length))
        return remaining
      })
      return next
    })
  }

  async function fetchAndResolve(
    params: { playerName: string; year: number; preset: string; categoryId: string; limit: string },
    index: number,
  ) {
    const res = await fetchDartsResult({ data: params })
    if (res.status === 'processing') {
      retryRef.current = setTimeout(() => fetchAndResolve(params, index), 10_000)
      return
    }
    applyValue(res.value, index, params.limit)
  }

  async function handleSubmit() {
    if (gameState !== 'playing' || spinPhase !== 'ready') return
    setSpinPhase('idle')
    const params = {
      playerName,
      year,
      preset: presetId,
      categoryId: category.id,
      limit: currentLimit,
    }
    // Remove the used limit immediately so it's gone before the next spin,
    // not after the server responds.
    setAvailableLimits((prev) => prev.filter((l) => l !== params.limit))
    const index = submissions.length
    setSubmissions((prev) => [
      ...prev,
      {
        playerName,
        year,
        category: category.label,
        limit: currentLimit,
        limitLabel: config.limitLabel,
        value: '?',
        scoreAfter: '?',
      },
    ])

    setPlayerName('')
    const res = await fetchDartsResult({ data: params })
    if (res.status === 'processing') {
      retryRef.current = setTimeout(() => fetchAndResolve(params, index), 10_000)
      return
    }
    applyValue(res.value, index, params.limit)
  }

  function resetGame() {
    setPlayerName('')
    setYear(2023)
    setCategory(config.categories[0])
    setAvailableLimits(config.limits)
    setCurrentLimit(config.limits[0])
    setSubmissions([])
    setScore(config.startScore)
    setGameState('playing')
    setSpinKey(0)
    setSpinPhase('idle')
    wheelsDoneRef.current = 0
    if (retryRef.current) clearTimeout(retryRef.current)
  }

  useEffect(() => {
    if (playerName.length < 2) {
      setFuzzyResults([])
      setShowDropdown(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const results = await fetchFuzzyMatchResult({ data: { query: playerName } })
      setFuzzyResults(results)
      setShowDropdown(results.length > 0)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [playerName])

  function selectPlayer(player: FuzzyMatchPlayer) {
    setPlayerName(player.name)
    setShowDropdown(false)
    setFuzzyResults([])
  }

  useEffect(() => () => { if (retryRef.current) clearTimeout(retryRef.current) }, [])

  const throwsLeft = availableLimits.length
  const throwsUsed = config.limits.length - throwsLeft

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
      <main className="pt-6 pb-20 px-4 max-w-7xl mx-auto">

        {/* ── Compact header bar ── */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
          <button
            onClick={() => navigate({ to: '/games/1501' })}
            className="text-[#8b938d] font-['Lexend'] font-bold uppercase tracking-[0.15em] text-xs flex items-center gap-1 hover:text-[#ffb693] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Games
          </button>

          <h1 className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter text-[#e5e2e1]">
            {config.sport} <span className="text-[#ffb693] italic">{config.startScore}</span>
          </h1>

          {/* Score + pips pushed to the right */}
          <div className="ml-auto flex items-center gap-5">
            <div className="text-right">
              <p className="font-['Lexend'] font-black text-4xl text-[#ffb693] leading-none">{score}</p>
              <p className="text-[#8b938d] font-['Lexend'] font-bold text-[10px] uppercase tracking-widest">
                remaining
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5" style={{ maxWidth: 88 }}>
              {config.limits.map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < throwsUsed ? 'bg-[#ffb693]' : 'bg-[#2e2d2d]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Game-over banner ── */}
        {gameState !== 'playing' && (
          <div className="bg-[#1c1b1b] border-l-4 border-[#a5d0b9] p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[#a5d0b9] font-['Lexend'] font-bold text-lg uppercase leading-none">
                {statusLabel}
              </p>
              <p className="text-[#c1c8c2] text-sm mt-1">Final score: {score}</p>
            </div>
            <button
              onClick={resetGame}
              className="bg-[#ffb693] text-[#561f00] font-['Lexend'] font-black px-6 py-2 rounded-full text-sm uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
            >
              Play Again
            </button>
          </div>
        )}

        {/* ── Main two-zone layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 mb-8">

          {/* Left: wheels + shared spin button */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <SpinWheelCard
                title="Category"
                icon="analytics"
                options={config.categories.map((c) => c.label)}
                currentValue={category.label}
                colorScheme="primary"
                compact
                spinKey={spinKey}
                onResult={(label) => onWheelDone('category', label)}
              />
              <SpinWheelCard
                title={config.limitLabel}
                icon="shield"
                options={availableLimits}
                currentValue={currentLimit}
                colorScheme="secondary"
                compact
                spinKey={spinKey}
                onResult={(v) => onWheelDone('limit', v)}
              />
            </div>

            {/* Single shared SPIN button */}
            <button
              onClick={triggerSpin}
              disabled={spinPhase !== 'idle' || gameState !== 'playing'}
              className="w-full py-3 rounded-full font-['Lexend'] font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-[#1c1b1b]"
              style={{ backgroundColor: '#ffb693' }}
            >
              {spinPhase === 'spinning' ? 'SPINNING…' : spinPhase === 'ready' ? 'SPUN ✓' : 'SPIN'}
            </button>
          </div>

          {/* Right: locked selections + form */}
          <div className="flex flex-col gap-4">
            {/* Current locked selection */}
            <div className="bg-[#1c1b1b] rounded-xl p-5">
              <p className="font-['Lexend'] font-bold text-[10px] uppercase tracking-[0.2em] text-[#8b938d] mb-3">
                Current Selection
              </p>
              <div className="flex gap-5">
                <div className="border-l-2 border-[#ffb693] pl-3">
                  <p className="font-['Lexend'] font-bold text-[10px] uppercase text-[#ffb693] mb-0.5">
                    Category
                  </p>
                  <p className="font-['Lexend'] font-extrabold text-sm uppercase text-[#e5e2e1] leading-tight">
                    {category.label}
                  </p>
                </div>
                <div className="border-l-2 border-[#a5d0b9] pl-3">
                  <p className="font-['Lexend'] font-bold text-[10px] uppercase text-[#a5d0b9] mb-0.5">
                    {config.limitLabel}
                  </p>
                  <p className="font-['Lexend'] font-extrabold text-sm uppercase text-[#e5e2e1] leading-tight">
                    {currentLimit}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-['Lexend'] font-bold text-[10px] uppercase text-[#8b938d] mb-0.5">
                    Throws
                  </p>
                  <p className="font-['Lexend'] font-extrabold text-sm text-[#e5e2e1]">
                    {throwsLeft} left
                  </p>
                </div>
              </div>
            </div>

            {/* Compact form — submit blocked until spun */}
            <div className="relative">
            <SubmissionBetForm
              key={submissions.length}
              playerName={playerName}
              year={year}
              onPlayerNameChange={setPlayerName}
              onYearChange={setYear}
              onSubmit={handleSubmit}
              disabled={gameState !== 'playing' || spinPhase !== 'ready'}
              compact
            />
            {showDropdown && (
              <div className="absolute z-50 left-0 right-0 top-[calc(100%-0.5rem)] bg-[#1c1b1b] border border-[#2e2d2d] rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {fuzzyResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPlayer(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#2e2d2d] transition-colors flex items-center justify-between gap-3"
                  >
                    <span className="font-['Lexend'] font-bold text-sm text-[#e5e2e1]">
                      {p.name}
                    </span>
                    <span className="font-['Lexend'] text-[10px] uppercase tracking-wider text-[#8b938d] shrink-0">
                      {p.position} · {p.league} · {p.years_active}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* ── History ── */}
        {submissions.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-6 border-b border-[#414844]/15 pb-4">
              <h2 className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter">
                History <span className="text-[#a5d0b9] opacity-50 font-light">REEL</span>
              </h2>
            </div>
            <div className="space-y-3">
              {submissions.map((s, i) => (
                <HistoryCard key={i} {...s} />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
