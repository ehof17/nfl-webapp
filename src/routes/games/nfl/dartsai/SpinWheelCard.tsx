import RouletteWheel from '#/components/RouletteWheel'

interface SpinWheelCardProps {
  title: string
  icon: string
  options: string[]
  currentValue: string
  colorScheme: 'primary' | 'secondary'
  onResult: (value: string) => void
  compact?: boolean
  spinKey?: number
}

const COLORS = {
  primary: { text: 'text-[#ffb693]', bar: 'bg-[#ffb693]', hex: '#ffb693' },
  secondary: { text: 'text-[#a5d0b9]', bar: 'bg-[#a5d0b9]', hex: '#a5d0b9' },
}

export default function SpinWheelCard({
  title,
  icon,
  options,
  currentValue,
  colorScheme,
  onResult,
  compact = false,
  spinKey,
}: SpinWheelCardProps) {
  const c = COLORS[colorScheme]
  return (
    <div className={`bg-[#1c1b1b] rounded-xl relative overflow-hidden group ${compact ? 'p-4' : 'p-8'}`}>
      <div className={`absolute opacity-10 group-hover:opacity-20 transition-opacity ${compact ? '-top-6 -right-6' : '-top-10 -right-10'}`}>
        <span className={`material-symbols-outlined ${c.text} ${compact ? 'text-[7rem]' : 'text-[12rem]'}`}>{icon}</span>
      </div>
      <h3 className={`font-['Lexend'] font-extrabold uppercase tracking-tighter flex items-center gap-2 text-[#e5e2e1] ${compact ? 'text-base mb-3' : 'text-2xl mb-2'}`}>
        <span className={`${c.bar} block shrink-0 ${compact ? 'w-1.5 h-5' : 'w-2 h-8'}`} />
        {title}
      </h3>
      {!compact && (
        <p className={`${c.text} font-['Lexend'] font-bold text-sm uppercase mb-4`}>{currentValue}</p>
      )}
      <div className="flex justify-center">
        <RouletteWheel
          options={options}
          onResult={onResult}
          accentColor={c.hex}
          size={compact ? 200 : 280}
          spinKey={spinKey}
        />
      </div>
    </div>
  )
}
