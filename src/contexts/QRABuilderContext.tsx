// QRA Builder Context
// This context preserves all state, functions, and interactions from RDExpensesTab.tsx
// to ensure complete functionality preservation during modularization

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Business, RoleNode, Role } from '../types/Business';
import { Employee, Contractor, Supply, ExpenseFormData, ContractorFormData, SupplyFormData, EMPTY_EXPENSE_FORM, EMPTY_CONTRACTOR_FORM, EMPTY_SUPPLY_FORM, NON_RD_ROLE, OTHER_ROLE } from '../types/Employee';
import { ExpensesService } from '../services/expensesService';
import { approvalsService } from '../services/approvals';
import { SubcomponentSelectionData } from '../types/QRABuilderInterfaces';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyFormatting';
import { flattenAllRoles, getRoleName } from '../pages/QRABuilderTabs/RDExpensesTab/utils/roleHelpers';
import { 
  QRABuilderContextValue, 
  QRABuilderState, 
  ModalStates, 
  EmployeeConfigureModalState, 
  ContractorConfigureModalState, 
  SupplyConfigureModalState,
  CalculationFunctions,
  EventHandlers,
  EmployeeEventHandlers,
  ContractorEventHandlers,
  SupplyEventHandlers,
  UtilityEventHandlers
} from '../types/QRABuilderInterfaces';
import { loadQRADataFromSupabase } from '../services/qraDataService';
import { QRABuilderService } from '../services/qrabuilderService';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const QRABuilderContext = createContext<QRABuilderContextValue | undefined>(undefined);

// ============================================================================
// CONTEXT PROVIDER PROPS
// ============================================================================

interface QRABuilderProviderProps {
  children: ReactNode;
  selectedYear: number;
  selectedBusinessId: string;
  businesses: Business[];
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  tabReadOnly: boolean[];
  setTabReadOnly: React.Dispatch<React.SetStateAction<boolean[]>>;
  approvedTabs: boolean[];
  setApprovedTabs: React.Dispatch<React.SetStateAction<boolean[]>>;
  onEdit: () => void;
}

// ============================================================================
// CONTEXT PROVIDER
// ============================================================================

