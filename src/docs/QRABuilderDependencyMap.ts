// QRA Builder Dependency Mapping
// This document maps every function, state variable, and interaction in RDExpensesTab.tsx
// to ensure complete preservation during modularization

import { FunctionDependency, StateDependency, ModalDependency, DependencyMap } from '../types/QRABuilderInterfaces';

// ============================================================================
// FUNCTION DEPENDENCIES
// ============================================================================

export const functionDependencies: FunctionDependency[] = [
  // Core calculation functions
  {
    functionName: 'calculateRoleAppliedPercentages',
    dependencies: ['roles', 'selectedBusinessId', 'selectedYear', 'localStorage', 'businesses'],
    description: 'Calculates applied percentages for all roles based on QRA data',
    critical: true
  },
  {
    functionName: 'loadEmployees',
    dependencies: ['selectedBusinessId', 'selectedYear', 'ExpensesService', 'setEmployees', 'calculateEmployeeAppliedPercentage', 'getEmployeeActivities'],
    description: 'Loads and processes employee data with applied percentages',
    critical: true
  },
  {
    functionName: 'loadContractors',
    dependencies: ['selectedBusinessId', 'selectedYear', 'ExpensesService', 'setContractors'],
    description: 'Loads contractor data from service',
    critical: true
  },
  {
    functionName: 'loadSupplies',
    dependencies: ['selectedBusinessId', 'selectedYear', 'ExpensesService', 'setSupplies'],
    description: 'Loads supply data from service',
    critical: true
  },
  {
    functionName: 'loadAvailableYears',
    dependencies: ['selectedBusinessId', 'ExpensesService', 'setAvailableYears'],
    description: 'Loads available years for the business',
    critical: false
  },

  // Employee calculation functions
  {
    functionName: 'calculateEmployeeAppliedPercentage',
    dependencies: ['employee', 'activities', 'employeePracticePercentages', 'calculateActivityAppliedPercentage'],
    description: 'Calculates total applied percentage for an employee',
    critical: true
  },
  {
    functionName: 'calculateActivityAppliedPercentage',
    dependencies: ['activity', 'employeePracticePercentages'],
    description: 'Calculates applied percentage for a specific activity',
    critical: true
  },
  {
    functionName: 'getEmployeeActivities',
    dependencies: ['employee', 'selectedBusiness', 'selectedYear', 'businessRoles'],
    description: 'Gets activities associated with an employee',
    critical: true
  },

  // Contractor calculation functions
  {
    functionName: 'calculateContractorAppliedPercentage',
    dependencies: ['contractor', 'activities', 'contractorPracticePercentages', 'calculateContractorActivityAppliedPercentage'],
    description: 'Calculates total applied percentage for a contractor',
    critical: true
  },
  {
    functionName: 'calculateContractorActivityAppliedPercentage',
    dependencies: ['activity', 'contractorPracticePercentages'],
    description: 'Calculates applied percentage for a contractor activity',
    critical: true
  },
  {
    functionName: 'getContractorActivities',
    dependencies: ['contractor', 'selectedBusiness', 'selectedYear', 'businessRoles'],
    description: 'Gets activities associated with a contractor',
    critical: true
  },

  // Supply calculation functions
  {
    functionName: 'calculateSupplyAppliedPercentage',
    dependencies: ['supply', 'supplyActivityPercentages'],
    description: 'Calculates applied percentage for a supply',
    critical: true
  },
  {
    functionName: 'getSupplyActivities',
    dependencies: ['selectedBusiness', 'selectedYear'],
    description: 'Gets all available activities for supplies',
    critical: true
  },
  {
    functionName: 'getSupplyActivitySubcomponents',
    dependencies: ['activityName', 'getQRAData'],
    description: 'Gets subcomponents for a supply activity',
    critical: true
  },

  // Utility functions
  {
    functionName: 'getQRAData',
    dependencies: ['activityName', 'selectedBusinessId', 'selectedYear', 'localStorage'],
    description: 'Retrieves QRA data for an activity',
    critical: true
  },
  {
    functionName: 'getAppliedPercentage',
    dependencies: ['activityName', 'getQRAData'],
    description: 'Gets applied percentage for an activity',
    critical: true
  },
  {
    functionName: 'hasAnyQRAData',
    dependencies: ['selectedBusiness', 'selectedYear'],
    description: 'Checks if any QRA data exists',
    critical: false
  },
  {
    functionName: 'getActivityColor',
    dependencies: ['activityName', 'allActivities'],
    description: 'Gets color for activity visualization',
    critical: false
  },

  // Form handlers
  {
    functionName: 'handleFormChange',
    dependencies: ['setFormData', 'field', 'value'],
    description: 'Handles employee form field changes',
    critical: true
  },
  {
    functionName: 'handleContractorFormChange',
    dependencies: ['setContractorFormData', 'field', 'value'],
    description: 'Handles contractor form field changes',
    critical: true
  },
  {
    functionName: 'handleSupplyFormChange',
    dependencies: ['setSupplyFormData', 'field', 'value'],
    description: 'Handles supply form field changes',
    critical: true
  },

  // Employee handlers
  {
    functionName: 'handleAddEmployee',
    dependencies: ['formData', 'setFormError', 'ExpensesService', 'setEmployees', 'setFormData', 'calculateEmployeeAppliedPercentage', 'getEmployeeActivities'],
    description: 'Adds a new employee',
    critical: true
  },
  {
    functionName: 'handleDeleteEmployee',
    dependencies: ['employeeId', 'ExpensesService', 'setEmployees'],
    description: 'Deletes an employee',
    critical: true
  },
  {
    functionName: 'handleToggleEmployeeActive',
    dependencies: ['employee', 'ExpensesService', 'setEmployees'],
    description: 'Toggles employee active status',
    critical: true
  },
  {
    functionName: 'handleToggleEmployeeLock',
    dependencies: ['employee', 'ExpensesService', 'setEmployees'],
    description: 'Toggles employee lock status',
    critical: true
  },

  // Contractor handlers
  {
    functionName: 'handleAddContractor',
    dependencies: ['contractorFormData', 'setContractorFormError', 'ExpensesService', 'setContractors', 'setContractorFormData', 'calculateRoleAppliedPercentages'],
    description: 'Adds a new contractor',
    critical: true
  },
  {
    functionName: 'handleDeleteContractor',
    dependencies: ['contractorId', 'ExpensesService', 'setContractors'],
    description: 'Deletes a contractor',
    critical: true
  },
  {
    functionName: 'handleToggleContractorActive',
    dependencies: ['contractor', 'ExpensesService', 'setContractors'],
    description: 'Toggles contractor active status',
    critical: true
  },
  {
    functionName: 'handleToggleContractorLock',
    dependencies: ['contractor', 'ExpensesService', 'setContractors'],
    description: 'Toggles contractor lock status',
    critical: true
  },

  // Supply handlers
  {
    functionName: 'handleAddSupply',
    dependencies: ['supplyFormData', 'setSupplyFormError', 'ExpensesService', 'setSupplies', 'setSupplyFormData'],
    description: 'Adds a new supply',
    critical: true
  },
  {
    functionName: 'handleDeleteSupply',
    dependencies: ['supplyId', 'ExpensesService', 'setSupplies'],
    description: 'Deletes a supply',
    critical: true
  },
  {
    functionName: 'handleToggleSupplyActive',
    dependencies: ['supply', 'ExpensesService', 'setSupplies'],
    description: 'Toggles supply active status',
    critical: true
  },
  {
    functionName: 'handleToggleSupplyLock',
    dependencies: ['supply', 'ExpensesService', 'setSupplies'],
    description: 'Toggles supply lock status',
    critical: true
  },

  // Modal handlers
  {
    functionName: 'handleOpenConfigureModal',
    dependencies: ['employee', 'setConfigureModalOpen', 'setSelectedEmployeeForConfig', 'setEmployeePracticePercentages', 'setEmployeeTimePercentages', 'getEmployeeActivities'],
    description: 'Opens employee configuration modal',
    critical: true
  },
  {
    functionName: 'handleCloseConfigureModal',
    dependencies: ['setConfigureModalOpen', 'setSelectedEmployeeForConfig'],
    description: 'Closes employee configuration modal',
    critical: true
  },
  {
    functionName: 'handleSaveEmployeeConfiguration',
    dependencies: ['selectedEmployeeForConfig', 'employeePracticePercentages', 'employeeTimePercentages', 'ExpensesService', 'setEmployees', 'handleCloseConfigureModal'],
    description: 'Saves employee configuration',
    critical: true
  },
  {
    functionName: 'handleOpenContractorConfigureModal',
    dependencies: ['contractor', 'setContractorConfigureModalOpen', 'setSelectedContractorForConfig', 'setContractorPracticePercentages', 'setContractorTimePercentages', 'getContractorActivities'],
    description: 'Opens contractor configuration modal',
    critical: true
  },
  {
    functionName: 'handleCloseContractorConfigureModal',
    dependencies: ['setContractorConfigureModalOpen', 'setSelectedContractorForConfig'],
    description: 'Closes contractor configuration modal',
    critical: true
  },
  {
    functionName: 'handleSaveContractorConfiguration',
    dependencies: ['selectedContractorForConfig', 'contractorPracticePercentages', 'contractorTimePercentages', 'ExpensesService', 'setContractors', 'handleCloseContractorConfigureModal'],
    description: 'Saves contractor configuration',
    critical: true
  },
  {
    functionName: 'handleOpenSupplyConfigureModal',
    dependencies: ['supply', 'setSupplyConfigureModalOpen', 'setSelectedSupplyForConfig', 'setSupplyActivityPercentages', 'setSupplySubcomponentPercentages', 'setSelectedSubcomponents', 'getSupplyActivities'],
    description: 'Opens supply configuration modal',
    critical: true
  },
  {
    functionName: 'handleCloseSupplyConfigureModal',
    dependencies: ['setSupplyConfigureModalOpen', 'setSelectedSupplyForConfig'],
    description: 'Closes supply configuration modal',
    critical: true
  },
  {
    functionName: 'handleSaveSupplyConfiguration',
    dependencies: ['selectedSupplyForConfig', 'supplyActivityPercentages', 'supplySubcomponentPercentages', 'selectedSubcomponents', 'ExpensesService', 'setSupplies', 'handleCloseSupplyConfigureModal'],
    description: 'Saves supply configuration',
    critical: true
  },

  // Supply-specific handlers
  {
    functionName: 'handleSubcomponentToggle',
    dependencies: ['activityName', 'subcomponentId', 'selectedSubcomponents', 'setSelectedSubcomponents', 'redistributeActivityPercentage'],
    description: 'Toggles subcomponent selection',
    critical: true
  },
  {
    functionName: 'handleActivityPercentageChange',
    dependencies: ['activityName', 'newPercentage', 'setSupplyActivityPercentages'],
    description: 'Changes activity percentage for supply',
    critical: true
  },
  {
    functionName: 'redistributeActivityPercentage',
    dependencies: ['activityName', 'selectedSubcomponentsMap', 'setSupplySubcomponentPercentages'],
    description: 'Redistributes percentages when subcomponents change',
    critical: true
  },
  {
    functionName: 'getSubcomponentPercentage',
    dependencies: ['activityName', 'subcomponentId', 'supplySubcomponentPercentages'],
    description: 'Gets percentage for a subcomponent',
    critical: true
  },
  {
    functionName: 'isSubcomponentSelected',
    dependencies: ['activityName', 'subcomponentId', 'selectedSubcomponents'],
    description: 'Checks if subcomponent is selected',
    critical: true
  },

  // Utility handlers
  {
    functionName: 'handleKeyPress',
    dependencies: ['event', 'nextRef'],
    description: 'Handles keyboard navigation',
    critical: false
  },
  {
    functionName: 'handleExportCSV',
    dependencies: ['employees', 'contractors', 'supplies', 'CSVExportService'],
    description: 'Exports data to CSV',
    critical: false
  }
];

