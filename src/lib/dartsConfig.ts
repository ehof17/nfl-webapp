import type { FantasyFootballScraperType } from '#/api/getNFLData'

export interface DartsCategory {
  id: string
  label: string
  scraper: FantasyFootballScraperType
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

export const GAME_PRESETS: DartsPreset[] = [NFL_PRESET, NBA_PRESET]
