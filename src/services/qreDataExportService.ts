import { Employee, Contractor, Supply } from '../types/Employee';
import { Business } from '../types/Business';
import { SubcomponentSelectionData } from '../types/QRABuilderInterfaces';

// Core data interfaces for normalized QRE export
export interface QREDataExport {
  // Business and year context
  businessId: string;
  businessName: string;
  year: number;
  exportTimestamp: string;
  
  // Research Activities and their configurations
  researchActivities: ResearchActivityData[];
  
  // Steps and their configurations
  steps: StepData[];
  
  // Subcomponents and their configurations
  subcomponents: SubcomponentData[];
  
  // Employee data with all relationships
  employees: EmployeeData[];
  
  // Contractor data with all relationships
  contractors: ContractorData[];
  
  // Supply data with all relationships
  supplies: SupplyData[];
  
  // Summary statistics
  summary: QREDataSummary;
}

export interface ResearchActivityData {
  id: string;
  name: string;
  practicePercent: number;
  nonRDTime: number;
  active: boolean;
  selectedRoles: string[];
  category?: string;
  area?: string;
  focus?: string;
  qraCompleted: boolean;
  totalAppliedPercent: number;
  subcomponentCount: number;
  stepCount: number;
}

export interface StepData {
  id: string;
  activityId: string;
  activityName: string;
  stepName: string;
  timePercent: number;
  isLocked: boolean;
  subcomponentCount: number;
  totalAppliedPercent: number;
}

export interface SubcomponentData {
  id: string;
  activityId: string;
  activityName: string;
  stepId: string;
  stepName: string;
  subcomponentName: string;
  phase: string;
  frequencyPercent: number;
  yearPercent: number;
  startYear: number;
  selectedRoles: string[];
  appliedPercent: number;
  isNonRD: boolean;
  category?: string;
  area?: string;
  focus?: string;
}

export interface EmployeeData {
  // Basic employee info
  id: string;
  firstName: string;
  lastName: string;
  wage: number;
  role: string;
  isBusinessOwner: boolean;
  isActive: boolean;
  isLocked: boolean;
  
  // Applied percentages and amounts
  appliedPercentage: number;
  appliedAmount: number;
  
  // Custom configurations
  customPracticePercentages: Record<string, number>;
  customTimePercentages: Record<string, Record<string, number>>;
  