// ============================================================================
// STATE DEPENDENCIES
// ============================================================================

export const stateDependencies: StateDependency[] = [
  // Core state arrays
  {
    stateName: 'employees',
    usedBy: ['loadEmployees', 'handleAddEmployee', 'handleDeleteEmployee', 'handleToggleEmployeeActive', 'handleToggleEmployeeLock', 'handleSaveEmployeeConfiguration', 'yearTotals', 'ExpenseSummary', 'TabNavigation'],
    description: 'Array of employee data',
    critical: true
  },
  {
    stateName: 'contractors',
    usedBy: ['loadContractors', 'handleAddContractor', 'handleDeleteContractor', 'handleToggleContractorActive', 'handleToggleContractorLock', 'handleSaveContractorConfiguration', 'yearTotals', 'ExpenseSummary', 'TabNavigation'],
    description: 'Array of contractor data',
    critical: true
  },
  {
    stateName: 'supplies',
    usedBy: ['loadSupplies', 'handleAddSupply', 'handleDeleteSupply', 'handleToggleSupplyActive', 'handleToggleSupplyLock', 'handleSaveSupplyConfiguration', 'yearTotals', 'ExpenseSummary', 'TabNavigation'],
    description: 'Array of supply data',
    critical: true
  },
  {
    stateName: 'roles',
    usedBy: ['calculateRoleAppliedPercentages', 'getEmployeeActivities', 'getContractorActivities', 'EmployeeTab', 'ContractorTab'],
    description: 'Array of role data with applied percentages',
    critical: true
  },
  {
    stateName: 'availableYears',
    usedBy: ['loadAvailableYears', 'AppBar'],
    description: 'Array of available years',
    critical: false
  },

  // Form states
  {
    stateName: 'formData',
    usedBy: ['handleFormChange', 'handleAddEmployee', 'EmployeeForm'],
    description: 'Employee form data',
    critical: true
  },
  {
    stateName: 'contractorFormData',
    usedBy: ['handleContractorFormChange', 'handleAddContractor', 'ContractorForm'],
    description: 'Contractor form data',
    critical: true
  },
  {
    stateName: 'supplyFormData',
    usedBy: ['handleSupplyFormChange', 'handleAddSupply', 'SupplyForm'],
    description: 'Supply form data',
    critical: true
  },

  // Error states
  {
    stateName: 'formError',
    usedBy: ['handleAddEmployee', 'EmployeeForm'],
    description: 'Employee form error message',
    critical: true
  },
  {
    stateName: 'contractorFormError',
    usedBy: ['handleAddContractor', 'ContractorForm'],
    description: 'Contractor form error message',
    critical: true
  },
  {
    stateName: 'supplyFormError',
    usedBy: ['handleAddSupply', 'SupplyForm'],
    description: 'Supply form error message',
    critical: true
  },

  // Tab selection
  {
    stateName: 'selectedExpenseType',
    usedBy: ['TabNavigation', 'conditional rendering'],
    description: 'Currently selected expense tab',
    critical: true
  },

  // Modal states
  {
    stateName: 'configureModalOpen',
    usedBy: ['handleOpenConfigureModal', 'handleCloseConfigureModal', 'EmployeeConfigureModal'],
    description: 'Employee configure modal open state',
    critical: true
  },
  {
    stateName: 'selectedEmployeeForConfig',
    usedBy: ['handleOpenConfigureModal', 'handleSaveEmployeeConfiguration', 'EmployeeConfigureModal'],
    description: 'Currently selected employee for configuration',
    critical: true
  },
  {
    stateName: 'employeePracticePercentages',
    usedBy: ['handleOpenConfigureModal', 'handleSaveEmployeeConfiguration', 'calculateEmployeeAppliedPercentage', 'EmployeeConfigureModal'],
    description: 'Employee practice percentages for modal',
    critical: true
  },
  {
    stateName: 'employeeTimePercentages',
    usedBy: ['handleOpenConfigureModal', 'handleSaveEmployeeConfiguration', 'EmployeeConfigureModal'],
    description: 'Employee time percentages for modal',
    critical: true
  },
  {
    stateName: 'contractorConfigureModalOpen',
    usedBy: ['handleOpenContractorConfigureModal', 'handleCloseContractorConfigureModal', 'ContractorConfigureModal'],
    description: 'Contractor configure modal open state',
    critical: true
  },
  {
    stateName: 'selectedContractorForConfig',
    usedBy: ['handleOpenContractorConfigureModal', 'handleSaveContractorConfiguration', 'ContractorConfigureModal'],
    description: 'Currently selected contractor for configuration',
    critical: true
  },
  {
    stateName: 'contractorPracticePercentages',
    usedBy: ['handleOpenContractorConfigureModal', 'handleSaveContractorConfiguration', 'calculateContractorAppliedPercentage', 'ContractorConfigureModal'],
    description: 'Contractor practice percentages for modal',
    critical: true
  },
  {
    stateName: 'contractorTimePercentages',
    usedBy: ['handleOpenContractorConfigureModal', 'handleSaveContractorConfiguration', 'ContractorConfigureModal'],
    description: 'Contractor time percentages for modal',
    critical: true
  },
  {
    stateName: 'supplyConfigureModalOpen',
    usedBy: ['handleOpenSupplyConfigureModal', 'handleCloseSupplyConfigureModal', 'SupplyConfigureModal'],
    description: 'Supply configure modal open state',
    critical: true
  },
  {
    stateName: 'selectedSupplyForConfig',
    usedBy: ['handleOpenSupplyConfigureModal', 'handleSaveSupplyConfiguration', 'SupplyConfigureModal'],
    description: 'Currently selected supply for configuration',
    critical: true
  },
  {
    stateName: 'supplyActivityPercentages',
    usedBy: ['handleOpenSupplyConfigureModal', 'handleSaveSupplyConfiguration', 'calculateSupplyAppliedPercentage', 'SupplyConfigureModal'],
    description: 'Supply activity percentages for modal',
    critical: true
  },
  {
    stateName: 'supplySubcomponentPercentages',
    usedBy: ['handleOpenSupplyConfigureModal', 'handleSaveSupplyConfiguration', 'SupplyConfigureModal'],
    description: 'Supply subcomponent percentages for modal',
    critical: true
  },
  {
    stateName: 'selectedSubcomponents',
    usedBy: ['handleOpenSupplyConfigureModal', 'handleSaveSupplyConfiguration', 'handleSubcomponentToggle', 'isSubcomponentSelected', 'SupplyConfigureModal'],
    description: 'Selected subcomponents for supply modal',
    critical: true
  }
];

