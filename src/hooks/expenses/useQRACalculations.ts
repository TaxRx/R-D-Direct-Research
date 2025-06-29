import { useCallback, useState, useEffect } from 'react';
import { SubcomponentSelectionData } from '../../types/QRABuilderInterfaces';
import { loadQRADataFromSupabase } from '../../services/qraDataService';
import { QRABuilderService } from '../../services/qrabuilderService';

/**
 * Custom hook for QRA (Qualified Research Activities) calculations
 * Extracts the complex QRA formula calculations from RDExpensesTab
 */
export const useQRACalculations = (
  selectedBusinessId: string,
  selectedYear: number
) => {
  const [qraDataCache, setQraDataCache] = useState<Record<string, SubcomponentSelectionData | null>>({});
  const [loadingCache, setLoadingCache] = useState<Record<string, boolean>>({});

  /**
   * Get QRA data for a specific activity from Supabase with localStorage fallback
   */
  const getQRAData = useCallback(async (activityName: string): Promise<SubcomponentSelectionData | null> => {
    try {
      // Check cache first
      if (qraDataCache[activityName] !== undefined) {
        return qraDataCache[activityName];
      }

      // Check if already loading
      if (loadingCache[activityName]) {
        return null;
      }

      // Set loading state
      setLoadingCache(prev => ({ ...prev, [activityName]: true }));

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
        setLoadingCache(prev => ({ ...prev, [activityName]: false }));
        return null;
      }
      
      const activityId = activityEntry[0];

      // Try Supabase first using the new service
      try {
        const supabaseData = await QRABuilderService.loadQRAData(selectedBusinessId, selectedYear, activityId);
      
      if (supabaseData) {
        // Cache the result
        setQraDataCache(prev => ({ ...prev, [activityName]: supabaseData }));
        setLoadingCache(prev => ({ ...prev, [activityName]: false }));
        return supabaseData;
        }
      } catch (error) {
        console.warn(`Error loading from Supabase for ${activityName}:`, error);
      }

      // Fallback to localStorage
      const localStorageData = localStorage.getItem(`qra_${selectedBusinessId}_${selectedYear}_${activityId}`);
      const parsedData = localStorageData ? JSON.parse(localStorageData) : null;
      
      // Cache the result
      setQraDataCache(prev => ({ ...prev, [activityName]: parsedData }));
      setLoadingCache(prev => ({ ...prev, [activityName]: false }));
      
      return parsedData;
    } catch (error) {
      console.error('Error loading QRA data:', error);
      setLoadingCache(prev => ({ ...prev, [activityName]: false }));
      return null;
    }
  }, [selectedBusinessId, selectedYear, qraDataCache, loadingCache]);

  /**
   * Synchronous version for immediate access (uses cache only)
   */
  const getQRADataSync = useCallback((activityName: string): SubcomponentSelectionData | null => {
    return qraDataCache[activityName] || null;
  }, [qraDataCache]);

  /**
   * Get the applied percentage for a specific activity
   * This uses the baseline applied percentage from Activities tab
   */
  const getAppliedPercentage = useCallback((activityName: string): number => {
    const qraData = getQRADataSync(activityName);
    return qraData?.totalAppliedPercent || 0;
  }, [getQRADataSync]);

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
      const qraData = getQRADataSync(activity.name);
      
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
  }, [getQRADataSync]);

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

  /**
   * Clear cache when business or year changes
   */
  useEffect(() => {
    setQraDataCache({});
    setLoadingCache({});
  }, [selectedBusinessId, selectedYear]);

  return {
    getQRAData,
    getQRADataSync,
    getAppliedPercentage,
    calculateActivityAppliedPercentage,
    calculateEmployeeAppliedPercentage,
    calculateContractorAppliedPercentage,
    calculateSupplyAppliedPercentage
  };
}; 