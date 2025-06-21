import { useCallback } from 'react';
import { SubcomponentSelectionData } from '../../components/qra/SimpleQRAModal';

/**
 * Custom hook for QRA (Qualified Research Activities) calculations
 * Extracts the complex QRA formula calculations from RDExpensesTab
 */
export const useQRACalculations = (
  selectedBusinessId: string,
  selectedYear: number
) => {
  /**
   * Get QRA data for a specific activity from localStorage
   */
  const getQRAData = useCallback((activityName: string): SubcomponentSelectionData | null => {
    try {
      const qraData = localStorage.getItem(`qra_${selectedBusinessId}_${selectedYear}_${activityName}`);
      return qraData ? JSON.parse(qraData) : null;
    } catch (error) {
      console.error('Error loading QRA data:', error);
      return null;
    }
  }, [selectedBusinessId, selectedYear]);

  /**
   * Get the applied percentage for a specific activity
   * This uses the baseline applied percentage from Activities tab
   */
  const getAppliedPercentage = useCallback((activityName: string): number => {
    const qraData = getQRAData(activityName);
    return qraData?.totalAppliedPercent || 0;
  }, [getQRAData]);

  /**
   * Calculate applied percentage for a single activity using full QRA formula
   * This is the core QRA calculation: (Practice × Time × Frequency × Year) / 1,000,000
   */
  const calculateActivityAppliedPercentage = useCallback((
    activity: any,
    practicePercentages: Record<string, number> = {},
    timePercentages: Record<string, Record<string, number>> = {}
  ): number => {
    let contributedApplied = 0;
    
    if (practicePercentages[activity.name] !== undefined) {
      // Modal is open and user has adjusted practice percentage sliders
      const basePracticePercent = practicePercentages[activity.name];
      
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
            const activityTimePercentages = timePercentages[activity.name];
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
      contributedApplied = activity.appliedPercent || 0;
    }
    
    return contributedApplied;
  }, [getQRAData]);

  /**
   * Calculate the total applied percentage for an employee across all their activities
   */
  const calculateEmployeeAppliedPercentage = useCallback((
    employee: any,
    activities: any[],
    practicePercentages: Record<string, number> = {},
    timePercentages: Record<string, Record<string, number>> = {}
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
  }, [calculateActivityAppliedPercentage]);

  /**
   * Calculate the total applied percentage for a contractor across all their activities
   */
  const calculateContractorAppliedPercentage = useCallback((
    contractor: any,
    activities: any[],
    practicePercentages: Record<string, number> = {},
    timePercentages: Record<string, Record<string, number>> = {}
  ): number => {
    if (!activities || activities.length === 0) {
      return 0;
    }

    let totalApplied = 0;
    
    activities.forEach(activity => {
      const contributedApplied = calculateActivityAppliedPercentage(activity, practicePercentages, timePercentages);
      totalApplied += contributedApplied;
    });
    
    // Apply 65% rule for contractors
    return totalApplied * 0.65;
  }, [calculateActivityAppliedPercentage]);

  /**
   * Calculate the total applied percentage for a supply across all its activities
   */
  const calculateSupplyAppliedPercentage = useCallback((
    supply: any,
    activities: any[],
    activityPercentages: Record<string, number> = {}
  ): number => {
    if (!activities || activities.length === 0) {
      return 0;
    }

    let totalApplied = 0;
    
    activities.forEach(activity => {
      const activityPercentage = activityPercentages[activity.name] || 0;
      const appliedPercentage = activity.appliedPercent || 0;
      
      // Calculate supply's contribution to this activity
      const supplyContribution = (activityPercentage / 100) * appliedPercentage;
      totalApplied += supplyContribution;
    });
    
    return totalApplied;
  }, []);

  return {
    getQRAData,
    getAppliedPercentage,
    calculateActivityAppliedPercentage,
    calculateEmployeeAppliedPercentage,
    calculateContractorAppliedPercentage,
    calculateSupplyAppliedPercentage
  };
}; 