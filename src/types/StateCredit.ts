export interface StateCreditConfig {
  stateCode: string;
  stateName: string;
  years: {
    [year: number]: StateCreditYearConfig;
  };
  defaultConfig: StateCreditYearConfig;
}

export interface StateCreditYearConfig {
  // Basic credit information
  creditRate: number;
  maxCredit?: number | null;
  carryForwardYears: number;
  carryBackYears?: number;
  refundable: boolean;
  transferable?: boolean;
  
  // Calculation method
  calculationMethod: 'Standard' | 'ASC' | 'Hybrid' | 'Tiered' | 'FederalBased';
  
  // Entity eligibility
  eligibleEntities: EntityType[];
  
  // Pre-filing requirements
  preFilingRequired: boolean;
  preFilingForm?: string;
  preFilingDeadline?: string;
  certificationRequired?: boolean;
  
  // Special rules
  specialRules?: {
    startupRules?: boolean;
    smallBusinessRules?: boolean;
    industrySpecificRules?: string[];
    employeeCountLimits?: {
      min?: number;
      max?: number;
    };
    grossReceiptsLimits?: {
      min?: number;
      max?: number;
    };
    universityCollaborationBonus?: number;
    basicResearchBonus?: number;
    statewideCap?: number;
    perTaxpayerCap?: number;
  };
  
  // Effective dates
  effectiveDate: string;
  sunsetDate?: string;
  
  // Formula details
  formula: {
    baseCalculation?: 'Average3Year' | 'Average4Year' | 'FixedPercentage' | 'None';
    basePercentage?: number; // For fixed percentage base
    excessCalculation: 'Simple' | 'Tiered' | 'FederalBased';
    tiers?: CreditTier[];
    federalCreditPercentage?: number; // For federal-based calculations
  };
  
  // Additional requirements
  requiresFederalCredit?: boolean;
  requiresForm6765?: boolean;
  notes?: string[];
}

export interface CreditTier {
  threshold: number;
  rate: number;
  description: string;
}

export type EntityType = 
  | 'C-Corp' 
  | 'S-Corp' 
  | 'LLC' 
  | 'Partnership' 
  | 'SoleProprietorship' 
  | 'Trust' 
  | 'ExemptOrg' 
  | 'All';

export interface StateCreditInput {
  stateCode: string;
  year: number;
  calculationYear: number;
  federalCredit: number;
  stateQREs: number;
  priorYearQREs: number[]; // [y-1, y-2, y-3, y-4] as needed
  businessType: EntityType;
  employeeCount?: number;
  grossReceipts?: number;
  universityCollaboration?: boolean;
  basicResearchPayments?: number;
  isStartup?: boolean;
  industry?: string;
}

export interface StateCreditResult {
  credit: number;
  creditAmount: number;
  baseAmount: number;
  excessQREs: number;
  effectiveRate: number;
  calculationMethod: string;
  carryForwardYears: number;
  refundable: boolean;
  transferable?: boolean;
  maxCredit?: number | null;
  notes: string[];
  breakdown: {
    step1?: string;
    step2?: string;
    step3?: string;
    step4?: string;
  };
}

export interface StateCreditEligibility {
  isEligible: boolean;
  reasons: string[];
  requirements: string[];
  preFilingRequired: boolean;
  preFilingForm?: string;
  preFilingDeadline?: string;
} 