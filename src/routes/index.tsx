import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

const GAMES = [
  {
    id: '1501',
    name: '1501',
    tagline: 'Score down from 1501 to zero.',
    description:
      'Spin the stat category and division wheels. Name a player to score their season stat. Get within ±10 of zero in 8 throws to win.',
    to: '/games/1501' as const,
    icon: 'sports_football',
    accentColor: '#ffb693',
    dimColor: '#561f00',
    available: true,
    tag: 'NFL',
  },
  {
    id: 'scattegory',
    name: 'Scattegory',
    tagline: 'Name 5 players, outscore your friends.',
    description:
      'A random stat category and division is picked. Race to name 5 NFL players and rack up the highest total stats. Play with friends in real time.',
    to: '/games/scattegory' as const,
    icon: 'groups',
    accentColor: '#a5d0b9',
    dimColor: '#0d2018',
    available: true,
    tag: 'Multiplayer',
  },
  {
    id: 'guess-the-team',
    name: 'Guess The Team',
    tagline: 'Who played where?',
    description:
      'Given a player and a season stat line, guess which team they played for that year. How well do you know the rosters?',
    to: '/' as const,
    icon: 'shield',
    accentColor: '#a5d0b9',
    dimColor: '#0d2018',
    available: false,
    tag: 'Coming Soon',
  },
  {
    id: 'draffum',
    name: 'Draffum',
    tagline: 'Draft your all-time squad.',
    description:
      'Pick players round by round to build the highest-scoring historical roster. Compete against friends or the clock.',
    to: '/' as const,
    icon: 'group',
    accentColor: '#b6a5d0',
    dimColor: '#1a0d2e',
    available: false,
    tag: 'Coming Soon',
  },
]

function App() {
  return (
    <div className="bg-[#131313] min-h-screen text-[#e5e2e1]">
      <main className="pt-12 pb-32 px-4 max-w-5xl mx-auto">

        {/* Hero */}
        <section className="mb-16">
          <span className="text-[#ffb693] font-['Lexend'] font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
            Sports Trivia
          </span>
          <h1 className="font-['Lexend'] font-black text-6xl md:text-8xl leading-none uppercase tracking-tighter text-[#e5e2e1]">
            Pick A<br />
            <span className="text-[#ffb693] italic">Game</span>
          </h1>
        </section>

        {/* Game cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {GAMES.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>

      </main>
    </div>
  )
}

interface GameCardProps {
  name: string
  tagline: string
  description: string
  to: string
  icon: string
  accentColor: string
  dimColor: string
  available: boolean
  tag: string
}

function GameCard({ name, tagline, description, to, icon, accentColor, dimColor, available, tag }: GameCardProps) {
  const inner = (
    <div
      className={`relative bg-[#1c1b1b] rounded-xl p-8 overflow-hidden flex flex-col h-full border-2 transition-all duration-200
        ${available
          ? 'border-[#2e2d2d] hover:border-current cursor-pointer group active:scale-[0.98]'
          : 'border-[#2e2d2d] opacity-60 cursor-not-allowed'
        }
      `}
      style={{ '--tw-border-opacity': 1, borderColor: available ? undefined : '#2e2d2d' } as React.CSSProperties}
    >
      {/* Background icon */}
      <div className="absolute -bottom-6 -right-6 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity pointer-events-none">
        <span className="material-symbols-outlined" style={{ fontSize: '10rem', color: accentColor }}>{icon}</span>
      </div>

      {/* Tag */}
      <div className="flex items-center gap-2 mb-6">
        <span
          className="font-['Lexend'] font-black text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
          style={{ backgroundColor: accentColor + '22', color: accentColor }}
        >
          {tag}
        </span>
      </div>

      {/* Accent bar + name */}
      <div className="flex items-start gap-3 mb-3">
        <span className="w-1.5 shrink-0 mt-1 rounded-full" style={{ height: '2rem', backgroundColor: accentColor }} />
        <div>
          <h2 className="font-['Lexend'] font-black text-3xl uppercase tracking-tighter text-[#e5e2e1] leading-none">
            {name}
          </h2>
          <p className="font-['Lexend'] font-bold text-sm uppercase tracking-wider mt-1" style={{ color: accentColor }}>
            {tagline}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[#8b938d] text-sm font-['Lexend'] leading-relaxed mt-auto pt-4">
        {description}
      </p>

      {/* CTA */}
      {available && (
        <div className="mt-6">
          <span
            className="inline-flex items-center gap-2 font-['Lexend'] font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-full transition-all group-hover:brightness-110"
            style={{ backgroundColor: accentColor, color: dimColor }}
          >
            Play
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </span>
        </div>
      )}
    </div>
  )

  if (!available) return inner

  return (
    <Link to={to} className="no-underline block h-full" style={{ color: accentColor }}>
      {inner}
    </Link>
  )
}
