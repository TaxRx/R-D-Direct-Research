import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  AppBar,
  Toolbar,
  Chip,
  Alert,
  Button,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Calculate as CalculateIcon,
  InfoOutlined as InfoOutlinedIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { Business, RoleNode, Role } from '../../types/Business';
import { Employee, Contractor, Supply, ExpenseFormData, ContractorFormData, SupplyFormData, EMPTY_EXPENSE_FORM, EMPTY_CONTRACTOR_FORM, EMPTY_SUPPLY_FORM, NON_RD_ROLE, OTHER_ROLE, SUPPLY_CATEGORIES } from '../../types/Employee';
import { ExpensesService } from '../../services/expensesService';
import { CSVExportService } from '../../services/csvExportService';
import { approvalsService } from '../../services/approvals';
import { SubcomponentSelectionData } from '../../components/qra/SimpleQRAModal';

// Currency formatting utilities
const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, '');
  
  // Handle decimal places (max 2)
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    parts.length = 2;
  }
  if (parts[1] && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2);
  }
  
  const cleanValue = parts.join('.');
  
  // Format with commas
  if (cleanValue) {
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    }
  }
  
  return cleanValue;
};

const parseCurrencyInput = (formattedValue: string): string => {
  // Remove all non-numeric characters except decimal point
  return formattedValue.replace(/[^\d.]/g, '');
};

// Helper function to flatten hierarchical roles (same as in IdentifyRolesTab)
const flattenAllRoles = (nodes: RoleNode[]): RoleNode[] => {
  if (!Array.isArray(nodes)) return [];
  let result: RoleNode[] = [];
  nodes.forEach(node => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenAllRoles(node.children));
    }
  });
  return result;
};

