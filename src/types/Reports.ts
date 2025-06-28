export interface Step {
  id: string;
  name: string;
  order: number;
  businessComponentId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Subcomponent {
  id: string;
  name: string;
  parentStepId: string;
  usageWeight: number; // Percentage of time/effort
  generalDescription: string;
  hypothesis: string;
  uncertainties: string;
  alternativesConsidered: string;
  developmentalPathway: string;
  lastEdited: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  researchApiData?: {
    lastFetched: string;
    sourceId: string;
    hasChanges: boolean;
  };
}

export interface ReportSettings {
  id: string;
  reportType: 'research-design' | 'research-summary' | 'filing-guide';
  title: string;
  businessId: string;
  year: number;
  createdBy: string;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  settings: {
    includeSubcomponents: boolean;
    includeTreeView: boolean;
    includeDetailedPages: boolean;
    customTitle?: string;
    customPurpose?: string;
  };
}

export interface FeedbackRequest {
  id: string;
  subcomponentId: string;
  sentTo: string;
  employeeId?: string;
  roleId?: string;
  message: string;
  status: 'pending' | 'sent' | 'responded' | 'expired';
  sentAt: string;
  respondedAt?: string;
  response?: string;
}

export interface ReportPreview {
  id: string;
  reportSettingsId: string;
  generatedAt: string;
  generatedBy: string;
  content: {
    titlePage: {
      title: string;
      company: string;
      date: string;
      preparedBy: string;
    };
    tableOfContents: {
      sections: Array<{
        title: string;
        pageNumber: number;
        subsections?: Array<{
          title: string;
          pageNumber: number;
        }>;
      }>;
    };
    purposeStatement: string;
    steps: Array<{
      step: Step;
      subcomponents: Subcomponent[];
      description: string;
    }>;
    detailedSubcomponents: Array<{
      subcomponent: Subcomponent;
      step: Step;
      fullContent: string;
    }>;
  };
}

export interface AIGeneratedContent {
  id: string;
  subcomponentId: string;
  field: 'generalDescription' | 'hypothesis' | 'uncertainties' | 'alternativesConsidered' | 'developmentalPathway';
  content: string;
  generatedAt: string;
  confidence: number; // 0-1
  source: 'research-api' | 'ai-model' | 'manual';
  version: number;
} 