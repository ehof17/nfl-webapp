export const FUZZYMATCH_URL = "http://localhost:3001";

export interface FuzzyMatchPlayer {
  id: number;
  name: string;
  league: string;
  position: string;
  team: string | null;
  years_active: string;
}
// todo add league param here and filter by that as well
export async function fuzzySearchPlayers(league: 'mlb' | 'nfl' | 'nba', query: string): Promise<FuzzyMatchPlayer[]> {
  const res = await fetch(
    `${FUZZYMATCH_URL}/players/search?q=${encodeURIComponent(query)}&league=${league}`
  );
  if (!res.ok) {
    throw new Error(`Player search failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}