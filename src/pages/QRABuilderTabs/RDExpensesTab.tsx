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
import { SubcomponentSelectionData } from '../../types/QRABuilderInterfaces';

// Service Imports
import { ExpensesService } from '../../services/expensesService';
import { CSVExportService } from '../../services/csvExportService';
import { approvalsService, TabApproval } from '../../services/approvals';
import { QRADataExportService } from '../../services/qraDataExportService';
import { loadQRADataFromSupabase } from '../../services/qraDataService';
import { QRABuilderService } from '../../services/qrabuilderService';

// Util Imports
import { formatCurrencyInput, parseCurrencyInput, formatCurrency } from '../../utils/currencyFormatting';
import { flattenAllRoles, getRoleName, calculateRoleAppliedPercentages } from './RDExpensesTab/utils/roleHelpers';

// Hook Imports
import { CreditCalculatorInput, useFederalCreditCalculations } from '../../components/expenses/credit-calculator/useFederalCreditCalculations';

// Component Imports
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
import { ExpenseSummary } from '../../components/expenses/shared/ExpenseSummary';
import { ExpenseAnalytics, ComplianceReport, QREDataExportPanel } from '../../components/expenses/reports';

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
  
  // Approval state
  const [approvalData, setApprovalData] = useState<TabApproval | null>(null);
  
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

  // Add state for QRA data map
  const [qraDataMap, setQraDataMap] = useState<Record<string, SubcomponentSelectionData>>({});

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
    
    // Recalculate appliedAmount for each contractor to ensure it matches current QRA data
    const updatedContractors = contractorData.map(contractor => {
      // Get activities for this contractor
      const activities = getContractorActivities(contractor);
      
      // Calculate the applied percentage based on current QRA data and saved custom configuration
      const appliedPercentage = calculateContractorAppliedPercentage(
        contractor, 
        activities,
        contractor.customPracticePercentages, // Use saved custom practice percentages
        contractor.customTimePercentages      // Use saved custom time percentages
      );
      
      // Calculate the applied amount with 65% rule
      const appliedAmount = contractor.totalAmount * (appliedPercentage / 100) * 0.65;
      
      // Debug logging
      console.log('[Contractor Debug]', {
        contractor: contractor.firstName || contractor.businessName || contractor.id,
        activities,
        customPracticePercentages: contractor.customPracticePercentages,
        customTimePercentages: contractor.customTimePercentages,
        appliedPercentage,
        appliedAmount
      });
      
      return {
        ...contractor,
        appliedPercentage,
        appliedAmount
      };
    });
    
    setContractors(updatedContractors);
  }, [selectedBusinessId, selectedYear]);

  const loadSupplies = useCallback(() => {
    const supplyData = ExpensesService.getSupplies(selectedBusinessId, selectedYear);
    
    // Recalculate appliedAmount for each supply to ensure it matches current configuration
    const updatedSupplies = supplyData.map(supply => {
      // Calculate the applied percentage based on saved configuration
      const appliedPercentage = calculateSupplyAppliedPercentage(supply);
      
      // Calculate the applied amount
      const appliedAmount = supply.totalValue * (appliedPercentage / 100);
      
      return {
        ...supply,
        appliedPercentage,
        appliedAmount
      };
    });
    
    setSupplies(updatedSupplies);
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

  // Load approval state from storage on mount
  useEffect(() => {
    const stored = approvalsService.getApprovalData('expenses', selectedYear);
    if (stored && stored.approvalData) {
      setApprovalData(stored.approvalData);
    } else {
      setApprovalData(null);
    }
  }, [selectedYear]);

  // Handle approval
  const handleApprove = async () => {
    try {
      const approval: TabApproval = {
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1', // In a real app, this would come from the request
        data: {
          employees: employees,
          contractors: contractors,
          supplies: supplies,
          roles: roles,
          availableYears: availableYears
        }
      };
      
      approvalsService.recordApproval('expenses', approval, selectedYear);
      setApprovalData(approval);
    } catch (error) {
      console.error('Error approving expenses:', error);
    }
  };

  // Handle unapproval
  const handleUnapprove = () => {
    approvalsService.removeApproval('expenses', selectedYear);
    setApprovalData(null);
  };

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
    if (selectedSupplyForConfig) {
      // Calculate total applied percentage from all subcomponents
      const totalAppliedPercentage = Object.values(supplySubcomponentPercentages).reduce((activitySum, subcomponents) => {
        return activitySum + Object.values(subcomponents).reduce((subSum, percentage) => subSum + percentage, 0);
      }, 0);
      
      // Save the supply configuration
      const updatedSupply: Supply = {
        ...selectedSupplyForConfig,
        customActivityPercentages: supplyActivityPercentages,
        customSubcomponentPercentages: supplySubcomponentPercentages,
        selectedSubcomponents: selectedSubcomponents,
        appliedPercentage: totalAppliedPercentage,
        appliedAmount: selectedSupplyForConfig.totalValue * (totalAppliedPercentage / 100),
        updatedAt: new Date().toISOString()
      };

      // Update the supply in the service
      ExpensesService.saveSupply(selectedBusinessId, selectedYear, updatedSupply);

      // Update the local state
      setSupplies(prev => prev.map(s => 
        s.id === selectedSupplyForConfig.id ? updatedSupply : s
      ));

      // Close the modal
      handleCloseSupplyConfigureModal();
    }
  };

  // Update handlers for configure modals
  const handleEmployeeUpdate = (updatedEmployee: Employee) => {
    // Update the employee in the service
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, updatedEmployee);

    // Update the local state
    setEmployees(prev => prev.map(e => 
      e.id === updatedEmployee.id ? updatedEmployee : e
    ));

    // Update the selected employee for config if it's the same one
    if (selectedEmployeeForConfig?.id === updatedEmployee.id) {
      setSelectedEmployeeForConfig(updatedEmployee);
    }
  };

  const handleContractorUpdate = (updatedContractor: Contractor) => {
    // Update the contractor in the service
    ExpensesService.saveContractor(selectedBusinessId, selectedYear, updatedContractor);

    // Update the local state
    setContractors(prev => prev.map(c => 
      c.id === updatedContractor.id ? updatedContractor : c
    ));

    // Update the selected contractor for config if it's the same one
    if (selectedContractorForConfig?.id === updatedContractor.id) {
      setSelectedContractorForConfig(updatedContractor);
    }
  };

  const handleSupplyUpdate = (updatedSupply: Supply) => {
    // Update the supply in the service
    ExpensesService.saveSupply(selectedBusinessId, selectedYear, updatedSupply);

    // Update the local state
    setSupplies(prev => prev.map(s => 
      s.id === updatedSupply.id ? updatedSupply : s
    ));

    // Update the selected supply for config if it's the same one
    if (selectedSupplyForConfig?.id === updatedSupply.id) {
      setSelectedSupplyForConfig(updatedSupply);
    }
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
    const qraData = getQRADataSync(activityName);
    if (!qraData || !qraData.selectedSubcomponents) {
      return [];
    }
    
    return Object.entries(qraData.selectedSubcomponents).map(([subcomponentId, subcomponent]: [string, any]) => ({
      id: subcomponentId,
      name: subcomponent.subcomponent,
      phase: subcomponent.phase,
      step: subcomponent.step,
      timePercent: subcomponent.timePercent || 0,
      frequencyPercent: subcomponent.frequencyPercent || 0,
      yearPercent: subcomponent.yearPercent || 0,
      isNonRD: subcomponent.isNonRD || false
    }));
  };

  const calculateSupplyAppliedPercentage = (supply: Supply): number => {
    // Use the supply's saved configuration, not the modal state
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
  const getQRADataSync = (activityName: string): SubcomponentSelectionData | null => {
    // Get the business and find the activity by name to get its ID
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    // Find activity ID by name
    const activityEntry = Object.entries(activities).find(([id, activity]: [string, any]) => 
      activity.name === activityName
    );
    
    if (!activityEntry) {
      return null;
    }
    
    const activityId = activityEntry[0];
    
    // Get QRA data from the qraDataMap
    // The qraDataMap is loaded from QRABuilderService.getAllQRAData() which returns data with activityId as key
    const qraData = qraDataMap[activityId];
    
    console.log(`[getQRADataSync] Looking for activity: ${activityName} (ID: ${activityId})`);
    console.log(`[getQRADataSync] Found QRA data:`, qraData ? 'Yes' : 'No');
    
    if (qraData) {
      return qraData;
    }
    
    return null;
  };

  // Helper function to get applied percentage for an activity (matches Activities tab approach)
  const getAppliedPercentage = (activityName: string): number => {
    // Get the business and find the activity by name to get its ID
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    // Find activity ID by name
    const activityEntry = Object.entries(activities).find(([id, activity]: [string, any]) => 
      activity.name === activityName
    );
    
    if (!activityEntry) {
      console.warn(`Could not find activity with name: ${activityName}`);
      return 0;
    }
    
    const activityId = activityEntry[0];
    const qraData = qraDataMap[activityId];
    return qraData?.totalAppliedPercent || 0;
  };

  // Helper function to check if any QRA data exists for debugging
  const hasAnyQRAData = async (): Promise<boolean> => {
    try {
      const qraDataMap = await QRABuilderService.getAllQRAData(selectedBusinessId, selectedYear);
      const hasData = Object.keys(qraDataMap).length > 0;
      console.log(`[RDExpensesTab] QRA data check: ${hasData ? 'Found' : 'No'} QRA data for ${selectedYear}`);
      return hasData;
    } catch (error) {
      console.error('[RDExpensesTab] Error checking QRA data:', error);
      return false;
    }
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
      const qraData = getQRADataSync(activity.name);
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
    ExpensesService.saveEmployee(selectedBusinessId, selectedYear, updatedEmployee);
    
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
    // Clear previous state
    setContractorPracticePercentages({});
    setContractorTimePercentages({});
    setSelectedContractorForConfig(contractor);
    setContractorConfigureModalOpen(true);

    // Always build from current activities, using custom only if relevant
    const activities = getContractorActivities(contractor);
    const practicePercentages: Record<string, number> = {};
    const timePercentages: Record<string, Record<string, number>> = {};

    activities.forEach(activity => {
      // Use QRA data practicePercent as baseline, fallback to activity.practicePercent
      const qraData = getQRADataSync(activity.name);
      const baselinePracticePercent = qraData?.practicePercent ?? activity.currentPracticePercent ?? 0;
      const customPercent = contractor.customPracticePercentages?.[activity.name];
      practicePercentages[activity.name] = customPercent !== undefined
        ? customPercent
        : baselinePracticePercent;

      // Initialize time percentages for subcomponents from QRA data (if available)
      if (qraData && qraData.selectedSubcomponents) {
        timePercentages[activity.name] = {};
        Object.entries(qraData.selectedSubcomponents).forEach(([subId, subConfig]) => {
          if (subConfig && !subConfig.isNonRD) {
            timePercentages[activity.name][subId] =
              contractor.customTimePercentages?.[activity.name]?.[subId] !== undefined
                ? contractor.customTimePercentages[activity.name][subId]
                : (subConfig.timePercent || 0);
          }
        });
      }
    });

    setContractorPracticePercentages(practicePercentages);
    setContractorTimePercentages(timePercentages);
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
        getContractorActivities(selectedContractorForConfig),
        contractorPracticePercentages,
        contractorTimePercentages
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
        const qraData = getQRADataSync(activity.name);
        
        // Calculate applied percentage using the same approach as Activities tab
        const appliedPercent = getAppliedPercentage(activity.name);
        
        // Get practice percentage from QRA data or activity data
        let storedPracticePercent = qraData?.practicePercent ?? activity.practicePercent ?? 0;
        
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

  // Implement QRA calculation functions directly
  const calculateActivityAppliedPercentage = (
    activity: any,
    practicePercentages?: Record<string, number>,
    timePercentages?: Record<string, Record<string, number>>
  ): number => {
    const qraData = getQRADataSync(activity.name);
    
    if (qraData?.selectedSubcomponents) {
      // Calculate using FULL QRA FORMULA for each subcomponent
      let activityTotalApplied = 0;
      
      Object.entries(qraData.selectedSubcomponents).forEach(([subId, subConfig]) => {
        if (subConfig && !subConfig.isNonRD) {
          // Get practice percentage from modal state or fallback to activity data
          const practicePercent = practicePercentages?.[activity.name] ?? activity.currentPracticePercent ?? 0;
          
          // Get time percentage from modal state or fallback to QRA data
          const timePercent = timePercentages?.[activity.name]?.[subId] ?? subConfig.timePercent ?? 0;
          
          // Frequency and Year percentages from QRA data (these don't change in modal)
          const frequencyPercent = subConfig.frequencyPercent || 0;
          const yearPercent = subConfig.yearPercent || 0;
          
          // Apply the COMPLETE QRA FORMULA: (Practice × Time × Frequency × Year) / 1,000,000
          const subcomponentApplied = (practicePercent * timePercent * frequencyPercent * yearPercent) / 1000000;
          
          activityTotalApplied += subcomponentApplied;
        }
      });
      
      return activityTotalApplied;
    } else {
      // Fallback to the baseline applied percentage
      return qraData?.totalAppliedPercent || 0;
    }
  };

  const calculateEmployeeAppliedPercentage = (
    employee: any, 
    activities: any[],
    practicePercentages?: Record<string, number>,
    timePercentages?: Record<string, Record<string, number>>
  ): number => {
    if (!activities || activities.length === 0) {
      return 0;
    }

    let totalApplied = 0;
    
    activities.forEach(activity => {
      const contributedApplied = calculateActivityAppliedPercentage(activity, practicePercentages, timePercentages);
      totalApplied += contributedApplied;
    });
    
    return totalApplied;
  };

  const calculateContractorAppliedPercentage = (
    contractor: any, 
    activities: any[],
    practicePercentages?: Record<string, number>,
    timePercentages?: Record<string, Record<string, number>>
  ): number => {
    if (!activities || activities.length === 0) {
      return 0;
    }

    let totalApplied = 0;
    
    activities.forEach(activity => {
      const contributedApplied = calculateContractorActivityAppliedPercentage(activity, practicePercentages, timePercentages);
      totalApplied += contributedApplied;
    });
    
    return totalApplied;
  };

  // Helper function to calculate applied percentage for a single contractor activity
  const calculateContractorActivityAppliedPercentage = (
    activity: any, 
    practicePercentages?: Record<string, number>,
    timePercentages?: Record<string, Record<string, number>>
  ): number => {
    // Get QRA data for this activity
    const qraData = getQRADataSync(activity.name);
    
    if (qraData?.selectedSubcomponents) {
      // Calculate using FULL QRA FORMULA for each subcomponent
      let activityTotalApplied = 0;
      
      Object.entries(qraData.selectedSubcomponents).forEach(([subId, subConfig]) => {
        if (subConfig && !subConfig.isNonRD) {
          // Get practice percentage from modal state or fallback to activity data
          const practicePercent = practicePercentages?.[activity.name] ?? activity.currentPracticePercent ?? 0;
          
          // Get time percentage from modal state or fallback to QRA data
          const timePercent = timePercentages?.[activity.name]?.[subId] ?? subConfig.timePercent ?? 0;
          
          // Frequency and Year percentages from QRA data (these don't change in modal)
          const frequencyPercent = subConfig.frequencyPercent || 0;
          const yearPercent = subConfig.yearPercent || 0;
          
          // Apply the COMPLETE QRA FORMULA: (Practice × Time × Frequency × Year) / 1,000,000
          const subcomponentApplied = (practicePercent * timePercent * frequencyPercent * yearPercent) / 1000000;
          
          activityTotalApplied += subcomponentApplied;
        }
      });
      
      return activityTotalApplied;
    } else {
      // Fallback to the baseline applied percentage
      return qraData?.totalAppliedPercent || 0;
    }
  };

  // Helper function to get activities for an employee's role - loads from Activities tab data
  const getEmployeeActivities = (employee: Employee) => {
    // Get the business and year data from the current state
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    console.log(`[getEmployeeActivities] Processing employee: ${employee.firstName} ${employee.lastName} (Role: ${employee.roleId})`);
    console.log(`[getEmployeeActivities] Available activities:`, Object.keys(activities));
    console.log(`[getEmployeeActivities] QRA Data Map keys:`, Object.keys(qraDataMap));
    
    const employeeActivities: Array<{
      id: string;
      name: string;
      defaultPracticePercent: number;
      currentPracticePercent: number;
      appliedPercent: number;
      activityData: any;
    }> = [];
    
    // Get activities from the years JSONB column, and the QRA data is in qra_data JSONB
    Object.entries(activities).forEach(([activityId, activity]: [string, any]) => {
      // Include activity if:
      // 1. Employee has "Other" role (gets all activities at full percentages)
      // 2. Employee's role is specifically assigned to this activity
      const includeActivity = employee.roleId === OTHER_ROLE.id || 
        (activity.selectedRoles && activity.selectedRoles.includes(employee.roleId));
      
      if (includeActivity && activity.active !== false) {
        // Get QRA data for this activity from the qraDataMap
        // The qraDataMap is loaded from QRABuilderService.getAllQRAData() which returns data with activityId as key
        const qraData = qraDataMap[activityId];
        
        // Calculate applied percentage using the same approach as Activities tab
        const appliedPercent = qraData?.totalAppliedPercent || 0;
        
        // Get practice percentage from QRA data or activity data
        let storedPracticePercent = qraData?.practicePercent ?? activity.practicePercent ?? 0;
        
        // For "Other" role, use 100% practice percentage (full activity percentage)
        if (employee.roleId === OTHER_ROLE.id) {
          storedPracticePercent = 100;
        }
        
        console.log(`Activity ${activity.name} (${activityId}):`, {
          employeeRole: employee.roleId,
          isOtherRole: employee.roleId === OTHER_ROLE.id,
          storedPracticePercent,
          qraData: qraData ? 'Found' : 'Not found',
          appliedPercent,
          includeActivity,
          qraDataKey: activityId
        });
        
        employeeActivities.push({
          id: activityId,
          name: activity.name,
          defaultPracticePercent: storedPracticePercent,
          currentPracticePercent: storedPracticePercent,
          appliedPercent: appliedPercent,
          activityData: activity
        });
      }
    });
    
    console.log('Final employee activities:', employeeActivities);
    return employeeActivities;
  };

  // Add effect to reload business object and QRA data map when Activities tab is approved or changed
  useEffect(() => {
    const loadQRADataMap = async () => {
      if (selectedBusinessId && selectedYear) {
        try {
          const data = await QRABuilderService.getAllQRAData(selectedBusinessId, selectedYear);
          setQraDataMap(data);
        } catch (error) {
          console.error('Error loading QRA data map:', error);
          setQraDataMap({});
        }
      }
    };

    // Reload QRA data map when Activities tab is approved or businesses object changes
    loadQRADataMap();
  }, [selectedBusinessId, selectedYear, isActivitiesApproved, businesses]);

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
            {isExpensesApproved && approvalData && (
              <Box sx={{ ml: 3, fontSize: 14 }}>
                Approved: {new Date(approvalData.timestamp).toLocaleString()} (IP: {approvalData.ipAddress})
              </Box>
            )}
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
            {isExpensesApproved ? (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<UnlockIcon />}
                onClick={handleUnapprove}
              >
                Unapprove
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<LockIcon />}
                onClick={handleApprove}
                sx={{ 
                  bgcolor: 'success.light', 
                  color: 'success.contrastText', 
                  '&:hover': { bgcolor: 'success.main' } 
                }}
              >
                Approve
              </Button>
          )}
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
            calculateContractorAppliedPercentage={(contractor, activities) => calculateContractorAppliedPercentage(contractor, activities)}
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
          <ExpenseAnalytics
            employees={employees}
            contractors={contractors}
            supplies={supplies}
            selectedYear={selectedYear}
            selectedBusinessId={selectedBusinessId}
            businessType={selectedBusiness?.entityType === 'C-Corporation' ? 'C-Corp' : 'Pass-Through'}
            stateCode={selectedBusiness?.entityState}
            employeeCount={employees.filter(emp => emp.isActive).length}
            grossReceipts={selectedBusiness?.financialHistory?.find(f => f.year === selectedYear)?.grossReceipts}
            businesses={businesses}
          />
          
          <ComplianceReport
            employees={employees}
            contractors={contractors}
            supplies={supplies}
            selectedYear={selectedYear}
            selectedBusinessId={selectedBusinessId}
            businessType={selectedBusiness?.entityType === 'C-Corporation' ? 'C-Corp' : 'Pass-Through'}
            stateCode={selectedBusiness?.entityState}
            employeeCount={employees.filter(emp => emp.isActive).length}
            grossReceipts={selectedBusiness?.financialHistory?.find(f => f.year === selectedYear)?.grossReceipts}
            businesses={businesses}
          />
          <QREDataExportPanel
            selectedYear={selectedYear}
            selectedBusinessId={selectedBusinessId}
            businessName={selectedBusiness?.businessName || ''}
            employees={employees}
            contractors={contractors}
            supplies={supplies}
            activities={researchActivities}
            qraDataMap={qraDataMap}
            isExpensesApproved={isExpensesApproved}
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
        getQRAData={getQRADataSync}
        getActivityColor={getActivityColor}
        hasAnyQRAData={hasAnyQRAData}
        selectedBusinessId={selectedBusinessId}
        selectedYear={selectedYear}
        onEmployeeUpdate={handleEmployeeUpdate}
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
        getQRAData={getQRADataSync}
        hasAnyQRAData={hasAnyQRAData}
        getActivityColor={getActivityColor}
        roles={roles}
        selectedYear={selectedYear}
        selectedBusinessId={selectedBusinessId}
        onContractorUpdate={handleContractorUpdate}
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
        onSupplyUpdate={handleSupplyUpdate}
      />
    </Box>
  );
} 