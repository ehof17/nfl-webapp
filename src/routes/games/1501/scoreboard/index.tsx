import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getLeaderboard } from '#/api/scores'
import { GAME_PRESETS } from '#/lib/dartsConfig'

const fetchLeaderboard = createServerFn({ method: 'GET' })
  .inputValidator((data: { sport: string }) => data)
  .handler(async ({ data }) => getLeaderboard(data.sport, 50))

export const Route = createFileRoute('/games/1501/scoreboard/')({
  validateSearch: (raw: Record<string, unknown>) => ({
    sport: typeof raw.sport === 'string' ? raw.sport : 'nfl',
  }),
  loaderDeps: ({ search }) => ({ sport: search.sport }),
  loader: async ({ deps }) => {
    const records = await fetchLeaderboard({ data: { sport: deps.sport } })
    return { records }
  },
  component: RouteComponent,
})

function medal(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

function RouteComponent() {
  const { sport } = Route.useSearch()
  const { records } = Route.useLoaderData()
  const navigate = Route.useNavigate()

  const preset = GAME_PRESETS.find((p) => p.id === sport) ?? GAME_PRESETS[0]

  return (
    <div className="bg-[#131313] min-h-screen text-[#e5e2e1]">
      <main className="pt-6 pb-20 px-4 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8">
          <Link
            to="/games/1501"
            className="text-[#8b938d] font-['Lexend'] font-bold uppercase tracking-[0.15em] text-xs flex items-center gap-1 hover:text-[#ffb693] transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </Link>
          <h1 className="font-['Lexend'] font-black text-2xl uppercase tracking-tighter text-[#e5e2e1]">
            Scoreboard <span className="text-[#ffb693] italic">1501</span>
          </h1>
        </div>

        {/* Sport tabs */}
        <div className="flex gap-2 mb-8">
          {GAME_PRESETS.filter((p) => p.available).map((p) => (
            <button
              key={p.id}
              onClick={() => navigate({ search: { sport: p.id } })}
              className={`px-5 py-2 rounded-full font-['Lexend'] font-bold text-sm uppercase tracking-wider transition-all ${
                sport === p.id
                  ? 'bg-[#ffb693] text-[#561f00]'
                  : 'bg-[#1c1b1b] text-[#8b938d] border border-[#2e2d2d] hover:border-[#ffb693]/50 hover:text-[#e5e2e1]'
              }`}
            >
              {p.sport}
            </button>
          ))}
        </div>

        {/* Ranking legend */}
        <p className="text-[#8b938d] font-['Lexend'] text-xs uppercase tracking-wider mb-4">
          Ranked by fewest throws · then closest to zero
        </p>

        {records.length === 0 ? (
          <div className="bg-[#1c1b1b] rounded-xl p-12 text-center">
            <p className="text-[#8b938d] font-['Lexend'] font-bold text-lg mb-2">No scores yet</p>
            <p className="text-[#4a4a4a] font-['Lexend'] text-sm mb-6">
              Win a game of {preset.name} to get on the board!
            </p>
            <Link
              to="/games/1501"
              className="bg-[#ffb693] text-[#561f00] font-['Lexend'] font-black px-8 py-3 rounded-full text-sm uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Play Now
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record, i) => {
              const rank = i + 1
              const m = medal(rank)
              const date = new Date(record.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              return (
                <details key={record.id} className="group bg-[#1c1b1b] rounded-xl overflow-hidden">
                  <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer list-none select-none hover:bg-[#222221] transition-colors">
                    {/* Rank */}
                    <div className="w-8 text-center shrink-0">
                      {m ? (
                        <span className="text-xl">{m}</span>
                      ) : (
                        <span className="font-['Lexend'] font-black text-sm text-[#8b938d]">#{rank}</span>
                      )}
                    </div>

                    {/* Name */}
                    <p className="font-['Lexend'] font-black text-base uppercase tracking-tight flex-1 truncate">
                      {record.entrantName}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <p className="font-['Lexend'] font-black text-lg text-[#ffb693] leading-none">
                          {record.throwsUsed}
                        </p>
                        <p className="font-['Lexend'] text-[10px] uppercase tracking-widest text-[#8b938d]">
                          throws
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-['Lexend'] font-black text-lg text-[#a5d0b9] leading-none">
                          {record.finalScore}
                        </p>
                        <p className="font-['Lexend'] text-[10px] uppercase tracking-widest text-[#8b938d]">
                          final
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="font-['Lexend'] text-xs text-[#8b938d]">{date}</p>
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-[#8b938d] text-sm ml-1 transition-transform group-open:rotate-90">
                      chevron_right
                    </span>
                  </summary>

                  {/* Expanded history */}
                  <div className="border-t border-[#2e2d2d] px-5 py-4">
                    <p className="font-['Lexend'] font-bold text-[10px] uppercase tracking-[0.2em] text-[#8b938d] mb-3">
                      History
                    </p>
                    <div className="space-y-2">
                      {record.history.map((h, j) => (
                        <div key={j} className="flex items-center gap-3 text-sm font-['Lexend']">
                          <span className="text-[#8b938d] w-5 text-right shrink-0">{j + 1}</span>
                          <span className="text-[#e5e2e1] font-bold truncate flex-1">{h.playerName}</span>
                          <span className="text-[#8b938d] shrink-0">{h.year}</span>
                          <span className="text-[#a5d0b9] shrink-0 text-xs">{h.category}</span>
                          <span className="text-[#ffb693] font-bold shrink-0 w-16 text-right">
                            {h.value === '?' ? '?' : h.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
