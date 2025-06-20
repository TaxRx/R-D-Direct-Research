// QRASelections utility for localStorage (future: swap for Supabase API)

export interface Subcomponent {
  id: string;
  title: string;
  step: string;
  hint: string;
  frequencyPercent: number;
  timePercent: number;
  description?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  selectedMonths?: string[];
  selectedRoles?: string[];
}

export interface QRASelections {
  [businessId: string]: {
    [year: string]: {
      [activity: string]: {
        selectedModalSubs: Record<string, { phase: string; step: string; sub: Subcomponent }>;
        modalMetrics: Record<string, { timePercent: number; frequencyPercent: number; yearPercent: number; startMonth: number; startYear?: number; selectedRoles?: string[] }>;
      }
    }
  }
}

const QRA_SELECTIONS_KEY = 'qraSelections';

export function loadQRASelections(): QRASelections {
  try {
    return JSON.parse(localStorage.getItem(QRA_SELECTIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveQRASelections(data: QRASelections) {
  localStorage.setItem(QRA_SELECTIONS_KEY, JSON.stringify(data));
} 