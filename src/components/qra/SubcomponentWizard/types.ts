export interface Subcomponent {
  id: string;
  name: string;
  description?: string;
  metrics?: {
    time?: number;
    frequency?: number;
    year?: number;
  };
}

export interface SubcomponentMetrics {
  timePercent: number;
  frequencyPercent: number;
  yearPercent: number;
  startMonth?: number;
}

export interface ModalHierarchy {
  [phase: string]: {
    [step: string]: Subcomponent[];
  };
}

export interface SubcomponentSelection {
  phase: string;
  step: string;
  sub: Subcomponent;
}

export interface SubcomponentWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (selections: Record<string, SubcomponentSelection>, metrics: Record<string, SubcomponentMetrics>) => void;
  activity: string;
  csvRows: any[];
  currentYear: number;
}

export interface SubcomponentSelections {
  selectedModalSubs: Record<string, SubcomponentSelection>;
  modalMetrics: Record<string, SubcomponentMetrics>;
}

export interface StepTimeMap {
  [key: string]: number;
}

export interface SubcomponentLink {
  source: string;
  target: string;
  type: string;
} 