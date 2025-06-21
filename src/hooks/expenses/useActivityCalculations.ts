import { useCallback } from 'react';
import { Business } from '../../types/Business';
import { Employee, Contractor, OTHER_ROLE } from '../../types/Employee';

/**
 * Custom hook for activity-related calculations
 * Extracts activity calculation logic from RDExpensesTab
 */
export const useActivityCalculations = (
  selectedBusinessId: string,
  selectedYear: number,
  businesses: Business[]
) => {
  /**
   * Get activities for an employee's role - loads from Activities tab data
   */
  const getEmployeeActivities = useCallback((employee: Employee) => {
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    // Get QRA slider state from Activities tab business object (correct source)
    const qraSliderState = business?.qraSliderByYear?.[selectedYear] || {};
    
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
        // Get practice percentage
        let storedPracticePercent = activity.practicePercent || 0;
        
        // For "Other" role, use 100% practice percentage (full activity percentage)
        if (employee.roleId === OTHER_ROLE.id) {
          storedPracticePercent = 100;
        }
        
        const currentPracticePercent = qraSliderState[activityId]?.value !== undefined 
          ? qraSliderState[activityId].value 
          : storedPracticePercent;
        
        employeeActivities.push({
          id: activityId,
          name: activity.name,
          defaultPracticePercent: storedPracticePercent,
          currentPracticePercent: currentPracticePercent,
          appliedPercent: activity.appliedPercent || 0,
          activityData: activity
        });
      }
    });
    
    return employeeActivities;
  }, [businesses, selectedBusinessId, selectedYear]);

  /**
   * Get activities for a contractor's role
   */
  const getContractorActivities = useCallback((contractor: Contractor) => {
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    // Get QRA slider state from Activities tab business object
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
          appliedPercent: activity.appliedPercent || 0,
          activityData: activity
        });
      }
    });
    
    return contractorActivities;
  }, [businesses, selectedBusinessId, selectedYear]);

  /**
   * Get activities for supplies (all activities are available for supplies)
   */
  const getSupplyActivities = useCallback(() => {
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    return Object.entries(activities)
      .filter(([_, activity]: [string, any]) => activity.active !== false)
      .map(([activityId, activity]: [string, any]) => ({
        id: activityId,
        name: activity.name,
        appliedPercent: activity.appliedPercent || 0,
        activityData: activity
      }));
  }, [businesses, selectedBusinessId, selectedYear]);

  /**
   * Get subcomponents for a specific activity
   */
  const getActivitySubcomponents = useCallback((activityName: string) => {
    const business = businesses.find(b => b.id === selectedBusinessId);
    const yearData = business?.years?.[selectedYear];
    const activities = yearData?.activities || {};
    
    const activity = Object.values(activities).find((act: any) => act.name === activityName);
    return activity?.subcomponents || [];
  }, [businesses, selectedBusinessId, selectedYear]);

  /**
   * Get a color for an activity based on its position in the activities list
   */
  const getActivityColor = useCallback((activityName: string, allActivities: any[]): string => {
    const colors = [
      '#1976d2', // Blue
      '#2e7d32', // Green
      '#ed6c02', // Orange
      '#9c27b0', // Purple
      '#d32f2f', // Red
      '#00796b', // Teal
      '#5d4037', // Brown
      '#455a64', // Blue Grey
      '#e65100', // Deep Orange
      '#6a1b9a', // Deep Purple
    ];
    
    const activityIndex = allActivities.findIndex(activity => activity.name === activityName);
    return colors[activityIndex % colors.length] || colors[0];
  }, []);

  return {
    getEmployeeActivities,
    getContractorActivities,
    getSupplyActivities,
    getActivitySubcomponents,
    getActivityColor
  };
}; 