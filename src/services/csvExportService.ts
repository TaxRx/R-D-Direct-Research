import { Employee, Contractor, Supply } from '../types/Employee';
import { Business } from '../types/Business';
import { ExpensesService } from './expensesService';

export interface CSVExportRow {
  Year: number;
  'Research Activity Title': string;
  'Research Activity Practice Percent': number;
  Step: string;
  'Subcomponent Title': string;
  'Subcomponent Year %': number;
  'Subcomponent Frequency %': number;
  'Subcomponent Time %': number;
  'First Name': string;
  'Last Name': string;
  Role: string;
  'Supply Name': string; // Empty for employees/contractors
  'Total Cost': number;
  'Applied Percent': number;
  Category: 'Employee' | 'Contractor' | 'Supply';
}

// Interface matching the ACTUAL QRA data structure stored in localStorage
interface QRASubcomponentConfig {
  phase: string;
  step: string;
  subcomponent: string;
  timePercent: number;
  frequencyPercent: number;
  yearPercent: number;
  startYear: number;
  selectedRoles: string[];
  appliedPercent: number;
  isNonRD?: boolean;
}

interface QRAStorageData {
  selectedSubcomponents: Record<string, QRASubcomponentConfig>;
  totalAppliedPercent: number;
  stepFrequencies: Record<string, number>;
  stepTimeMap: Record<string, number>;
  stepTimeLocked: Record<string, boolean>;
  activityName: string;
  practicePercent: number;
  currentYear: number;
  selectedRoles: string[];
  calculationFormula: string;
  lastUpdated: string;
  totalSubcomponents: number;
  rdSubcomponents: number;
  nonRdSubcomponents: number;
  stepSummaries: Record<string, any>;
}

export class CSVExportService {
  /**
   * Generate export data for CSV download
   */
  static generateExportData(
    businessId: string, 
    year: number, 
    businesses: Business[]
  ): CSVExportRow[] {
    const exportRows: CSVExportRow[] = [];
    const selectedBusiness = businesses.find(b => b.id === businessId);
    
    if (!selectedBusiness) {
      console.error('Business not found');
      return exportRows;
    }

    // Get all expense data
    const employees = ExpensesService.getEmployees(businessId, year);
    const contractors = ExpensesService.getContractors(businessId, year);
    const supplies = ExpensesService.getSupplies(businessId, year);

    // Get activities from business data
    const activities = selectedBusiness.years?.[year]?.activities || {};

    console.log('CSV Export Debug:', {
      businessId,
      year,
      employeeCount: employees.length,
      contractorCount: contractors.length,
      suppliesCount: supplies.length,
      activitiesCount: Object.keys(activities).length,
      activities: Object.keys(activities),
      availableQRAKeys: this.getAvailableQRAKeys(businessId, year)
    });

    // Process employees with their activity assignments
    employees.forEach(employee => {
      this.addEmployeeRows(employee, activities, selectedBusiness, businessId, year, exportRows);
    });

    // Process contractors
    contractors.forEach(contractor => {
      this.addContractorRow(contractor, year, exportRows);
    });

    // Process supplies
    supplies.forEach(supply => {
      this.addSupplyRow(supply, year, exportRows);
    });

    console.log('Generated CSV rows:', exportRows.length);
    return exportRows;
  }

