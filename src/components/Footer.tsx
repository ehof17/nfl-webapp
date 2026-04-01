
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#1c1b1b] border-t border-[#2e2d2d] px-4 pt-12 pb-10">
      <div className="max-w-7xl mx-auto">

        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-1.5 h-5 bg-[#ffb693] block" />
              <span className="font-['Lexend'] font-black text-lg uppercase tracking-tighter text-[#e5e2e1] leading-none">
                EMURDA <span className="text-[#ffb693] italic">GAMES</span>
              </span>
            </div>
            <p className="text-[#8b938d] text-xs font-['Lexend'] font-medium max-w-xs leading-relaxed">
              Sports trivia games for people who know their stats.
            </p>
          </div>

          {/* Nav */}
    
        </div>

        {/* Divider */}
        <div className="border-t border-[#2e2d2d] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-['Lexend'] font-medium text-xs text-[#8b938d] uppercase tracking-widest">
            &copy; {year} EMurda Industries
          </p>
          <p className="font-['Lexend'] font-medium text-xs text-[#2e2d2d] uppercase tracking-widest">
            All rights reserved
          </p>
        </div>

      </div>
    </footer>
  )
}
