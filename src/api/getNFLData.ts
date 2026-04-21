export type FantasyFootballScraperType =
  | "FantasyFootball"
  | "FootballYardage"
  | "FootballAwards"
  | "PPRFantasyFootball"
  | "FootballTDs";

export type NFLDartsCategoryType =
  | "PPR Fantasy Points in a Season"
  | "Rushing Yards in a Season"
  | "Receiving Yards in a Season"
  | "Passing TDs in a Season";

export interface NFLDartsCategoryConfig {
  scraper: FantasyFootballScraperType
  field: string
}

export const DARTS_CATEGORY_CONFIG: Record<NFLDartsCategoryType, NFLDartsCategoryConfig> = {
  "PPR Fantasy Points in a Season":    { scraper: "PPRFantasyFootball", field: "FantPt" },
  "Rushing Yards in a Season":   { scraper: "FootballYardage",   field: "RushingYds" },
  "Receiving Yards in a Season": { scraper: "FootballYardage",   field: "ReceivingYds" },
  "Passing TDs in a Season": {scraper: "FootballTDs", field: "PassingTDs"}
}

export type NFLDivision = 
  | "AFC East"
  | "AFC North"
  | "AFC South"
  | "AFC West"
  | "NFC East"
  | "NFC North"
  | "NFC South"
  | "NFC West";

export interface BaseSeason {
  playerName: string
  Year: number
  TeamAtYear: string
}


export interface FantasyFootballSeason extends BaseSeason {
  Age: number
  Games: number
  FantPos: string
  FantPt: number
  VBD?: number | null
  PosRank: number
  OvRank: number
}

export interface FootballYardage extends BaseSeason {
  RushingYds: number
  ReceivingYds: number
  PassingYds: number
}

export interface FootballTDs extends BaseSeason {
  RushingTDs: number
  ReceivingTDs: number
  PassingTDs: number
}

export interface FootballRewards extends BaseSeason {
  AllProFirst: boolean
  AllProSecond: boolean
  ProBowl: boolean
  OPOY: boolean
  DPOY: boolean
  MVP: boolean
  ComebackPlayer: boolean
}

export type NFLResponse<T> =
  | { status: "processing" }
  | { status: "ready"; data: T[] }

type GameTypeMap = {
  FantasyFootball: FantasyFootballSeason
  PPRFantasyFootball: FantasyFootballSeason
  FootballYardage: FootballYardage
  FootballAwards: FootballRewards
  FootballTDs: FootballTDs
}

const DIVISION_TEAMS: Record<NFLDivision, string[]> = {
  "AFC East":  ["BUF", "MIA", "NWE", "NYJ"],
  "AFC North": ["BAL", "CIN", "CLE", "PIT"],
  "AFC South": ["HOU", "IND", "JAX", "TEN"],
  "AFC West":  ["DEN", "KAN", "LVR", "LAC"],
  "NFC East":  ["DAL", "NYG", "PHI", "WAS"],
  "NFC North": ["CHI", "DET", "GNB", "MIN"],
  "NFC South": ["ATL", "CAR", "NOR", "TAM"],
  "NFC West":  ["ARI", "LAR", "SFO", "SEA"],
}

export function filterToDivision<T extends BaseSeason>(seasons: T[], division: NFLDivision): T[] {
  const teams = DIVISION_TEAMS[division]
  return seasons.filter((s) => teams.includes(s.TeamAtYear))
}


const AWS_URL =
  "https://8ta04a1fye.execute-api.us-east-2.amazonaws.com/default/GetNFLGameFunction";

export async function fetchPlayerStats<
  T extends FantasyFootballScraperType
>(
  player: string,
  gameType: T
): Promise<NFLResponse<GameTypeMap[T]>> {

  const res = await fetch(AWS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      player,
      gameType,
    }),
  })

  if (!res.ok) {
    throw new Error(`NFL API request failed: ${res.status}`)
  }

  const json = await res.json()

  return json as NFLResponse<GameTypeMap[T]>
}