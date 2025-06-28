// Comprehensive QRA Builder Interface Definitions
// This file defines all interfaces needed for modularizing RDExpensesTab.tsx
// while preserving every single interaction and functionality

import React, { ReactNode } from 'react';
import { Business, RoleNode, Role } from './Business';
import { Employee, Contractor, Supply, ExpenseFormData, ContractorFormData, SupplyFormData } from './Employee';

// ============================================================================
// CORE STATE INTERFACES
// ============================================================================

export interface QRABuilderState {
  // Main data arrays
  employees: Employee[];
  contractors: Contractor[];
  supplies: Supply[];
  roles: Role[];
  availableYears: number[];
  
  // Form states
  formData: ExpenseFormData;
  contractorFormData: ContractorFormData;
  supplyFormData: SupplyFormData;
  
  // Error states
  formError: string;
  contractorFormError: string;
  supplyFormError: string;
  
  // Tab selection
  selectedExpenseType: 'employees' | 'contractors' | 'supplies' | 'reporting';
  
  // Approval states
  isActivitiesApproved: boolean;
  isExpensesApproved: boolean;
}

// ============================================================================
// MODAL STATE INTERFACES
// ============================================================================

export interface EmployeeConfigureModalState {
  isOpen: boolean;
  selectedEmployee: Employee | null;
  practicePercentages: Record<string, number>;
  timePercentages: Record<string, Record<string, number>>;
}

export interface ContractorConfigureModalState {
  isOpen: boolean;
  selectedContractor: Contractor | null;
  practicePercentages: Record<string, number>;
  timePercentages: Record<string, Record<string, number>>;
}

export interface SupplyConfigureModalState {
  isOpen: boolean;
  selectedSupply: Supply | null;
  activityPercentages: Record<string, number>;
  subcomponentPercentages: Record<string, Record<string, number>>;
  selectedSubcomponents: Record<string, string[]>;
}

export interface ModalStates {
  employee: EmployeeConfigureModalState;
  contractor: ContractorConfigureModalState;
  supply: SupplyConfigureModalState;
}

// ============================================================================
// CALCULATION INTERFACES
// ============================================================================

export interface CalculationFunctions {
  // Employee calculations
  calculateEmployeeAppliedPercentage: (employee: Employee, activities: any[]) => number;
  calculateActivityAppliedPercentage: (activity: any) => number;
  getEmployeeActivities: (employee: Employee) => any[];
  
  // Contractor calculations
  calculateContractorAppliedPercentage: (contractor: Contractor, activities: any[]) => number;
  calculateContractorActivityAppliedPercentage: (activity: any) => number;
  getContractorActivities: (contractor: Contractor) => any[];
  
  // Supply calculations
  calculateSupplyAppliedPercentage: (supply: Supply) => number;
  getSupplyActivities: () => any[];
  getSupplyActivitySubcomponents: (activityName: string) => any[];
  
  // Role calculations
  calculateRoleAppliedPercentages: (roles: RoleNode[], selectedBusinessId: string, selectedYear: number) => Role[];
  
  // Utility calculations
  getQRAData: (activityName: string) => SubcomponentSelectionData | null;
  getAppliedPercentage: (activityName: string) => number;
  hasAnyQRAData: () => boolean;
  getActivityColor: (activityName: string, allActivities: any[]) => string;
}

// ============================================================================
// EVENT HANDLER INTERFACES
// ============================================================================

export interface EmployeeEventHandlers {
  handleAddEmployee: () => void;
  handleDeleteEmployee: (employeeId: string) => void;
  handleToggleEmployeeActive: (employee: Employee) => void;
  handleToggleEmployeeLock: (employee: Employee) => void;
  handleOpenConfigureModal: (employee: Employee) => void;
  handleCloseConfigureModal: () => void;
  handleSaveEmployeeConfiguration: () => void;
  handleFormChange: (field: keyof ExpenseFormData, value: string | boolean) => void;
}

export interface ContractorEventHandlers {
  handleAddContractor: () => void;
  handleDeleteContractor: (contractorId: string) => void;
  handleToggleContractorActive: (contractor: Contractor) => void;
  handleToggleContractorLock: (contractor: Contractor) => void;
  handleOpenContractorConfigureModal: (contractor: Contractor) => void;
  handleCloseContractorConfigureModal: () => void;
  handleSaveContractorConfiguration: () => void;
  handleContractorFormChange: (field: keyof ContractorFormData, value: string) => void;
}

export interface SupplyEventHandlers {
  handleAddSupply: () => void;
  handleDeleteSupply: (supplyId: string) => void;
  handleToggleSupplyActive: (supply: Supply) => void;
  handleToggleSupplyLock: (supply: Supply) => void;
  handleOpenSupplyConfigureModal: (supply: Supply) => void;
  handleCloseSupplyConfigureModal: () => void;
  handleSaveSupplyConfiguration: () => void;
  handleSupplyFormChange: (field: keyof SupplyFormData, value: string) => void;
  
