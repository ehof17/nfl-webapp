import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { GAME_PRESETS, NFL_PRESET, type DartsPreset } from '#/lib/dartsConfig'

export const Route = createFileRoute('/games/1501/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const [selectedPreset, setSelectedPreset] = useState<DartsPreset>(NFL_PRESET)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    NFL_PRESET.categories.map((c) => c.id),
  )

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(id)) {
        // Must keep at least 1 selected
        return prev.length > 1 ? prev.filter((c) => c !== id) : prev
      }
      return [...prev, id]
    })
  }

  function handlePresetSelect(preset: DartsPreset) {
    if (!preset.available) return
    setSelectedPreset(preset)
    setSelectedCategoryIds(preset.categories.map((c) => c.id))
  }

  function startGame() {
    navigate({
      to: '/games/1501/play',
      search: { preset: selectedPreset.id, categories: selectedCategoryIds },
    })
  }

  return (
    <div className="bg-[#131313] min-h-screen text-[#e5e2e1]">
      <main className="pt-12 pb-32 px-4 max-w-4xl mx-auto">
        {/* Hero */}
        <section className="mb-16">
          <span className="text-[#ffb693] font-['Lexend'] font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
            Choose Your Game
          </span>
          <h1 className="font-['Lexend'] font-black text-6xl md:text-8xl leading-none uppercase tracking-tighter text-[#e5e2e1]">
            <span className="text-[#ffb693] italic">1501</span>
          </h1>
          <p className="text-[#8b938d] font-['Lexend'] font-medium mt-4 text-lg max-w-xl">
            Spin to lock your stat category and limit. Name a player to score. Reach exactly{' '}
            <span className="text-[#ffb693] font-bold">0</span> (within ±{selectedPreset.winMargin}) from{' '}
            <span className="text-[#ffb693] font-bold">{selectedPreset.startScore}</span> to win.
          </p>
        </section>

        {/* Preset cards */}
        <section className="mb-14">
          <h2 className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter mb-6 flex items-center gap-3">
            <span className="w-2 h-6 bg-[#ffb693] block" />
            Select Sport
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAME_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  disabled={!preset.available}
                  className={`relative text-left p-6 rounded-xl border-2 transition-all group overflow-hidden
                    ${isSelected ? 'border-[#ffb693] bg-[#1c1b1b]' : 'border-[#2e2d2d] bg-[#1c1b1b]'}
                    ${!preset.available ? 'opacity-40 cursor-not-allowed' : 'hover:border-[#ffb693]/50 cursor-pointer'}
                  `}
                >
                  <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-15 transition-opacity">
                    <span className="material-symbols-outlined text-[8rem] text-[#ffb693]">{preset.icon}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-[#ffb693] text-2xl">{preset.icon}</span>
                    <span className="font-['Lexend'] font-black text-xl uppercase tracking-tight text-[#e5e2e1]">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="ml-auto bg-[#ffb693] text-[#561f00] font-['Lexend'] font-black text-[10px] px-2 py-1 rounded-full uppercase tracking-widest">
                        Selected
                      </span>
                    )}
                    {!preset.available && (
                      <span className="ml-auto bg-[#2e2d2d] text-[#8b938d] font-['Lexend'] font-bold text-[10px] px-2 py-1 rounded-full uppercase tracking-widest">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-[#8b938d] text-sm font-['Lexend']">
                    {preset.limits.length} {preset.limitLabel}s · Target {preset.startScore} · ±{preset.winMargin}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Category config */}
        {selectedPreset.available && selectedPreset.categories.length > 0 && (
          <section className="mb-14">
            <h2 className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter mb-2 flex items-center gap-3">
              <span className="w-2 h-6 bg-[#a5d0b9] block" />
              Stat Categories
            </h2>
            <p className="text-[#8b938d] text-sm font-['Lexend'] mb-6">
              Choose which categories appear on the spin wheel. Min 1 required.
            </p>
            <div className="flex flex-wrap gap-3">
              {selectedPreset.categories.map((cat) => {
                const isOn = selectedCategoryIds.includes(cat.id)
                const isOnly = selectedCategoryIds.length === 1 && isOn
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    disabled={isOnly}
                    className={`px-5 py-3 rounded-full font-['Lexend'] font-bold text-sm uppercase tracking-wider transition-all
                      ${isOn
                        ? 'bg-[#a5d0b9] text-[#0d2018] shadow-lg'
                        : 'bg-[#1c1b1b] text-[#8b938d] border border-[#2e2d2d] hover:border-[#a5d0b9]/50'
                      }
                      ${isOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                    `}
                  >
                    {isOn && <span className="mr-2">✓</span>}
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Summary + start */}
        <div className="bg-[#1c1b1b] border border-[#2e2d2d] rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[#8b938d] font-['Lexend'] font-bold text-xs uppercase tracking-widest mb-1">
              Game Summary
            </p>
            <p className="text-[#e5e2e1] font-['Lexend'] font-extrabold text-lg uppercase">
              {selectedPreset.name}
            </p>
            <p className="text-[#8b938d] text-sm font-['Lexend'] mt-1">
              {selectedCategoryIds.length} categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'} ·{' '}
              {selectedPreset.limits.length} {selectedPreset.limitLabel.toLowerCase()}s ·{' '}
              {selectedPreset.limits.length} throws max
            </p>
          </div>
          <button
            onClick={startGame}
            disabled={!selectedPreset.available || selectedCategoryIds.length === 0}
            className="shrink-0 py-4 px-10 rounded-full font-['Lexend'] font-black text-[#561f00] text-xl uppercase tracking-tighter shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #ffb693 0%, #692800 100%)' }}
          >
            START GAME
            <span className="material-symbols-outlined">play_circle</span>
          </button>
        </div>
      </main>
    </div>
  )
}
