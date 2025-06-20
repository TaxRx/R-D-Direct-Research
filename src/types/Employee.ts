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
  description: string;
  totalAmount: number;
  category: string;
  appliedPercentage: number;
  appliedAmount: number;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
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