  // Supply-specific handlers
  handleSubcomponentToggle: (activityName: string, subcomponentId: string) => void;
  handleActivityPercentageChange: (activityName: string, newPercentage: number) => void;
  redistributeActivityPercentage: (activityName: string, selectedSubcomponentsMap: Record<string, string[]>) => void;
  getSubcomponentPercentage: (activityName: string, subcomponentId: string) => number;
  isSubcomponentSelected: (activityName: string, subcomponentId: string) => boolean;
}

export interface UtilityEventHandlers {
  handleKeyPress: (event: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => void;
  handleExportCSV: () => void;
}

export interface EventHandlers {
  employee: EmployeeEventHandlers;
  contractor: ContractorEventHandlers;
  supply: SupplyEventHandlers;
  utility: UtilityEventHandlers;
}

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

export interface QRABuilderContextValue {
  // Core state
  state: QRABuilderState;
  modalStates: ModalStates;
  
  // Props from parent
  selectedYear: number;
  selectedBusinessId: string;
  businesses: Business[];
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  tabReadOnly: boolean[];
  setTabReadOnly: React.Dispatch<React.SetStateAction<boolean[]>>;
  approvedTabs: boolean[];
  setApprovedTabs: React.Dispatch<React.SetStateAction<boolean[]>>;
  onEdit: () => void;
  
  // Computed values
  selectedBusiness: Business | undefined;
  businessRoles: RoleNode[];
  researchActivities: any[];
  qraData: any[];
  yearTotals: any;
  availableRoles: any[];
  
  // Functions
  calculations: CalculationFunctions;
  handlers: EventHandlers;
  
  // State setters
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setContractors: React.Dispatch<React.SetStateAction<Contractor[]>>;
  setSupplies: React.Dispatch<React.SetStateAction<Supply[]>>;
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setAvailableYears: React.Dispatch<React.SetStateAction<number[]>>;
  setFormData: React.Dispatch<React.SetStateAction<ExpenseFormData>>;
  setContractorFormData: React.Dispatch<React.SetStateAction<ContractorFormData>>;
  setSupplyFormData: React.Dispatch<React.SetStateAction<SupplyFormData>>;
  setFormError: React.Dispatch<React.SetStateAction<string>>;
  setContractorFormError: React.Dispatch<React.SetStateAction<string>>;
  setSupplyFormError: React.Dispatch<React.SetStateAction<string>>;
  setSelectedExpenseType: React.Dispatch<React.SetStateAction<'employees' | 'contractors' | 'supplies' | 'reporting'>>;
  
  // Modal state setters
  setEmployeeModalState: React.Dispatch<React.SetStateAction<EmployeeConfigureModalState>>;
  setContractorModalState: React.Dispatch<React.SetStateAction<ContractorConfigureModalState>>;
  setSupplyModalState: React.Dispatch<React.SetStateAction<SupplyConfigureModalState>>;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface EmployeeTabProps {
  employees: Employee[];
  roles: Role[];
  formData: ExpenseFormData;
  formError: string;
  isExpensesApproved: boolean;
  handlers: EmployeeEventHandlers;
  calculations: CalculationFunctions;
  modalState: EmployeeConfigureModalState;
  setModalState: React.Dispatch<React.SetStateAction<EmployeeConfigureModalState>>;
}

export interface ContractorTabProps {
  contractors: Contractor[];
  roles: Role[];
  contractorFormData: ContractorFormData;
  contractorFormError: string;
  isExpensesApproved: boolean;
  handlers: ContractorEventHandlers;
  calculations: CalculationFunctions;
  modalState: ContractorConfigureModalState;
  setModalState: React.Dispatch<React.SetStateAction<ContractorConfigureModalState>>;
}

export interface SupplyTabProps {
  supplies: Supply[];
  supplyFormData: SupplyFormData;
  supplyFormError: string;
  isExpensesApproved: boolean;
  handlers: SupplyEventHandlers;
  calculations: CalculationFunctions;
  modalState: SupplyConfigureModalState;
  setModalState: React.Dispatch<React.SetStateAction<SupplyConfigureModalState>>;
}

export interface ExpenseSummaryProps {
  yearTotals: any;
  selectedYear: number;
  isExpensesApproved: boolean;
}

export interface TabNavigationProps {
  selectedExpenseType: 'employees' | 'contractors' | 'supplies' | 'reporting';
  setSelectedExpenseType: React.Dispatch<React.SetStateAction<'employees' | 'contractors' | 'supplies' | 'reporting'>>;
  employees: Employee[];
  contractors: Contractor[];
  supplies: Supply[];
  isExpensesApproved: boolean;
}

// ============================================================================
// MODAL COMPONENT PROPS INTERFACES
// ============================================================================

export interface EmployeeConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  roles: Role[];
  practicePercentages: Record<string, number>;
  timePercentages: Record<string, Record<string, number>>;
  onSave: () => void;
  calculations: CalculationFunctions;
  setPracticePercentages: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setTimePercentages: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
}

export interface ContractorConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: Contractor | null;
  roles: Role[];
  practicePercentages: Record<string, number>;
  timePercentages: Record<string, Record<string, number>>;
  onSave: () => void;
  calculations: CalculationFunctions;
  setPracticePercentages: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setTimePercentages: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
}