// Calculate role applied percentages from activities
const calculateRoleAppliedPercentages = (
  roles: RoleNode[],
  selectedBusinessId: string,
  selectedYear: number
): Role[] => {
  // First, flatten the hierarchical role structure to get all roles including children
  const allRoles = flattenAllRoles(roles);
  
  // Get QRA data for all activities
  const getQRAData = (activityName: string) => {
    try {
      const qraData = localStorage.getItem(`qra_${selectedBusinessId}_${selectedYear}_${activityName}`);
      return qraData ? JSON.parse(qraData) : null;
    } catch (error) {
      console.error('Error loading QRA data:', error);
      return null;
    }
  };

  // Get business data to find activities and their role assignments
  const STORAGE_KEY = 'businessInfoData';
  const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const business = savedData.businesses?.find((b: any) => b.id === selectedBusinessId);
  const activities = business?.years?.[selectedYear]?.activities || {};

  // Calculate applied percentage for each role
  return allRoles.map(role => {
    let totalAppliedPercentage = 0;
    let activityCount = 0;

    // Find all activities that this role participates in
    Object.values(activities).forEach((activity: any) => {
      if (activity.selectedRoles && activity.selectedRoles.includes(role.id)) {
        // Get the applied percentage from QRA data for this activity
        const qraData = getQRAData(activity.name);
        if (qraData && qraData.totalAppliedPercent) {
          totalAppliedPercentage += qraData.totalAppliedPercent;
          activityCount++;
        }
      }
    });

    // Average the applied percentages across all activities this role participates in
    const appliedPercentage = activityCount > 0 ? totalAppliedPercentage / activityCount : 0;

    return {
      ...role,
      appliedPercentage: Math.round(appliedPercentage * 100) / 100 // Round to 2 decimal places
    };
  });
};

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
  const [activeExpenseTab, setActiveExpenseTab] = useState(0);
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
  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
  const businessRoles = selectedBusiness?.rolesByYear?.[selectedYear] || [];

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
  }, [selectedYear, selectedBusinessId, isActivitiesApproved, businessRoles, loadEmployees, loadContractors, loadSupplies, loadAvailableYears]);

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
    loadEmployees();
    onEdit();
  };

  const handleAddContractor = () => {
    const validationError = ExpensesService.validateContractor(
      contractorFormData.contractorType,
      contractorFormData.firstName,
      contractorFormData.lastName,
      contractorFormData.businessName,
      contractorFormData.totalAmount,
      contractorFormData.roleId,
      contractorFormData.customRoleName
    );

    if (validationError) {
      setContractorFormError(validationError);
      return;
    }

    const newContractor = ExpensesService.createContractor(
      contractorFormData.contractorType,
      contractorFormData.firstName,
      contractorFormData.lastName,
      contractorFormData.businessName,
      parseFloat(parseCurrencyInput(contractorFormData.totalAmount)),
      contractorFormData.roleId,
      contractorFormData.customRoleName,
      roles
    );

    ExpensesService.saveContractor(selectedBusinessId, selectedYear, newContractor);
    loadContractors();
    setContractorFormData(EMPTY_CONTRACTOR_FORM);
    setContractorFormError('');
    onEdit();
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
        // Extract selected subcomponents (those with percentage > 0)
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

  const getRoleName = (roleId: string, customRoleName?: string) => {
    if (roleId === NON_RD_ROLE.id) {
      return NON_RD_ROLE.name;
    }
    if (roleId === OTHER_ROLE.id) {
      return customRoleName || OTHER_ROLE.name;
    }
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Unknown Role';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
            <Tooltip title="Export CSV data">
              <span>
                <IconButton size="small" onClick={handleExportCSV} disabled={employees.length === 0}>
                  <FileDownloadIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="R&D Expenses help">
              <IconButton size="small">
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Summary Card */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            R&D Expenses Summary - {selectedYear}
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {yearTotals.employeeCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Employees
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {formatCurrency(yearTotals.totalWages)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Wages
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {formatCurrency(yearTotals.totalAppliedWages)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applied R&D Amount
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                  {yearTotals.businessOwnerCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Business Owners
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Expense Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeExpenseTab} onChange={(_, newValue) => setActiveExpenseTab(newValue)}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Wages ({employees.length})
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 1 }} />
                Contractors ({contractors.length})
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalculateIcon sx={{ mr: 1 }} />
                Supplies ({supplies.length})
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Wages Tab Content */}
      {activeExpenseTab === 0 && (
        <Box>
          {/* Quick Employee Entry Form - MOVED INSIDE WAGES TAB */}
          <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <AddIcon sx={{ mr: 1 }} />
                Quick Employee Entry
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Use Tab to navigate fields, Enter to add employee
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    inputRef={firstNameRef}
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, lastNameRef)}
                    fullWidth
                    size="small"
                    error={!!formError && formError.includes('First name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    inputRef={lastNameRef}
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, wageRef)}
                    fullWidth
                    size="small"
                    error={!!formError && formError.includes('Last name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    inputRef={wageRef}
                    label="Annual Wage"
                    value={formData.wage}
                    onChange={(e) => handleFormChange('wage', e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, roleRef)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="50,000"
                    error={!!formError && formError.includes('Wage')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small" error={!!formError && formError.includes('Role')}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      inputRef={roleRef}
                      value={formData.roleId}
                      onChange={(e) => handleFormChange('roleId', e.target.value)}
                      label="Role"
                    >
                      {availableRoles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {role.id === NON_RD_ROLE.id ? (
                              <BusinessIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                            ) : role.id === OTHER_ROLE.id ? (
                              <EditIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                            ) : (
                              <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            )}
                            {role.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Custom Role Name Field - Only show when Other is selected */}
                {formData.roleId === OTHER_ROLE.id && (
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      value={formData.customRoleName}
                      onChange={(e) => handleFormChange('customRoleName', e.target.value)}
                      fullWidth
                      size="small"
                      label="Custom Role Name"
                      placeholder="e.g., Senior Developer"
                      error={!!formError && formError.includes('Custom role name')}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6} md={2}>
                  <Tooltip title="Designate if this employee is a business owner for tax reporting">
                    <FormControlLabel
                      control={
                        <Switch
                          inputRef={ownerRef}
                          checked={formData.isBusinessOwner}
                          onChange={(e) => handleFormChange('isBusinessOwner', e.target.checked)}
                          size="small"
                        />
                      }
                      label="Owner"
                    />
                  </Tooltip>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="contained"
                    onClick={handleAddEmployee}
                    fullWidth
                    startIcon={<AddIcon />}
                    disabled={!formData.firstName || !formData.lastName || !formData.wage || !formData.roleId || (formData.roleId === OTHER_ROLE.id && !formData.customRoleName)}
                  >
                    Add Employee
                  </Button>
                </Grid>
              </Grid>
              {formError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {formError}
                </Alert>
              )}
            </Box>
          </Card>

          {/* Employee List - SAME STRUCTURE AS BEFORE */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Employee Wages
                  </Typography>
                  <Chip 
                    label={`${employees.length} employee${employees.length !== 1 ? 's' : ''}`} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Applied: {formatCurrency(yearTotals.totalAppliedWages)}
                </Typography>
              </Box>
            </Box>

          <Box sx={{ p: 2 }}>
            {employees.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <PersonIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Employees Added
                </Typography>
                <Typography color="text.secondary">
                  Use the quick entry form above to add your first employee.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {employees.map((employee) => (
                  <Box
                    key={employee.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: employee.isActive ? 'background.paper' : 'grey.50',
                      opacity: employee.isActive ? 1 : 0.7,
                    }}
                  >
                    {/* Employee Info */}
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          {employee.isBusinessOwner && (
                            <Chip 
                              label="Owner" 
                              size="small" 
                              color="warning"
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {getRoleName(employee.roleId, employee.customRoleName)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Wage */}
                    <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatCurrency(employee.wage)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Annual Wage
                      </Typography>
                    </Box>

                    {/* Applied Percentage & Amount - Improved Spacing */}
                    <Box sx={{ display: 'flex', gap: 2, minWidth: 180, textAlign: 'right', mr: 2 }}>
                      {/* Applied Percentage */}
                      <Box sx={{ minWidth: 80 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {(() => {
                            // Check if employee has custom configuration by looking for non-empty custom objects
                            const hasCustomPracticePercentages = employee.customPracticePercentages && 
                              Object.keys(employee.customPracticePercentages).length > 0;
                            const hasCustomTimePercentages = employee.customTimePercentages && 
                              Object.keys(employee.customTimePercentages).length > 0;
                            
                            // Use saved applied percentage if employee has custom configuration, otherwise calculate dynamically
                            const appliedPercentage = hasCustomPracticePercentages || hasCustomTimePercentages
                              ? employee.appliedPercentage // Use saved percentage from modal configuration
                              : calculateEmployeeAppliedPercentage(employee, getEmployeeActivities(employee)); // Calculate from role defaults
                            
                            return appliedPercentage.toFixed(1);
                          })()}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Applied %
                        </Typography>
                      </Box>
                      
                      {/* R&D Amount */}
                      <Box sx={{ minWidth: 90 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {(() => {
                            // Check if employee has custom configuration by looking for non-empty custom objects
                            const hasCustomPracticePercentages = employee.customPracticePercentages && 
                              Object.keys(employee.customPracticePercentages).length > 0;
                            const hasCustomTimePercentages = employee.customTimePercentages && 
                              Object.keys(employee.customTimePercentages).length > 0;
                            
                            // Use saved applied amount if employee has custom configuration, otherwise calculate dynamically
                            let appliedAmount;
                            if (hasCustomPracticePercentages || hasCustomTimePercentages) {
                              appliedAmount = employee.wage * (employee.appliedPercentage / 100);
                            } else {
                              appliedAmount = employee.wage * calculateEmployeeAppliedPercentage(employee, getEmployeeActivities(employee)) / 100;
                            }
                            
                            return formatCurrency(appliedAmount);
                          })()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          R&D Amount
                        </Typography>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title={employee.isLocked ? 'Unlock employee' : 'Lock employee'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleEmployeeLock(employee)}
                          color={employee.isLocked ? 'warning' : 'default'}
                        >
                          {employee.isLocked ? <LockIcon /> : <UnlockIcon />}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Configure applied percentage">
                        <span>
                          <IconButton 
                            size="small" 
                            disabled={employee.isLocked}
                            onClick={() => handleOpenConfigureModal(employee)}
                          >
                            <SettingsIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      
                      <Tooltip title={employee.isActive ? 'Deactivate employee' : 'Activate employee'}>
                        <span>
                          <Switch
                            checked={employee.isActive}
                            onChange={() => handleToggleEmployeeActive(employee)}
                            size="small"
                            disabled={employee.isLocked}
                          />
                        </span>
                      </Tooltip>
                      
                      <Tooltip title="Delete employee">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            color="error"
                            disabled={employee.isLocked}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Card>
        </Box>
      )}

      {/* Contractors Tab Content */}
      {activeExpenseTab === 1 && (
        <Box>
          {/* Quick Contractor Entry Form - MOVED ABOVE CONTRACTOR LIST */}
          <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <AddIcon sx={{ mr: 1 }} />
                Quick Contractor Entry
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Add contractors (65% of amount applied to R&D)
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={contractorFormData.contractorType}
                      onChange={(e) => handleContractorFormChange('contractorType', e.target.value)}
                    >
                      <MenuItem value="individual">Individual</MenuItem>
                      <MenuItem value="business">Business</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {contractorFormData.contractorType === 'individual' ? (
                  <>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        label="First Name"
                        value={contractorFormData.firstName}
                        onChange={(e) => handleContractorFormChange('firstName', e.target.value)}
                        fullWidth
                        size="small"
                        error={!!contractorFormError && contractorFormError.includes('First name')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        label="Last Name"
                        value={contractorFormData.lastName}
                        onChange={(e) => handleContractorFormChange('lastName', e.target.value)}
                        fullWidth
                        size="small"
                        error={!!contractorFormError && contractorFormError.includes('Last name')}
                      />
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Business Name"
                      value={contractorFormData.businessName}
                      onChange={(e) => handleContractorFormChange('businessName', e.target.value)}
                      fullWidth
                      size="small"
                      error={!!contractorFormError && contractorFormError.includes('Business name')}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="Total Amount"
                    value={contractorFormData.totalAmount}
                    onChange={(e) => handleContractorFormChange('totalAmount', e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="50,000"
                    error={!!contractorFormError && contractorFormError.includes('Total amount')}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={contractorFormData.roleId}
                      onChange={(e) => handleContractorFormChange('roleId', e.target.value)}
                    >
                      {ExpensesService.getAvailableRoles(roles).map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {contractorFormData.roleId === OTHER_ROLE.id && (
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="Custom Role Name"
                      value={contractorFormData.customRoleName}
                      onChange={(e) => handleContractorFormChange('customRoleName', e.target.value)}
                      fullWidth
                      size="small"
                      error={!!contractorFormError && contractorFormError.includes('Custom role name')}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="contained"
                    onClick={handleAddContractor}
                    fullWidth
                    startIcon={<AddIcon />}
                    disabled={
                      !contractorFormData.totalAmount || 
                      !contractorFormData.roleId || 
                      (contractorFormData.roleId === OTHER_ROLE.id && !contractorFormData.customRoleName) ||
                      (contractorFormData.contractorType === 'individual' && (!contractorFormData.firstName || !contractorFormData.lastName)) ||
                      (contractorFormData.contractorType === 'business' && !contractorFormData.businessName)
                    }
                  >
                    Add Contractor
                  </Button>
                </Grid>
              </Grid>
              {contractorFormError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {contractorFormError}
                </Alert>
              )}
            </Box>
          </Card>

          {/* Contractor List - SAME STRUCTURE AS WAGES TAB */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Contractors
                  </Typography>
                  <Chip 
                    label={`${contractors.length} contractor${contractors.length !== 1 ? 's' : ''}`} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Applied: {formatCurrency(yearTotals.totalAppliedContractorAmounts || 0)} (65% applied)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 2 }}>
              {contractors.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <BusinessIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Contractors Added
                  </Typography>
                  <Typography color="text.secondary">
                    Use the quick entry form above to add your first contractor.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {contractors.map((contractor) => {
                    const contractorName = contractor.contractorType === 'individual' 
                      ? `${contractor.firstName} ${contractor.lastName}` 
                      : contractor.businessName;
                    
                    return (
                      <Box
                        key={contractor.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: contractor.isActive ? 'background.paper' : 'grey.50',
                          opacity: contractor.isActive ? 1 : 0.7,
                        }}
                      >
                        {/* Contractor Info */}
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {contractorName}
                              </Typography>
                              <Chip 
                                label={contractor.contractorType === 'individual' ? 'Individual' : 'Business'} 
                                size="small" 
                                color={contractor.contractorType === 'individual' ? 'primary' : 'secondary'}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {getRoleName(contractor.roleId, contractor.customRoleName)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Total Amount */}
                        <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatCurrency(contractor.totalAmount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Amount
                          </Typography>
                        </Box>

                        {/* Applied Percentage & Amount - SAME AS WAGES TAB */}
                        <Box sx={{ display: 'flex', gap: 2, minWidth: 180, textAlign: 'right', mr: 2 }}>
                          {/* Applied Percentage */}
                          <Box sx={{ minWidth: 80 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {(() => {
                                // Check if contractor has custom configuration by looking for non-empty custom objects
                                const hasCustomPracticePercentages = contractor.customPracticePercentages && 
                                  Object.keys(contractor.customPracticePercentages).length > 0;
                                const hasCustomTimePercentages = contractor.customTimePercentages && 
                                  Object.keys(contractor.customTimePercentages).length > 0;
                                
                                // Use saved applied percentage if contractor has custom configuration, otherwise calculate dynamically
                                const appliedPercentage = hasCustomPracticePercentages || hasCustomTimePercentages
                                  ? contractor.appliedPercentage // Use saved percentage from modal configuration
                                  : calculateContractorAppliedPercentage(contractor, getContractorActivities(contractor)); // Calculate from role defaults
                                
                                return appliedPercentage.toFixed(1);
                              })()}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Applied %
                            </Typography>
                          </Box>
                          
                          {/* R&D Amount */}
                          <Box sx={{ minWidth: 90 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {(() => {
                                // Check if contractor has custom configuration by looking for non-empty custom objects
                                const hasCustomPracticePercentages = contractor.customPracticePercentages && 
                                  Object.keys(contractor.customPracticePercentages).length > 0;
                                const hasCustomTimePercentages = contractor.customTimePercentages && 
                                  Object.keys(contractor.customTimePercentages).length > 0;
                                
                                // Use saved applied amount if contractor has custom configuration, otherwise calculate dynamically
                                let appliedAmount;
                                if (hasCustomPracticePercentages || hasCustomTimePercentages) {
                                  appliedAmount = contractor.totalAmount * (contractor.appliedPercentage / 100) * 0.65; // 65% rule
                                } else {
                                  appliedAmount = contractor.totalAmount * calculateContractorAppliedPercentage(contractor, getContractorActivities(contractor)) / 100 * 0.65; // 65% rule
                                }
                                
                                return formatCurrency(appliedAmount);
                              })()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              R&D Amount
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              (65% applied)
                            </Typography>
                          </Box>
                        </Box>

                        {/* Actions - SAME AS WAGES TAB WITH CONFIGURE BUTTON */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title={contractor.isLocked ? 'Unlock contractor' : 'Lock contractor'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleContractorLock(contractor)}
                              color={contractor.isLocked ? 'warning' : 'default'}
                            >
                              {contractor.isLocked ? <LockIcon /> : <UnlockIcon />}
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Configure applied percentage">
                            <span>
                              <IconButton 
                                size="small" 
                                disabled={contractor.isLocked}
                                onClick={() => handleOpenContractorConfigureModal(contractor)}
                              >
                                <SettingsIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          
                          <Tooltip title={contractor.isActive ? 'Deactivate contractor' : 'Activate contractor'}>
                            <span>
                              <Switch
                                checked={contractor.isActive}
                                onChange={() => handleToggleContractorActive(contractor)}
                                size="small"
                                disabled={contractor.isLocked}
                              />
                            </span>
                          </Tooltip>
                          
                          <Tooltip title="Delete contractor">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteContractor(contractor.id)}
                                color="error"
                                disabled={contractor.isLocked}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Card>
        </Box>
      )}

      {/* Supplies Tab Content */}
      {activeExpenseTab === 2 && (
        <Box>
          {/* Quick Supply Entry Form */}
          <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'secondary.50' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <AddIcon sx={{ mr: 1 }} />
                Quick Supply Entry
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Add supplies used in R&D activities
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Supply Title"
                    value={supplyFormData.title}
                    onChange={(e) => handleSupplyFormChange('title', e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="e.g., Laboratory Equipment"
                    error={!!supplyFormError && supplyFormError.includes('Title')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Description"
                    value={supplyFormData.description}
                    onChange={(e) => handleSupplyFormChange('description', e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="What it is and what it does"
                    error={!!supplyFormError && supplyFormError.includes('Description')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="Total Value"
                    value={supplyFormData.totalValue}
                    onChange={(e) => handleSupplyFormChange('totalValue', e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    placeholder="5,000"
                    error={!!supplyFormError && supplyFormError.includes('Total value')}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small" error={!!supplyFormError && supplyFormError.includes('Category')}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={supplyFormData.category}
                      onChange={(e) => handleSupplyFormChange('category', e.target.value)}
                      label="Category"
                    >
                      {SUPPLY_CATEGORIES.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Custom Category Field - Only show when Other is selected */}
                {supplyFormData.category === 'Other' && (
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      value={supplyFormData.customCategory}
                      onChange={(e) => handleSupplyFormChange('customCategory', e.target.value)}
                      fullWidth
                      size="small"
                      label="Custom Category"
                      placeholder="e.g., Custom Equipment"
                      error={!!supplyFormError && supplyFormError.includes('Custom category')}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="contained"
                    onClick={handleAddSupply}
                    fullWidth
                    startIcon={<AddIcon />}
                    disabled={!supplyFormData.title || !supplyFormData.description || !supplyFormData.totalValue || !supplyFormData.category || (supplyFormData.category === 'Other' && !supplyFormData.customCategory)}
                  >
                    Add Supply
                  </Button>
                </Grid>
              </Grid>
              {supplyFormError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {supplyFormError}
                </Alert>
              )}
            </Box>
          </Card>

          {/* Supply List */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Supply Expenses
                  </Typography>
                  <Chip 
                    label={`${supplies.length} supply${supplies.length !== 1 ? 's' : ''}`} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Applied: {formatCurrency(yearTotals.totalAppliedSupplyAmounts || 0)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 2 }}>
              {supplies.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CalculateIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Supplies Added
                  </Typography>
                  <Typography color="text.secondary">
                    Use the quick entry form above to add your first supply.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {supplies.map((supply) => (
                    <Box
                      key={supply.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: supply.isActive ? 'background.paper' : 'grey.50',
                        opacity: supply.isActive ? 1 : 0.7,
                      }}
                    >
                      {/* Supply Info */}
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {supply.title}
                            </Typography>
                            <Chip 
                              label={supply.category} 
                              size="small" 
                              color="info"
                              variant="outlined"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {supply.description}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Total Value */}
                      <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {formatCurrency(supply.totalValue)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Value
                        </Typography>
                      </Box>

                      {/* Applied Percentage & Amount */}
                      <Box sx={{ display: 'flex', gap: 2, minWidth: 180, textAlign: 'right', mr: 2 }}>
                        {/* Applied Percentage */}
                        <Box sx={{ minWidth: 80 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {calculateSupplyAppliedPercentage(supply).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Applied %
                          </Typography>
                        </Box>
                        
                        {/* R&D Amount */}
                        <Box sx={{ minWidth: 90 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatCurrency(supply.totalValue * (calculateSupplyAppliedPercentage(supply) / 100))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            R&D Amount
                          </Typography>
                        </Box>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={supply.isLocked ? 'Unlock supply' : 'Lock supply'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleSupplyLock(supply)}
                            color={supply.isLocked ? 'warning' : 'default'}
                          >
                            {supply.isLocked ? <LockIcon /> : <UnlockIcon />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Configure applied percentage">
                          <span>
                            <IconButton 
                              size="small" 
                              disabled={supply.isLocked}
                              onClick={() => handleOpenSupplyConfigureModal(supply)}
                            >
                              <SettingsIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        <Tooltip title={supply.isActive ? 'Deactivate supply' : 'Activate supply'}>
                          <span>
                            <Switch
                              checked={supply.isActive}
                              onChange={() => handleToggleSupplyActive(supply)}
                              size="small"
                              disabled={supply.isLocked}
                            />
                          </span>
                        </Tooltip>
                        
                        <Tooltip title="Delete supply">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSupply(supply.id)}
                              color="error"
                              disabled={supply.isLocked}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Card>
        </Box>
      )}

      {/* Employee Configure Modal */}
      <Dialog
        open={configureModalOpen}
        onClose={handleCloseConfigureModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
          <Box sx={{ pr: 6 }}>
            <Typography variant="h5" component="div">
              Configure Applied Percentage
            </Typography>
            {selectedEmployeeForConfig && (
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {selectedEmployeeForConfig.firstName} {selectedEmployeeForConfig.lastName} - {getRoleName(selectedEmployeeForConfig.roleId, selectedEmployeeForConfig.customRoleName)}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleCloseConfigureModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedEmployeeForConfig && (
            <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
              {/* Practice Percentage Breakdown */}
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Practice Percentage Breakdown
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Practice Distribution
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {(() => {
                        const activities = getEmployeeActivities(selectedEmployeeForConfig);
                        const totalPractice = activities.reduce((sum, activity) => {
                          return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                        }, 0);
                        const isOverLimit = totalPractice > 100;
                        
                        return (
                          <>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                color: isOverLimit ? 'error.main' : totalPractice === 100 ? 'success.main' : 'text.primary'
                              }}
                            >
                              {totalPractice.toFixed(1)}% Total
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ({activities.length} Activities)
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </Box>
                  
                  {(() => {
                    const activities = getEmployeeActivities(selectedEmployeeForConfig);
                    const totalPractice = activities.reduce((sum, activity) => {
                      return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                    }, 0);
                    
                    if (totalPractice > 100) {
                      return (
                        <Box sx={{ 
                          mb: 2, 
                          p: 1.5, 
                          bgcolor: 'error.light', 
                          borderRadius: 1, 
                          border: '1px solid',
                          borderColor: 'error.main'
                        }}>
                          <Typography variant="caption" sx={{ color: 'error.dark', fontWeight: 600 }}>
                            ⚠️ Total exceeds 100% by {(totalPractice - 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'error.dark', display: 'block' }}>
                            Adjust practice percentages to total 100% or less.
                          </Typography>
                        </Box>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Practice Percentage Progress Bar */}
                  <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 2 }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%',
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      {(() => {
                        const activities = getEmployeeActivities(selectedEmployeeForConfig);
                        const totalPractice = activities.reduce((sum, activity) => {
                          return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                        }, 0);
                        
                        let currentLeft = 0;
                        
                        return activities.map((activity, idx) => {
                          const percentage = employeePracticePercentages[activity.name] || activity.currentPracticePercent;
                          // Calculate proportional width - each activity's share of the total bar (100%)
                          const width = percentage;
                          const color = getActivityColor(activity.name, getEmployeeActivities(selectedEmployeeForConfig));
                          
                          if (percentage <= 0) return null;
                          
                          const segment = (
                            <Box
                              key={activity.name}
                              sx={{
                                position: 'absolute',
                                left: `${currentLeft}%`,
                                width: `${width}%`,
                                height: '100%',
                                bgcolor: color,
                                borderRight: currentLeft + width < Math.min(totalPractice, 100) ? '1px solid white' : 'none'
                              }}
                            />
                          );
                          
                          currentLeft += width;
                          return segment;
                        });
                      })()}
                      
                      {/* Non-R&D Section */}
                      {(() => {
                        const activities = getEmployeeActivities(selectedEmployeeForConfig);
                        const totalPractice = activities.reduce((sum, activity) => {
                          return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                        }, 0);
                        const nonRDPercent = Math.max(0, 100 - totalPractice);
                        
                        if (nonRDPercent > 0) {
                          return (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: `${Math.min(totalPractice, 100)}%`,
                                width: `${nonRDPercent}%`,
                                height: '100%',
                                bgcolor: 'grey.400',
                                borderLeft: totalPractice > 0 ? '1px solid white' : 'none'
                              }}
                            />
                          );
                        }
                        return null;
                      })()}
                    </Box>
                    
                    {/* Border overlay with overflow indicator */}
                    {(() => {
                      const activities = getEmployeeActivities(selectedEmployeeForConfig);
                      const totalPractice = activities.reduce((sum, activity) => {
                        return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                      }, 0);
                      const isOverLimit = totalPractice > 100;
                      
                      return (
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%',
                          border: '2px solid',
                          borderColor: isOverLimit ? 'error.main' : 'divider',
                          borderRadius: 1,
                          pointerEvents: 'none',
                          ...(isOverLimit && {
                            boxShadow: '0 0 0 2px rgba(211, 47, 47, 0.2)'
                          })
                        }} />
                      );
                    })()}
                  </Box>
                  
                  {/* Practice Percentage Labels */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    {getEmployeeActivities(selectedEmployeeForConfig).map((activity, idx) => (
                      <Box key={activity.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: getActivityColor(activity.name, getEmployeeActivities(selectedEmployeeForConfig)),
                            borderRadius: '50%'
                          }}
                        />
                        <Typography variant="caption">
                          {activity.name}: {(employeePracticePercentages[activity.name] || activity.currentPracticePercent).toFixed(1)}%
                        </Typography>
                      </Box>
                    ))}
                    {(() => {
                      const activities = getEmployeeActivities(selectedEmployeeForConfig);
                      const totalPractice = activities.reduce((sum, activity) => {
                        return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                      }, 0);
                      const nonRDPercent = Math.max(0, 100 - totalPractice);
                      if (nonRDPercent > 0) {
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                bgcolor: 'grey.400',
                                borderRadius: '50%'
                              }}
                            />
                            <Typography variant="caption">
                              Non-R&D: {nonRDPercent.toFixed(1)}%
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                  </Box>
                </Box>
              </Box>

              {/* Applied Percentage Breakdown */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Applied Percentage Breakdown
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {(() => {
                      if (!selectedEmployeeForConfig) return "0.0";
                      
                      // REAL-TIME CALCULATION: Use the actual calculation function to get live updates including time percentages
                      const appliedPercentage = calculateEmployeeAppliedPercentage(
                        selectedEmployeeForConfig, 
                        getEmployeeActivities(selectedEmployeeForConfig)
                      );
                      
                      return appliedPercentage.toFixed(1);
                    })()}%
                  </Typography>
                </Box>

                {/* Applied Percentage Progress Bar */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Applied Distribution by Activity
                    </Typography>
                    <Chip 
                      label={`${getEmployeeActivities(selectedEmployeeForConfig).length} Activities`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                  
                  <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%',
                      bgcolor: 'grey.100'
                    }}>
                      {(() => {
                        const activities = getEmployeeActivities(selectedEmployeeForConfig);
                        let currentLeft = 0;
                        
                        // Calculate individual contributions using the full QRA formula
                        const activityContributions = activities.map(activity => {
                          const contributedApplied = calculateActivityAppliedPercentage(activity);
                          return { activity, contributedApplied };
                        });
                        
                        const totalApplied = activityContributions.reduce((total, item) => total + item.contributedApplied, 0);
                        
                        return activityContributions.map((item, idx) => {
                          const { activity, contributedApplied } = item;
                          const width = totalApplied > 0 ? (contributedApplied / totalApplied) * 100 : 0;
                          const activityColor = getActivityColor(activity.name, activities);
                          
                          if (width <= 0) return null;
                          
                          const segment = (
                            <Box
                              key={activity.name}
                              sx={{
                                position: 'absolute',
                                left: `${currentLeft}%`,
                                width: `${width}%`,
                                height: '100%',
                                backgroundColor: activityColor,
                                borderRight: currentLeft + width < 100 ? '2px solid white' : 'none',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  filter: 'brightness(1.1)'
                                }
                              }}
                              title={`${activity.name}: ${contributedApplied.toFixed(1)}%`}
                            />
                          );
                          
                          currentLeft += width;
                          return segment;
                        });
                      })()}
                    </Box>
                  </Box>
                  
                  {/* Applied Percentage Labels */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {(() => {
                      const activities = getEmployeeActivities(selectedEmployeeForConfig);
                      
                      // Calculate contributions using the full QRA formula
                      return activities.map((activity, idx) => {
                        const contributedApplied = calculateActivityAppliedPercentage(activity);
                        
                        if (contributedApplied <= 0) return null;
                        
                        const activityColor = getActivityColor(activity.name, activities);
                      
                                              return (
                          <Chip
                            key={activity.name}
                            label={`${activity.name}: ${contributedApplied.toFixed(1)}%`}
                            size="small"
                            sx={{
                              bgcolor: activityColor + '20', // 20% opacity
                              color: activityColor,
                              border: `1px solid ${activityColor}`,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        );
                      });
                    })()}
                    </Box>
                </Box>
              </Box>



              {/* Activities and Subcomponents Configuration */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Activity Configuration
                  </Typography>
                  
                  {getEmployeeActivities(selectedEmployeeForConfig).map((activity, activityIdx) => {
                    const qraData = getQRAData(activity.name);
                    const subcomponents = qraData?.selectedSubcomponents || {};
                    const rdSubcomponents = Object.entries(subcomponents).filter(([_, sub]) => sub && !sub.isNonRD);
                    
                    return (
                      <Card key={activity.name} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {activity.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Applied Percentage: {calculateActivityAppliedPercentage(activity).toFixed(1)}%
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 2 }}>
                          {/* Practice Percentage Slider */}
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                              Practice Percentage
                            </Typography>
                            <Slider
                              value={employeePracticePercentages[activity.name] !== undefined 
                                ? employeePracticePercentages[activity.name] 
                                : activity.currentPracticePercent}
                              onChange={(_, value) => {
                                const newValue = value as number;
                                
                                // Calculate what the total would be with this change
                                const activities = getEmployeeActivities(selectedEmployeeForConfig);
                                const otherActivitiesTotal = activities.reduce((sum, act) => {
                                  if (act.name === activity.name) return sum;
                                  return sum + (employeePracticePercentages[act.name] !== undefined 
                                    ? employeePracticePercentages[act.name] 
                                    : act.currentPracticePercent);
                                }, 0);
                                
                                // Prevent exceeding 100% total practice percentage
                                const maxAllowed = 100 - otherActivitiesTotal;
                                const constrainedValue = Math.min(newValue, maxAllowed);
                                
                                if (constrainedValue !== newValue) {
                                  console.warn(`Practice percentage for ${activity.name} limited to ${constrainedValue}% to stay within 100% total`);
                                }
                                
                                setEmployeePracticePercentages(prev => ({
                                  ...prev,
                                  [activity.name]: constrainedValue
                                }));
                              }}
                              min={0}
                              max={100}
                              step={0.1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                              sx={{ 
                                mt: 1,
                                '& .MuiSlider-track': {
                                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                                },
                                '& .MuiSlider-thumb': {
                                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                                }
                              }}
                            />
                          </Box>

                          {/* Subcomponents Section */}
                          {rdSubcomponents.length > 0 ? (
                            <Box>
                              <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                                Subcomponents ({rdSubcomponents.length})
                              </Typography>
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Research Activity
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {activity.name}
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Subcomponents
                                  </Typography>
                                  
                                  {/* Subcomponent List with Time% Sliders */}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {rdSubcomponents.map(([subId, subConfig]) => (
                                      <Box key={subId} sx={{ 
                                        p: 2, 
                                        border: '1px solid', 
                                        borderColor: 'divider', 
                                        borderRadius: 1,
                                        bgcolor: 'background.paper'
                                      }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                          {subConfig.subcomponent}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                          Step: {subConfig.step} | Phase: {subConfig.phase}
                                        </Typography>
                                        
                                        {/* Time Percentage Slider */}
                                        <Box sx={{ mt: 2 }}>
                                          <Typography variant="caption" color="text.secondary" gutterBottom>
                                            Time % (Currently: {(employeeTimePercentages[activity.name]?.[subId] || subConfig.timePercent || 0).toFixed(1)}%)
                                          </Typography>
                                          <Slider
                                            value={employeeTimePercentages[activity.name]?.[subId] || subConfig.timePercent || 0}
                                            onChange={(_, value) => {
                                              setEmployeeTimePercentages(prev => ({
                                                ...prev,
                                                [activity.name]: {
                                                  ...prev[activity.name],
                                                  [subId]: value as number
                                                }
                                              }));
                                            }}
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                                            size="small"
                                            sx={{ mt: 1 }}
                                          />
                                        </Box>
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ 
                              p: 3, 
                              textAlign: 'center', 
                              bgcolor: 'grey.50', 
                              borderRadius: 1,
                              border: '1px dashed',
                              borderColor: 'grey.300'
                            }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                No QRA subcomponents found for "{activity.name}"
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                {hasAnyQRAData() 
                                  ? `QRA data exists for this business/year, but not for this specific activity.`
                                  : `No QRA data found for ${selectedYear}. Configure subcomponents in the Activities tab first.`
                                }
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Expected localStorage key: qra_{selectedBusinessId}_{selectedYear}_{activity.name}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseConfigureModal} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveEmployeeConfiguration} variant="contained">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contractor Configure Modal */}
      <Dialog
        open={contractorConfigureModalOpen}
        onClose={handleCloseContractorConfigureModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
          <Box sx={{ pr: 6 }}>
            <Typography variant="h5" component="div">
              Configure Applied Percentage (Contractor)
            </Typography>
            {selectedContractorForConfig && (
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {selectedContractorForConfig.contractorType === 'individual' 
                  ? `${selectedContractorForConfig.firstName} ${selectedContractorForConfig.lastName}` 
                  : selectedContractorForConfig.businessName} - {getRoleName(selectedContractorForConfig.roleId, selectedContractorForConfig.customRoleName)}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleCloseContractorConfigureModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedContractorForConfig && (
            <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
              {/* Practice Percentage Breakdown */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Practice Percentage Breakdown
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {(() => {
                      const activities = getContractorActivities(selectedContractorForConfig);
                      const totalPractice = activities.reduce((sum, activity) => {
                        return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                      }, 0);
                      return totalPractice.toFixed(1);
                    })()}%
                  </Typography>
                </Box>

                {/* Practice Percentage Progress Bar */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Practice Distribution by Activity
                    </Typography>
                    <Chip 
                      label={`${getContractorActivities(selectedContractorForConfig).length} Activities`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                  
                  {/* Practice Percentage Progress Bar */}
                  <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 2 }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%',
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      {(() => {
                        const activities = getContractorActivities(selectedContractorForConfig);
                        const totalPractice = activities.reduce((sum, activity) => {
                          return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                        }, 0);
                        
                        let currentLeft = 0;
                        
                        return activities.map((activity, idx) => {
                          const percentage = contractorPracticePercentages[activity.name] || activity.currentPracticePercent;
                          // Calculate proportional width - each activity's share of the total bar (100%)
                          const width = percentage;
                          const color = getActivityColor(activity.name, getContractorActivities(selectedContractorForConfig));
                          
                          if (percentage <= 0) return null;
                          
                          const segment = (
                            <Box
                              key={activity.name}
                              sx={{
                                position: 'absolute',
                                left: `${currentLeft}%`,
                                width: `${width}%`,
                                height: '100%',
                                bgcolor: color,
                                borderRight: currentLeft + width < Math.min(totalPractice, 100) ? '1px solid white' : 'none'
                              }}
                            />
                          );
                          
                          currentLeft += width;
                          return segment;
                        });
                      })()}
                      
                      {/* Non-R&D Section */}
                      {(() => {
                        const activities = getContractorActivities(selectedContractorForConfig);
                        const totalPractice = activities.reduce((sum, activity) => {
                          return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                        }, 0);
                        const nonRDPercent = Math.max(0, 100 - totalPractice);
                        
                        if (nonRDPercent > 0) {
                          return (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: `${Math.min(totalPractice, 100)}%`,
                                width: `${nonRDPercent}%`,
                                height: '100%',
                                bgcolor: 'grey.400',
                                borderLeft: totalPractice > 0 ? '1px solid white' : 'none'
                              }}
                            />
                          );
                        }
                        return null;
                      })()}
                    </Box>
                    
                    {/* Border overlay with overflow indicator */}
                    {(() => {
                      const activities = getContractorActivities(selectedContractorForConfig);
                      const totalPractice = activities.reduce((sum, activity) => {
                        return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                      }, 0);
                      const isOverLimit = totalPractice > 100;
                      
                      return (
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%',
                          border: '2px solid',
                          borderColor: isOverLimit ? 'error.main' : 'divider',
                          borderRadius: 1,
                          pointerEvents: 'none',
                          ...(isOverLimit && {
                            boxShadow: '0 0 0 2px rgba(211, 47, 47, 0.2)'
                          })
                        }} />
                      );
                    })()}
                  </Box>
                  
                  {/* Practice Percentage Labels */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    {getContractorActivities(selectedContractorForConfig).map((activity, idx) => (
                      <Box key={activity.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: getActivityColor(activity.name, getContractorActivities(selectedContractorForConfig)),
                            borderRadius: '50%'
                          }}
                        />
                        <Typography variant="caption">
                          {activity.name}: {(contractorPracticePercentages[activity.name] || activity.currentPracticePercent).toFixed(1)}%
                        </Typography>
                      </Box>
                    ))}
                    {(() => {
                      const activities = getContractorActivities(selectedContractorForConfig);
                      const totalPractice = activities.reduce((sum, activity) => {
                        return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                      }, 0);
                      const nonRDPercent = Math.max(0, 100 - totalPractice);
                      if (nonRDPercent > 0) {
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                bgcolor: 'grey.400',
                                borderRadius: '50%'
                              }}
                            />
                            <Typography variant="caption">
                              Non-R&D: {nonRDPercent.toFixed(1)}%
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                  </Box>
                </Box>
              </Box>

              {/* Applied Percentage Breakdown */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Applied Percentage Breakdown (65% Rule Applied)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {(() => {
                      if (!selectedContractorForConfig) return "0.0";
                      
                      // REAL-TIME CALCULATION: Use the actual calculation function to get live updates including time percentages
                      const appliedPercentage = calculateContractorAppliedPercentage(
                        selectedContractorForConfig, 
                        getContractorActivities(selectedContractorForConfig)
                      );
                      
                      return appliedPercentage.toFixed(1);
                    })()}%
                  </Typography>
                </Box>

                 {/* Applied Percentage Progress Bar */}
                 <Box sx={{ mb: 3 }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                     <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                       Applied Distribution by Activity
                     </Typography>
                     <Chip 
                       label={`${getContractorActivities(selectedContractorForConfig).length} Activities`}
                       size="small"
                       variant="outlined"
                       color="primary"
                     />
                   </Box>
                   
                   <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                     <Box sx={{ 
                       position: 'absolute', 
                       top: 0, 
                       left: 0, 
                       width: '100%', 
                       height: '100%',
                       bgcolor: 'grey.100'
                     }}>
                       {(() => {
                         const activities = getContractorActivities(selectedContractorForConfig);
                         let currentLeft = 0;
                         
                         // Calculate individual contributions using the full QRA formula
                         const activityContributions = activities.map(activity => {
                           const contributedApplied = calculateContractorActivityAppliedPercentage(activity);
                           return { activity, contributedApplied };
                         });
                         
                         const totalApplied = activityContributions.reduce((total, item) => total + item.contributedApplied, 0);
                         
                         return activityContributions.map((item, idx) => {
                           const { activity, contributedApplied } = item;
                           const width = totalApplied > 0 ? (contributedApplied / totalApplied) * 100 : 0;
                           const activityColor = getActivityColor(activity.name, activities);
                           
                           if (width <= 0) return null;
                           
                           const segment = (
                             <Box
                               key={activity.name}
                               sx={{
                                 position: 'absolute',
                                 left: `${currentLeft}%`,
                                 width: `${width}%`,
                                 height: '100%',
                                 backgroundColor: activityColor,
                                 borderRight: currentLeft + width < 100 ? '2px solid white' : 'none',
                                 transition: 'all 0.2s ease',
                                 '&:hover': {
                                   filter: 'brightness(1.1)'
                                 }
                               }}
                               title={`${activity.name}: ${contributedApplied.toFixed(1)}%`}
                             />
                           );
                           
                           currentLeft += width;
                           return segment;
                         });
                       })()}
                     </Box>
                   </Box>
                   
                   {/* Applied Percentage Labels */}
                   <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                     {(() => {
                       const activities = getContractorActivities(selectedContractorForConfig);
                       
                       // Calculate contributions using the full QRA formula
                       return activities.map((activity, idx) => {
                         const contributedApplied = calculateContractorActivityAppliedPercentage(activity);
                         
                         if (contributedApplied <= 0) return null;
                         
                         const activityColor = getActivityColor(activity.name, activities);
                       
                         return (
                           <Chip
                             key={activity.name}
                             label={`${activity.name}: ${contributedApplied.toFixed(1)}%`}
                             size="small"
                             sx={{
                               bgcolor: activityColor + '20', // 20% opacity
                               color: activityColor,
                               border: `1px solid ${activityColor}`,
                               fontWeight: 600,
                               fontSize: '0.75rem'
                             }}
                           />
                         );
                       });
                     })()}
                   </Box>
                 </Box>

                 {/* Practice Percentage Total Check */}
                 <Box sx={{ mb: 2 }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="body2" color="text.secondary">
                       Total Practice Distribution
                     </Typography>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       {(() => {
                         const activities = getContractorActivities(selectedContractorForConfig);
                         const totalPractice = activities.reduce((sum, activity) => {
                           return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                         }, 0);
                         const isOverLimit = totalPractice > 100;
                         
                         return (
                           <>
                             <Typography 
                               variant="body2" 
                               sx={{ 
                                 fontWeight: 600,
                                 color: isOverLimit ? 'error.main' : totalPractice === 100 ? 'success.main' : 'text.primary'
                               }}
                             >
                               {totalPractice.toFixed(1)}% Total
                             </Typography>
                             <Typography variant="body2" color="text.secondary">
                               ({activities.length} Activities)
                             </Typography>
                           </>
                         );
                       })()}
                     </Box>
                   </Box>
                   
                   {(() => {
                     const activities = getContractorActivities(selectedContractorForConfig);
                     const totalPractice = activities.reduce((sum, activity) => {
                       return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                     }, 0);
                     
                     if (totalPractice > 100) {
                       return (
                         <Box sx={{ 
                           mb: 2, 
                           p: 1.5, 
                           bgcolor: 'error.light', 
                           borderRadius: 1, 
                           border: '1px solid',
                           borderColor: 'error.main'
                         }}>
                           <Typography variant="caption" sx={{ color: 'error.dark', fontWeight: 600 }}>
                             ⚠️ Total exceeds 100% by {(totalPractice - 100).toFixed(1)}%
                           </Typography>
                           <Typography variant="caption" sx={{ color: 'error.dark', display: 'block' }}>
                             Adjust practice percentages to total 100% or less.
                           </Typography>
                         </Box>
                       );
                     }
                     return null;
                   })()}
                 </Box>
               </Box>

              {/* Activities and Subcomponents Configuration */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Activity Configuration
                  </Typography>
                  
                  {getContractorActivities(selectedContractorForConfig).map((activity, activityIdx) => {
                    const qraData = getQRAData(activity.name);
                    const subcomponents = qraData?.selectedSubcomponents || {};
                    const rdSubcomponents = Object.entries(subcomponents).filter(([_, sub]) => sub && !sub.isNonRD);
                    
                    return (
                      <Card key={activity.name} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {activity.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Applied Percentage: {calculateContractorActivityAppliedPercentage(activity).toFixed(1)}% (65% rule will be applied)
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 2 }}>
                          {/* Practice Percentage Slider */}
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                              Practice Percentage
                            </Typography>
                            <Slider
                              value={contractorPracticePercentages[activity.name] !== undefined 
                                ? contractorPracticePercentages[activity.name] 
                                : activity.currentPracticePercent}
                              onChange={(_, value) => {
                                const newValue = value as number;
                                
                                // Calculate what the total would be with this change
                                const activities = getContractorActivities(selectedContractorForConfig);
                                const otherActivitiesTotal = activities.reduce((sum, act) => {
                                  if (act.name === activity.name) return sum;
                                  return sum + (contractorPracticePercentages[act.name] !== undefined 
                                    ? contractorPracticePercentages[act.name] 
                                    : act.currentPracticePercent);
                                }, 0);
                                
                                // Prevent exceeding 100% total practice percentage
                                const maxAllowed = 100 - otherActivitiesTotal;
                                const constrainedValue = Math.min(newValue, maxAllowed);
                                
                                if (constrainedValue !== newValue) {
                                  console.warn(`Practice percentage for ${activity.name} limited to ${constrainedValue}% to stay within 100% total`);
                                }
                                
                                setContractorPracticePercentages(prev => ({
                                  ...prev,
                                  [activity.name]: constrainedValue
                                }));
                              }}
                              min={0}
                              max={100}
                              step={0.1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                              sx={{ 
                                mt: 1,
                                '& .MuiSlider-track': {
                                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                                },
                                '& .MuiSlider-thumb': {
                                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                                }
                              }}
                            />
                          </Box>

                          {/* Subcomponents Section */}
                          {rdSubcomponents.length > 0 ? (
                            <Box>
                              <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                                Subcomponents ({rdSubcomponents.length})
                              </Typography>
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Research Activity
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {activity.name}
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Subcomponents
                                  </Typography>
                                  
                                  {/* Subcomponent List with Time% Sliders */}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {rdSubcomponents.map(([subId, subConfig]) => (
                                      <Box key={subId} sx={{ 
                                        p: 2, 
                                        border: '1px solid', 
                                        borderColor: 'divider', 
                                        borderRadius: 1,
                                        bgcolor: 'background.paper'
                                      }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                          {subConfig.subcomponent}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                          Step: {subConfig.step} | Phase: {subConfig.phase}
                                        </Typography>
                                        
                                        {/* Time Percentage Slider */}
                                        <Box sx={{ mt: 2 }}>
                                          <Typography variant="caption" color="text.secondary" gutterBottom>
                                            Time % (Currently: {(contractorTimePercentages[activity.name]?.[subId] || subConfig.timePercent || 0).toFixed(1)}%)
                                          </Typography>
                                          <Slider
                                            value={contractorTimePercentages[activity.name]?.[subId] || subConfig.timePercent || 0}
                                            onChange={(_, value) => {
                                              setContractorTimePercentages(prev => ({
                                                ...prev,
                                                [activity.name]: {
                                                  ...prev[activity.name],
                                                  [subId]: value as number
                                                }
                                              }));
                                            }}
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                                            size="small"
                                            sx={{ mt: 1 }}
                                          />
                                        </Box>
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ 
                              p: 3, 
                              textAlign: 'center', 
                              bgcolor: 'grey.50', 
                              borderRadius: 1,
                              border: '1px dashed',
                              borderColor: 'grey.300'
                            }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                No QRA subcomponents found for "{activity.name}"
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                {hasAnyQRAData() 
                                  ? `QRA data exists for this business/year, but not for this specific activity.`
                                  : `No QRA data found for ${selectedYear}. Configure subcomponents in the Activities tab first.`
                                }
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Expected localStorage key: qra_{selectedBusinessId}_{selectedYear}_{activity.name}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseContractorConfigureModal} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveContractorConfiguration} variant="contained">
            Save Configuration (65% Applied)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supply Configure Modal */}
      <Dialog
        open={supplyConfigureModalOpen}
        onClose={handleCloseSupplyConfigureModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', position: 'relative' }}>
          <Box sx={{ pr: 6 }}>
            <Typography variant="h5" component="div">
              Configure Supply Allocation
            </Typography>
            {selectedSupplyForConfig && (
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {selectedSupplyForConfig.title} - {selectedSupplyForConfig.category}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleCloseSupplyConfigureModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedSupplyForConfig && (
            <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
              {/* Applied Percentage Summary */}
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Applied Percentage Breakdown
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {(() => {
                        const totalApplied = Object.values(supplyActivityPercentages).reduce((sum, percentage) => sum + percentage, 0);
                        return totalApplied.toFixed(1);
                      })()}%
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(selectedSupplyForConfig.totalValue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Applied Amount
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {(() => {
                        const totalApplied = Object.values(supplyActivityPercentages).reduce((sum, percentage) => sum + percentage, 0);
                        return formatCurrency(selectedSupplyForConfig.totalValue * (totalApplied / 100));
                      })()}
                    </Typography>
                  </Box>
                </Box>

                {/* Validation Warning */}
                {(() => {
                  const totalApplied = Object.values(supplyActivityPercentages).reduce((sum, percentage) => sum + percentage, 0);
                  
                  if (totalApplied > 100) {
                    return (
                      <Box sx={{ 
                        mb: 2, 
                        p: 1.5, 
                        bgcolor: 'error.light', 
                        borderRadius: 1, 
                        border: '1px solid',
                        borderColor: 'error.main'
                      }}>
                        <Typography variant="caption" sx={{ color: 'error.dark', fontWeight: 600 }}>
                          ⚠️ Total exceeds 100% by {(totalApplied - 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'error.dark', display: 'block' }}>
                          Adjust activity percentages to total 100% or less.
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                })()}

                {/* Progress Bar */}
                <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 2 }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%',
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    {(() => {
                      const activities = getSupplyActivities();
                      let currentLeft = 0;
                      
                      return activities.map((activity, idx) => {
                        const percentage = supplyActivityPercentages[activity.name] || 0;
                        const color = getActivityColor(activity.name, activities);
                        
                        if (percentage <= 0) return null;
                        
                        const segment = (
                          <Box
                            key={activity.name}
                            sx={{
                              position: 'absolute',
                              left: `${currentLeft}%`,
                              width: `${percentage}%`,
                              height: '100%',
                              bgcolor: color,
                              borderRight: currentLeft + percentage < 100 ? '1px solid white' : 'none'
                            }}
                          />
                        );
                        
                        currentLeft += percentage;
                        return segment;
                      });
                    })()}
                  </Box>
                </Box>

                {/* Activity Contribution Chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {getSupplyActivities().map((activity) => {
                    const percentage = supplyActivityPercentages[activity.name] || 0;
                    const selectedSubs = selectedSubcomponents[activity.name] || [];
                    if (percentage <= 0) return null;
                    
                    return (
                      <Tooltip 
                        key={activity.name}
                        title={
                          selectedSubs.length > 0 
                            ? `${selectedSubs.length} subcomponent${selectedSubs.length !== 1 ? 's' : ''} selected`
                            : 'No subcomponents selected'
                        }
                      >
                        <Chip
                          label={`${activity.name}: ${percentage.toFixed(1)}% ${selectedSubs.length > 0 ? `(${selectedSubs.length} sub${selectedSubs.length !== 1 ? 's' : ''})` : '(0 subs)'}`}
                          size="small"
                          sx={{
                            bgcolor: getActivityColor(activity.name, getSupplyActivities()),
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>

              {/* Activities Configuration */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Activity Allocation
                  </Typography>
                  
                  {getSupplyActivities().map((activity) => {
                    const subcomponents = getSupplyActivitySubcomponents(activity.name);
                    
                    return (
                      <Card key={activity.name} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {activity.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Allocation: {(supplyActivityPercentages[activity.name] || 0).toFixed(1)}%
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 2 }}>
                          {/* Activity Percentage Slider */}
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                              Activity Usage Percentage
                            </Typography>
                            <Slider
                              value={supplyActivityPercentages[activity.name] || 0}
                              onChange={(_, value) => {
                                const newValue = value as number;
                                
                                // Calculate what the total would be with this change
                                const activities = getSupplyActivities();
                                const otherActivitiesTotal = activities.reduce((sum, act) => {
                                  if (act.name === activity.name) return sum;
                                  return sum + (supplyActivityPercentages[act.name] || 0);
                                }, 0);
                                
                                // Prevent exceeding 100% total
                                const maxAllowed = 100 - otherActivitiesTotal;
                                const constrainedValue = Math.min(newValue, maxAllowed);
                                
                                if (constrainedValue !== newValue) {
                                  console.warn(`Activity percentage for ${activity.name} limited to ${constrainedValue}% to stay within 100% total`);
                                }
                                
                                handleActivityPercentageChange(activity.name, constrainedValue);
                              }}
                              min={0}
                              max={100}
                              step={0.1}
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                              sx={{ 
                                mt: 1,
                                '& .MuiSlider-track': {
                                  background: 'linear-gradient(90deg, #9c27b0 0%, #ba68c8 100%)'
                                },
                                '& .MuiSlider-thumb': {
                                  boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)'
                                }
                              }}
                            />
                          </Box>

                          {/* Subcomponents Selection */}
                          {subcomponents.length > 0 ? (
                            <Box>
                              <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                                Select Subcomponents ({selectedSubcomponents[activity.name]?.length || 0} of {subcomponents.length} selected)
                              </Typography>
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, mb: 2 }}>
                                {subcomponents.map((subcomponent) => {
                                  const isSelected = isSubcomponentSelected(activity.name, subcomponent.id);
                                  const percentage = getSubcomponentPercentage(activity.name, subcomponent.id);
                                  
                                  return (
                                    <Box 
                                      key={subcomponent.id} 
                                      onClick={() => handleSubcomponentToggle(activity.name, subcomponent.id)}
                                      sx={{ 
                                        p: 2, 
                                        border: '2px solid', 
                                        borderColor: isSelected ? 'secondary.main' : 'divider', 
                                        borderRadius: 1,
                                        bgcolor: isSelected ? 'secondary.light' : 'background.paper',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                          borderColor: isSelected ? 'secondary.dark' : 'secondary.light',
                                          bgcolor: isSelected ? 'secondary.main' : 'secondary.light',
                                          transform: 'translateY(-2px)',
                                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                        }
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="body2" sx={{ 
                                          fontWeight: 600, 
                                          color: isSelected ? 'white' : 'text.primary',
                                          flex: 1
                                        }}>
                                          {subcomponent.name}
                                        </Typography>
                                        {isSelected && (
                                          <Chip 
                                            label={`${percentage.toFixed(1)}%`}
                                            size="small"
                                            sx={{ 
                                              bgcolor: 'white', 
                                              color: 'secondary.main',
                                              fontWeight: 600,
                                              ml: 1
                                            }}
                                          />
                                        )}
                                      </Box>
                                      
                                      <Typography variant="caption" sx={{ 
                                        color: isSelected ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                                        display: 'block',
                                        mb: 1
                                      }}>
                                        Step: {subcomponent.step} | Phase: {subcomponent.phase}
                                      </Typography>
                                      
                                      {isSelected && (
                                        <Box sx={{ 
                                          mt: 1, 
                                          p: 1, 
                                          bgcolor: 'rgba(255,255,255,0.2)', 
                                          borderRadius: 0.5 
                                        }}>
                                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                            ✓ Selected - {percentage.toFixed(1)}% of supply allocated
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  );
                                })}
                              </Box>
                              
                              {selectedSubcomponents[activity.name]?.length > 0 ? (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                  <Typography variant="caption" color="success.dark" sx={{ fontWeight: 600 }}>
                                    ✓ {(supplyActivityPercentages[activity.name] || 0).toFixed(1)}% distributed equally across {selectedSubcomponents[activity.name].length} subcomponent{selectedSubcomponents[activity.name].length !== 1 ? 's' : ''}
                                  </Typography>
                                  <Typography variant="caption" color="success.dark" sx={{ display: 'block', mt: 0.5 }}>
                                    Each subcomponent: {((supplyActivityPercentages[activity.name] || 0) / selectedSubcomponents[activity.name].length).toFixed(1)}%
                                  </Typography>
                                </Box>
                              ) : (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                                  <Typography variant="caption" color="warning.dark">
                                    ⚠️ Click on subcomponents above to select which ones this supply applies to. 
                                    The activity percentage will be distributed equally across selected subcomponents.
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ 
                              p: 3, 
                              textAlign: 'center', 
                              bgcolor: 'grey.50', 
                              borderRadius: 1,
                              border: '1px dashed',
                              borderColor: 'grey.300'
                            }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                No QRA subcomponents found for "{activity.name}"
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Configure subcomponents in the Activities tab first.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseSupplyConfigureModal} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveSupplyConfiguration} variant="contained" color="secondary">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 