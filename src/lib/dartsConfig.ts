import type { ScraperType } from '#/api/getNFLData'

export interface DartsCategory {
  id: string
  label: string
  scraper: ScraperType
  field: string
}

export interface DartsPreset {
  id: string
  name: string
  sport: string
  icon: string
  startScore: number
  winMargin: number
  categories: DartsCategory[]
  limits: string[]
  limitLabel: string
  available: boolean
}

export const NFL_CATEGORIES: DartsCategory[] = [
  { id: 'ppr',  label: 'PPR Fantasy Points',  scraper: 'PPRFantasyFootball', field: 'FantPt'       },
  { id: 'rush', label: 'Rushing Yards',        scraper: 'FootballYardage',   field: 'RushingYds'   },
  { id: 'rec',  label: 'Receiving Yards',      scraper: 'FootballYardage',   field: 'ReceivingYds' },
  { id: 'tot', label: 'Passing Touchdowns', scraper: 'FootballTDs', field: 'PassingTDs' }
]

export const NFL_PRESET: DartsPreset = {
  id: 'nfl',
  name: 'NFL 1501',
  sport: 'NFL',
  icon: 'sports_football',
  startScore: 1501,
  winMargin: 10,
  categories: NFL_CATEGORIES,
  limits: [
    'AFC East', 'AFC North', 'AFC South', 'AFC West',
    'NFC East', 'NFC North', 'NFC South', 'NFC West',
  ],
  limitLabel: 'Division',
  available: true,
}

export const MLB_HITTING_CATEGORIES: DartsCategory[] = [
  { id: 'hr',  label: 'Home Runs',    scraper: 'MLBHittingSeason', field: 'HomeRuns'    },
  { id: 'rbi', label: 'RBIs',         scraper: 'MLBHittingSeason', field: 'RBIs'        },
  { id: 'sb',  label: 'Stolen Bases', scraper: 'MLBHittingSeason', field: 'StolenBases' },
  { id: 'h',   label: 'Hits',         scraper: 'MLBHittingSeason', field: 'Hits'        },
  { id: 'r',   label: 'Runs',         scraper: 'MLBHittingSeason', field: 'Runs'        },
]

export const MLB_PITCHING_CATEGORIES: DartsCategory[] = [
  { id: 'era', label: 'ERA',          scraper: 'MLBPitchingSeason', field: 'ERA'          },
  { id: 'war', label: 'WAR',          scraper: 'MLBPitchingSeason', field: 'WAR'          },
  { id: 'pw',  label: 'Pitching Wins', scraper: 'MLBPitchingSeason', field: 'PitchingWins' },
]

export const MLB_CATEGORIES: DartsCategory[] = [...MLB_HITTING_CATEGORIES, ...MLB_PITCHING_CATEGORIES]

export const MLB_PRESET: DartsPreset = {
  id: 'mlb',
  name: 'MLB 1501',
  sport: 'MLB',
  icon: 'sports_baseball',
  startScore: 1501,
  winMargin: 10,
  categories: MLB_CATEGORIES,
  limits: [
    'AL East', 'AL Central', 'AL West',
    'NL East', 'NL Central', 'NL West',
  ],
  limitLabel: 'Division',
  available: true,
}

// Stub — swap in when NBA data is wired up
export const NBA_PRESET: DartsPreset = {
  id: 'nba',
  name: 'NBA 1501',
  sport: 'NBA',
  icon: 'sports_basketball',
  startScore: 1501,
  winMargin: 10,
  categories: [],
  limits: [],
  limitLabel: 'Conference',
  available: false,
}

export const GAME_PRESETS: DartsPreset[] = [NFL_PRESET, MLB_PRESET, NBA_PRESET]
