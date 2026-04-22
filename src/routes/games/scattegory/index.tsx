import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { NFL_CATEGORIES } from '#/lib/dartsConfig'

export const Route = createFileRoute('/games/scattegory/')({ component: ScattegoryLobby })

const YEARS = Array.from({ length: 7 }, (_, i) => 2024 - i)

function ScattegoryLobby() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'create' | 'join'>('create')

  // Create room form state
  const [createName, setCreateName] = useState('')
  const [year, setYear] = useState(2023)
  const [selectedCats, setSelectedCats] = useState<string[]>(NFL_CATEGORIES.map(c => c.id))

  // Join room form state
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')

  function toggleCat(id: string) {
    setSelectedCats(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(c => c !== id) : prev
        : [...prev, id],
    )
  }

  function handleCreate() {
    if (!createName.trim() || selectedCats.length === 0) return
    const roomId = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
    navigate({
      to: '/games/scattegory/$roomId',
      params: { roomId },
      search: { name: createName.trim(), year, cats: selectedCats, host: true },
    })
  }

  function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (!code || !joinName.trim()) return
    navigate({
      to: '/games/scattegory/$roomId',
      params: { roomId: code },
      search: { name: joinName.trim(), year: 2023, cats: [], host: false },
    })
  }

  return (
    <div className="bg-[#131313] min-h-screen text-[#e5e2e1]">
      <main className="pt-12 pb-32 px-4 max-w-3xl mx-auto">

        {/* Hero */}
        <section className="mb-12">
          <span className="text-[#a5d0b9] font-['Lexend'] font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
            Multiplayer
          </span>
          <h1 className="font-['Lexend'] font-black text-6xl md:text-8xl leading-none uppercase tracking-tighter text-[#e5e2e1]">
            <span className="text-[#a5d0b9] italic">Scattegory</span>
          </h1>
          <p className="text-[#8b938d] font-['Lexend'] font-medium mt-4 text-lg max-w-xl">
            Race your friends to name 5 NFL players in the same stat category and division.
            Whoever racks up the most total stats wins.
          </p>
        </section>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-8 bg-[#1c1b1b] p-1 rounded-full w-fit border border-[#2e2d2d]">
          {(['create', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-full font-['Lexend'] font-black text-xs uppercase tracking-widest transition-all ${
                tab === t
                  ? 'bg-[#a5d0b9] text-[#0d2018]'
                  : 'text-[#8b938d] hover:text-[#e5e2e1]'
              }`}
            >
              {t === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <div className="space-y-8">
            {/* Name */}
            <div>
              <label className="font-['Lexend'] font-black text-xs uppercase tracking-widest text-[#8b938d] block mb-3">
                Your Name
              </label>
              <input
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full bg-[#1c1b1b] border border-[#2e2d2d] rounded-xl px-5 py-4 font-['Lexend'] font-bold text-[#e5e2e1] placeholder-[#4a4a4a] focus:outline-none focus:border-[#a5d0b9] transition-colors"
              />
            </div>

            {/* Year */}
            <div>
              <label className="font-['Lexend'] font-black text-xs uppercase tracking-widest text-[#8b938d] block mb-3">
                Season Year
              </label>
              <div className="flex flex-wrap gap-2">
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`px-5 py-3 rounded-full font-['Lexend'] font-bold text-sm uppercase tracking-wider transition-all ${
                      year === y
                        ? 'bg-[#a5d0b9] text-[#0d2018] shadow-lg'
                        : 'bg-[#1c1b1b] text-[#8b938d] border border-[#2e2d2d] hover:border-[#a5d0b9]/50'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat Categories */}
            <div>
              <h2 className="font-['Lexend'] font-black text-xs uppercase tracking-widest text-[#8b938d] mb-3 flex items-center gap-3">
                Stat Categories
                <span className="text-[#4a4a4a] normal-case tracking-normal font-normal">min 1 required</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {NFL_CATEGORIES.map(cat => {
                  const isOn = selectedCats.includes(cat.id)
                  const isOnly = selectedCats.length === 1 && isOn
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCat(cat.id)}
                      disabled={isOnly}
                      className={`px-5 py-3 rounded-full font-['Lexend'] font-bold text-sm uppercase tracking-wider transition-all ${
                        isOn
                          ? 'bg-[#a5d0b9] text-[#0d2018] shadow-lg'
                          : 'bg-[#1c1b1b] text-[#8b938d] border border-[#2e2d2d] hover:border-[#a5d0b9]/50'
                      } ${isOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                    >
                      {isOn && <span className="mr-2">✓</span>}
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!createName.trim()}
              className="w-full py-4 rounded-full font-['Lexend'] font-black text-[#0d2018] text-xl uppercase tracking-tighter shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #a5d0b9 0%, #1a5c38 100%)' }}
            >
              Create Room
              <span className="material-symbols-outlined">add_circle</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="font-['Lexend'] font-black text-xs uppercase tracking-widest text-[#8b938d] block mb-3">
                Room Code
              </label>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4"
                maxLength={8}
                className="w-full bg-[#1c1b1b] border border-[#2e2d2d] rounded-xl px-5 py-4 font-['Lexend'] font-bold text-[#e5e2e1] placeholder-[#4a4a4a] focus:outline-none focus:border-[#a5d0b9] transition-colors tracking-widest uppercase"
              />
            </div>

            <div>
              <label className="font-['Lexend'] font-black text-xs uppercase tracking-widest text-[#8b938d] block mb-3">
                Your Name
              </label>
              <input
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full bg-[#1c1b1b] border border-[#2e2d2d] rounded-xl px-5 py-4 font-['Lexend'] font-bold text-[#e5e2e1] placeholder-[#4a4a4a] focus:outline-none focus:border-[#a5d0b9] transition-colors"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || !joinName.trim()}
              className="w-full py-4 rounded-full font-['Lexend'] font-black text-[#0d2018] text-xl uppercase tracking-tighter shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #a5d0b9 0%, #1a5c38 100%)' }}
            >
              Join Room
              <span className="material-symbols-outlined">login</span>
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
