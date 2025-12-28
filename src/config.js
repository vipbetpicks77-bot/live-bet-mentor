/**
 * LIVE BETTING MENTOR - Centralized Configuration
 */

/**
 * CONFIGURATION - [FROZEN FOR OBSERVATION PHASE: DEC 26 - JAN 05]
 * DO NOT MODIFY LIMITS, RISK, OR LEAGUES DURING THIS PERIOD.
 */
export const CONFIG = {
  // Decision Engine Thresholds
  DECISION: {
    EDGE_SCORE_THRESHOLD: 1.20, // Min value to consider a BET
    MIN_SELECTIVITY_PASS_RATE: 0.60, // Target selectivity
    MAX_COUNTER_ARGUMENTS: 2, // Max allowed counter-args before automatic PASS
    DAILY_TRANSACTION_LIMIT: 2, // Max 2 approved trades per day
    DQS_THRESHOLD: 0.70, // Min Data Quality Score to allow analysis
    DQS_WEIGHTS: {
      LATENCY: 0.4,
      STATS_AVAILABILITY: 0.4,
      FRESHNESS: 0.2
    },
    MODES: {
      CORE_DQS: 'CORE_DQS',
      DQS_RISK: 'DQS_RISK',
      FULL_STACK: 'FULL_STACK'
    },
    RISK: {
      DEAD_MATCH_MIN: 75,
      DEAD_MATCH_DIFF: 2,
      MOMENTUM_WINDOW_MIN: 10,
      LATE_GAME_BAN_MIN: 85
    }
  },

  // Data & Latency
  DATA: {
    RAPIDAPI_HOST: 'api-football-v1.p.rapidapi.com',
    SOFASCORE_API_BASE: 'https://api.sofascore.com/api/v1',
    LIVESCORE_API_HOST: 'live-score-api.com',
    LATENCY_THRESHOLD_MS: 30000, // 30 seconds
    POLLING_INTERVAL_MS: 10000, // 10 seconds for live updates
    RELIABILITY_SCORE_MIN: 0.8, // Minimum reliability score to avoid NO-BET
    USE_MOCK_DATA: false, // For Phase 11 testing
    DATA_SOURCE_OPTIONS: {
      SOFASCORE: 'SOFASCORE',
      RAPIDAPI: 'RAPIDAPI',
      LIVESCORE_API: 'LIVESCORE_API'
    }
  },

  // Bankroll Management
  BANKROLL: {
    DEFAULT_MAX_STAKE_PERCENT: 0.01,
    LOW_RISK_STAKE: 0.0075,
    MEDIUM_RISK_STAKE: 0.005,
    HIGH_RISK_STAKE: 0.0025,
    LOSS_STREAK_STAKE_MODIFIER: 0.5,
    HIERARCHY: {
      INITIAL_BALANCE: 2000,
      MODES: {
        NORMAL: 'NORMAL',
        CAUTION: 'CAUTION',
        NO_BET: 'NO_BET'
      },
      THRESHOLDS: {
        CAUTION_LOSS_STREAK: 2,
        STOP_LOSS_STREAK: 3,
        DAILY_LOSS_LIMIT: 3,
        DAILY_BET_LIMIT: 5
      },
      STAKE_PERCENTAGE: {
        TIER_1: 0.01, // 1%
        TIER_2: 0.005 // 0.5%
      }
    }
  },

  // Visuals
  THEME: {
    DARK_MODE: true,
    GLASSMORPHISM: true,
  },

  // Phase 11: Modular System (Gözlem Aşaması - Default: OFF)
  MODULAR_SYSTEM: {
    OBSERVATION_MODE: true, // 14-day silent log protocol
    SECONDARY_VALIDATOR: {
      ENABLED: true,
      SOURCE: 'MACKOLIK_VALIDATOR',
      MATCHING_STRICTNESS: 'HIGH', // 4D Matching (League + Time + Teams + Fuzzy)
    },
    OPTIONAL_MODULES: {
      XG_ANALYSIS: false,
      LEAGUE_PROFILES: false,
      BAYESIAN_PRICING: false
    },
    // Phase 12: Tiered League System
    LEAGUE_TIERS: {
      TIER_1: ['Süper Lig', 'Premier League', 'Bundesliga', 'LaLiga', 'Serie A', 'Ligue 1', 'Champions League', 'Europa League'],
      TIER_2: ['Eredivisie', 'Primeira Liga', 'Pro League', 'Austrian Bundesliga', 'Super League', 'Superliga', 'Scottish Premiership', 'MLS'],
      // Everything else is TIER_3 (Discovery) by default
      SETTINGS: {
        TIER_2_MOMENTUM_WINDOW: 15, // More aggressive (15m instead of 10m)
        TIER_2_DEAD_MATCH_MIN: 70, // Earlier dead-match check (70' instead of 75')
      }
    }
  }
};
