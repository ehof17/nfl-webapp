import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/games/nfl/')({
  component: RouteComponent,
})

const games = [
  { name: 'Darts', to: '/games/nfl/darts' as const },
]

function RouteComponent() {
  return (
    <div style={{ padding: 20 }}>
      <h2>NFL Games</h2>
      <ul>
        {games.map((game) => (
          <li key={game.to}>
            <Link to={game.to}>{game.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}