  // Activity breakdowns
  activityBreakdowns: EmployeeActivityBreakdown[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeActivityBreakdown {
  activityId: string;
  activityName: string;
  practicePercent: number;
  timePercentages: Record<string, number>; // stepId -> percentage
  totalAppliedPercent: number;
  appliedAmount: number;
}

export interface ContractorData {
  // Basic contractor info
  id: string;
  contractorType: 'individual' | 'business';
  businessName?: string;
  firstName?: string;
  lastName?: string;
  wage: number;
  role: string;
  isOwner: boolean;
  isActive: boolean;
  isLocked: boolean;
  
  // Applied percentages and amounts
  appliedPercentage: number;
  appliedAmount: number;
  
  // Custom configurations
  customPracticePercentages: Record<string, number>;
  customTimePercentages: Record<string, Record<string, number>>;
  
  // Activity breakdowns
  activityBreakdowns: ContractorActivityBreakdown[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ContractorActivityBreakdown {
  activityId: string;
  activityName: string;
  practicePercent: number;
  timePercentages: Record<string, number>; // stepId -> percentage
  totalAppliedPercent: number;
  appliedAmount: number;
}

export interface SupplyData {
  // Basic supply info
  id: string;
  title: string;
  totalValue: number;
  category: string;
  isActive: boolean;
  isLocked: boolean;
  
  // Applied percentages and amounts
  appliedPercentage: number;
  appliedAmount: number;
  
  // Custom configurations
  customActivityPercentages: Record<string, number>;
  customSubcomponentPercentages: Record<string, Record<string, number>>;
  selectedSubcomponents: Record<string, string[]>;
  
  // Activity breakdowns
  activityBreakdowns: SupplyActivityBreakdown[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface SupplyActivityBreakdown {
  activityId: string;
  activityName: string;
  activityPercent: number;
  subcomponentPercentages: Record<string, number>; // subcomponentId -> percentage
  totalAppliedPercent: number;
  appliedAmount: number;
}

export interface QREDataSummary {
  // Employee statistics
  totalEmployees: number;
  activeEmployees: number;
  totalEmployeeWages: number;
  totalEmployeeAppliedAmount: number;
  averageEmployeeAppliedPercent: number;
  
  // Contractor statistics
  totalContractors: number;
  activeContractors: number;
  totalContractorWages: number;
  totalContractorAppliedAmount: number;
  averageContractorAppliedPercent: number;
  
  // Supply statistics
  totalSupplies: number;
  activeSupplies: number;
  totalSupplyCosts: number;
  totalSupplyAppliedAmount: number;
  averageSupplyAppliedPercent: number;
  
  // Overall statistics
  totalQRE: number;
  totalExpenses: number;
  overallAppliedPercent: number;
  
  // Activity statistics
  totalActivities: number;
  activitiesWithExpenses: number;
  totalPracticePercent: number;
  
  // Step statistics
  totalSteps: number;
  totalTimePercent: number;
  
  // Subcomponent statistics
  totalSubcomponents: number;
  rdSubcomponents: number;
  nonRdSubcomponents: number;
  totalFrequencyPercent: number;
}

// Service class for QRE data export
export class QREDataExportService {
  
  /**
   * Generate comprehensive QRE export data for a business and year
   */
  static generateExportData(
    businessId: string,
    businessName: string,
    year: number,
    employees: Employee[],
    contractors: Contractor[],
    supplies: Supply[],
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): QREDataExport {
    
    // Process research activities, steps, and subcomponents
    const researchActivities = this.processResearchActivities(activities, qraDataMap);
    const steps = this.processSteps(activities, qraDataMap);
    const subcomponents = this.processSubcomponents(activities, qraDataMap);
    
    // Process employees with activity breakdowns
    const employeeData = this.processEmployees(employees, activities, qraDataMap);
    
    // Process contractors with activity breakdowns
    const contractorData = this.processContractors(contractors, activities, qraDataMap);
    
    // Process supplies with activity breakdowns
    const supplyData = this.processSupplies(supplies, activities, qraDataMap);
    
    // Calculate summary statistics
    const summary = this.calculateSummary(
      employeeData,
      contractorData,
      supplyData,
      researchActivities,
      steps,
      subcomponents
    );
    
    return {
      businessId,
      businessName,
      year,
      exportTimestamp: new Date().toISOString(),
      researchActivities,
      steps,
      subcomponents,
      employees: employeeData,
      contractors: contractorData,
      supplies: supplyData,
      summary
    };
  }
  
  /**
   * Process research activities data
   */
  private static processResearchActivities(
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): ResearchActivityData[] {
    return activities.map(activity => {
      const qraData = qraDataMap[activity.name];
      const isQRACompleted = qraData && Object.keys(qraData.selectedSubcomponents).length > 0;
      
      return {
        id: activity.id,
        name: activity.name,
        practicePercent: activity.practicePercent || 0,
        nonRDTime: activity.nonRDTime || 0,
        active: activity.active !== undefined ? activity.active : true,
        selectedRoles: activity.selectedRoles || [],
        category: activity.category,
        area: activity.area,
        focus: activity.focus,
        qraCompleted: isQRACompleted,
        totalAppliedPercent: qraData?.totalAppliedPercent || 0,
        subcomponentCount: qraData ? Object.keys(qraData.selectedSubcomponents).length : 0,
        stepCount: qraData ? Object.keys(qraData.stepTimeMap || {}).length : 0
      };
    });
  }
  
  /**
   * Process steps data
   */
  private static processSteps(
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): StepData[] {
    const steps: StepData[] = [];
    
    activities.forEach(activity => {
      const qraData = qraDataMap[activity.name];
      
      if (qraData && qraData.stepTimeMap) {
        // Process steps for this activity
        Object.keys(qraData.stepTimeMap).forEach(stepName => {
          const stepId = `${activity.id}_${stepName}`;
          const stepSubcomponents = Object.values(qraData.selectedSubcomponents)
            .filter((sub: any) => sub.step === stepName);
          
          steps.push({
            id: stepId,
            activityId: activity.id,
            activityName: activity.name,
            stepName,
            timePercent: qraData.stepTimeMap![stepName] || 0,
            isLocked: qraData.stepTimeLocked?.[stepName] || false,
            subcomponentCount: stepSubcomponents.length,
            totalAppliedPercent: stepSubcomponents.reduce((sum: number, sub: any) => sum + (sub.appliedPercent || 0), 0)
          });
        });
      }
    });
    
    return steps;
  }
  
  /**
   * Process subcomponents data
   */
  private static processSubcomponents(
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): SubcomponentData[] {
    const subcomponents: SubcomponentData[] = [];
    
    activities.forEach(activity => {
      const qraData = qraDataMap[activity.name];
      
      if (qraData && qraData.selectedSubcomponents) {
        Object.entries(qraData.selectedSubcomponents).forEach(([subcomponentId, sub]: [string, any]) => {
          const stepId = `${activity.id}_${sub.step}`;
          
          subcomponents.push({
            id: subcomponentId,
            activityId: activity.id,
            stepId,
            activityName: activity.name,
            stepName: sub.step,
            subcomponentName: sub.subcomponent,
            phase: sub.phase,
            frequencyPercent: sub.frequencyPercent,
            yearPercent: sub.yearPercent,
            startYear: sub.startYear,
            selectedRoles: sub.selectedRoles || [],
            appliedPercent: sub.appliedPercent || 0,
            isNonRD: sub.isNonRD || false,
            category: activity.category,
            area: activity.area,
            focus: activity.focus
          });
        });
      }
    });
    
    return subcomponents;
  }
  
  /**
   * Process employees with activity breakdowns
   */
  private static processEmployees(
    employees: Employee[],
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): EmployeeData[] {
    return employees.map(employee => {
      const activityBreakdowns = this.calculateEmployeeActivityBreakdowns(
        employee,
        activities,
        qraDataMap
      );
      
      return {
        id: employee.id,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        wage: employee.wage,
        role: employee.roleId,
        isBusinessOwner: employee.isBusinessOwner,
        isActive: employee.isActive,
        isLocked: employee.isLocked,
        appliedPercentage: employee.appliedPercentage,
        appliedAmount: employee.appliedAmount,
        customPracticePercentages: employee.customPracticePercentages || {},
        customTimePercentages: employee.customTimePercentages || {},
        activityBreakdowns,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      };
    });
  }
  
  /**
   * Calculate employee activity breakdowns
   */
  private static calculateEmployeeActivityBreakdowns(
    employee: Employee,
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): EmployeeActivityBreakdown[] {
    const breakdowns: EmployeeActivityBreakdown[] = [];
    
    activities.forEach(activity => {
      const qraData = qraDataMap[activity.name];
      if (!qraData) return;
      
      // Get custom practice percentage or use default
      const practicePercent = employee.customPracticePercentages?.[activity.name] || 
                             activity.practicePercent || 0;
      
      // Calculate time percentages for each step
      const timePercentages: Record<string, number> = {};
      let totalAppliedPercent = 0;
      
      if (qraData.stepTimeMap) {
        Object.entries(qraData.stepTimeMap).forEach(([stepName, stepTimePercent]) => {
          const stepId = `${activity.id}_${stepName}`;
          const customTimePercent = (employee.customTimePercentages?.[activity.name]?.[stepId] as number) || 
                                   stepTimePercent;
          
          timePercentages[stepId] = customTimePercent;
          totalAppliedPercent += (practicePercent * customTimePercent) / 100;
        });
      }
      
      const appliedAmount = employee.wage * (totalAppliedPercent / 100);
      
      breakdowns.push({
        activityId: activity.id,
        activityName: activity.name,
        practicePercent,
        timePercentages,
        totalAppliedPercent,
        appliedAmount
      });
    });
    
    return breakdowns;
  }
  
  /**
   * Process contractors with activity breakdowns
   */
  private static processContractors(
    contractors: Contractor[],
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): ContractorData[] {
    return contractors.map(contractor => {
      const activityBreakdowns = this.calculateContractorActivityBreakdowns(
        contractor,
        activities,
        qraDataMap
      );
      return {
        id: contractor.id,
        contractorType: contractor.contractorType,
        businessName: contractor.businessName,
        firstName: contractor.firstName || '',
        lastName: contractor.lastName || '',
        wage: contractor.totalAmount,
        role: contractor.roleId,
        isOwner: false,
        isActive: contractor.isActive,
        isLocked: contractor.isLocked,
        appliedPercentage: contractor.appliedPercentage,
        appliedAmount: contractor.appliedAmount,
        customPracticePercentages: contractor.customPracticePercentages || {},
        customTimePercentages: contractor.customTimePercentages || {},
        activityBreakdowns,
        createdAt: contractor.createdAt,
        updatedAt: contractor.updatedAt
      };
    });
  }
  
  /**
   * Calculate contractor activity breakdowns
   */
  private static calculateContractorActivityBreakdowns(
    contractor: Contractor,
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): ContractorActivityBreakdown[] {
    const breakdowns: ContractorActivityBreakdown[] = [];
    
    activities.forEach(activity => {
      const qraData = qraDataMap[activity.name];
      if (!qraData) return;
      
      // Get custom practice percentage or use default
      const practicePercent = contractor.customPracticePercentages?.[activity.name] || 
                             activity.practicePercent || 0;
      
      // Calculate time percentages for each step
      const timePercentages: Record<string, number> = {};
      let totalAppliedPercent = 0;
      
      if (qraData.stepTimeMap) {
        Object.entries(qraData.stepTimeMap).forEach(([stepName, stepTimePercent]) => {
          const stepId = `${activity.id}_${stepName}`;
          const customTimePercent = (contractor.customTimePercentages?.[activity.name]?.[stepId] as number) || 
                                   stepTimePercent;
          
          timePercentages[stepId] = customTimePercent;
          totalAppliedPercent += (practicePercent * customTimePercent) / 100;
        });
      }
      
      const appliedAmount = contractor.totalAmount * (totalAppliedPercent / 100);
      
      breakdowns.push({
        activityId: activity.id,
        activityName: activity.name,
        practicePercent,
        timePercentages,
        totalAppliedPercent,
        appliedAmount
      });
    });
    
    return breakdowns;
  }
  
  /**
   * Process supplies with activity breakdowns
   */
  private static processSupplies(
    supplies: Supply[],
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): SupplyData[] {
    return supplies.map(supply => {
      const activityBreakdowns = this.calculateSupplyActivityBreakdowns(
        supply,
        activities,
        qraDataMap
      );
      
      return {
        id: supply.id,
        title: supply.title,
        totalValue: supply.totalValue,
        category: supply.category,
        isActive: supply.isActive,
        isLocked: supply.isLocked,
        appliedPercentage: supply.appliedPercentage,
        appliedAmount: supply.appliedAmount,
        customActivityPercentages: supply.customActivityPercentages || {},
        customSubcomponentPercentages: supply.customSubcomponentPercentages || {},
        selectedSubcomponents: supply.selectedSubcomponents || {},
        activityBreakdowns,
        createdAt: supply.createdAt,
        updatedAt: supply.updatedAt
      };
    });
  }
  
  /**
   * Calculate supply activity breakdowns
   */
  private static calculateSupplyActivityBreakdowns(
    supply: Supply,
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): SupplyActivityBreakdown[] {
    const breakdowns: SupplyActivityBreakdown[] = [];
    
    activities.forEach(activity => {
      const qraData = qraDataMap[activity.name];
      if (!qraData) return;
      
      // Get custom activity percentage or use default
      const activityPercent = supply.customActivityPercentages?.[activity.name] || 
                             activity.practicePercent || 0;
      
      // Calculate subcomponent percentages
      const subcomponentPercentages: Record<string, number> = {};
      let totalAppliedPercent = 0;
      
      if (qraData.selectedSubcomponents) {
        Object.entries(qraData.selectedSubcomponents).forEach(([subcomponentId, sub]: [string, any]) => {
          const customSubPercent = supply.customSubcomponentPercentages?.[activity.name]?.[subcomponentId] || 
                                  sub.frequencyPercent;
          
          subcomponentPercentages[subcomponentId] = customSubPercent;
          totalAppliedPercent += (activityPercent * customSubPercent) / 100;
        });
      }
      
      const appliedAmount = supply.totalValue * (totalAppliedPercent / 100);
      
      breakdowns.push({
        activityId: activity.id,
        activityName: activity.name,
        activityPercent,
        subcomponentPercentages,
        totalAppliedPercent,
        appliedAmount
      });
    });
    
    return breakdowns;
  }
  
  /**
   * Calculate comprehensive summary statistics
   */
  private static calculateSummary(
    employees: EmployeeData[],
    contractors: ContractorData[],
    supplies: SupplyData[],
    activities: ResearchActivityData[],
    steps: StepData[],
    subcomponents: SubcomponentData[]
  ): QREDataSummary {
    // Employee statistics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.isActive).length;
    const totalEmployeeWages = employees.reduce((sum, emp) => sum + emp.wage, 0);
    const totalEmployeeAppliedAmount = employees.reduce((sum, emp) => sum + emp.appliedAmount, 0);
    const averageEmployeeAppliedPercent = totalEmployees > 0 ? 
      employees.reduce((sum, emp) => sum + emp.appliedPercentage, 0) / totalEmployees : 0;
    
    // Contractor statistics
    const totalContractors = contractors.length;
    const activeContractors = contractors.filter(con => con.isActive).length;
    const totalContractorWages = contractors.reduce((sum, con) => sum + con.wage, 0);
    const totalContractorAppliedAmount = contractors.reduce((sum, con) => sum + con.appliedAmount, 0);
    const averageContractorAppliedPercent = totalContractors > 0 ? 
      contractors.reduce((sum, con) => sum + con.appliedPercentage, 0) / totalContractors : 0;
    
    // Supply statistics
    const totalSupplies = supplies.length;
    const activeSupplies = supplies.filter(sup => sup.isActive).length;
    const totalSupplyCosts = supplies.reduce((sum, sup) => sum + sup.totalValue, 0);
    const totalSupplyAppliedAmount = supplies.reduce((sum, sup) => sum + sup.appliedAmount, 0);
    const averageSupplyAppliedPercent = totalSupplies > 0 ? 
      supplies.reduce((sum, sup) => sum + sup.appliedPercentage, 0) / totalSupplies : 0;
    
    // Overall statistics
    const totalQRE = totalEmployeeAppliedAmount + totalContractorAppliedAmount + totalSupplyAppliedAmount;
    const totalExpenses = totalEmployeeWages + totalContractorWages + totalSupplyCosts;
    const overallAppliedPercent = totalExpenses > 0 ? (totalQRE / totalExpenses) * 100 : 0;
    
    // Activity statistics
    const totalActivities = activities.length;
    const activitiesWithExpenses = activities.filter(act => act.totalAppliedPercent > 0).length;
    const totalPracticePercent = activities.reduce((sum, act) => sum + act.practicePercent, 0);
    
    // Step statistics
    const totalSteps = steps.length;
    const totalTimePercent = steps.reduce((sum, step) => sum + step.timePercent, 0);
    
    // Subcomponent statistics
    const totalSubcomponents = subcomponents.length;
    const rdSubcomponents = subcomponents.filter(sub => !sub.isNonRD).length;
    const nonRdSubcomponents = subcomponents.filter(sub => sub.isNonRD).length;
    const totalFrequencyPercent = subcomponents.reduce((sum, sub) => sum + sub.frequencyPercent, 0);
    
    return {
      totalEmployees,
      activeEmployees,
      totalEmployeeWages,
      totalEmployeeAppliedAmount,
      averageEmployeeAppliedPercent,
      totalContractors,
      activeContractors,
      totalContractorWages,
      totalContractorAppliedAmount,
      averageContractorAppliedPercent,
      totalSupplies,
      activeSupplies,
      totalSupplyCosts,
      totalSupplyAppliedAmount,
      averageSupplyAppliedPercent,
      totalQRE,
      totalExpenses,
      overallAppliedPercent,
      totalActivities,
      activitiesWithExpenses,
      totalPracticePercent,
      totalSteps,
      totalTimePercent,
      totalSubcomponents,
      rdSubcomponents,
      nonRdSubcomponents,
      totalFrequencyPercent
    };
  }
  
  /**
   * Export data as CSV for external verification
   */
  static exportAsCSV(data: QREDataExport): string {
    const csvRows: string[] = [];
    
    // Add header with metadata
    csvRows.push('QRE Data Export - Comprehensive Data Dump for External Verification');
    csvRows.push(`Business: ${data.businessName}`);
    csvRows.push(`Year: ${data.year}`);
    csvRows.push(`Export Timestamp: ${data.exportTimestamp}`);
    csvRows.push('');
    
    // Research Activities
    csvRows.push('=== RESEARCH ACTIVITIES ===');
    csvRows.push('ID,Name,Practice Percent,Non-RD Time,Active,Selected Roles,Category,Area,Focus,QRA Completed,Total Applied Percent,Subcomponent Count,Step Count');
    data.researchActivities.forEach(activity => {
      csvRows.push([
        activity.id,
        `"${activity.name}"`,
        activity.practicePercent,
        activity.nonRDTime,
        activity.active,
        `"${activity.selectedRoles.join(';')}"`,
        activity.category || '',
        activity.area || '',
        activity.focus || '',
        activity.qraCompleted,
        activity.totalAppliedPercent,
        activity.subcomponentCount,
        activity.stepCount
      ].join(','));
    });
    csvRows.push('');
    
    // Steps
    csvRows.push('=== STEPS ===');
    csvRows.push('ID,Activity ID,Activity Name,Step Name,Time Percent,Is Locked,Subcomponent Count,Total Applied Percent');
    data.steps.forEach(step => {
      csvRows.push([
        step.id,
        step.activityId,
        `"${step.activityName}"`,
        `"${step.stepName}"`,
        step.timePercent,
        step.isLocked,
        step.subcomponentCount,
        step.totalAppliedPercent
      ].join(','));
    });
    csvRows.push('');
    
    // Subcomponents
    csvRows.push('=== SUBCOMPONENTS ===');
    csvRows.push('ID,Activity ID,Activity Name,Step ID,Step Name,Subcomponent Name,Phase,Frequency Percent,Year Percent,Start Year,Selected Roles,Applied Percent,Is Non-RD,Category,Area,Focus');
    data.subcomponents.forEach(sub => {
      csvRows.push([
        sub.id,
        sub.activityId,
        `"${sub.activityName}"`,
        sub.stepId,
        `"${sub.stepName}"`,
        `"${sub.subcomponentName}"`,
        sub.phase,
        sub.frequencyPercent,
        sub.yearPercent,
        sub.startYear,
        `"${sub.selectedRoles.join(';')}"`,
        sub.appliedPercent,
        sub.isNonRD,
        sub.category || '',
        sub.area || '',
        sub.focus || ''
      ].join(','));
    });
    csvRows.push('');
    
    // Employees
    csvRows.push('=== EMPLOYEES ===');
    csvRows.push('ID,First Name,Last Name,Wage,Role,Is Owner,Is Active,Is Locked,Applied Percentage,Applied Amount,Custom Practice Percentages,Custom Time Percentages,Created At,Updated At');
    data.employees.forEach(employee => {
      csvRows.push([
        employee.id,
        `"${employee.firstName}"`,
        `"${employee.lastName}"`,
        formatCurrency(employee.wage),
        `"${employee.role}"`,
        employee.isBusinessOwner,
        employee.isActive,
        employee.isLocked,
        formatPercent(employee.appliedPercentage),
        formatCurrency(employee.appliedAmount),
        `"${JSON.stringify(employee.customPracticePercentages)}"`,
        `"${JSON.stringify(employee.customTimePercentages)}"`,
        employee.createdAt,
        employee.updatedAt
      ].join(','));
    });
    csvRows.push('');
    
    // Employee Activity Breakdowns
    csvRows.push('=== EMPLOYEE ACTIVITY BREAKDOWNS ===');
    csvRows.push('Employee ID,Activity ID,Activity Name,Practice Percent,Time Percentages,Total Applied Percent,Applied Amount');
    data.employees.forEach(employee => {
      employee.activityBreakdowns.forEach(breakdown => {
        csvRows.push([
          employee.id,
          breakdown.activityId,
          `"${breakdown.activityName}"`,
          formatPercent(breakdown.practicePercent),
          `"${JSON.stringify(breakdown.timePercentages)}"`,
          formatPercent(breakdown.totalAppliedPercent),
          formatCurrency(breakdown.appliedAmount)
        ].join(','));
      });
    });
    csvRows.push('');
    
    // Contractors
    csvRows.push('=== CONTRACTORS ===');
    csvRows.push('ID,Name,Wage,Role,Is Active,Is Locked,Applied Percentage,Applied Amount,Custom Practice Percentages,Custom Time Percentages,Created At,Updated At');
    data.contractors.forEach(contractor => {
      // Use businessName if present, else first/last
      const name = contractor.contractorType === 'business'
        ? `"${contractor.businessName || ''}"`
        : `"${contractor.firstName || ''} ${contractor.lastName || ''}"`;
      csvRows.push([
        contractor.id,
        name,
        formatCurrency(contractor.wage),
        `"${contractor.role}"`,
        contractor.isActive,
        contractor.isLocked,
        formatPercent(contractor.appliedPercentage),
        formatCurrency(contractor.appliedAmount),
        `"${JSON.stringify(contractor.customPracticePercentages)}"`,
        `"${JSON.stringify(contractor.customTimePercentages)}"`,
        contractor.createdAt,
        contractor.updatedAt
      ].join(','));
    });
    csvRows.push('');
    
    // Contractor Activity Breakdowns
    csvRows.push('=== CONTRACTOR ACTIVITY BREAKDOWNS ===');
    csvRows.push('Contractor ID,Activity ID,Activity Name,Practice Percent,Time Percentages,Total Applied Percent,Applied Amount');
    data.contractors.forEach(contractor => {
      contractor.activityBreakdowns.forEach(breakdown => {
        csvRows.push([
          contractor.id,
          breakdown.activityId,
          `"${breakdown.activityName}"`,
          formatPercent(breakdown.practicePercent),
          `"${JSON.stringify(breakdown.timePercentages)}"`,
          formatPercent(breakdown.totalAppliedPercent),
          formatCurrency(breakdown.appliedAmount)
        ].join(','));
      });
    });
    csvRows.push('');
    
    // Supplies
    csvRows.push('=== SUPPLIES ===');
    csvRows.push('ID,Name,Cost,Category,Is Active,Is Locked,Applied Percentage,Applied Amount,Custom Activity Percentages,Custom Subcomponent Percentages,Selected Subcomponents,Created At,Updated At');
    data.supplies.forEach(supply => {
      csvRows.push([
        supply.id,
        `"${supply.title}"`,
        formatCurrency(supply.totalValue),
        `"${supply.category}"`,
        supply.isActive,
        supply.isLocked,
        formatPercent(supply.appliedPercentage),
        formatCurrency(supply.appliedAmount),
        `"${JSON.stringify(supply.customActivityPercentages)}"`,
        `"${JSON.stringify(supply.customSubcomponentPercentages)}"`,
        `"${JSON.stringify(supply.selectedSubcomponents)}"`,
        supply.createdAt,
        supply.updatedAt
      ].join(','));
    });
    csvRows.push('');
    
    // Supply Activity Breakdowns
    csvRows.push('=== SUPPLY ACTIVITY BREAKDOWNS ===');
    csvRows.push('Supply ID,Activity ID,Activity Name,Activity Percent,Subcomponent Percentages,Total Applied Percent,Applied Amount');
    data.supplies.forEach(supply => {
      supply.activityBreakdowns.forEach(breakdown => {
        csvRows.push([
          supply.id,
          breakdown.activityId,
          `"${breakdown.activityName}"`,
          formatPercent(breakdown.activityPercent),
          `"${JSON.stringify(breakdown.subcomponentPercentages)}"`,
          formatPercent(breakdown.totalAppliedPercent),
          formatCurrency(breakdown.appliedAmount)
        ].join(','));
      });
    });
    csvRows.push('');
    
    // Summary
    csvRows.push('=== SUMMARY STATISTICS ===');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Employees,${data.summary.totalEmployees}`);
    csvRows.push(`Active Employees,${data.summary.activeEmployees}`);
    csvRows.push(`Total Employee Wages,${formatCurrency(data.summary.totalEmployeeWages)}`);
    csvRows.push(`Total Employee Applied Amount,${formatCurrency(data.summary.totalEmployeeAppliedAmount)}`);
    csvRows.push(`Average Employee Applied Percent,${formatPercent(data.summary.averageEmployeeAppliedPercent)}`);
    csvRows.push(`Total Contractors,${data.summary.totalContractors}`);
    csvRows.push(`Active Contractors,${data.summary.activeContractors}`);
    csvRows.push(`Total Contractor Wages,${formatCurrency(data.summary.totalContractorWages)}`);
    csvRows.push(`Total Contractor Applied Amount,${formatCurrency(data.summary.totalContractorAppliedAmount)}`);
    csvRows.push(`Average Contractor Applied Percent,${formatPercent(data.summary.averageContractorAppliedPercent)}`);
    csvRows.push(`Total Supplies,${data.summary.totalSupplies}`);
    csvRows.push(`Active Supplies,${data.summary.activeSupplies}`);
    csvRows.push(`Total Supply Costs,${formatCurrency(data.summary.totalSupplyCosts)}`);
    csvRows.push(`Total Supply Applied Amount,${formatCurrency(data.summary.totalSupplyAppliedAmount)}`);
    csvRows.push(`Average Supply Applied Percent,${formatPercent(data.summary.averageSupplyAppliedPercent)}`);
    csvRows.push(`Total QRE,${formatCurrency(data.summary.totalQRE)}`);
    csvRows.push(`Total Expenses,${formatCurrency(data.summary.totalExpenses)}`);
    csvRows.push(`Overall Applied Percent,${formatPercent(data.summary.overallAppliedPercent)}`);
    csvRows.push(`Total Activities,${data.summary.totalActivities}`);
    csvRows.push(`Activities with Expenses,${data.summary.activitiesWithExpenses}`);
    csvRows.push(`Total Practice Percent,${formatPercent(data.summary.totalPracticePercent)}`);
    csvRows.push(`Total Steps,${data.summary.totalSteps}`);
    csvRows.push(`Total Time Percent,${formatPercent(data.summary.totalTimePercent)}`);
    csvRows.push(`Total Subcomponents,${data.summary.totalSubcomponents}`);
    csvRows.push(`RD Subcomponents,${data.summary.rdSubcomponents}`);
    csvRows.push(`Non-RD Subcomponents,${data.summary.nonRdSubcomponents}`);
    csvRows.push(`Total Frequency Percent,${formatPercent(data.summary.totalFrequencyPercent)}`);
    
    return csvRows.join('\n');
  }
  
  /**
   * Download the export as a CSV file
   */
  static downloadExport(data: QREDataExport, filename?: string): void {
    const csvContent = this.exportAsCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `qre-data-export-${data.businessName}-${data.year}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Export a normalized, row-based CSV with only selected activities, steps, and subcomponents.
   * Columns: Year, Research Activity Title, Research Activity Practice Percent, Step, Subcomponent Title, Subcomponent Year %, Subcomponent Frequency %, Subcomponent Time %, Role(s)
   */
  static exportNormalizedCSV(
    year: number,
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): string {
    const rows: string[] = [];
    // Header
    rows.push([
      'Year',
      'Research Activity Title',
      'Research Activity Practice Percent',
      'Step',
      'Subcomponent Title',
      'Subcomponent Year %',
      'Subcomponent Frequency %',
      'Subcomponent Time %',
      'Role(s)'
    ].join(','));

    // For each selected activity in qraDataMap
    Object.entries(qraDataMap).forEach(([activityKey, qra]) => {
      // Find the activity in the activities array (by id or name)
      const activity = activities.find(
        a => a.id === activityKey || a.name === activityKey
      );
      if (!activity || !qra.selectedSubcomponents) return;
      const activityTitle = activity.name;
      const practicePercent = qra.practicePercent ?? 0;
      // For each selected subcomponent
      Object.entries(qra.selectedSubcomponents).forEach(([subId, subSel]) => {
        // Find the subcomponent in the activity hierarchy if possible
        let stepName = subSel.step || '';
        let subcomponentTitle = subSel.subcomponent || '';
        let yearPercent = subSel.yearPercent ?? '';
        let frequencyPercent = subSel.frequencyPercent ?? '';
        let timePercent = subSel.timePercent ?? '';
        let roles = Array.isArray(subSel.selectedRoles)
          ? subSel.selectedRoles.join(', ')
          : (subSel.selectedRoles || '');
        // Fallback: try to get step/subcomponent names from activity if missing
        if ((!stepName || !subcomponentTitle) && activity.steps) {
          for (const step of activity.steps) {
            if (step.subcomponents) {
              const found = step.subcomponents.find(
                (sc: any) => sc.id === subId || sc.name === subId
              );
              if (found) {
                stepName = step.name;
                subcomponentTitle = found.name;
                break;
              }
            }
          }
        }
        rows.push([
          year,
          `"${activityTitle}"`,
          practicePercent,
          `"${stepName}"`,
          `"${subcomponentTitle}"`,
          yearPercent,
          frequencyPercent,
          timePercent,
          `"${roles}"`
        ].join(','));
      });
    });
    return rows.join('\n');
  }

  /**
   * Export a normalized, row-based JSON with only selected activities, steps, and subcomponents.
   * Each object has: year, activityTitle, practicePercent, step, subcomponentTitle, yearPercent, frequencyPercent, timePercent, roles
   */
  static exportNormalizedJSON(
    year: number,
    activities: any[],
    qraDataMap: Record<string, SubcomponentSelectionData>
  ): string {
    const result: any[] = [];
    Object.entries(qraDataMap).forEach(([activityKey, qra]) => {
      const activity = activities.find(
        a => a.id === activityKey || a.name === activityKey
      );
      if (!activity || !qra.selectedSubcomponents) return;
      const activityTitle = activity.name;
      const practicePercent = qra.practicePercent ?? 0;
      Object.entries(qra.selectedSubcomponents).forEach(([subId, subSel]) => {
        let stepName = subSel.step || '';
        let subcomponentTitle = subSel.subcomponent || '';
        let yearPercent = subSel.yearPercent ?? '';
        let frequencyPercent = subSel.frequencyPercent ?? '';
        let timePercent = subSel.timePercent ?? '';
        let roles = Array.isArray(subSel.selectedRoles)
          ? subSel.selectedRoles.join(', ')
          : (subSel.selectedRoles || '');
        if ((!stepName || !subcomponentTitle) && activity.steps) {
          for (const step of activity.steps) {
            if (step.subcomponents) {
              const found = step.subcomponents.find(
                (sc: any) => sc.id === subId || sc.name === subId
              );
              if (found) {
                stepName = step.name;
                subcomponentTitle = found.name;
                break;
              }
            }
          }
        }
        result.push({
          year,
          activityTitle,
          practicePercent,
          step: stepName,
          subcomponentTitle,
          yearPercent,
          frequencyPercent,
          timePercent,
          roles
        });
      });
    });
    return JSON.stringify(result, null, 2);
  }
}

// Helper functions for formatting
function formatCurrency(value: number): string {
  if (isNaN(value)) return '';
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function formatPercent(value: number): string {
  if (isNaN(value)) return '';
  return `${value.toFixed(2)}%`;
}