export interface SupplyConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  supply: Supply | null;
  activityPercentages: Record<string, number>;
  subcomponentPercentages: Record<string, Record<string, number>>;
  selectedSubcomponents: Record<string, string[]>;
  onSave: () => void;
  calculations: CalculationFunctions;
  handlers: SupplyEventHandlers;
  setActivityPercentages: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setSubcomponentPercentages: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  setSelectedSubcomponents: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

// ============================================================================
// DEPENDENCY MAPPING INTERFACES
// ============================================================================

export interface FunctionDependency {
  functionName: string;
  dependencies: string[];
  description: string;
  critical: boolean;
}

export interface StateDependency {
  stateName: string;
  usedBy: string[];
  description: string;
  critical: boolean;
}

export interface ModalDependency {
  modalName: string;
  stateDependencies: string[];
  functionDependencies: string[];
  description: string;
  critical: boolean;
}

export interface DependencyMap {
  functions: FunctionDependency[];
  states: StateDependency[];
  modals: ModalDependency[];
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

export interface ValidationRule {
  field: string;
  rule: (value: any) => boolean;
  message: string;
  critical: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationFunctions {
  validateEmployee: (employee: Employee) => ValidationResult;
  validateContractor: (contractor: Contractor) => ValidationResult;
  validateSupply: (supply: Supply) => ValidationResult;
  validateModalData: (modalType: 'employee' | 'contractor' | 'supply', data: any) => ValidationResult;
}

// =====================================================
// UNIFIED QRA DATA TYPES
// =====================================================

export interface SubcomponentConfig {
  phase: string;
  step: string;
  subcomponent: { id: string; title: string } | string;
  timePercent: number;
  frequencyPercent: number;
  yearPercent: number;
  startYear?: number;
  selectedRoles: string[];
  appliedPercent?: number;
  isNonRD?: boolean;
}

export interface StepSummary {
  stepName: string;
  timePercent: number;
  subcomponentCount: number;
  totalAppliedPercent: number;
  isLocked: boolean;
}

export interface SubcomponentSelectionData {
  // Core selection data
  selectedSubcomponents: Record<string, SubcomponentConfig>;
  totalAppliedPercent: number;
  
  // Step-level data
  stepFrequencies?: Record<string, number>;
  stepTimeMap?: Record<string, number>;
  stepTimeLocked?: Record<string, boolean>;
  
  // Enhanced metadata
  activityName?: string;
  practicePercent: number;
  currentYear?: number;
  selectedRoles?: string[];
  
  // Calculation metadata
  calculationFormula?: string;
  lastUpdated: string;
  
  // Summary statistics
  totalSubcomponents?: number;
  rdSubcomponents?: number;
  nonRdSubcomponents?: number;
  
  // Step-level summaries
  stepSummaries?: Record<string, StepSummary>;
  
  // Legacy compatibility
  nonRDTime?: number;
  isLocked?: boolean;
}

// =====================================================
// CONFIGURATION TYPES
// =====================================================

export interface EmployeeConfiguration {
  id?: string;
  employeeId: string;
  employeeName: string;
  practicePercentages: Record<string, number>;
  timePercentages: Record<string, Record<string, number>>;
  roleAssignments: Record<string, string>;
  appliedPercentage: number;
  appliedAmount: number;
  isLocked: boolean;
}

export interface ContractorConfiguration {
  id?: string;
  contractorId: string;
  contractorName: string;
  contractorType: 'individual' | 'business';
  practicePercentages: Record<string, number>;
  timePercentages: Record<string, Record<string, number>>;
  roleAssignments: Record<string, string>;
  appliedPercentage: number;
  appliedAmount: number;
  isLocked: boolean;
}

export interface SupplyConfiguration {
  id?: string;
  supplyId: string;
  supplyName: string;
  supplyCategory?: string;
  activityPercentages: Record<string, number>;
  subcomponentPercentages: Record<string, Record<string, number>>;
  selectedSubcomponents: Record<string, string[]>;
  appliedPercentage: number;
  appliedAmount: number;
  isLocked: boolean;
}

export interface ResearchActivitySelection {
  id?: string;
  researchActivityId: string;
  isSelected: boolean;
  customName?: string;
  customDescription?: string;
  practicePercent: number;
}

export interface ResearchActivityAssignment {
  id?: string;
  researchActivityId: string;
  assigneeType: 'employee' | 'contractor';
  assigneeId: string;
  timePercentage: number;
  roleId?: string;
} 