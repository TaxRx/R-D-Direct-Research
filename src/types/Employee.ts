export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  wage: number;
  roleId: string; // Links to role from IdentifyRoles
  customRoleName?: string; // Custom role name when roleId is 'other'
  isBusinessOwner: boolean;
  appliedPercentage: number; // Initially from role, can be customized
  appliedAmount: number; // Calculated: wage * appliedPercentage
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  // Custom employee-specific configuration
  customPracticePercentages?: Record<string, number>; // Activity name -> practice percentage
  customTimePercentages?: Record<string, Record<string, number>>; // Activity name -> subcomponent ID -> time percentage
}

export interface EmployeesByYear {
  [year: number]: Employee[];
}

export interface ContractorsByYear {
  [year: number]: Contractor[];
}

export interface SuppliesByYear {
  [year: number]: Supply[];
}

export interface Contractor {
  id: string;
  contractorType: 'individual' | 'business'; // New field to distinguish type
  firstName?: string; // For individual contractors
  lastName?: string; // For individual contractors
  businessName?: string; // For business entity contractors
  totalAmount: number;
  roleId: string;
  customRoleName?: string; // Custom role name when roleId is 'other'
  appliedPercentage: number;
  appliedAmount: number; // Calculated: totalAmount * appliedPercentage * 0.65 (65% rule)
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  // Custom contractor-specific configuration
  customPracticePercentages?: Record<string, number>; // Activity name -> practice percentage
  customTimePercentages?: Record<string, Record<string, number>>; // Activity name -> subcomponent ID -> time percentage
}

export interface Supply {
  id: string;
  title: string; // Name of the supply
  description: string; // What it is and what it does
  totalValue: number; // Total value of the supply
  category: string; // Category with 'other' option
  appliedPercentage: number; // Total percentage applied across all activities/subcomponents
  appliedAmount: number; // Calculated: totalValue * appliedPercentage
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  // Custom supply-specific configuration for activity/subcomponent allocation
  customActivityPercentages?: Record<string, number>; // Activity name -> percentage
  customSubcomponentPercentages?: Record<string, Record<string, number>>; // Activity name -> subcomponent ID -> percentage
  selectedSubcomponents?: Record<string, string[]>; // Activity name -> array of selected subcomponent IDs
}

export interface ExpenseData {
  employees: EmployeesByYear;
  contractors: ContractorsByYear;
  supplies: SuppliesByYear;
}

export interface ExpenseFormData {
  firstName: string;
  lastName: string;
  wage: string;
  roleId: string;
  customRoleName: string;
  isBusinessOwner: boolean;
}

export interface ContractorFormData {
  contractorType: 'individual' | 'business';
  firstName: string;
  lastName: string;
  businessName: string;
  totalAmount: string;
  roleId: string;
  customRoleName: string;
}

export const EMPTY_EXPENSE_FORM: ExpenseFormData = {
  firstName: '',
  lastName: '',
  wage: '',
  roleId: '',
  customRoleName: '',
  isBusinessOwner: false,
};

export const EMPTY_CONTRACTOR_FORM: ContractorFormData = {
  contractorType: 'individual',
  firstName: '',
  lastName: '',
  businessName: '',
  totalAmount: '',
  roleId: '',
  customRoleName: '',
};

export interface SupplyFormData {
  title: string;
  description: string;
  totalValue: string;
  category: string;
  customCategory: string;
}

export const EMPTY_SUPPLY_FORM: SupplyFormData = {
  title: '',
  description: '',
  totalValue: '',
  category: '',
  customCategory: '',
};

export const SUPPLY_CATEGORIES = [
  'Laboratory Equipment',
  'Software & Licenses',
  'Raw Materials',
  'Testing Materials',
  'Research Tools',
  'Computing Hardware',
  'Specialized Components',
  'Other'
];

export const NON_RD_ROLE = {
  id: 'non-rd',
  name: 'Non-R&D',
  appliedPercentage: 0,
  description: 'Employee does not participate in R&D activities'
};

export const OTHER_ROLE = {
  id: 'other',
  name: 'Other',
  appliedPercentage: 100, // Default to full activity percentages
  description: 'Custom role with access to all activities at full percentages'
}; 