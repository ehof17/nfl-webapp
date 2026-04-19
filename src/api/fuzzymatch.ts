export const FUZZYMATCH_URL = "http://localhost:3001";

export interface FuzzyMatchPlayer {
  id: number;
  name: string;
  league: string;
  position: string;
  team: string | null;
  years_active: string;
}

export async function fuzzySearchPlayers(query: string): Promise<FuzzyMatchPlayer[]> {
  const res = await fetch(
    `${FUZZYMATCH_URL}/players/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) {
    throw new Error(`Player search failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}