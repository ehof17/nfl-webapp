import { useState } from 'react'

interface SubmissionBetFormProps {
  playerName: string
  year: number
  onPlayerNameChange: (name: string) => void
  onYearChange: (year: number) => void
  onSubmit: () => void
  disabled: boolean
  compact?: boolean
}

export default function SubmissionBetForm({
  playerName,
  year,
  onPlayerNameChange,
  onYearChange,
  onSubmit,
  disabled,
  compact = false,
}: SubmissionBetFormProps) {
  const [nameTouched, setNameTouched] = useState(false)

  const nameEmpty = playerName.trim() === ''
  const nameError = nameTouched && nameEmpty
  const canSubmit = !disabled && !nameEmpty

  function handleSubmit() {
    if (nameEmpty) {
      setNameTouched(true)
      return
    }
    onSubmit()
  }

  if (compact) {
    return (
      <div className="bg-[#1c1b1b] rounded-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-start">

          <div>
            <div className="relative flex items-center">
              <div className={`absolute left-0 w-1 h-full transition-colors ${nameError ? 'bg-[#ffb4ab]' : 'bg-[#a5d0b9]'}`} />
              <input
                type="text"
                value={playerName}
                onChange={(e) => { onPlayerNameChange(e.target.value); setNameTouched(true) }}
                onBlur={() => setNameTouched(true)}
                placeholder="Player name…"
                className={`w-full bg-[#353534] border-none focus:ring-0 text-[#e5e2e1] py-3 px-4 pl-5 font-['Lexend'] font-bold placeholder:text-[#8b938d] rounded-r-lg text-sm`}
              />
            </div>
            {nameError && (
              <p className="text-[#ffb4ab] font-['Lexend'] font-bold text-[10px] uppercase tracking-widest mt-1.5 pl-4">
                Player name required
              </p>
            )}
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-0 w-1 h-full bg-[#a5d0b9]" />
            <input
              type="number"
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              min={1930}
              max={2025}
              placeholder="Year"
              className="w-full sm:w-28 bg-[#353534] border-none focus:ring-0 text-[#e5e2e1] py-3 px-4 pl-5 font-['Lexend'] font-bold placeholder:text-[#8b938d] rounded-r-lg text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="py-3 px-6 rounded-full font-['Lexend'] font-black text-[#561f00] uppercase tracking-tighter shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #ffb693 0%, #692800 100%)' }}
          >
            LOCK IN
            <span className="material-symbols-outlined text-base">play_circle</span>
          </button>

        </div>
      </div>
    )
  }

  return (
    <section className="mb-20">
      <div className="bg-[#353534] p-1 rounded-xl">
        <div className="bg-[#1c1b1b] p-8 md:p-12 rounded-[calc(0.75rem-1px)]">
          <h2 className="font-['Lexend'] font-black text-4xl uppercase italic tracking-tighter mb-10 text-[#ffb693]">
            Place Your Bet
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            <div className="md:col-span-5">
              <label className="block font-['Lexend'] font-bold text-xs uppercase text-[#c1c8c2] mb-2 tracking-widest">
                Player Name
              </label>
              <div className="relative flex items-center">
                <div className={`absolute left-0 w-1 h-full transition-colors ${nameError ? 'bg-[#ffb4ab]' : 'bg-[#a5d0b9]'}`} />
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => { onPlayerNameChange(e.target.value); setNameTouched(true) }}
                  onBlur={() => setNameTouched(true)}
                  placeholder="e.g. Barry Sanders"
                  className="w-full bg-[#353534] border-none focus:ring-0 text-[#e5e2e1] p-4 pl-6 font-['Lexend'] font-bold placeholder:text-[#8b938d] rounded-r-lg"
                />
              </div>
              {nameError && (
                <p className="text-[#ffb4ab] font-['Lexend'] font-bold text-[10px] uppercase tracking-widest mt-2 pl-1">
                  Player name required
                </p>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block font-['Lexend'] font-bold text-xs uppercase text-[#c1c8c2] mb-2 tracking-widest">
                Season Year
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-0 w-1 h-full bg-[#a5d0b9]" />
                <input
                  type="number"
                  value={year}
                  onChange={(e) => onYearChange(Number(e.target.value))}
                  placeholder="1997"
                  className="w-full bg-[#353534] border-none focus:ring-0 text-[#e5e2e1] p-4 pl-6 font-['Lexend'] font-bold placeholder:text-[#8b938d] rounded-r-lg"
                />
              </div>
            </div>

            <div className="md:col-span-4 md:pt-6">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-4 rounded-full font-['Lexend'] font-black text-[#561f00] text-xl uppercase tracking-tighter shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #ffb693 0%, #692800 100%)' }}
              >
                LOCK IN PICK
                <span className="material-symbols-outlined">play_circle</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