// ============================================================================
// MODAL DEPENDENCIES
// ============================================================================

export const modalDependencies: ModalDependency[] = [
  {
    modalName: 'EmployeeConfigureModal',
    stateDependencies: [
      'configureModalOpen',
      'selectedEmployeeForConfig',
      'employeePracticePercentages',
      'employeeTimePercentages',
      'employees',
      'roles'
    ],
    functionDependencies: [
      'handleCloseConfigureModal',
      'handleSaveEmployeeConfiguration',
      'getEmployeeActivities',
      'calculateEmployeeAppliedPercentage',
      'getActivityColor'
    ],
    description: 'Modal for configuring employee applied percentages',
    critical: true
  },
  {
    modalName: 'ContractorConfigureModal',
    stateDependencies: [
      'contractorConfigureModalOpen',
      'selectedContractorForConfig',
      'contractorPracticePercentages',
      'contractorTimePercentages',
      'contractors',
      'roles'
    ],
    functionDependencies: [
      'handleCloseContractorConfigureModal',
      'handleSaveContractorConfiguration',
      'getContractorActivities',
      'calculateContractorAppliedPercentage',
      'calculateContractorActivityAppliedPercentage',
      'getActivityColor'
    ],
    description: 'Modal for configuring contractor applied percentages',
    critical: true
  },
  {
    modalName: 'SupplyConfigureModal',
    stateDependencies: [
      'supplyConfigureModalOpen',
      'selectedSupplyForConfig',
      'supplyActivityPercentages',
      'supplySubcomponentPercentages',
      'selectedSubcomponents',
      'supplies'
    ],
    functionDependencies: [
      'handleCloseSupplyConfigureModal',
      'handleSaveSupplyConfiguration',
      'getSupplyActivities',
      'getSupplyActivitySubcomponents',
      'handleSubcomponentToggle',
      'handleActivityPercentageChange',
      'redistributeActivityPercentage',
      'getSubcomponentPercentage',
      'isSubcomponentSelected',
      'getQRAData',
      'getAppliedPercentage'
    ],
    description: 'Modal for configuring supply applied percentages and subcomponents',
    critical: true
  }
];

