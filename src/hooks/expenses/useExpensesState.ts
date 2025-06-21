import { useState, useCallback, useMemo } from 'react';
import { Employee, Contractor, Supply } from '../../types/Employee';
import { Business } from '../../types/Business';
import { ExpensesService } from '../../services/expensesService';
import { useQRACalculations } from './useQRACalculations';
import { useActivityCalculations } from './useActivityCalculations';

/**
 * Custom hook for managing expenses state in RDExpensesTab
 * Extracts complex state management from the monolithic component
 */
export const useExpensesState = (
  selectedBusinessId: string,
  selectedYear: number,
  businesses: Business[]
) => {
  // Core state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [yearTotals, setYearTotals] = useState<any>({});

  // Modal states
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [contractorModalOpen, setContractorModalOpen] = useState(false);
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [employeeConfigModalOpen, setEmployeeConfigModalOpen] = useState(false);
  const [contractorConfigModalOpen, setContractorConfigModalOpen] = useState(false);
  const [supplyConfigModalOpen, setSupplyConfigModalOpen] = useState(false);

  // Selected items for configuration
  const [selectedEmployeeForConfig, setSelectedEmployeeForConfig] = useState<Employee | null>(null);
  const [selectedContractorForConfig, setSelectedContractorForConfig] = useState<Contractor | null>(null);
  const [selectedSupplyForConfig, setSelectedSupplyForConfig] = useState<Supply | null>(null);

  // Form states
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    role: '',
    wage: '',
    appliedPercentage: 0
  });

  const [contractorFormData, setContractorFormData] = useState({
    name: '',
    role: '',
    amount: '',
    appliedPercentage: 0
  });

  const [supplyFormData, setSupplyFormData] = useState({
    name: '',
    category: '',
    amount: '',
    appliedPercentage: 0
  });

  // Percentage states
  const [employeePracticePercentages, setEmployeePracticePercentages] = useState<Record<string, number>>({});
  const [contractorPracticePercentages, setContractorPracticePercentages] = useState<Record<string, number>>({});
  const [supplyActivityPercentages, setSupplyActivityPercentages] = useState<Record<string, number>>({});

  // Subcomponent states
  const [employeeSubcomponentState, setEmployeeSubcomponentState] = useState<Record<string, Record<string, boolean>>>({});
  const [contractorSubcomponentState, setContractorSubcomponentState] = useState<Record<string, Record<string, boolean>>>({});
  const [supplySubcomponentState, setSupplySubcomponentState] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<Record<string, string[]>>({});

  // Use calculation hooks
  const { getQRAData, calculateActivityAppliedPercentage } = useQRACalculations(selectedBusinessId, selectedYear);
  const { getEmployeeActivities, getContractorActivities, getSupplyActivities } = useActivityCalculations(selectedBusinessId, selectedYear, businesses);

  // Memoized derived state
  const selectedBusiness = useMemo(() => {
    return businesses.find(b => b.id === selectedBusinessId);
  }, [businesses, selectedBusinessId]);

  const businessRoles = useMemo(() => {
    return selectedBusiness?.rolesByYear?.[selectedYear] || [];
  }, [selectedBusiness, selectedYear]);

  const researchActivities = useMemo(() => {
    const yearData = selectedBusiness?.years?.[selectedYear];
    return yearData?.activities ? Object.values(yearData.activities) : [];
  }, [selectedBusiness, selectedYear]);

  const qraData = useMemo(() => {
    const yearData = selectedBusiness?.years?.[selectedYear];
    return yearData?.qraData || {};
  }, [selectedBusiness, selectedYear]);

  // Data loading functions
  const loadEmployees = useCallback(() => {
    const employeeData = ExpensesService.getEmployees(selectedBusinessId, selectedYear);
    const updatedEmployees = employeeData.map(employee => ({
      ...employee,
      activities: getEmployeeActivities(employee),
      appliedPercentage: calculateEmployeeAppliedPercentage(employee)
    }));
    setEmployees(updatedEmployees);
  }, [selectedBusinessId, selectedYear, getEmployeeActivities, calculateEmployeeAppliedPercentage]);

  const loadContractors = useCallback(() => {
    const contractorData = ExpensesService.getContractors(selectedBusinessId, selectedYear);
    const updatedContractors = contractorData.map(contractor => ({
      ...contractor,
      activities: getContractorActivities(contractor),
      appliedPercentage: calculateContractorAppliedPercentage(contractor)
    }));
    setContractors(updatedContractors);
  }, [selectedBusinessId, selectedYear, getContractorActivities, calculateContractorAppliedPercentage]);

  const loadSupplies = useCallback(() => {
    const supplyData = ExpensesService.getSupplies(selectedBusinessId, selectedYear);
    const updatedSupplies = supplyData.map(supply => ({
      ...supply,
      activities: getSupplyActivities(supply),
      appliedPercentage: calculateSupplyAppliedPercentage(supply)
    }));
    setSupplies(updatedSupplies);
  }, [selectedBusinessId, selectedYear, getSupplyActivities, calculateSupplyAppliedPercentage]);

  const loadAvailableYears = useCallback(() => {
    const years = ExpensesService.getAvailableYears(selectedBusinessId);
    return years;
  }, [selectedBusinessId]);

  // Calculation functions (placeholders - these will be implemented with actual logic)
  const calculateEmployeeAppliedPercentage = useCallback((employee: Employee): number => {
    // TODO: Implement actual calculation logic from main component
    return 0;
  }, []);

  const calculateContractorAppliedPercentage = useCallback((contractor: Contractor): number => {
    // TODO: Implement actual calculation logic from main component
    return 0;
  }, []);

  const calculateSupplyAppliedPercentage = useCallback((supply: Supply): number => {
    // TODO: Implement actual calculation logic from main component
    return 0;
  }, []);

  const calculateRoleAppliedPercentages = useCallback(() => {
    // TODO: Implement actual calculation logic from main component
    return [];
  }, []);

  // Modal handlers
  const handleOpenEmployeeModal = useCallback(() => setEmployeeModalOpen(true), []);
  const handleCloseEmployeeModal = useCallback(() => setEmployeeModalOpen(false), []);
  const handleOpenContractorModal = useCallback(() => setContractorModalOpen(true), []);
  const handleCloseContractorModal = useCallback(() => setContractorModalOpen(false), []);
  const handleOpenSupplyModal = useCallback(() => setSupplyModalOpen(true), []);
  const handleCloseSupplyModal = useCallback(() => setSupplyModalOpen(false), []);

  // Configuration handlers
  const handleOpenEmployeeConfig = useCallback((employee: Employee) => {
    setSelectedEmployeeForConfig(employee);
    setEmployeeConfigModalOpen(true);
  }, []);

  const handleCloseEmployeeConfig = useCallback(() => {
    setEmployeeConfigModalOpen(false);
    setSelectedEmployeeForConfig(null);
  }, []);

  const handleOpenContractorConfig = useCallback((contractor: Contractor) => {
    setSelectedContractorForConfig(contractor);
    setContractorConfigModalOpen(true);
  }, []);

  const handleCloseContractorConfig = useCallback(() => {
    setContractorConfigModalOpen(false);
    setSelectedContractorForConfig(null);
  }, []);

  const handleOpenSupplyConfig = useCallback((supply: Supply) => {
    setSelectedSupplyForConfig(supply);
    setSupplyConfigModalOpen(true);
  }, []);

  const handleCloseSupplyConfig = useCallback(() => {
    setSupplyConfigModalOpen(false);
    setSelectedSupplyForConfig(null);
  }, []);

  // Form handlers
  const handleEmployeeFormChange = useCallback((field: string, value: string | number) => {
    setEmployeeFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleContractorFormChange = useCallback((field: string, value: string | number) => {
    setContractorFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSupplyFormChange = useCallback((field: string, value: string | number) => {
    setSupplyFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // CRUD operations
  const addEmployee = useCallback((employee: Employee) => {
    ExpensesService.addEmployee(selectedBusinessId, selectedYear, employee);
    loadEmployees();
  }, [selectedBusinessId, selectedYear, loadEmployees]);

  const updateEmployee = useCallback((employee: Employee) => {
    ExpensesService.updateEmployee(selectedBusinessId, selectedYear, employee);
    loadEmployees();
  }, [selectedBusinessId, selectedYear, loadEmployees]);

  const deleteEmployee = useCallback((employeeId: string) => {
    ExpensesService.deleteEmployee(selectedBusinessId, selectedYear, employeeId);
    loadEmployees();
  }, [selectedBusinessId, selectedYear, loadEmployees]);

  const addContractor = useCallback((contractor: Contractor) => {
    ExpensesService.addContractor(selectedBusinessId, selectedYear, contractor);
    loadContractors();
  }, [selectedBusinessId, selectedYear, loadContractors]);

  const updateContractor = useCallback((contractor: Contractor) => {
    ExpensesService.updateContractor(selectedBusinessId, selectedYear, contractor);
    loadContractors();
  }, [selectedBusinessId, selectedYear, loadContractors]);

  const deleteContractor = useCallback((contractorId: string) => {
    ExpensesService.deleteContractor(selectedBusinessId, selectedYear, contractorId);
    loadContractors();
  }, [selectedBusinessId, selectedYear, loadContractors]);

  const addSupply = useCallback((supply: Supply) => {
    ExpensesService.addSupply(selectedBusinessId, selectedYear, supply);
    loadSupplies();
  }, [selectedBusinessId, selectedYear, loadSupplies]);

  const updateSupply = useCallback((supply: Supply) => {
    ExpensesService.updateSupply(selectedBusinessId, selectedYear, supply);
    loadSupplies();
  }, [selectedBusinessId, selectedYear, loadSupplies]);

  const deleteSupply = useCallback((supplyId: string) => {
    ExpensesService.deleteSupply(selectedBusinessId, selectedYear, supplyId);
    loadSupplies();
  }, [selectedBusinessId, selectedYear, loadSupplies]);

  // Update year totals
  const updateYearTotals = useCallback(() => {
    const totals = ExpensesService.calculateYearTotals(selectedBusinessId, selectedYear);
    setYearTotals(totals);
  }, [selectedBusinessId, selectedYear]);

  return {
    // State
    employees,
    contractors,
    supplies,
    roles,
    yearTotals,
    
    // Modal states
    employeeModalOpen,
    contractorModalOpen,
    supplyModalOpen,
    employeeConfigModalOpen,
    contractorConfigModalOpen,
    supplyConfigModalOpen,
    
    // Selected items
    selectedEmployeeForConfig,
    selectedContractorForConfig,
    selectedSupplyForConfig,
    
    // Form data
    employeeFormData,
    contractorFormData,
    supplyFormData,
    
    // Percentage states
    employeePracticePercentages,
    contractorPracticePercentages,
    supplyActivityPercentages,
    
    // Subcomponent states
    employeeSubcomponentState,
    contractorSubcomponentState,
    supplySubcomponentState,
    selectedSubcomponents,
    
    // Derived state
    selectedBusiness,
    businessRoles,
    researchActivities,
    qraData,
    
    // Actions
    loadEmployees,
    loadContractors,
    loadSupplies,
    loadAvailableYears,
    updateYearTotals,
    
    // Modal handlers
    handleOpenEmployeeModal,
    handleCloseEmployeeModal,
    handleOpenContractorModal,
    handleCloseContractorModal,
    handleOpenSupplyModal,
    handleCloseSupplyModal,
    
    // Configuration handlers
    handleOpenEmployeeConfig,
    handleCloseEmployeeConfig,
    handleOpenContractorConfig,
    handleCloseContractorConfig,
    handleOpenSupplyConfig,
    handleCloseSupplyConfig,
    
    // Form handlers
    handleEmployeeFormChange,
    handleContractorFormChange,
    handleSupplyFormChange,
    
    // CRUD operations
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addContractor,
    updateContractor,
    deleteContractor,
    addSupply,
    updateSupply,
    deleteSupply,
    
    // Setters for state updates
    setEmployeePracticePercentages,
    setContractorPracticePercentages,
    setSupplyActivityPercentages,
    setEmployeeSubcomponentState,
    setContractorSubcomponentState,
    setSupplySubcomponentState,
    setSelectedSubcomponents,
    setRoles
  };
}; 