  /**
   * Add rows for an employee based on their activities and QRA data
   */
  private static addEmployeeRows(
    employee: Employee,
    activities: Record<string, any>,
    business: Business,
    businessId: string,
    year: number,
    exportRows: CSVExportRow[]
  ): void {
    const employeeActivities = this.getEmployeeActivities(employee, activities);
    
    if (employeeActivities.length === 0) {
      // Employee has no activities - add a single row with zero values
      exportRows.push({
        Year: year,
        'Research Activity Title': 'No Activities Assigned',
        'Research Activity Practice Percent': 0,
        Step: 'N/A',
        'Subcomponent Title': 'No Subcomponents',
        'Subcomponent Year %': 0,
        'Subcomponent Frequency %': 0,
        'Subcomponent Time %': 0,
        'First Name': employee.firstName || '',
        'Last Name': employee.lastName || '',
        Role: this.getRoleName(employee, business, year),
        'Supply Name': '',
        'Total Cost': employee.wage || 0,
        'Applied Percent': 0,
        Category: 'Employee'
      });
      return;
    }

    // Process each activity the employee is assigned to
    employeeActivities.forEach(activity => {
      // Get QRA data for this activity using the activity ID (full identifier)
      const qraData = this.getQRADataFromStorage(businessId, year, activity.id);
      
      if (qraData && qraData.selectedSubcomponents && Object.keys(qraData.selectedSubcomponents).length > 0) {
        // Process each subcomponent from the QRA data
        Object.values(qraData.selectedSubcomponents).forEach((subcomponent: QRASubcomponentConfig) => {
          // Skip Non-R&D subcomponents as they don't contribute to R&D credits
          if (subcomponent.isNonRD) {
            return;
          }

          // Check if this subcomponent applies to the employee's role
          if (!this.doesSubcomponentApplyToEmployee(subcomponent, employee, activity)) {
            return;
          }

          // Get employee-specific customizations
          const customTimePercent = employee.customTimePercentages?.[activity.id]?.[this.getSubcomponentId(subcomponent)];
          const finalTimePercent = customTimePercent !== undefined ? customTimePercent : subcomponent.timePercent;

          const customPracticePercent = employee.customPracticePercentages?.[activity.id];
          const finalPracticePercent = customPracticePercent !== undefined ? customPracticePercent : activity.practicePercent;

          // Calculate applied percentage using QRA formula: (Practice × Time × Frequency × Year) / 1,000,000
          const appliedPercent = this.calculateAppliedPercent(
            finalPracticePercent,
            finalTimePercent,
            subcomponent.frequencyPercent,
            subcomponent.yearPercent
          );

          exportRows.push({
            Year: year,
            'Research Activity Title': activity.name,
            'Research Activity Practice Percent': finalPracticePercent,
            Step: subcomponent.step,
            'Subcomponent Title': subcomponent.subcomponent,
            'Subcomponent Year %': subcomponent.yearPercent,
            'Subcomponent Frequency %': subcomponent.frequencyPercent,
            'Subcomponent Time %': finalTimePercent,
            'First Name': employee.firstName || '',
            'Last Name': employee.lastName || '',
            Role: this.getRoleName(employee, business, year),
            'Supply Name': '',
            'Total Cost': employee.wage || 0,
            'Applied Percent': appliedPercent,
            Category: 'Employee'
          });
        });
      } else {
        // No QRA data found - add a fallback row indicating missing QRA data
        const customPracticePercent = employee.customPracticePercentages?.[activity.id];
        const finalPracticePercent = customPracticePercent !== undefined ? customPracticePercent : activity.practicePercent;

        exportRows.push({
          Year: year,
          'Research Activity Title': activity.name,
          'Research Activity Practice Percent': finalPracticePercent,
          Step: 'Missing QRA Data',
          'Subcomponent Title': 'QRA Not Configured',
          'Subcomponent Year %': 0,
          'Subcomponent Frequency %': 0,
          'Subcomponent Time %': 0,
          'First Name': employee.firstName || '',
          'Last Name': employee.lastName || '',
          Role: this.getRoleName(employee, business, year),
          'Supply Name': '',
          'Total Cost': employee.wage || 0,
          'Applied Percent': 0,
          Category: 'Employee'
        });
      }
    });
  }

  /**
   * Add a row for a contractor
   */
  private static addContractorRow(contractor: Contractor, year: number, exportRows: CSVExportRow[]): void {
    exportRows.push({
      Year: year,
      'Research Activity Title': 'Contractor Services',
      'Research Activity Practice Percent': 100,
      Step: 'General',
      'Subcomponent Title': 'Contractor Services',
      'Subcomponent Year %': 100,
      'Subcomponent Frequency %': 100,
      'Subcomponent Time %': 100,
      'First Name': contractor.firstName || '',
      'Last Name': contractor.lastName || '',
      Role: 'Contractor',
      'Supply Name': '',
      'Total Cost': contractor.totalAmount || 0,
      'Applied Percent': contractor.appliedPercentage || 0,
      Category: 'Contractor'
    });
  }

  /**
   * Add a row for a supply
   */
  private static addSupplyRow(supply: Supply, year: number, exportRows: CSVExportRow[]): void {
    exportRows.push({
      Year: year,
      'Research Activity Title': 'Supply/Materials',
      'Research Activity Practice Percent': 100,
      Step: 'General',
      'Subcomponent Title': 'Supply/Materials',
      'Subcomponent Year %': 100,
      'Subcomponent Frequency %': 100,
      'Subcomponent Time %': 100,
      'First Name': '',
      'Last Name': '',
      Role: '',
      'Supply Name': supply.title || 'Unknown Supply',
      'Total Cost': supply.totalValue || 0,
      'Applied Percent': supply.appliedPercentage || 0,
      Category: 'Supply'
    });
  }

