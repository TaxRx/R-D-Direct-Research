import { Employee, Contractor, Supply, ExpenseData, EmployeesByYear, ContractorsByYear, SuppliesByYear, NON_RD_ROLE, OTHER_ROLE, ContractorFormData, SupplyFormData, SUPPLY_CATEGORIES } from '../types/Employee';
import { Role } from '../types/Business';

export class ExpensesService {
  private static readonly STORAGE_KEY = 'rd_expenses_data';

  // Get all expense data for a business
  static getExpenseData(businessId: string): ExpenseData {
    const key = `${this.STORAGE_KEY}_${businessId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing expense data:', error);
      }
    }

    return {
      employees: {},
      contractors: {},
      supplies: {}
    };
  }

  // Save expense data for a business
  static saveExpenseData(businessId: string, data: ExpenseData): void {
    const key = `${this.STORAGE_KEY}_${businessId}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Get employees for a specific year
  static getEmployees(businessId: string, year: number): Employee[] {
    const expenseData = this.getExpenseData(businessId);
    return expenseData.employees[year] || [];
  }

  // Get contractors for a specific business and year
  static getContractors(businessId: string, year: number): Contractor[] {
    const expenseData = this.getExpenseData(businessId);
    return expenseData.contractors[year] || [];
  }

  // Get supplies for a specific business and year
  static getSupplies(businessId: string, year: number): Supply[] {
    const expenseData = this.getExpenseData(businessId);
    return expenseData.supplies[year] || [];
  }

  // Add or update employee
  static saveEmployee(businessId: string, year: number, employee: Employee): void {
    const data = this.getExpenseData(businessId);
    
    if (!data.employees[year]) {
      data.employees[year] = [];
    }

    const existingIndex = data.employees[year].findIndex(emp => emp.id === employee.id);
    
    if (existingIndex >= 0) {
      data.employees[year][existingIndex] = employee;
    } else {
      data.employees[year].push(employee);
    }

    this.saveExpenseData(businessId, data);
  }

  // Add or update contractor
  static saveContractor(businessId: string, year: number, contractor: Contractor): void {
    const data = this.getExpenseData(businessId);
    
    if (!data.contractors[year]) {
      data.contractors[year] = [];
    }

    const existingIndex = data.contractors[year].findIndex(c => c.id === contractor.id);
    
    if (existingIndex >= 0) {
      data.contractors[year][existingIndex] = contractor;
    } else {
      data.contractors[year].push(contractor);
    }

    this.saveExpenseData(businessId, data);
  }

  // Update employee (alias for saveEmployee for consistency)
  static updateEmployee(businessId: string, year: number, employee: Employee): void {
    this.saveEmployee(businessId, year, employee);
  }

  // Delete employee
  static deleteEmployee(businessId: string, year: number, employeeId: string): void {
    const data = this.getExpenseData(businessId);
    
    if (data.employees[year]) {
      data.employees[year] = data.employees[year].filter(emp => emp.id !== employeeId);
      this.saveExpenseData(businessId, data);
    }
  }

  // Delete contractor
  static deleteContractor(businessId: string, year: number, contractorId: string): void {
    const data = this.getExpenseData(businessId);
    
    if (data.contractors[year]) {
      data.contractors[year] = data.contractors[year].filter(c => c.id !== contractorId);
      this.saveExpenseData(businessId, data);
    }
  }

  // Add or update supply
  static saveSupply(businessId: string, year: number, supply: Supply): void {
    const data = this.getExpenseData(businessId);
    
    if (!data.supplies[year]) {
      data.supplies[year] = [];
    }

    const existingIndex = data.supplies[year].findIndex(s => s.id === supply.id);
    
    if (existingIndex >= 0) {
      data.supplies[year][existingIndex] = supply;
    } else {
      data.supplies[year].push(supply);
    }

    this.saveExpenseData(businessId, data);
  }

  // Delete supply
  static deleteSupply(businessId: string, year: number, supplyId: string): void {
    const data = this.getExpenseData(businessId);
    
    if (data.supplies[year]) {
      data.supplies[year] = data.supplies[year].filter(s => s.id !== supplyId);
      this.saveExpenseData(businessId, data);
    }
  }

  // Create new employee with role-based applied percentage
  static createEmployee(
    firstName: string,
    lastName: string,
    wage: number,
    roleId: string,
    customRoleName: string,
    isBusinessOwner: boolean,
    roles: Role[]
  ): Employee {
    const role = roles.find(r => r.id === roleId) || NON_RD_ROLE;
    const appliedPercentage = this.getRoleAppliedPercentage(roleId, roles);
    
    return {
      id: this.generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      wage,
      roleId,
      customRoleName: roleId === OTHER_ROLE.id ? customRoleName.trim() : undefined,
      isBusinessOwner,
      appliedPercentage,
      appliedAmount: wage * (appliedPercentage / 100),
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Create new contractor with 65% rule applied
  static createContractor(
    contractorType: 'individual' | 'business',
    firstName: string,
    lastName: string,
    businessName: string,
    totalAmount: number,
    roleId: string,
    customRoleName: string,
    roles: Role[]
  ): Contractor {
    const appliedPercentage = this.getRoleAppliedPercentage(roleId, roles);
    // Apply 65% rule: only 65% of contractor amount can be applied to R&D
    const appliedAmount = totalAmount * (appliedPercentage / 100) * 0.65;
    
    return {
      id: this.generateContractorId(),
      contractorType,
      firstName: contractorType === 'individual' ? firstName.trim() : undefined,
      lastName: contractorType === 'individual' ? lastName.trim() : undefined,
      businessName: contractorType === 'business' ? businessName.trim() : undefined,
      totalAmount,
      roleId,
      customRoleName: roleId === OTHER_ROLE.id ? customRoleName.trim() : undefined,
      appliedPercentage,
      appliedAmount,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Create new supply
  static createSupply(
    title: string,
    description: string,
    totalValue: number,
    category: string,
    customCategory: string
  ): Supply {
    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    
    return {
      id: this.generateSupplyId(),
      title: title.trim(),
      description: description.trim(),
      totalValue,
      category: finalCategory,
      appliedPercentage: 0, // Initially 0%, user will configure
      appliedAmount: 0, // Will be calculated when percentages are set
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Get applied percentage for a role
  static getRoleAppliedPercentage(roleId: string, roles: Role[]): number {
    if (roleId === NON_RD_ROLE.id) {
      return 0;
    }

    if (roleId === OTHER_ROLE.id) {
      return OTHER_ROLE.appliedPercentage;
    }

    const role = roles.find(r => r.id === roleId);
    return role?.appliedPercentage || 0;
  }

  // Update employee applied percentage and recalculate amount
  static updateEmployeePercentage(employee: Employee, newPercentage: number): Employee {
    return {
      ...employee,
      appliedPercentage: newPercentage,
      appliedAmount: employee.wage * (newPercentage / 100),
      updatedAt: new Date().toISOString()
    };
  }

  // Get all available roles including Non-R&D and Other
  static getAvailableRoles(roles: Role[]): Array<Role | typeof NON_RD_ROLE | typeof OTHER_ROLE> {
    return [NON_RD_ROLE, ...roles, OTHER_ROLE];
  }

  // Calculate total expenses for a year including contractors and supplies
  static calculateYearTotals(businessId: string, year: number): {
    totalWages: number;
    totalAppliedWages: number;
    totalContractorAmounts: number;
    totalAppliedContractorAmounts: number;
    totalSupplyValues: number;
    totalAppliedSupplyAmounts: number;
    employeeCount: number;
    businessOwnerCount: number;
    contractorCount: number;
    supplyCount: number;
  } {
    const employees = this.getEmployees(businessId, year);
    const contractors = this.getContractors(businessId, year);
    const supplies = this.getSupplies(businessId, year);
    
    console.log('=== CALCULATING YEAR TOTALS ===');
    console.log('Number of employees:', employees.length);
    console.log('Number of contractors:', contractors.length);
    console.log('Number of supplies:', supplies.length);
    
    let totalAppliedWages = 0;
    let totalAppliedContractorAmounts = 0;
    let totalAppliedSupplyAmounts = 0;
    
    employees.forEach(emp => {
      const appliedAmount = emp.wage * (emp.appliedPercentage / 100);
      totalAppliedWages += appliedAmount;
      
      console.log(`Employee ${emp.firstName} ${emp.lastName}:`, {
        wage: emp.wage,
        appliedPercentage: emp.appliedPercentage,
        appliedAmount: appliedAmount,
        hasCustomConfig: (emp.customPracticePercentages && Object.keys(emp.customPracticePercentages).length > 0) || 
                        (emp.customTimePercentages && Object.keys(emp.customTimePercentages).length > 0)
      });
    });

    contractors.forEach(contractor => {
      totalAppliedContractorAmounts += contractor.appliedAmount;
      
      const contractorName = contractor.contractorType === 'individual' 
        ? `${contractor.firstName} ${contractor.lastName}` 
        : contractor.businessName;
      
      console.log(`Contractor ${contractorName}:`, {
        totalAmount: contractor.totalAmount,
        appliedPercentage: contractor.appliedPercentage,
        appliedAmount: contractor.appliedAmount,
        note: '65% rule applied'
      });
    });

    supplies.forEach(supply => {
      totalAppliedSupplyAmounts += supply.appliedAmount;
      
      console.log(`Supply ${supply.title}:`, {
        totalValue: supply.totalValue,
        appliedPercentage: supply.appliedPercentage,
        appliedAmount: supply.appliedAmount,
        category: supply.category
      });
    });
    
    console.log('Final totalAppliedWages:', totalAppliedWages);
    console.log('Final totalAppliedContractorAmounts:', totalAppliedContractorAmounts);
    console.log('Final totalAppliedSupplyAmounts:', totalAppliedSupplyAmounts);
    
    return {
      totalWages: employees.reduce((sum, emp) => sum + emp.wage, 0),
      totalAppliedWages,
      totalContractorAmounts: contractors.reduce((sum, contractor) => sum + contractor.totalAmount, 0),
      totalAppliedContractorAmounts,
      totalSupplyValues: supplies.reduce((sum, supply) => sum + supply.totalValue, 0),
      totalAppliedSupplyAmounts,
      employeeCount: employees.filter(emp => !emp.isBusinessOwner).length,
      businessOwnerCount: employees.filter(emp => emp.isBusinessOwner).length,
      contractorCount: contractors.length,
      supplyCount: supplies.length,
    };
  }

  // Get years with expense data
  static getAvailableYears(businessId: string): number[] {
    const data = this.getExpenseData(businessId);
    const years = new Set<number>();
    
    Object.keys(data.employees).forEach(year => years.add(parseInt(year)));
    Object.keys(data.contractors).forEach(year => years.add(parseInt(year)));
    Object.keys(data.supplies).forEach(year => years.add(parseInt(year)));
    
    return Array.from(years).sort((a, b) => b - a);
  }

  // Generate unique ID
  private static generateId(): string {
    return `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique contractor ID
  private static generateContractorId(): string {
    return `contractor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique supply ID
  private static generateSupplyId(): string {
    return `supply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate employee data
  static validateEmployee(firstName: string, lastName: string, wage: string, roleId: string, customRoleName: string): string | null {
    if (!firstName.trim()) return 'First name is required';
    if (!lastName.trim()) return 'Last name is required';
    if (!wage.trim()) return 'Wage is required';
    
    // Parse currency input to handle formatted values like '$50,000'
    const parsedWage = wage.replace(/[^\d.]/g, '');
    if (!parsedWage || isNaN(Number(parsedWage)) || Number(parsedWage) <= 0) return 'Wage must be a valid positive number';
    
    if (!roleId) return 'Role is required';
    if (roleId === OTHER_ROLE.id && !customRoleName.trim()) return 'Custom role name is required when Other is selected';
    
    return null;
  }

  // Validate contractor data
  static validateContractor(
    contractorType: 'individual' | 'business',
    firstName: string,
    lastName: string,
    businessName: string,
    totalAmount: string,
    roleId: string,
    customRoleName: string
  ): string | null {
    if (contractorType === 'individual') {
      if (!firstName.trim()) return 'First name is required for individual contractors';
      if (!lastName.trim()) return 'Last name is required for individual contractors';
    } else {
      if (!businessName.trim()) return 'Business name is required for business entity contractors';
    }
    
    if (!totalAmount.trim()) return 'Total amount is required';
    
    const parsedAmount = totalAmount.replace(/[^\d.]/g, '');
    if (!parsedAmount || isNaN(Number(parsedAmount)) || Number(parsedAmount) <= 0) {
      return 'Total amount must be a valid positive number';
    }
    
    if (!roleId) return 'Role is required';
    if (roleId === OTHER_ROLE.id && !customRoleName.trim()) {
      return 'Custom role name is required when Other is selected';
    }
    
    return null;
  }

  // Validate supply data
  static validateSupply(
    title: string,
    description: string,
    totalValue: string,
    category: string,
    customCategory: string
  ): string | null {
    if (!title.trim()) return 'Title is required';
    if (!description.trim()) return 'Description is required';
    if (!totalValue.trim()) return 'Total value is required';
    
    const parsedValue = totalValue.replace(/[^\d.]/g, '');
    if (!parsedValue || isNaN(Number(parsedValue)) || Number(parsedValue) <= 0) {
      return 'Total value must be a valid positive number';
    }
    
    if (!category) return 'Category is required';
    if (category === 'Other' && !customCategory.trim()) {
      return 'Custom category is required when Other is selected';
    }
    
    return null;
  }

  // Update supply applied percentage and recalculate amount
  static updateSupplyPercentage(supply: Supply, newPercentage: number): Supply {
    return {
      ...supply,
      appliedPercentage: newPercentage,
      appliedAmount: supply.totalValue * (newPercentage / 100),
      updatedAt: new Date().toISOString()
    };
  }
} 