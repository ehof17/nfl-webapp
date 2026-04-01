import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#1c1b1b]/95 border-b border-[#2e2d2d] backdrop-blur-lg">
      <nav className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-14">

        {/* Brand → home */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 no-underline group">
          <span className="w-1.5 h-5 bg-[#ffb693] block transition-all group-hover:h-6" />
          <span className="font-['Lexend'] font-black text-lg uppercase tracking-tighter text-[#e5e2e1] leading-none">
            EMURDA <span className="text-[#ffb693] italic">GAMES</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="ml-auto flex items-center gap-6">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="font-['Lexend'] font-bold text-[11px] uppercase tracking-[0.2em] text-[#8b938d] hover:text-[#e5e2e1] transition-colors no-underline"
            activeProps={{ className: "font-['Lexend'] font-bold text-[11px] uppercase tracking-[0.2em] text-[#e5e2e1] no-underline" }}
          >
            Games
          </Link>
          <Link
            to="/games/1501"
            className="font-['Lexend'] font-bold text-[11px] uppercase tracking-[0.2em] text-[#8b938d] hover:text-[#ffb693] transition-colors no-underline"
            activeProps={{ className: "font-['Lexend'] font-bold text-[11px] uppercase tracking-[0.2em] text-[#ffb693] no-underline" }}
          >
            1501
          </Link>
        </div>

      </nav>
    </header>
  )
}
