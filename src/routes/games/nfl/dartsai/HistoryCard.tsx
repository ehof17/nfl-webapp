export interface HistoryEntry {
  playerName: string
  year: number
  category: string
  limit: string
  limitLabel: string
  value: number | '?'
  scoreAfter: number | '?'
}

function getCardStyle(value: number | '?') {
  if (value === '?') return { bar: 'bg-[#8b938d]', scoreColor: 'text-[#8b938d]', label: 'Pending', icon: null }
  if (value === 0) return { bar: 'bg-[#ffb4ab]', scoreColor: 'text-[#c1c8c2]', label: 'Missed', icon: 'cancel' as const, iconColor: 'text-[#ffb4ab]' }
  return { bar: 'bg-[#a5d0b9]', scoreColor: 'text-[#e5e2e1]', label: 'Score', icon: 'check_circle' as const, iconColor: 'text-[#a5d0b9]' }
}

export default function HistoryCard({ playerName, year, category, limit, limitLabel, value, scoreAfter }: HistoryEntry) {
  const style = getCardStyle(value)
  return (
    <div className="bg-[#1c1b1b] hover:bg-[#2a2a2a] transition-all p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden rounded-lg">
      <div className={`absolute left-0 top-0 h-full w-2 ${style.bar}`} />
      <div className="flex items-center gap-6 pl-2">
        <div className="text-center w-16">
          <p className={`font-['Lexend'] font-black ${value !== '?' && String(value).length >= 4 ? 'text-2xl' : 'text-4xl'} ${style.scoreColor} leading-none`}>
            {value === '?' ? '?' : value}
          </p>
          <p className={`font-['Lexend'] font-bold text-[10px] uppercase ${style.bar.replace('bg-', 'text-')}`}>
            {style.label}
          </p>
        </div>
        <div>
          <h4 className="font-['Lexend'] font-extrabold text-xl text-[#e5e2e1]">{playerName}</h4>
          <p className="text-[#c1c8c2] text-sm font-medium">Season: {year}</p>
          {scoreAfter !== '?' && (
            <p className="text-[#8b938d] text-xs mt-1">Remaining: {scoreAfter}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="bg-[#353534] px-4 py-2 rounded-lg border-l-2 border-[#ffb693]">
          <p className="text-[10px] font-['Lexend'] font-bold uppercase text-[#ffb693] mb-1">Category</p>
          <p className="text-xs font-['Lexend'] font-extrabold uppercase text-[#e5e2e1]">{category}</p>
        </div>
        <div className="bg-[#353534] px-4 py-2 rounded-lg border-l-2 border-[#a5d0b9]">
          <p className="text-[10px] font-['Lexend'] font-bold uppercase text-[#a5d0b9] mb-1">{limitLabel}</p>
          <p className="text-xs font-['Lexend'] font-extrabold uppercase text-[#e5e2e1]">{limit}</p>
        </div>
        {style.icon && (
          <span className={`material-symbols-outlined ${style.iconColor} ml-2 text-2xl`}>{style.icon}</span>
        )}
      </div>
    </div>
  )
}
