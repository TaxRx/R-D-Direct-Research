export const WIZARD_STEPS = {
  SELECTION: 1,
  REVIEW: 2
} as const;

export const DEFAULT_METRICS = {
  timePercent: 100,
  frequencyPercent: 100,
  yearPercent: 100,
  startMonth: 0
} as const;

export const CHART_COLORS = {
  TIME: '#2196f3',
  FREQUENCY: '#4caf50',
  YEAR: '#ff9800',
  BACKGROUND: '#f5f5f5',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336'
} as const;

export const VALIDATION = {
  MIN_PERCENT: 0,
  MAX_PERCENT: 100,
  MIN_MONTH: 0,
  MAX_MONTH: 11,
  TIME_TOLERANCE: 0.01
} as const;

export const UI = {
  DIALOG: {
    MIN_HEIGHT: '80vh',
    MAX_HEIGHT: '90vh'
  },
  CARD: {
    SHADOW: 1
  },
  CHART: {
    WIDTH: 200,
    HEIGHT: 200,
    INNER_RADIUS: 30,
    OUTER_RADIUS: 40,
    PADDING_ANGLE: 5
  }
} as const; 