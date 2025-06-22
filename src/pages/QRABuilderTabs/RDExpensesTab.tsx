import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// MUI Imports
import {
  Box, Typography, Card, AppBar, Toolbar, Chip, Alert, Button, Grid, IconButton,
  Tooltip, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel,
  Switch, Tabs, Tab, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Slider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon, Lock as LockIcon, LockOpen as UnlockIcon,
  Calculate as CalculateIcon, InfoOutlined as InfoOutlinedIcon, Add as AddIcon,
  Delete as DeleteIcon, Edit as EditIcon, Settings as SettingsIcon, Person as PersonIcon,
  Business as BusinessIcon, Close as CloseIcon, FileDownload as FileDownloadIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// Type Imports
import { Business, RoleNode, Role } from '../../types/Business';
import { Employee, Contractor, Supply, ExpenseFormData, ContractorFormData, SupplyFormData, EMPTY_EXPENSE_FORM, EMPTY_CONTRACTOR_FORM, EMPTY_SUPPLY_FORM, NON_RD_ROLE, OTHER_ROLE, SUPPLY_CATEGORIES } from '../../types/Employee';

// Service Imports
import { ExpensesService } from '../../services/expensesService';
import { CSVExportService } from '../../services/csvExportService';
import { approvalsService } from '../../services/approvals';

// Util Imports
import { formatCurrencyInput, parseCurrencyInput, formatCurrency } from '../../utils/currencyFormatting';
import { flattenAllRoles, getRoleName, calculateRoleAppliedPercentages } from './RDExpensesTab/utils/roleHelpers';

// Hook Imports
import { CreditCalculatorInput, useFederalCreditCalculations } from '../../components/expenses/credit-calculator/useFederalCreditCalculations';

// Component Imports
import { SubcomponentSelectionData } from '../../components/qra/SimpleQRAModal';
import { EmployeeForm } from '../../components/expenses/forms/EmployeeForm';
import { ContractorForm } from '../../components/expenses/forms/ContractorForm';
import { SupplyForm } from '../../components/expenses/forms/SupplyForm';
import { EmployeeList } from '../../components/expenses/lists/EmployeeList';
import { ContractorList } from '../../components/expenses/lists/ContractorList';
import { SupplyList } from '../../components/expenses/lists/SupplyList';
import { EmployeeConfigureModal } from '../../components/expenses/modals/EmployeeConfigureModal';
import ContractorConfigureModal from '../../components/expenses/modals/ContractorConfigureModal';
import SupplyConfigureModal from '../../components/expenses/modals/SupplyConfigureModal';
import { ExportButton } from '../../components/expenses/shared/ExportButton';
import { ExpenseTabNavigation } from '../../components/expenses/tabs/ExpenseTabNavigation';
import { ReportingDashboard } from '../../components/expenses/reports/ReportingDashboard';
import { ExpenseSummary } from '../../components/expenses/shared/ExpenseSummary';

interface RDExpensesTabProps {
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

export default function RDExpensesTab({
  selectedYear,
  selectedBusinessId,
  businesses,
  setBusinesses,
  tabReadOnly,
  setTabReadOnly,
  approvedTabs,
  setApprovedTabs,
  onEdit,
}: RDExpensesTabProps) {
  const [selectedExpenseType, setSelectedExpenseType] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [formData, setFormData] = useState<ExpenseFormData>(EMPTY_EXPENSE_FORM);
  const [contractorFormData, setContractorFormData] = useState<ContractorFormData>(EMPTY_CONTRACTOR_FORM);
  const [supplyFormData, setSupplyFormData] = useState<SupplyFormData>(EMPTY_SUPPLY_FORM);
  const [formError, setFormError] = useState<string>('');
  const [contractorFormError, setContractorFormError] = useState<string>('');
  const [supplyFormError, setSupplyFormError] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Employee Configure Modal state
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [selectedEmployeeForConfig, setSelectedEmployeeForConfig] = useState<Employee | null>(null);
  const [employeePracticePercentages, setEmployeePracticePercentages] = useState<Record<string, number>>({});
  const [employeeTimePercentages, setEmployeeTimePercentages] = useState<Record<string, Record<string, number>>>({});
  
  // Contractor Configure Modal state
  const [contractorConfigureModalOpen, setContractorConfigureModalOpen] = useState(false);
  const [selectedContractorForConfig, setSelectedContractorForConfig] = useState<Contractor | null>(null);
  const [contractorPracticePercentages, setContractorPracticePercentages] = useState<Record<string, number>>({});
  const [contractorTimePercentages, setContractorTimePercentages] = useState<Record<string, Record<string, number>>>({});
  
  // Supply Configure Modal state
  const [supplyConfigureModalOpen, setSupplyConfigureModalOpen] = useState(false);
  const [selectedSupplyForConfig, setSelectedSupplyForConfig] = useState<Supply | null>(null);
  const [supplyActivityPercentages, setSupplyActivityPercentages] = useState<Record<string, number>>({});
  const [supplySubcomponentPercentages, setSupplySubcomponentPercentages] = useState<Record<string, Record<string, number>>>({});
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<Record<string, string[]>>({});
  
  // Refs for tab navigation
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const wageRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);

  // Check approval status
  const isActivitiesApproved = approvalsService.isTabApproved('activities', selectedYear);
  const isExpensesApproved = approvalsService.isTabApproved('expenses', selectedYear);

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
    return selectedBusiness?.years[selectedYear]?.qraData || [];
  }, [selectedBusiness, selectedYear]);

  const loadEmployees = useCallback(() => {
    const employeeData = ExpensesService.getEmployees(selectedBusinessId, selectedYear);
    
    // Update employees with 0% applied percentage by calculating from their activities
    const updatedEmployees = employeeData.map(employee => {
      // Check if employee has custom configuration
      const hasCustomPracticePercentages = employee.customPracticePercentages && 
        Object.keys(employee.customPracticePercentages).length > 0;
      const hasCustomTimePercentages = employee.customTimePercentages && 
        Object.keys(employee.customTimePercentages).length > 0;
      
      // If employee has custom configuration, keep their current applied percentage
      if (hasCustomPracticePercentages || hasCustomTimePercentages) {
        return employee;
      }
      
      // If employee has 0% applied percentage, recalculate from activities
      if (employee.appliedPercentage === 0) {
        const employeeActivities = getEmployeeActivities(employee);
        const calculatedAppliedPercentage = calculateEmployeeAppliedPercentage(employee, employeeActivities);
        
        if (calculatedAppliedPercentage > 0) {
          console.log(`Updating employee ${employee.firstName} ${employee.lastName} applied percentage from 0% to ${calculatedAppliedPercentage.toFixed(2)}%`);
          
          const updatedEmployee = {
            ...employee,
            appliedPercentage: calculatedAppliedPercentage,
            appliedAmount: employee.wage * (calculatedAppliedPercentage / 100),
            updatedAt: new Date().toISOString()
          };
          
          // Save the updated employee
          ExpensesService.saveEmployee(selectedBusinessId, selectedYear, updatedEmployee);
          return updatedEmployee;
        }
      }
      
      return employee;
    });
    
    setEmployees(updatedEmployees);
  }, [selectedBusinessId, selectedYear]);

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

  useEffect(() => {
    if (isActivitiesApproved) {
      loadEmployees();
      loadContractors();
      loadSupplies();
      loadAvailableYears();
      // Calculate applied percentages for roles
      const rolesWithAppliedPercentages = calculateRoleAppliedPercentages(
        businessRoles,
        selectedBusinessId,
        selectedYear
      );
      setRoles(rolesWithAppliedPercentages);
    }
  }, [selectedYear, selectedBusinessId, isActivitiesApproved, businessRoles, loadEmployees, loadContractors, loadSupplies, loadAvailableYears, calculateRoleAppliedPercentages]);

  const handleFormChange = (field: keyof ExpenseFormData, value: string | boolean) => {
    if (field === 'wage' && typeof value === 'string') {
      // Format currency input
      const formattedValue = formatCurrencyInput(value);
      setFormData(prev => ({ ...prev, [field]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setFormError('');
  };

  const handleContractorFormChange = (field: keyof ContractorFormData, value: string) => {
    if (field === 'totalAmount' && typeof value === 'string') {
      const formattedValue = formatCurrencyInput(value);
      setContractorFormData(prev => ({ ...prev, [field]: formattedValue }));
    } else {
      setContractorFormData(prev => ({ ...prev, [field]: value }));
    }
    setContractorFormError('');
  };

  const handleSupplyFormChange = (field: keyof SupplyFormData, value: string) => {
    if (field === 'totalValue' && typeof value === 'string') {
      const formattedValue = formatCurrencyInput(value);
      setSupplyFormData(prev => ({ ...prev, [field]: formattedValue }));
    } else {
      setSupplyFormData(prev => ({ ...prev, [field]: value }));
    }
    setSupplyFormError('');
  };

  const handleKeyPress = (event: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        handleAddEmployee();
      }
    }
  };

  const handleAddEmployee = () => {
    // Validate form data
    const validationError = ExpensesService.validateEmployee(
      formData.firstName,
      formData.lastName,
      formData.wage,
      formData.roleId,
      formData.customRoleName
    );

    if (validationError) {
      setFormError(validationError);
      return;
    }

    // Create new employee
    const newEmployee = ExpensesService.createEmployee(
      formData.firstName,
      formData.lastName,
      parseFloat(parseCurrencyInput(formData.wage)),
      formData.roleId,
      formData.customRoleName,
      formData.isBusinessOwner,
      roles
    );

    // Save employee
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, newEmployee);
    
    // Refresh employee list
    loadEmployees();
    
    // Reset form
    setFormData(EMPTY_EXPENSE_FORM);
    setFormError('');
    onEdit();
    
    // Focus first input for next entry
    if (firstNameRef.current) {
      firstNameRef.current.focus();
    }
  };

  const handleDeleteEmployee = (employeeId: string) => {
    ExpensesService.deleteEmployee(selectedBusinessId, selectedYear, employeeId);
    loadEmployees();
    onEdit();
  };

  const handleToggleEmployeeActive = (employee: Employee) => {
    const updatedEmployee = { ...employee, isActive: !employee.isActive };
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, updatedEmployee);
    loadEmployees();
    onEdit();
  };

  const handleToggleEmployeeLock = (employee: Employee) => {
    const updatedEmployee = { ...employee, isLocked: !employee.isLocked };
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, updatedEmployee);
    setEmployees(prev => prev.map(e => e.id === employee.id ? updatedEmployee : e));
  };

  const handleAddContractor = () => {
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
    if (contractorFormData.roleId === OTHER_ROLE.id && !contractorFormData.customRoleName) {
      setContractorFormError('Please enter a custom role name.');
      return;
    }

    // Get activities associated with the contractor's role
    const activities = getContractorActivities({ roleId: contractorFormData.roleId } as Contractor);

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
  };

  const handleDeleteContractor = (contractorId: string) => {
    ExpensesService.deleteContractor(selectedBusinessId, selectedYear, contractorId);
    loadContractors();
    onEdit();
  };

  const handleToggleContractorActive = (contractor: Contractor) => {
    const updatedContractor = { ...contractor, isActive: !contractor.isActive };
    ExpensesService.saveContractor(selectedBusinessId, selectedYear, updatedContractor);
    loadContractors();
    onEdit();
  };

  const handleToggleContractorLock = (contractor: Contractor) => {
    const updatedContractor = { ...contractor, isLocked: !contractor.isLocked };
    ExpensesService.saveContractor(selectedBusinessId, selectedYear, updatedContractor);
    loadContractors();
    onEdit();
  };

  const handleAddSupply = () => {
    const validationError = ExpensesService.validateSupply(
      supplyFormData.title,
      supplyFormData.description,
      supplyFormData.totalValue,
      supplyFormData.category,
      supplyFormData.customCategory
    );

    if (validationError) {
      setSupplyFormError(validationError);
      return;
    }

    const newSupply = ExpensesService.createSupply(
      supplyFormData.title,
      supplyFormData.description,
      parseFloat(parseCurrencyInput(supplyFormData.totalValue)),
      supplyFormData.category,
      supplyFormData.customCategory
    );

    ExpensesService.saveSupply(selectedBusinessId, selectedYear, newSupply);
    loadSupplies();
    setSupplyFormData(EMPTY_SUPPLY_FORM);
    setSupplyFormError('');
    onEdit();
  };

  const handleDeleteSupply = (supplyId: string) => {
    ExpensesService.deleteSupply(selectedBusinessId, selectedYear, supplyId);
    loadSupplies();
    onEdit();
  };

  const handleToggleSupplyActive = (supply: Supply) => {
    const updatedSupply = { ...supply, isActive: !supply.isActive };
    ExpensesService.saveSupply(selectedBusinessId, selectedYear, updatedSupply);
    loadSupplies();
    onEdit();
  };

  const handleToggleSupplyLock = (supply: Supply) => {
    const updatedSupply = { ...supply, isLocked: !supply.isLocked };
    ExpensesService.saveSupply(selectedBusinessId, selectedYear, updatedSupply);
    loadSupplies();
    onEdit();
  };

  const handleOpenSupplyConfigureModal = (supply: Supply) => {
    setSelectedSupplyForConfig(supply);
    
    // Initialize activity percentages from supply's custom configuration
    const initialActivityPercentages: Record<string, number> = {};
    const initialSubcomponentPercentages: Record<string, Record<string, number>> = {};
    const initialSelectedSubcomponents: Record<string, string[]> = {};
    
    if (supply.customActivityPercentages) {
      Object.entries(supply.customActivityPercentages).forEach(([activityName, percentage]) => {
        initialActivityPercentages[activityName] = percentage;
      });
    }
    
    if (supply.customSubcomponentPercentages) {
      Object.entries(supply.customSubcomponentPercentages).forEach(([activityName, subcomponents]) => {
        initialSubcomponentPercentages[activityName] = { ...subcomponents };
      });
    }
    
    // Load selected subcomponents from supply object if available, otherwise derive from percentages
    if (supply.selectedSubcomponents) {
      Object.entries(supply.selectedSubcomponents).forEach(([activityName, subcomponentIds]) => {
        initialSelectedSubcomponents[activityName] = [...subcomponentIds];
      });
    } else if (supply.customSubcomponentPercentages) {
      // Fallback: derive selected subcomponents from percentages (backward compatibility)
      Object.entries(supply.customSubcomponentPercentages).forEach(([activityName, subcomponents]) => {
        initialSelectedSubcomponents[activityName] = Object.keys(subcomponents).filter(subId => subcomponents[subId] > 0);
      });
    }
    
    setSupplyActivityPercentages(initialActivityPercentages);
    setSupplySubcomponentPercentages(initialSubcomponentPercentages);
    setSelectedSubcomponents(initialSelectedSubcomponents);
    setSupplyConfigureModalOpen(true);
  };

  const handleCloseSupplyConfigureModal = () => {
    setSupplyConfigureModalOpen(false);
    setSelectedSupplyForConfig(null);
    setSupplyActivityPercentages({});
    setSupplySubcomponentPercentages({});
    setSelectedSubcomponents({});
  };

  const handleSaveSupplyConfiguration = () => {
    if (!selectedSupplyForConfig) return;

    // Calculate total applied percentage from all subcomponents
    const totalAppliedPercentage = Object.values(supplySubcomponentPercentages).reduce((activitySum, subcomponents) => {
      return activitySum + Object.values(subcomponents).reduce((subSum, percentage) => subSum + percentage, 0);
    }, 0);
    
    const updatedSupply = {
      ...selectedSupplyForConfig,
      customActivityPercentages: { ...supplyActivityPercentages },
      customSubcomponentPercentages: { ...supplySubcomponentPercentages },
      selectedSubcomponents: { ...selectedSubcomponents },
      appliedPercentage: totalAppliedPercentage,
      appliedAmount: selectedSupplyForConfig.totalValue * (totalAppliedPercentage / 100),
      updatedAt: new Date().toISOString()
    };

    ExpensesService.saveSupply(selectedBusinessId, selectedYear, updatedSupply);
    loadSupplies();
    handleCloseSupplyConfigureModal();
    onEdit();
  };

  const getSupplyActivities = () => {
    // Get all available activities from business data
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    const activities = selectedBusiness?.years?.[selectedYear]?.activities || {};
    
    return Object.entries(activities).map(([activityId, activity]: [string, any]) => ({
      id: activityId,
      name: activity.name,
      active: activity.active !== false
    })).filter(activity => activity.active);
  };

  const getSupplyActivitySubcomponents = (activityName: string) => {
    // Get QRA data for this activity to find subcomponents
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
  };

  const calculateSupplyAppliedPercentage = (supply: Supply): number => {
    // If the supply has a saved appliedPercentage, use that (from modal configuration)
    if (supply.appliedPercentage !== undefined && supply.appliedPercentage !== null) {
      return supply.appliedPercentage;
    }
    
    // Fallback to calculating from customSubcomponentPercentages (for backward compatibility)
    if (!supply.customSubcomponentPercentages) return 0;
    
    // Sum all subcomponent percentages across all activities
    return Object.values(supply.customSubcomponentPercentages).reduce((activitySum, subcomponents) => {
      return activitySum + Object.values(subcomponents).reduce((subSum, percentage) => subSum + percentage, 0);
    }, 0);
  };

  const handleSubcomponentToggle = (activityName: string, subcomponentId: string) => {
    setSelectedSubcomponents(prev => {
      const currentSelected = prev[activityName] || [];
      const isSelected = currentSelected.includes(subcomponentId);
      
      let newSelected: string[];
      if (isSelected) {
        // Remove from selection
        newSelected = currentSelected.filter(id => id !== subcomponentId);
      } else {
        // Add to selection
        newSelected = [...currentSelected, subcomponentId];
      }
      
      const updated = {
        ...prev,
        [activityName]: newSelected
      };
      
      // Recalculate pro rata distribution for this activity
      redistributeActivityPercentage(activityName, updated);
      
      return updated;
    });
  };

  const redistributeActivityPercentage = (activityName: string, selectedSubcomponentsMap: Record<string, string[]>) => {
    const activityPercentage = supplyActivityPercentages[activityName] || 0;
    const selectedSubs = selectedSubcomponentsMap[activityName] || [];
    
    if (selectedSubs.length === 0) {
      // No subcomponents selected, clear all percentages for this activity
      setSupplySubcomponentPercentages(prev => ({
        ...prev,
        [activityName]: {}
      }));
      return;
    }
    
    // Distribute the activity percentage pro rata across selected subcomponents
    const percentagePerSubcomponent = activityPercentage / selectedSubs.length;
    
    const newSubcomponentPercentages: Record<string, number> = {};
    selectedSubs.forEach(subId => {
      newSubcomponentPercentages[subId] = percentagePerSubcomponent;
    });
    
    setSupplySubcomponentPercentages(prev => ({
      ...prev,
      [activityName]: newSubcomponentPercentages
    }));
  };

  const handleActivityPercentageChange = (activityName: string, newPercentage: number) => {
    setSupplyActivityPercentages(prev => ({
      ...prev,
      [activityName]: newPercentage
    }));
    
    // Redistribute the new percentage across selected subcomponents
    redistributeActivityPercentage(activityName, selectedSubcomponents);
  };

  const getSubcomponentPercentage = (activityName: string, subcomponentId: string): number => {
    return supplySubcomponentPercentages[activityName]?.[subcomponentId] || 0;
  };

  const isSubcomponentSelected = (activityName: string, subcomponentId: string): boolean => {
    return selectedSubcomponents[activityName]?.includes(subcomponentId) || false;
  };

  // Helper function to get QRA data
  const getQRAData = (activityName: string): SubcomponentSelectionData | null => {
    // QRA data is stored in localStorage with keys like: qra_${businessId}_${year}_${activityName}
    const storageKey = `qra_${selectedBusinessId}_${selectedYear}_${activityName}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (error) {
        console.warn(`Failed to parse QRA data for ${activityName}:`, error);
        return null;
      }
    }
    
    // Fallback: check business state (legacy)
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    const yearData = selectedBusiness?.years?.[selectedYear];
    const qraData = (yearData as any)?.qraData?.[activityName] || null;
    
    // Debug logging if still not found
    if (!qraData) {
      const allKeys = Object.keys(localStorage);
      const qraKeys = allKeys.filter(k => k.includes('qra') && k.includes(selectedBusinessId.toString()) && k.includes(selectedYear.toString()));
      console.log(`QRA data not found for activity: ${activityName}`);
      console.log(`Searched key: ${storageKey}`);
      console.log('Available QRA keys:', qraKeys);
    }
    
    return qraData;
  };

  // Helper function to get applied percentage for an activity (matches Activities tab approach)
  const getAppliedPercentage = (activityName: string): number => {
    const qraData = getQRAData(activityName);
    if (!qraData) return 0;
    
    // Applied percentage is directly from the QRA data totalAppliedPercent
    // This represents the percentage of time spent on qualifying R&D activities
    return qraData.totalAppliedPercent || 0;
  };

  // Helper function to check if any QRA data exists for debugging
  const hasAnyQRAData = () => {
    const allKeys = Object.keys(localStorage);
    const qraKeys = allKeys.filter(key => key.includes('qra') && key.includes(selectedBusinessId) && key.includes(selectedYear.toString()));
    return qraKeys.length > 0;
  };

  // Get consistent activity colors (same as IdentifyActivitiesTab)
  const getActivityColor = (activityName: string, allActivities: any[]): string => {
    const activityIndex = allActivities.findIndex(a => a.name === activityName);
    const brightColors = [
      '#42a5f5', // Light Blue
      '#ba68c8', // Purple
      '#ff9800', // Orange
      '#03a9f4', // Blue
      '#4caf50', // Green
      '#ff5722', // Deep Orange
      '#9c27b0', // Purple
      '#2196f3', // Blue
      '#8bc34a', // Light Green
      '#ffc107', // Amber
      '#e91e63', // Pink
      '#00bcd4', // Cyan
      '#cddc39', // Lime
      '#ff6f00', // Orange
      '#7b1fa2', // Deep Purple
      '#1976d2', // Blue
      '#388e3c', // Green
      '#f57c00', // Orange
      '#512da8', // Deep Purple
      '#0277bd', // Light Blue
      '#689f38', // Light Green
      '#f9a825', // Yellow
      '#c2185b', // Pink
      '#0097a7', // Cyan
      '#827717', // Lime
    ];
    return brightColors[activityIndex % brightColors.length];
  };

  // Employee Configure Modal handlers
  const handleOpenConfigureModal = (employee: Employee) => {
    console.log('=== MODAL OPENING DEBUG ===');
    console.log('Employee object:', JSON.stringify(employee, null, 2));
    console.log('Employee customPracticePercentages:', employee.customPracticePercentages);
    
    // Clear any previous state first to ensure fresh data
    setEmployeePracticePercentages({});
    setEmployeeTimePercentages({});
    
    setSelectedEmployeeForConfig(employee);
    setConfigureModalOpen(true);
    
    // CRITICAL FIX: Get fresh activities data with current practice percentages from Activities tab
    // This ensures we always start with the latest Activities tab data, not cached values
    const employeeActivities = getEmployeeActivities(employee);
    const practicePercentages: Record<string, number> = {};
    const timePercentages: Record<string, Record<string, number>> = {};
    
    console.log('Initializing modal for employee:', `${employee.firstName} ${employee.lastName}`);
    console.log('Employee activities found:', employeeActivities);
    
    // DEBUG: Check localStorage for any cached employee data
    const employeeKey = `employee_${selectedBusinessId}_${selectedYear}_${employee.id}`;
    const cachedEmployee = localStorage.getItem(employeeKey);
    console.log('Cached employee data:', cachedEmployee);
    
    employeeActivities.forEach(activity => {
      // CRITICAL FIX: Use current practice percentage as baseline (not applied percentage)
      // The practice percentage from Activities tab is the correct baseline for practice percentage display
      const baselinePracticePercent = activity.currentPracticePercent;
      const cachedCustomPercent = employee.customPracticePercentages?.[activity.name];
      
      // Use saved custom percentage if available, otherwise use the correct practice percentage baseline
      practicePercentages[activity.name] = cachedCustomPercent !== undefined 
        ? cachedCustomPercent 
        : baselinePracticePercent;
      
      console.log(`=== ACTIVITY: ${activity.name} ===`);
      console.log(`  Applied percentage: ${activity.appliedPercent}%`);
      console.log(`  Current practice percent (correct baseline): ${activity.currentPracticePercent}%`);
      console.log(`  Cached custom percentage: ${cachedCustomPercent}%`);
      console.log(`  Using as baseline: ${practicePercentages[activity.name]}%`);
      console.log(`  Activity object:`, JSON.stringify(activity, null, 2));
      
      // Initialize time percentages for subcomponents from QRA data (if available)
      const qraData = getQRAData(activity.name);
      if (qraData && qraData.selectedSubcomponents) {
        timePercentages[activity.name] = {};
        Object.entries(qraData.selectedSubcomponents).forEach(([subId, subData]) => {
          if (subData && !subData.isNonRD) {
            // Use employee's saved custom time percentage if available, otherwise use QRA default
            timePercentages[activity.name][subId] = 
              employee.customTimePercentages?.[activity.name]?.[subId] !== undefined
                ? employee.customTimePercentages[activity.name][subId]
                : (subData.timePercent || 0);
          }
        });
      }
    });
    
    console.log('Final practicePercentages being set:', practicePercentages);
    console.log('Final timePercentages being set:', timePercentages);
    
    setEmployeePracticePercentages(practicePercentages);
    setEmployeeTimePercentages(timePercentages);
    
    // Debug: Log the initial total applied percentage
    const initialAppliedPercentage = calculateEmployeeAppliedPercentage(employee, employeeActivities);
    console.log(`Initial applied percentage calculation result: ${initialAppliedPercentage.toFixed(2)}%`);
    console.log('=== END MODAL OPENING DEBUG ===');
  };

  const handleCloseConfigureModal = () => {
    setConfigureModalOpen(false);
    setSelectedEmployeeForConfig(null);
    setEmployeePracticePercentages({});
    setEmployeeTimePercentages({});
  };

  const handleSaveEmployeeConfiguration = () => {
    if (!selectedEmployeeForConfig) return;

    // Update employee with new configuration
    const updatedEmployee: Employee = {
      ...selectedEmployeeForConfig,
      customPracticePercentages: { ...employeePracticePercentages },
      customTimePercentages: { ...employeeTimePercentages },
      appliedPercentage: calculateEmployeeAppliedPercentage(
        selectedEmployeeForConfig, 
        getEmployeeActivities(selectedEmployeeForConfig)
      ),
      isLocked: true, // Automatically lock when user saves changes
      updatedAt: new Date().toISOString()
    };

    // Update applied amount based on new applied percentage
    updatedEmployee.appliedAmount = updatedEmployee.wage * (updatedEmployee.appliedPercentage / 100);

    // Save employee
    ExpensesService.updateEmployee(selectedBusinessId, selectedYear, updatedEmployee);
    
    // Refresh employees list
    loadEmployees();
    
    // Close modal
    setConfigureModalOpen(false);
    setSelectedEmployeeForConfig(null);
    setEmployeePracticePercentages({});
    setEmployeeTimePercentages({});
  };

  // Handle CSV export
  const handleExportCSV = () => {
    try {
      const exportData = CSVExportService.generateExportData(selectedBusinessId, selectedYear, businesses);
      const filename = `rd-expenses-${selectedBusiness?.businessName || 'export'}-${selectedYear}.csv`;
      CSVExportService.downloadCSV(exportData, filename);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // You could add a toast notification here
    }
  };

  // Contractor Configure Modal functions
  const handleOpenContractorConfigureModal = (contractor: Contractor) => {
    setSelectedContractorForConfig(contractor);
    
    // Load existing custom percentages or set defaults
    if (contractor.customPracticePercentages) {
      setContractorPracticePercentages({ ...contractor.customPracticePercentages });
    } else {
      // Set default practice percentages from activities
      const activities = getContractorActivities(contractor);
      const defaultPracticePercentages: Record<string, number> = {};
      activities.forEach(activity => {
        defaultPracticePercentages[activity.name] = activity.currentPracticePercent;
      });
      setContractorPracticePercentages(defaultPracticePercentages);
    }

    if (contractor.customTimePercentages) {
      setContractorTimePercentages({ ...contractor.customTimePercentages });
    } else {
      // Set default time percentages from QRA data
      const activities = getContractorActivities(contractor);
      const defaultTimePercentages: Record<string, Record<string, number>> = {};
      activities.forEach(activity => {
        const qraData = getQRAData(activity.name);
        if (qraData) {
          defaultTimePercentages[activity.name] = {};
          Object.entries(qraData.selectedSubcomponents).forEach(([subId, subConfig]) => {
            if (subConfig && subConfig.timePercent) {
              defaultTimePercentages[activity.name][subId] = subConfig.timePercent;
            }
          });
        }
      });
      setContractorTimePercentages(defaultTimePercentages);
    }
    
    setContractorConfigureModalOpen(true);
  };

  const handleCloseContractorConfigureModal = () => {
    setContractorConfigureModalOpen(false);
    setSelectedContractorForConfig(null);
    setContractorPracticePercentages({});
    setContractorTimePercentages({});
  };

  const handleSaveContractorConfiguration = () => {
    if (!selectedContractorForConfig) return;

    // Update contractor with new configuration
    const updatedContractor: Contractor = {
      ...selectedContractorForConfig,
      customPracticePercentages: { ...contractorPracticePercentages },
      customTimePercentages: { ...contractorTimePercentages },
      appliedPercentage: calculateContractorAppliedPercentage(
        selectedContractorForConfig, 
        getContractorActivities(selectedContractorForConfig)
      ),
      isLocked: true, // Automatically lock when user saves changes
      updatedAt: new Date().toISOString()
    };

    // Update applied amount based on new applied percentage with 65% rule
    updatedContractor.appliedAmount = updatedContractor.totalAmount * (updatedContractor.appliedPercentage / 100) * 0.65;

    // Save contractor
    ExpensesService.saveContractor(selectedBusinessId, selectedYear, updatedContractor);
    
    // Refresh contractors list
    loadContractors();
    
    // Close modal
    setContractorConfigureModalOpen(false);
    setSelectedContractorForConfig(null);
    setContractorPracticePercentages({});
    setContractorTimePercentages({});
  };

  // Get contractor activities (same logic as employee activities)
  const getContractorActivities = (contractor: Contractor) => {
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    // Get QRA slider state from Activities tab business object (correct source)
    const qraSliderState = business?.qraSliderByYear?.[selectedYear] || {};
    
    // Filter activities based on role
    const contractorActivities: Array<{
      id: string;
      name: string;
      defaultPracticePercent: number;
      currentPracticePercent: number;
      appliedPercent: number;
      activityData: any;
    }> = [];
    
    Object.entries(activities).forEach(([activityId, activity]: [string, any]) => {
      // Include activity if:
      // 1. Contractor has "Other" role (gets all activities at full percentages)
      // 2. Contractor's role is specifically assigned to this activity
      const includeActivity = contractor.roleId === OTHER_ROLE.id || 
        (activity.selectedRoles && activity.selectedRoles.includes(contractor.roleId));
      
      if (includeActivity && activity.active !== false) {
        // Get QRA data for this activity
        const qraData = getQRAData(activity.name);
        
        // Calculate applied percentage using the same approach as Activities tab
        const appliedPercent = getAppliedPercentage(activity.name);
        
        // Get practice percentage
        let storedPracticePercent = activity.practicePercent || 0;
        
        // For "Other" role, use 100% practice percentage (full activity percentage)
        if (contractor.roleId === OTHER_ROLE.id) {
          storedPracticePercent = 100;
        }
        
        const currentPracticePercent = qraSliderState[activityId]?.value !== undefined 
          ? qraSliderState[activityId].value 
          : storedPracticePercent;
        
        contractorActivities.push({
          id: activityId,
          name: activity.name,
          defaultPracticePercent: storedPracticePercent,
          currentPracticePercent: currentPracticePercent,
          appliedPercent: appliedPercent,
          activityData: activity
        });
      }
    });
    
    return contractorActivities;
  };

  // Calculate applied percentage for contractor (same as employee but with 65% rule applied separately)
  const calculateContractorAppliedPercentage = (contractor: Contractor, activities: any[]): number => {
    if (!activities || activities.length === 0) {
      return 0;
    }

    let totalApplied = 0;

    activities.forEach(activity => {
      const contributedApplied = calculateContractorActivityAppliedPercentage(activity);
      totalApplied += contributedApplied;
    });
    
    return totalApplied;
  };

  // Helper function to calculate applied percentage for a single contractor activity
  const calculateContractorActivityAppliedPercentage = (activity: any): number => {
    let contributedApplied = 0;
    
    if (contractorPracticePercentages[activity.name] !== undefined) {
      // Modal is open and user has adjusted practice percentage sliders
      const basePracticePercent = contractorPracticePercentages[activity.name];
      
      // Get QRA data to access frequency and year percentages
      const qraData = getQRAData(activity.name);
      
      if (qraData?.selectedSubcomponents) {
        // Calculate using FULL QRA FORMULA for each subcomponent
        let activityTotalApplied = 0;
        
        Object.entries(qraData.selectedSubcomponents).forEach(([subId, subConfig]) => {
          if (subConfig && !subConfig.isNonRD) {
            // Get all four components of the QRA formula
            const practicePercent = basePracticePercent;
            
            // Time percentage - use modal adjustment if available, otherwise QRA default
            const activityTimePercentages = contractorTimePercentages[activity.name];
            const timePercent = activityTimePercentages?.[subId] !== undefined 
              ? activityTimePercentages[subId] 
              : (subConfig.timePercent || 0);
            
            // Frequency and Year percentages from QRA data (not editable in modal)
            const frequencyPercent = subConfig.frequencyPercent || 0;
            const yearPercent = subConfig.yearPercent || 0;
            
            // Apply the COMPLETE QRA FORMULA: (Practice × Time × Frequency × Year) / 1,000,000
            const subcomponentApplied = (practicePercent * timePercent * frequencyPercent * yearPercent) / 1000000;
            
            activityTotalApplied += subcomponentApplied;
          }
        });
        
        contributedApplied = activityTotalApplied;
      } else {
        // No QRA subcomponents - fallback to simplified calculation
        contributedApplied = basePracticePercent;
      }
    } else {
      // Use the baseline applied percentage from Activities tab (already calculated with full QRA)
      contributedApplied = activity.appliedPercent;
    }
    
    return contributedApplied;
  };

  // Helper function to get activities for an employee's role - loads from Activities tab data
  const getEmployeeActivities = (employee: Employee) => {
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    // Get QRA slider state from Activities tab business object (correct source)
    const qraSliderState = business?.qraSliderByYear?.[selectedYear] || {};
    
    // Debug logging
    console.log('QRA Slider State from business object:', qraSliderState);
    console.log('Available activities:', Object.keys(activities));
    console.log('Employee role:', employee.roleId);
    
    // Filter activities based on role
    const employeeActivities: Array<{
      id: string;
      name: string;
      defaultPracticePercent: number;
      currentPracticePercent: number;
      appliedPercent: number;
      activityData: any;
    }> = [];
    
    Object.entries(activities).forEach(([activityId, activity]: [string, any]) => {
      // Include activity if:
      // 1. Employee has "Other" role (gets all activities at full percentages)
      // 2. Employee's role is specifically assigned to this activity
      const includeActivity = employee.roleId === OTHER_ROLE.id || 
        (activity.selectedRoles && activity.selectedRoles.includes(employee.roleId));
      
      if (includeActivity && activity.active !== false) {
        // Get QRA data for this activity
        const qraData = getQRAData(activity.name);
        
        // Calculate applied percentage using the same approach as Activities tab
        const appliedPercent = getAppliedPercentage(activity.name);
        
        // Get practice percentage
        let storedPracticePercent = activity.practicePercent || 0;
        
        // For "Other" role, use 100% practice percentage (full activity percentage)
        if (employee.roleId === OTHER_ROLE.id) {
          storedPracticePercent = 100;
        }
        
        const currentPracticePercent = qraSliderState[activityId]?.value !== undefined 
          ? qraSliderState[activityId].value 
          : storedPracticePercent;
        
        console.log(`Activity ${activity.name} (${activityId}):`, {
          employeeRole: employee.roleId,
          isOtherRole: employee.roleId === OTHER_ROLE.id,
          storedPracticePercent,
          sliderValue: qraSliderState[activityId]?.value,
          currentPracticePercent,
          appliedPercent,
          includeActivity
        });
        
        employeeActivities.push({
          id: activityId,
          name: activity.name,
          defaultPracticePercent: storedPracticePercent,
          currentPracticePercent: currentPracticePercent,
          appliedPercent: appliedPercent,
          activityData: activity
        });
      }
    });
    
    console.log('Final employee activities:', employeeActivities);
    return employeeActivities;
  };

  // Helper function to calculate applied percentage for a single activity using full QRA formula
  const calculateActivityAppliedPercentage = (activity: any): number => {
    let contributedApplied = 0;
    
    if (employeePracticePercentages[activity.name] !== undefined) {
      // Modal is open and user has adjusted practice percentage sliders
      const basePracticePercent = employeePracticePercentages[activity.name];
      
      // Get QRA data to access frequency and year percentages
      const qraData = getQRAData(activity.name);
      
      if (qraData?.selectedSubcomponents) {
        // Calculate using FULL QRA FORMULA for each subcomponent
        let activityTotalApplied = 0;
        
        Object.entries(qraData.selectedSubcomponents).forEach(([subId, subConfig]) => {
          if (subConfig && !subConfig.isNonRD) {
            // Get all four components of the QRA formula
            const practicePercent = basePracticePercent;
            
            // Time percentage - use modal adjustment if available, otherwise QRA default
            const activityTimePercentages = employeeTimePercentages[activity.name];
            const timePercent = activityTimePercentages?.[subId] !== undefined 
              ? activityTimePercentages[subId] 
              : (subConfig.timePercent || 0);
            
            // Frequency and Year percentages from QRA data (not editable in modal)
            const frequencyPercent = subConfig.frequencyPercent || 0;
            const yearPercent = subConfig.yearPercent || 0;
            
            // Apply the COMPLETE QRA FORMULA: (Practice × Time × Frequency × Year) / 1,000,000
            const subcomponentApplied = (practicePercent * timePercent * frequencyPercent * yearPercent) / 1000000;
            
            activityTotalApplied += subcomponentApplied;
          }
        });
        
        contributedApplied = activityTotalApplied;
      } else {
        // No QRA subcomponents - fallback to simplified calculation
        contributedApplied = basePracticePercent;
      }
    } else {
      // Use the baseline applied percentage from Activities tab (already calculated with full QRA)
      contributedApplied = activity.appliedPercent;
    }
    
    return contributedApplied;
  };

  const calculateEmployeeAppliedPercentage = (employee: Employee, activities: any[]): number => {
    console.log('=== CALCULATING APPLIED PERCENTAGE (FULL QRA FORMULA) ===');
    console.log('Employee ID:', employee.id);
    console.log('Available activities for calculation:', activities.map(a => a.name));
    
    if (!activities || activities.length === 0) {
      console.log('No activities available for calculation');
      return 0;
    }

    let totalApplied = 0;
    
    activities.forEach(activity => {
      const contributedApplied = calculateActivityAppliedPercentage(activity);
      
      console.log(`Activity ${activity.name}:`, {
        contributedApplied: contributedApplied.toFixed(6),
        'SOURCE': employeePracticePercentages[activity.name] !== undefined ? 'modal_full_qra_calculation' : 'activities_tab_baseline_full_qra'
      });
      
      totalApplied += contributedApplied;
    });
    
    console.log('Final calculated total applied percentage (FULL QRA):', totalApplied.toFixed(6));
    return totalApplied;
  };

  const yearTotals = ExpensesService.calculateYearTotals(selectedBusinessId, selectedYear);
  const availableRoles = ExpensesService.getAvailableRoles(roles); // Now using roles with applied percentages

  const currentYearQREs = useMemo(() => {
    const employeeQREs = employees.reduce((sum, emp) => sum + (emp.appliedAmount || 0), 0);
    const contractorQREs = contractors.reduce((sum, cont) => sum + (cont.appliedAmount || 0), 0);
    const supplyQREs = supplies.reduce((sum, sup) => sum + (sup.appliedAmount || 0), 0);
    return employeeQREs + contractorQREs + supplyQREs;
  }, [employees, contractors, supplies]);

  const creditCalculatorInput = useMemo((): CreditCalculatorInput => {
    const businessData = businesses.find(b => b.id === selectedBusinessId);
    if (!businessData) {
      // Return a default/empty state if business data is not found
      return {
        currentYearQREs: 0,
        priorYearQREs: [],
        priorYearGrossReceipts: [],
        businessType: 'C-Corp', // Default value
      };
    }

    const entityType = businessData.entityType?.toLowerCase().includes('c-corp') ? 'C-Corp' : 'Pass-Through';
    
    const financialHistory = businessData.financialHistory || [];
    const sortedHistory = [...financialHistory].sort((a, b) => b.year - a.year);

    const getPriorYearsData = (numberOfYears: number, dataKey: 'qre' | 'grossReceipts') => {
      const result: number[] = [];
      for (let i = 1; i <= numberOfYears; i++) {
        const yearData = sortedHistory.find(h => h.year === selectedYear - i);
        result.push(yearData?.[dataKey] || 0);
      }
      return result;
    };

    return {
      currentYearQREs,
      priorYearQREs: getPriorYearsData(4, 'qre'), // Get 4 years for standard method availability check
      priorYearGrossReceipts: getPriorYearsData(4, 'grossReceipts'),
      businessType: entityType,
    };
  }, [selectedBusinessId, businesses, selectedYear, currentYearQREs]);

  // Calculate federal credit for summary display
  const { finalCredit: federalCredit } = useFederalCreditCalculations(creditCalculatorInput);

  if (!isActivitiesApproved) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            R&D Expenses Locked
          </Typography>
          <Typography>
            The R&D Expenses section is locked until the Activities tab is approved for {selectedYear}.
            Please complete and approve your activities before managing expenses.
          </Typography>
        </Alert>

        <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <LockIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Complete Activities First
          </Typography>
          <Typography color="text.secondary">
            Expense management will be available once activities are approved.
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* AppBar with template management and approval */}
      <AppBar 
        position="static" 
        color="default"
        elevation={1} 
        sx={{ 
          mb: 2, 
          bgcolor: isExpensesApproved ? 'success.light' : undefined,
          color: isExpensesApproved ? 'success.contrastText' : undefined,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6">
                R&D Expenses
              </Typography>
              {isExpensesApproved && (
                <CheckCircleIcon sx={{ ml: 1, verticalAlign: 'middle' }} />
              )}
            </Box>
            <Chip 
              label={`${selectedYear}`} 
              size="small" 
              sx={{ ml: 2 }}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {availableYears.length > 0 && (
              <Chip 
                label={`${availableYears.length} year${availableYears.length > 1 ? 's' : ''} available`} 
                size="small"
                color="success"
                variant="outlined"
              />
            )}
            <ExportButton
              onExport={handleExportCSV}
              disabled={employees.length === 0}
              tooltipText="Export CSV data"
            />
            <Tooltip title="R&D Expenses help">
              <IconButton size="small">
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Summary Card */}
      <ExpenseSummary
        employees={employees}
        contractors={contractors}
        supplies={supplies}
        selectedYear={selectedYear}
        federalCredit={federalCredit}
      />

      {/* Expense Category Tabs */}
      <ExpenseTabNavigation
        activeTab={selectedExpenseType}
        onTabChange={(_, newValue) => setSelectedExpenseType(newValue)}
        employees={employees}
        contractors={contractors}
        supplies={supplies}
        isExpensesApproved={isExpensesApproved}
      />

      {selectedExpenseType === 0 && (
        <Box sx={{ p: 3 }}>
          {/* Quick Employee Entry Form */}
          <EmployeeForm
            formData={formData}
            onFormChange={handleFormChange}
            onAddEmployee={handleAddEmployee}
            onKeyPress={handleKeyPress}
            formError={formError}
            availableRoles={availableRoles}
            disabled={isExpensesApproved}
          />
          
          {/* Employee List */}
          <EmployeeList
            employees={employees}
            roles={roles}
            yearTotals={yearTotals}
            onToggleLock={handleToggleEmployeeLock}
            onConfigure={handleOpenConfigureModal}
            onToggleActive={handleToggleEmployeeActive}
            onDelete={handleDeleteEmployee}
            calculateEmployeeAppliedPercentage={calculateEmployeeAppliedPercentage}
            getEmployeeActivities={getEmployeeActivities}
            getRoleName={getRoleName}
          />
        </Box>
      )}

      {selectedExpenseType === 1 && (
        <Box sx={{ p: 3 }}>
          {/* Quick Contractor Entry Form */}
          <ContractorForm
            formData={contractorFormData}
            onFormChange={handleContractorFormChange}
            onAddContractor={handleAddContractor}
            formError={contractorFormError}
            availableRoles={ExpensesService.getAvailableRoles(roles)}
            disabled={isExpensesApproved}
          />

          {/* Contractor List */}
          <ContractorList
            contractors={contractors}
            roles={roles}
            yearTotals={yearTotals}
            onToggleLock={handleToggleContractorLock}
            onConfigure={handleOpenContractorConfigureModal}
            onToggleActive={handleToggleContractorActive}
            onDelete={handleDeleteContractor}
            calculateContractorAppliedPercentage={calculateContractorAppliedPercentage}
            getContractorActivities={getContractorActivities}
            getRoleName={getRoleName}
            disabled={isExpensesApproved}
          />
        </Box>
      )}

      {selectedExpenseType === 2 && (
        <Box sx={{ p: 3 }}>
          {/* Quick Supply Entry Form */}
          <SupplyForm
            formData={supplyFormData}
            onFormChange={handleSupplyFormChange}
            onAddSupply={handleAddSupply}
            formError={supplyFormError}
            disabled={isExpensesApproved}
          />

          {/* Supply List */}
          <SupplyList
            supplies={supplies}
            yearTotals={yearTotals}
            onToggleLock={handleToggleSupplyLock}
            onConfigure={handleOpenSupplyConfigureModal}
            onToggleActive={handleToggleSupplyActive}
            onDelete={handleDeleteSupply}
            calculateSupplyAppliedPercentage={calculateSupplyAppliedPercentage}
            disabled={isExpensesApproved}
          />
        </Box>
      )}

      {selectedExpenseType === 3 && (
        <Box sx={{ p: 3 }}>
          <ReportingDashboard
            employees={employees}
            contractors={contractors}
            supplies={supplies}
            selectedYear={selectedYear}
            isExpensesApproved={isExpensesApproved}
            creditCalculatorInput={creditCalculatorInput}
            onExportReport={(type) => console.log(`Exporting ${type} report...`)}
          />
        </Box>
      )}

      {/* Employee Configure Modal */}
      <EmployeeConfigureModal
        open={configureModalOpen}
        onClose={handleCloseConfigureModal}
        onSave={handleSaveEmployeeConfiguration}
        employee={selectedEmployeeForConfig}
        roles={roles}
        employeePracticePercentages={employeePracticePercentages}
        employeeTimePercentages={employeeTimePercentages}
        onPracticePercentageChange={(activityName, percentage) => {
          setEmployeePracticePercentages(prev => ({
            ...prev,
            [activityName]: percentage
          }));
        }}
        onTimePercentageChange={(activityName, subcomponentId, percentage) => {
          setEmployeeTimePercentages(prev => ({
            ...prev,
            [activityName]: {
              ...prev[activityName],
              [subcomponentId]: percentage
            }
          }));
        }}
        getEmployeeActivities={getEmployeeActivities}
        calculateActivityAppliedPercentage={calculateActivityAppliedPercentage}
        calculateEmployeeAppliedPercentage={calculateEmployeeAppliedPercentage}
        getQRAData={getQRAData}
        getActivityColor={getActivityColor}
        hasAnyQRAData={hasAnyQRAData}
        selectedBusinessId={selectedBusinessId}
        selectedYear={selectedYear}
      />

      {/* Contractor Configure Modal */}
      <ContractorConfigureModal
        open={contractorConfigureModalOpen}
        onClose={handleCloseContractorConfigureModal}
        onSave={handleSaveContractorConfiguration}
        selectedContractor={selectedContractorForConfig}
        contractorPracticePercentages={contractorPracticePercentages}
        contractorTimePercentages={contractorTimePercentages}
        setContractorPracticePercentages={setContractorPracticePercentages}
        setContractorTimePercentages={setContractorTimePercentages}
        getContractorActivities={getContractorActivities}
        calculateContractorAppliedPercentage={calculateContractorAppliedPercentage}
        calculateContractorActivityAppliedPercentage={calculateContractorActivityAppliedPercentage}
        getQRAData={getQRAData}
        hasAnyQRAData={hasAnyQRAData}
        getActivityColor={getActivityColor}
        roles={roles}
        selectedYear={selectedYear}
        selectedBusinessId={selectedBusinessId}
      />

      {/* Supply Configure Modal */}
      <SupplyConfigureModal
        open={supplyConfigureModalOpen}
        onClose={handleCloseSupplyConfigureModal}
        onSave={handleSaveSupplyConfiguration}
        selectedSupply={selectedSupplyForConfig}
        supplyActivityPercentages={supplyActivityPercentages}
        supplySubcomponentPercentages={supplySubcomponentPercentages}
        selectedSubcomponents={selectedSubcomponents}
        setSupplyActivityPercentages={setSupplyActivityPercentages}
        setSupplySubcomponentPercentages={setSupplySubcomponentPercentages}
        setSelectedSubcomponents={setSelectedSubcomponents}
        getSupplyActivities={getSupplyActivities}
        getSupplyActivitySubcomponents={getSupplyActivitySubcomponents}
        handleActivityPercentageChange={handleActivityPercentageChange}
        handleSubcomponentToggle={handleSubcomponentToggle}
        getSubcomponentPercentage={getSubcomponentPercentage}
        isSubcomponentSelected={isSubcomponentSelected}
        getActivityColor={getActivityColor}
      />
    </Box>
  );
} 