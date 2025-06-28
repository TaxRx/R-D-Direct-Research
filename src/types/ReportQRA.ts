import { SubcomponentSelectionData } from './QRABuilderInterfaces';

export interface QRASubcomponent {
  id: string;
  name: string;
  usageWeight: number;
  description?: string;
  hypothesis?: string;
  uncertainties?: string;
  alternatives?: string;
  developmentalPathway?: string;
  isReviewed?: boolean;
}

export interface QRAStep {
  id: string;
  name: string;
  description?: string;
  order: number;
  subcomponents?: QRASubcomponent[];
  timePercent?: number;
  isLocked?: boolean;
}

export interface QRAActivityData {
  id: string;
  name: string;
  category: string;
  area: string;
  focus: string;
  practicePercent: number;
  appliedPercent: number;
  nonRDTime: number;
  selectedRoles: string[];
  selectedSubcomponents?: Record<string, any>;
  subcomponentCount: number;
  steps: QRAStep[];
  active: boolean;
  lastUpdated: string;
}

export interface QRAReportData {
  businessId: string;
  year: number;
  activities: QRAActivityData[];
  totalActivities: number;
  totalSubcomponents: number;
  totalAppliedPercent: number;
  lastUpdated: string;
}

export interface QRAStatistics {
  totalActivities: number;
  totalSubcomponents: number;
  totalAppliedPercent: number;
  rdActivities: number;
  nonRdActivities: number;
  averageAppliedPercent: number;
  totalPracticePercent: number;
  topActivities: Array<{
    id: string;
    name: string;
    appliedPercent: number;
    subcomponentCount: number;
  }>;
}

export interface QRAExportData {
  reportData: QRAReportData;
  statistics: QRAStatistics;
  exportDate: string;
  version: string;
}

export interface SubcomponentConfig {
  phase: string;
  step: string;
  subcomponent: string;
  timePercent: number;
  frequencyPercent: number;
  yearPercent: number;
  startYear: number;
  selectedRoles: string[];
  appliedPercent: number;
  isNonRD?: boolean;
}

export interface StepSummary {
  stepName: string;
  timePercent: number;
  subcomponentCount: number;
  totalAppliedPercent: number;
  isLocked: boolean;
}

// Research Design Types (following RoleNode pattern)
export interface ResearchStep {
  id: string;
  name: string;
  color?: string;
  timePercentage: number; // Percentage of time for this step
  subcomponents: ResearchSubcomponent[];
  parentId?: string;
}

export interface ResearchSubcomponent {
  id: string;
  name: string;
  color?: string;
  frequencyPercentage: number; // Percentage of frequency for this subcomponent
  parentId?: string;
}

export interface ResearchActivity {
  id: string;
  name: string;
  color?: string;
  steps: ResearchStep[];
  selectedSubcomponents?: { [key: string]: any };
  subcomponentCount?: number;
}