  /**
   * Get activities that an employee participates in
   */
  private static getEmployeeActivities(employee: Employee, activities: Record<string, any>): Array<{
    id: string;
    name: string;
    practicePercent: number;
  }> {
    const employeeActivities: Array<{
      id: string;
      name: string;
      practicePercent: number;
    }> = [];
    
    // Special roles
    const OTHER_ROLE_ID = 'other';
    const NON_RD_ROLE_ID = 'non-rd';
    
    // Non-R&D employees don't participate in any activities
    if (employee.roleId === NON_RD_ROLE_ID) {
      return employeeActivities;
    }
    
    Object.entries(activities).forEach(([activityId, activity]: [string, any]) => {
      // Include activity if:
      // 1. Employee has "Other" role (gets all activities)
      // 2. Employee's role is specifically assigned to this activity
      const includeActivity = employee.roleId === OTHER_ROLE_ID || 
        (activity.selectedRoles && activity.selectedRoles.includes(employee.roleId));
      
      if (includeActivity && activity.active !== false) {
        employeeActivities.push({
          id: activityId, // This is the full activity identifier used in localStorage keys
          name: activity.name, // This is the display name
          practicePercent: activity.practicePercent || 0
        });
      }
    });
    
    return employeeActivities;
  }

  /**
   * Check if a subcomponent applies to a specific employee based on role assignments
   */
  private static doesSubcomponentApplyToEmployee(
    subcomponent: QRASubcomponentConfig,
    employee: Employee,
    activity: { id: string; name: string; practicePercent: number }
  ): boolean {
    // If no specific roles are assigned to the subcomponent, it applies to all employees in the activity
    if (!subcomponent.selectedRoles || subcomponent.selectedRoles.length === 0) {
      return true;
    }

    // Check if employee's role is in the subcomponent's selected roles
    return subcomponent.selectedRoles.includes(employee.roleId);
  }

  /**
   * Get QRA data from localStorage for a specific activity
   */
  private static getQRADataFromStorage(businessId: string, year: number, activityId: string): QRAStorageData | null {
    try {
      const storageKey = `qra_${businessId}_${year}_${activityId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        console.log(`Found QRA data for activity ID ${activityId}:`, {
          subcomponentCount: Object.keys(parsed.selectedSubcomponents || {}).length,
          totalAppliedPercent: parsed.totalAppliedPercent,
          activityName: parsed.activityName
        });
        return parsed;
      } else {
        console.warn(`No QRA data found for key: ${storageKey}`);
      }
    } catch (error) {
      console.error(`Error loading QRA data for activity ID ${activityId}:`, error);
    }
    
    return null;
  }

  /**
   * Get available QRA keys for debugging
   */
  private static getAvailableQRAKeys(businessId: string, year: number): string[] {
    const allKeys = Object.keys(localStorage);
    return allKeys.filter(key => 
      key.startsWith('qra_') && 
      key.includes(businessId) && 
      key.includes(year.toString())
    );
  }

  /**
   * Get role name for an employee
   */
  private static getRoleName(employee: Employee, business: Business, year: number): string {
    const NON_RD_ROLE_ID = 'non-rd';
    const OTHER_ROLE_ID = 'other';
    
    if (employee.roleId === NON_RD_ROLE_ID) {
      return 'Non-R&D';
    }
    if (employee.roleId === OTHER_ROLE_ID) {
      return employee.customRoleName || 'Other';
    }
    
    // Find role in business roles
    const roles = business.rolesByYear?.[year] || [];
    const role = this.findRoleInHierarchy(roles, employee.roleId);
    return role?.name || employee.roleId || 'Unknown Role';
  }

  /**
   * Find a role in the hierarchical role structure
   */
  private static findRoleInHierarchy(roles: any[], roleId: string): any {
    for (const role of roles) {
      if (role.id === roleId) {
        return role;
      }
      if (role.children && role.children.length > 0) {
        const found = this.findRoleInHierarchy(role.children, roleId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Calculate applied percentage using QRA formula
   */
  private static calculateAppliedPercent(
    practicePercent: number,
    timePercent: number,
    frequencyPercent: number,
    yearPercent: number
  ): number {
    // QRA Formula: (Practice × Time × Frequency × Year) / 1,000,000
    const result = (practicePercent * timePercent * frequencyPercent * yearPercent) / 1000000;
    return Math.round(result * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate a unique ID for a subcomponent (used for custom time percentage lookup)
   */
  private static getSubcomponentId(subcomponent: QRASubcomponentConfig): string {
    // This should match how subcomponent IDs are generated in the QRA modal
    return `${subcomponent.phase}_${subcomponent.step}_${subcomponent.subcomponent}`.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Convert export data to CSV format and trigger download
   */
  static downloadCSV(exportData: CSVExportRow[], filename: string = 'rd-expenses-export.csv'): void {
    if (exportData.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create CSV header
    const headers = Object.keys(exportData[0]) as (keyof CSVExportRow)[];
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
} 