// ============================================================================
// COMPLETE DEPENDENCY MAP
// ============================================================================

export const dependencyMap: DependencyMap = {
  functions: functionDependencies,
  states: stateDependencies,
  modals: modalDependencies
};

// ============================================================================
// CRITICAL INTERACTION PATHS
// ============================================================================

export const criticalInteractionPaths = [
  // Employee addition and configuration
  'handleAddEmployee -> setEmployees -> loadEmployees -> calculateEmployeeAppliedPercentage',
  'handleOpenConfigureModal -> setEmployeePracticePercentages -> handleSaveEmployeeConfiguration -> setEmployees',
  
  // Contractor addition and configuration
  'handleAddContractor -> setContractors -> loadContractors -> calculateContractorAppliedPercentage',
  'handleOpenContractorConfigureModal -> setContractorPracticePercentages -> handleSaveContractorConfiguration -> setContractors',
  
  // Supply addition and configuration
  'handleAddSupply -> setSupplies -> loadSupplies -> calculateSupplyAppliedPercentage',
  'handleOpenSupplyConfigureModal -> setSupplyActivityPercentages -> handleSaveSupplyConfiguration -> setSupplies',
  
  // Real-time calculations
  'employeePracticePercentages -> calculateEmployeeAppliedPercentage -> yearTotals',
  'contractorPracticePercentages -> calculateContractorAppliedPercentage -> yearTotals',
  'supplyActivityPercentages -> calculateSupplyAppliedPercentage -> yearTotals',
  
  // Modal interactions
  'handleSubcomponentToggle -> redistributeActivityPercentage -> setSupplySubcomponentPercentages',
  'handleActivityPercentageChange -> setSupplyActivityPercentages -> calculateSupplyAppliedPercentage'
];

// ============================================================================
// PRESERVATION CHECKLIST
// ============================================================================

export const preservationChecklist = [
  // State preservation
  'All state variables must be preserved in context',
  'All state setters must be preserved in context',
  'All computed values must be preserved in context',
  
  // Function preservation
  'All calculation functions must be preserved in context',
  'All event handlers must be preserved in context',
  'All utility functions must be preserved in context',
  
  // Modal preservation
  'All modal states must be preserved in context',
  'All modal interactions must be preserved',
  'All modal validation must be preserved',
  
  // Data flow preservation
  'All real-time calculations must be preserved',
  'All data loading must be preserved',
  'All data saving must be preserved',
  
  // UI interaction preservation
  'All form interactions must be preserved',
  'All tab switching must be preserved',
  'All lock/unlock functionality must be preserved',
  'All active/inactive toggles must be preserved',
  
  // Validation preservation
  'All form validation must be preserved',
  'All modal validation must be preserved',
  'All business rule validation must be preserved'
];

export default dependencyMap; 