export const QRABuilderProvider: React.FC<QRABuilderProviderProps> = ({
  children,
  selectedYear,
  selectedBusinessId,
  businesses,
  setBusinesses,
  tabReadOnly,
  setTabReadOnly,
  approvedTabs,
  setApprovedTabs,
  onEdit
}) => {
  // ============================================================================
  // CORE STATE
  // ============================================================================
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Form states
  const [formData, setFormData] = useState<ExpenseFormData>(EMPTY_EXPENSE_FORM);
  const [contractorFormData, setContractorFormData] = useState<ContractorFormData>(EMPTY_CONTRACTOR_FORM);
  const [supplyFormData, setSupplyFormData] = useState<SupplyFormData>(EMPTY_SUPPLY_FORM);
  
  // Error states
  const [formError, setFormError] = useState<string>('');
  const [contractorFormError, setContractorFormError] = useState<string>('');
  const [supplyFormError, setSupplyFormError] = useState<string>('');
  
  // Tab selection
  const [selectedExpenseType, setSelectedExpenseType] = useState<'employees' | 'contractors' | 'supplies' | 'reporting'>('employees');
  
  // ============================================================================
  // MODAL STATES
  // ============================================================================
  
  // Employee Configure Modal state
  const [employeeModalState, setEmployeeModalState] = useState<EmployeeConfigureModalState>({
    isOpen: false,
    selectedEmployee: null,
    practicePercentages: {},
    timePercentages: {}
  });
  
  // Contractor Configure Modal state
  const [contractorModalState, setContractorModalState] = useState<ContractorConfigureModalState>({
    isOpen: false,
    selectedContractor: null,
    practicePercentages: {},
    timePercentages: {}
  });
  
  // Supply Configure Modal state
  const [supplyModalState, setSupplyModalState] = useState<SupplyConfigureModalState>({
    isOpen: false,
    selectedSupply: null,
    activityPercentages: {},
    subcomponentPercentages: {},
    selectedSubcomponents: {}
  });
  
  // Selected items for configuration
  const [selectedEmployeeForConfig, setSelectedEmployeeForConfig] = useState<Employee | null>(null);
  const [selectedContractorForConfig, setSelectedContractorForConfig] = useState<Contractor | null>(null);
  const [selectedSupplyForConfig, setSelectedSupplyForConfig] = useState<Supply | null>(null);
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  // Check approval status
  const isActivitiesApproved = useMemo(() => {
    return approvalsService.isTabApproved('activities', selectedYear);
  }, [selectedYear]);
  
  const isExpensesApproved = useMemo(() => {
    return approvalsService.isTabApproved('expenses', selectedYear);
  }, [selectedYear]);
  
  // Get current business and roles
  const selectedBusiness = useMemo(() => {
    return businesses.find(b => b.id === selectedBusinessId);
  }, [businesses, selectedBusinessId]);
  
  const businessRoles = useMemo(() => {
    return selectedBusiness?.rolesByYear?.[selectedYear] || [];
  }, [selectedBusiness, selectedYear]);
  
  const researchActivities = useMemo(() => {
    return selectedBusiness?.years[selectedYear]?.activities ? 
           Object.values(selectedBusiness.years[selectedYear].activities) : 
           [];
  }, [selectedBusiness, selectedYear]);
  
  const qraData = useMemo(() => {
    const raw = selectedBusiness?.years[selectedYear]?.qraData;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    // If it's an object, return its values as an array
    return Object.values(raw);
  }, [selectedBusiness, selectedYear]);
  
  const yearTotals = useMemo(() => {
    return ExpensesService.calculateYearTotals(selectedBusinessId, selectedYear);
  }, [selectedBusinessId, selectedYear]);
  
  const availableRoles = useMemo(() => {
    return ExpensesService.getAvailableRoles(roles);
  }, [roles]);
  
  // ============================================================================
  // CALCULATION FUNCTIONS
  // ============================================================================
  
  // Calculate role applied percentages from activities
  const calculateRoleAppliedPercentages = useCallback(() => {
    try {
      // Get business data to find activities and their role assignments
      const STORAGE_KEY = 'businessInfoData';
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const business = savedData.businesses?.find((b: any) => b.id === selectedBusinessId);
      const activities = business?.years?.[selectedYear]?.activities || {};

      // Local function to get QRA data (synchronous from cache)
      const getQRADataSync = (activityName: string) => {
        try {
          // Find activity ID by name
          const activityEntry = Object.entries(activities).find(([id, activity]: [string, any]) => 
            activity.name === activityName
          );
          
          if (!activityEntry) {
            return null;
          }
          
          const activityId = activityEntry[0];
          
          // Try localStorage first (synchronous)
          const qraData = localStorage.getItem(`qra_${selectedBusinessId}_${selectedYear}_${activityId}`);
          return qraData ? JSON.parse(qraData) : null;
        } catch (error) {
          return null;
        }
      };

      // Calculate applied percentage for each role
      const roleResults = [];
      for (const role of businessRoles) {
        let totalAppliedPercentage = 0;
        let activityCount = 0;

        // Find all activities that this role participates in
        for (const activity of Object.values(activities) as any[]) {
          if (activity.selectedRoles && activity.selectedRoles.includes(role.id)) {
            // Get the applied percentage from QRA data for this activity
            const qraData = getQRADataSync(activity.name);
            if (qraData && qraData.totalAppliedPercent) {
              totalAppliedPercentage += qraData.totalAppliedPercent;
              activityCount++;
            }
          }
        }

        // Average the applied percentages across all activities this role participates in
        const appliedPercentage = activityCount > 0 ? totalAppliedPercentage / activityCount : 0;

        roleResults.push({
          ...role,
          appliedPercentage: Math.round(appliedPercentage * 100) / 100 // Round to 2 decimal places
        });
      }
      
      return roleResults;
    } catch (error) {
      console.error('Error calculating role applied percentages:', error);
      return businessRoles.map(role => ({ ...role, appliedPercentage: 0 }));
    }
  }, [selectedBusinessId, selectedYear, businessRoles]);
  
  const getQRAData = useCallback((activityName: string): SubcomponentSelectionData | null => {
    try {
      // Find the activity ID by name first
      const STORAGE_KEY = 'businessInfoData';
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const business = savedData.businesses?.find((b: any) => b.id === selectedBusinessId);
      const yearData = business?.years?.[selectedYear];
      const activities = yearData?.activities || {};
      
      // Find activity ID by name
      const activityEntry = Object.entries(activities).find(([id, activity]: [string, any]) => 
        activity.name === activityName
      );
      
      if (!activityEntry) {
        console.warn(`Could not find activity with name: ${activityName}`);
        return null;
      }
      
      const activityId = activityEntry[0];
      
      // Try localStorage (synchronous)
      const qraData = localStorage.getItem(`qra_${selectedBusinessId}_${selectedYear}_${activityId}`);
      return qraData ? JSON.parse(qraData) : null;
    } catch (error) {
      console.error('Error loading QRA data:', error);
      return null;
    }
  }, [selectedBusinessId, selectedYear]);
  
  const getAppliedPercentage = useCallback((activityName: string): number => {
    const qraData = getQRAData(activityName);
    return qraData?.totalAppliedPercent || 0;
  }, [getQRAData]);
  
  const hasAnyQRAData = useCallback((): boolean => {
    return !!selectedBusiness?.years[selectedYear]?.qraData &&
           selectedBusiness.years[selectedYear].qraData.length > 0;
  }, [selectedBusiness, selectedYear]);
  
  const getActivityColor = useCallback((activityName: string, allActivities: any[]): string => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#f57c00', '#388e3c', '#d32f2f', '#7b1fa2'];
    const index = allActivities.findIndex(activity => activity.name === activityName);
    return colors[index % colors.length];
  }, []);
  
  // Employee calculation functions
  const getEmployeeActivities = useCallback((employee: Employee) => {
    if (!selectedBusiness || !selectedYear) return [];
    
    const activities = selectedBusiness.years[selectedYear]?.activities || {};
    const employeeRoleId = employee.roleId;
    
    return Object.values(activities).filter((activity: any) => {
      return activity.selectedRoles && activity.selectedRoles.includes(employeeRoleId);
    });
  }, [selectedBusiness, selectedYear]);
  
  const calculateActivityAppliedPercentage = useCallback((activity: any): number => {
    const qraData = getQRAData(activity.name);
    if (!qraData) return 0;
    
    // Get the practice percentage from modal state or default
    const practicePercent = employeeModalState.practicePercentages[activity.name] || activity.currentPracticePercent || 0;
    
    // Calculate the applied percentage based on QRA data and practice percentage
    const appliedPercent = (qraData.totalAppliedPercent / 100) * (practicePercent / 100);
    
    return appliedPercent * 100; // Convert to percentage
  }, [getQRAData, employeeModalState.practicePercentages]);
  
  const calculateEmployeeAppliedPercentage = useCallback((employee: Employee, activities: any[]): number => {
    if (!activities || activities.length === 0) return 0;
    
    let totalApplied = 0;
    
    activities.forEach(activity => {
      const contributedApplied = calculateActivityAppliedPercentage(activity);
      totalApplied += contributedApplied;
    });
    
    return totalApplied;
  }, [calculateActivityAppliedPercentage]);
  
  // Contractor calculation functions
  const getContractorActivities = useCallback((contractor: Contractor) => {
    if (!selectedBusiness || !selectedYear) return [];
    
    const activities = selectedBusiness.years[selectedYear]?.activities || {};
    const contractorRoleId = contractor.roleId;
    
    return Object.values(activities).filter((activity: any) => {
      return activity.selectedRoles && activity.selectedRoles.includes(contractorRoleId);
    });
  }, [selectedBusiness, selectedYear]);
  
  const calculateContractorActivityAppliedPercentage = useCallback((activity: any): number => {
    const qraData = getQRAData(activity.name);
    if (!qraData) return 0;
    
    // Get the practice percentage from modal state or default
    const practicePercent = contractorModalState.practicePercentages[activity.name] || activity.currentPracticePercent || 0;
    
    // Calculate the applied percentage based on QRA data and practice percentage
    const appliedPercent = (qraData.totalAppliedPercent / 100) * (practicePercent / 100);
    
    return appliedPercent * 100; // Convert to percentage
  }, [getQRAData, contractorModalState.practicePercentages]);
  
  const calculateContractorAppliedPercentage = useCallback((contractor: Contractor, activities: any[]): number => {
    if (!activities || activities.length === 0) return 0;
    
    let totalApplied = 0;
    
    activities.forEach(activity => {
      const contributedApplied = calculateContractorActivityAppliedPercentage(activity);
      totalApplied += contributedApplied;
    });
    
    return totalApplied;
  }, [calculateContractorActivityAppliedPercentage]);
  
  // Supply calculation functions
  const getSupplyActivities = useCallback(() => {
    if (!selectedBusiness || !selectedYear) return [];
    
    const activities = selectedBusiness.years[selectedYear]?.activities || {};
    return Object.values(activities);
  }, [selectedBusiness, selectedYear]);
  
  const getSupplyActivitySubcomponents = useCallback((activityName: string) => {
    const qraData = getQRAData(activityName);
    if (!qraData || !qraData.selectedSubcomponents) {
      return [];
    }
    
    return Object.entries(qraData.selectedSubcomponents).map(([subcomponentId, subcomponent]: [string, any]) => ({
      id: subcomponentId,
      name: subcomponent.subcomponent,
      phase: subcomponent.phase,
      step: subcomponent.step
    }));
  }, [getQRAData]);
  
  const calculateSupplyAppliedPercentage = useCallback((supply: Supply): number => {
    // For supplies, we need to get the activity name from the supply configuration
    // Since Supply doesn't have activityName, we'll use a default calculation
    const activities = getSupplyActivities();
    let totalApplied = 0;
    
    activities.forEach((activity: any) => {
      const activityPercent = supplyModalState.activityPercentages[activity.name] || 0;
      const qraData = getQRAData(activity.name);
      if (qraData) {
        const appliedPercent = (qraData.totalAppliedPercent / 100) * (activityPercent / 100);
        totalApplied += appliedPercent;
      }
    });
    
    return totalApplied * 100; // Convert to percentage
  }, [getSupplyActivities, supplyModalState.activityPercentages, getQRAData]);
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  // Form handlers
  const handleFormChange = useCallback((field: keyof ExpenseFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleContractorFormChange = useCallback((field: keyof ContractorFormData, value: string) => {
    setContractorFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleSupplyFormChange = useCallback((field: keyof SupplyFormData, value: string) => {
    setSupplyFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Employee handlers
  const handleAddEmployee = useCallback(() => {
    setFormError('');
    const parsedWage = parseFloat(parseCurrencyInput(formData.wage));
    
    if (isNaN(parsedWage) || parsedWage <= 0) {
      setFormError('Please enter a valid wage.');
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      setFormError('Please enter both first and last name.');
      return;
    }
    if (!formData.roleId) {
      setFormError('Please select a role.');
      return;
    }
    
    // Calculate applied percentage based on role and activities
    const activities = getEmployeeActivities({
      ...formData,
      id: 'temp',
      wage: parsedWage,
      appliedAmount: 0,
      appliedPercentage: 0,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const appliedPercentage = calculateEmployeeAppliedPercentage({
      ...formData,
      id: 'temp',
      wage: parsedWage,
      appliedAmount: 0,
      appliedPercentage: 0,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, activities);
    
    const appliedAmount = (appliedPercentage / 100) * parsedWage;
    
    const newEmployee: Employee = {
      id: `new-employee-${Date.now()}`,
      ...formData,
      wage: parsedWage,
      appliedAmount: appliedAmount,
      appliedPercentage: appliedPercentage,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, newEmployee);
    setEmployees(prev => [...prev, newEmployee]);
    setFormData(EMPTY_EXPENSE_FORM);
    setFormError('');
  }, [formData, selectedBusinessId, selectedYear, getEmployeeActivities, calculateEmployeeAppliedPercentage]);
  
  const handleDeleteEmployee = useCallback((employeeId: string) => {
    ExpensesService.deleteEmployee(selectedBusinessId, selectedYear, employeeId);
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
  }, [selectedBusinessId, selectedYear]);
  
  const handleToggleEmployeeActive = useCallback((employee: Employee) => {
    const updatedEmployee = { ...employee, isActive: !employee.isActive };
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, updatedEmployee);
    setEmployees(prev => prev.map(e => e.id === employee.id ? updatedEmployee : e));
  }, [selectedBusinessId, selectedYear]);
  
  const handleToggleEmployeeLock = useCallback((employee: Employee) => {
    const updatedEmployee = { ...employee, isLocked: !employee.isLocked };
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, updatedEmployee);
    setEmployees(prev => prev.map(e => e.id === employee.id ? updatedEmployee : e));
  }, [selectedBusinessId, selectedYear]);
  
  // Contractor handlers
  const handleAddContractor = useCallback(() => {
    setContractorFormError('');
    const parsedAmount = parseFloat(parseCurrencyInput(contractorFormData.totalAmount));
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setContractorFormError('Please enter a valid total amount.');
      return;
    }
    if (contractorFormData.contractorType === 'individual' && (!contractorFormData.firstName || !contractorFormData.lastName)) {
      setContractorFormError('Please enter both first and last name for an individual.');
      return;
    }
    if (contractorFormData.contractorType === 'business' && !contractorFormData.businessName) {
      setContractorFormError('Please enter a business name.');
      return;
    }
    if (!contractorFormData.roleId) {
      setContractorFormError('Please select a role.');
      return;
    }
    
    // Calculate applied percentage based on role and activities
    const activities = getContractorActivities({
      ...contractorFormData,
      id: 'temp',
      totalAmount: parsedAmount,
      appliedAmount: 0,
      appliedPercentage: 0,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const totalPercentage = activities.reduce((sum, activity) => {
      return sum + (activity.currentPracticePercent || 0);
    }, 0);
    
    // Apply 65% rule for contractors
    const appliedAmount = (totalPercentage / 100) * parsedAmount * 0.65;
    
    const newContractor: Contractor = {
      id: `new-contractor-${Date.now()}`,
      ...contractorFormData,
      totalAmount: parsedAmount,
      appliedAmount: appliedAmount,
      appliedPercentage: totalPercentage,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    ExpensesService.saveContractor(selectedBusinessId, selectedYear, newContractor);
    setContractors(prev => [...prev, newContractor]);
    setContractorFormData(EMPTY_CONTRACTOR_FORM);
    setContractorFormError('');
  }, [contractorFormData, selectedBusinessId, selectedYear, getContractorActivities]);
  
  const handleDeleteContractor = useCallback((contractorId: string) => {
    ExpensesService.deleteContractor(selectedBusinessId, selectedYear, contractorId);
    setContractors(prev => prev.filter(c => c.id !== contractorId));
  }, [selectedBusinessId, selectedYear]);
  
  const handleToggleContractorActive = useCallback((contractor: Contractor) => {
    const updatedContractor = { ...contractor, isActive: !contractor.isActive };
    ExpensesService.saveContractor(selectedBusinessId, selectedYear, updatedContractor);
    setContractors(prev => prev.map(c => c.id === contractor.id ? updatedContractor : c));
  }, [selectedBusinessId, selectedYear]);
  
  const handleToggleContractorLock = useCallback((contractor: Contractor) => {
    const updatedContractor = { ...contractor, isLocked: !contractor.isLocked };
    ExpensesService.saveContractor(selectedBusinessId, selectedYear, updatedContractor);
    setContractors(prev => prev.map(c => c.id === contractor.id ? updatedContractor : c));
  }, [selectedBusinessId, selectedYear]);
  
  // Supply handlers
  const handleAddSupply = useCallback(() => {
    setSupplyFormError('');
    const parsedAmount = parseFloat(parseCurrencyInput(supplyFormData.totalValue));
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSupplyFormError('Please enter a valid total amount.');
      return;
    }
    if (!supplyFormData.category) {
      setSupplyFormError('Please select a category.');
      return;
    }
    
    const newSupply: Supply = {
      id: `new-supply-${Date.now()}`,
      ...supplyFormData,
      totalValue: parsedAmount,
      appliedAmount: 0,
      appliedPercentage: 0,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    ExpensesService.saveSupply(selectedBusinessId, selectedYear, newSupply);
    setSupplies(prev => [...prev, newSupply]);
    setSupplyFormData(EMPTY_SUPPLY_FORM);
    setSupplyFormError('');
  }, [supplyFormData, selectedBusinessId, selectedYear]);
  
  const handleDeleteSupply = useCallback((supplyId: string) => {
    ExpensesService.deleteSupply(selectedBusinessId, selectedYear, supplyId);
    setSupplies(prev => prev.filter(s => s.id !== supplyId));
  }, [selectedBusinessId, selectedYear]);
  
  const handleToggleSupplyActive = useCallback((supply: Supply) => {
    const updatedSupply = { ...supply, isActive: !supply.isActive };
    ExpensesService.saveSupply(selectedBusinessId, selectedYear, updatedSupply);
    setSupplies(prev => prev.map(s => s.id === supply.id ? updatedSupply : s));
  }, [selectedBusinessId, selectedYear]);
  
  const handleToggleSupplyLock = useCallback((supply: Supply) => {
    const updatedSupply = { ...supply, isLocked: !supply.isLocked };
    ExpensesService.saveSupply(selectedBusinessId, selectedYear, updatedSupply);
    setSupplies(prev => prev.map(s => s.id === supply.id ? updatedSupply : s));
  }, [selectedBusinessId, selectedYear]);
  
  // Modal handlers
  const handleOpenConfigureModal = useCallback((employee: Employee) => {
    setSelectedEmployeeForConfig(employee);
    setEmployeeModalState(prev => ({
      ...prev,
      isOpen: true,
      selectedEmployee: employee,
      practicePercentages: employee.customPracticePercentages || {},
      timePercentages: employee.customTimePercentages || {}
    }));
  }, []);
  
  const handleCloseConfigureModal = useCallback(() => {
    setSelectedEmployeeForConfig(null);
    setEmployeeModalState(prev => ({
      ...prev,
      isOpen: false,
      selectedEmployee: null,
      practicePercentages: {},
      timePercentages: {}
    }));
  }, []);
  
  const handleSaveEmployeeConfiguration = () => {
    if (!selectedEmployeeForConfig) return;

    const activities = getEmployeeActivities(selectedEmployeeForConfig);
    const appliedPercentage = calculateEmployeeAppliedPercentage(selectedEmployeeForConfig, activities);
    const appliedAmount = (appliedPercentage / 100) * selectedEmployeeForConfig.wage;
    
    const updatedEmployee: Employee = {
      ...selectedEmployeeForConfig,
      customPracticePercentages: employeeModalState.practicePercentages,
      customTimePercentages: employeeModalState.timePercentages,
      appliedAmount: appliedAmount,
      appliedPercentage: appliedPercentage,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    
    // Recalculate applied amount
    updatedEmployee.appliedAmount = (updatedEmployee.appliedPercentage / 100) * updatedEmployee.wage;
    
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, updatedEmployee);
    setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
    handleCloseConfigureModal();
  };
  
  const handleOpenContractorConfigureModal = useCallback((contractor: Contractor) => {
    setSelectedContractorForConfig(contractor);
    setContractorModalState(prev => ({
      ...prev,
      isOpen: true,
      selectedContractor: contractor,
      practicePercentages: contractor.customPracticePercentages || {},
      timePercentages: contractor.customTimePercentages || {}
    }));
  }, []);
  
  const handleCloseContractorConfigureModal = useCallback(() => {
    setSelectedContractorForConfig(null);
    setContractorModalState(prev => ({
      ...prev,
      isOpen: false,
      selectedContractor: null,
      practicePercentages: {},
      timePercentages: {}
    }));
  }, []);
  
  const handleSaveContractorConfiguration = () => {
    if (!selectedContractorForConfig) return;

    const activities = getContractorActivities(selectedContractorForConfig);
    const appliedPercentage = calculateContractorAppliedPercentage(selectedContractorForConfig, activities);
    const appliedAmount = (appliedPercentage / 100) * selectedContractorForConfig.totalAmount * 0.65;
    
    const updatedContractor: Contractor = {
      ...selectedContractorForConfig,
      customPracticePercentages: contractorModalState.practicePercentages,
      customTimePercentages: contractorModalState.timePercentages,
      appliedAmount: appliedAmount,
      appliedPercentage: appliedPercentage,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    
    // Recalculate applied amount
    updatedContractor.appliedAmount = (updatedContractor.appliedPercentage / 100) * updatedContractor.totalAmount * 0.65;
    
    ExpensesService.saveContractor(selectedBusinessId, selectedYear, updatedContractor);
    setContractors(prev => prev.map(c => c.id === updatedContractor.id ? updatedContractor : c));
    handleCloseContractorConfigureModal();
  };
  
  const handleOpenSupplyConfigureModal = useCallback((supply: Supply) => {
    setSelectedSupplyForConfig(supply);
    setSupplyModalState(prev => ({
      ...prev,
      isOpen: true,
      selectedSupply: supply,
      activityPercentages: supply.customActivityPercentages || {},
      subcomponentPercentages: supply.customSubcomponentPercentages || {},
      selectedSubcomponents: supply.selectedSubcomponents || {}
    }));
  }, []);
  
  const handleCloseSupplyConfigureModal = useCallback(() => {
    setSelectedSupplyForConfig(null);
    setSupplyModalState(prev => ({
      ...prev,
      isOpen: false,
      selectedSupply: null,
      activityPercentages: {},
      subcomponentPercentages: {},
      selectedSubcomponents: {}
    }));
  }, []);
  
  const handleSaveSupplyConfiguration = () => {
    if (!selectedSupplyForConfig) return;

    const appliedPercentage = calculateSupplyAppliedPercentage(selectedSupplyForConfig);
    const appliedAmount = (appliedPercentage / 100) * selectedSupplyForConfig.totalValue;
    
    const updatedSupply: Supply = {
      ...selectedSupplyForConfig,
      customActivityPercentages: supplyModalState.activityPercentages,
      customSubcomponentPercentages: supplyModalState.subcomponentPercentages,
      selectedSubcomponents: supplyModalState.selectedSubcomponents,
      appliedAmount: appliedAmount,
      appliedPercentage: appliedPercentage,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    
    // Recalculate applied amount
    updatedSupply.appliedAmount = (updatedSupply.appliedPercentage / 100) * updatedSupply.totalValue;
    
    ExpensesService.saveSupply(selectedBusinessId, selectedYear, updatedSupply);
    setSupplies(prev => prev.map(s => s.id === updatedSupply.id ? updatedSupply : s));
    handleCloseSupplyConfigureModal();
  };
  
  // Supply-specific handlers
  const handleSubcomponentToggle = useCallback((activityName: string, subcomponentId: string) => {
    setSupplyModalState(prev => {
      const currentSelected = prev.selectedSubcomponents[activityName] || [];
      const newSelected = currentSelected.includes(subcomponentId)
        ? currentSelected.filter(id => id !== subcomponentId)
        : [...currentSelected, subcomponentId];
      
      const newSelectedSubcomponents = {
        ...prev.selectedSubcomponents,
        [activityName]: newSelected
      };
      
      // Redistribute percentages
      const newSubcomponentPercentages = { ...prev.subcomponentPercentages };
      const totalPercentage = prev.activityPercentages[activityName] || 0;
      const selectedCount = newSelected.length;
      
      if (selectedCount > 0) {
        const percentagePerSubcomponent = totalPercentage / selectedCount;
        newSelected.forEach(subcomponentId => {
          if (!newSubcomponentPercentages[activityName]) {
            newSubcomponentPercentages[activityName] = {};
          }
          newSubcomponentPercentages[activityName][subcomponentId] = percentagePerSubcomponent;
        });
      }
      
      return {
        ...prev,
        selectedSubcomponents: newSelectedSubcomponents,
        subcomponentPercentages: newSubcomponentPercentages
      };
    });
  }, []);
  
  const handleActivityPercentageChange = useCallback((activityName: string, newPercentage: number) => {
    setSupplyModalState(prev => ({
      ...prev,
      activityPercentages: {
        ...prev.activityPercentages,
        [activityName]: newPercentage
      }
    }));
  }, []);
  
  const redistributeActivityPercentage = useCallback((activityName: string, selectedSubcomponentsMap: Record<string, string[]>) => {
    setSupplyModalState(prev => {
      const newSubcomponentPercentages = { ...prev.subcomponentPercentages };
      const totalPercentage = prev.activityPercentages[activityName] || 0;
      const selectedSubcomponents = selectedSubcomponentsMap[activityName] || [];
      const selectedCount = selectedSubcomponents.length;
      
      if (selectedCount > 0) {
        const percentagePerSubcomponent = totalPercentage / selectedCount;
        selectedSubcomponents.forEach(subcomponentId => {
          if (!newSubcomponentPercentages[activityName]) {
            newSubcomponentPercentages[activityName] = {};
          }
          newSubcomponentPercentages[activityName][subcomponentId] = percentagePerSubcomponent;
        });
      }
      
      return {
        ...prev,
        subcomponentPercentages: newSubcomponentPercentages
      };
    });
  }, []);
  
  const getSubcomponentPercentage = useCallback((activityName: string, subcomponentId: string): number => {
    return supplyModalState.subcomponentPercentages[activityName]?.[subcomponentId] || 0;
  }, [supplyModalState.subcomponentPercentages]);
  
  const isSubcomponentSelected = useCallback((activityName: string, subcomponentId: string): boolean => {
    return supplyModalState.selectedSubcomponents[activityName]?.includes(subcomponentId) || false;
  }, [supplyModalState.selectedSubcomponents]);
  
  // Utility handlers
  const handleKeyPress = useCallback((event: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (event.key === 'Enter' && nextRef?.current) {
      nextRef.current.focus();
    }
  }, []);
  
  const handleExportCSV = useCallback(() => {
    // Implementation for CSV export
    console.log('Export CSV functionality');
  }, []);
  
  // ============================================================================
  // DATA LOADING
  // ============================================================================
  
  const loadEmployees = useCallback(() => {
    const employees = ExpensesService.getEmployees(selectedBusinessId, selectedYear);
    const updatedEmployees = employees.map(employee => {
      const activities = getEmployeeActivities(employee);
      const appliedPercentage = calculateEmployeeAppliedPercentage(employee, activities);
      const appliedAmount = (appliedPercentage / 100) * employee.wage;
      
      return {
        ...employee,
        appliedPercentage: appliedPercentage,
        appliedAmount: appliedAmount
      };
    });
    
    setEmployees(updatedEmployees);
  }, [selectedBusinessId, selectedYear, getEmployeeActivities, calculateEmployeeAppliedPercentage]);
  
  const loadContractors = useCallback(() => {
    const contractorData = ExpensesService.getContractors(selectedBusinessId, selectedYear);
    setContractors(contractorData);
  }, [selectedBusinessId, selectedYear]);
  
  const loadSupplies = useCallback(() => {
    const supplyData = ExpensesService.getSupplies(selectedBusinessId, selectedYear);
    setSupplies(supplyData);
  }, [selectedBusinessId, selectedYear]);
  
  const loadAvailableYears = useCallback(() => {
    const years = ExpensesService.getAvailableYears(selectedBusinessId);
    setAvailableYears(years);
  }, [selectedBusinessId]);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Load data on mount and when dependencies change
  useEffect(() => {
    if (selectedBusinessId && selectedYear && isActivitiesApproved) {
      loadEmployees();
      loadContractors();
      loadSupplies();
      loadAvailableYears();
    }
  }, [selectedBusinessId, selectedYear, isActivitiesApproved, loadEmployees, loadContractors, loadSupplies, loadAvailableYears]);
  
  // Update roles with applied percentages when activities are approved
  useEffect(() => {
    if (businessRoles.length > 0) {
      const rolesWithAppliedPercentages = calculateRoleAppliedPercentages();
      setRoles(rolesWithAppliedPercentages);
    }
  }, [selectedYear, selectedBusinessId, isActivitiesApproved, businessRoles, calculateRoleAppliedPercentages]);
  
  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const state: QRABuilderState = {
    employees,
    contractors,
    supplies,
    roles,
    availableYears,
    formData,
    contractorFormData,
    supplyFormData,
    formError,
    contractorFormError,
    supplyFormError,
    selectedExpenseType,
    isActivitiesApproved,
    isExpensesApproved
  };
  
  const modalStates: ModalStates = {
    employee: employeeModalState,
    contractor: contractorModalState,
    supply: supplyModalState
  };
  
  const calculations: CalculationFunctions = {
    calculateEmployeeAppliedPercentage,
    calculateActivityAppliedPercentage,
    getEmployeeActivities,
    calculateContractorAppliedPercentage,
    calculateContractorActivityAppliedPercentage,
    getContractorActivities,
    calculateSupplyAppliedPercentage,
    getSupplyActivities,
    getSupplyActivitySubcomponents,
    calculateRoleAppliedPercentages,
    getQRAData,
    getAppliedPercentage,
    hasAnyQRAData,
    getActivityColor
  };
  
  const employeeHandlers: EmployeeEventHandlers = {
    handleAddEmployee,
    handleDeleteEmployee,
    handleToggleEmployeeActive,
    handleToggleEmployeeLock,
    handleOpenConfigureModal,
    handleCloseConfigureModal,
    handleSaveEmployeeConfiguration,
    handleFormChange
  };
  
  const contractorHandlers: ContractorEventHandlers = {
    handleAddContractor,
    handleDeleteContractor,
    handleToggleContractorActive,
    handleToggleContractorLock,
    handleOpenContractorConfigureModal,
    handleCloseContractorConfigureModal,
    handleSaveContractorConfiguration,
    handleContractorFormChange
  };
  
  const supplyHandlers: SupplyEventHandlers = {
    handleAddSupply,
    handleDeleteSupply,
    handleToggleSupplyActive,
    handleToggleSupplyLock,
    handleOpenSupplyConfigureModal,
    handleCloseSupplyConfigureModal,
    handleSaveSupplyConfiguration,
    handleSupplyFormChange,
    handleSubcomponentToggle,
    handleActivityPercentageChange,
    redistributeActivityPercentage,
    getSubcomponentPercentage,
    isSubcomponentSelected
  };
  
  const utilityHandlers: UtilityEventHandlers = {
    handleKeyPress,
    handleExportCSV
  };
  
  const handlers: EventHandlers = {
    employee: employeeHandlers,
    contractor: contractorHandlers,
    supply: supplyHandlers,
    utility: utilityHandlers
  };
  
  const contextValue: QRABuilderContextValue = {
    // Core state
    state,
    modalStates,
    
    // Props from parent
    selectedYear,
    selectedBusinessId,
    businesses,
    setBusinesses,
    tabReadOnly,
    setTabReadOnly,
    approvedTabs,
    setApprovedTabs,
    onEdit,
    
    // Computed values
    selectedBusiness,
    businessRoles,
    researchActivities,
    qraData,
    yearTotals,
    availableRoles,
    
    // Functions
    calculations,
    handlers,
    
    // State setters
    setEmployees,
    setContractors,
    setSupplies,
    setRoles,
    setAvailableYears,
    setFormData,
    setContractorFormData,
    setSupplyFormData,
    setFormError,
    setContractorFormError,
    setSupplyFormError,
    setSelectedExpenseType,
    
    // Modal state setters
    setEmployeeModalState,
    setContractorModalState,
    setSupplyModalState
  };
  
  return (
    <QRABuilderContext.Provider value={contextValue}>
      {children}
    </QRABuilderContext.Provider>
  );
};

// ============================================================================
// CONTEXT HOOK
// ============================================================================

export const useQRABuilder = (): QRABuilderContextValue => {
  const context = useContext(QRABuilderContext);
  if (context === undefined) {
    throw new Error('useQRABuilder must be used within a QRABuilderProvider');
  }
  return context;
};

export default QRABuilderContext; 