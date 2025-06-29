import { useState, useEffect, useRef, useCallback } from 'react';
import { QRABuilderService } from '../services/qrabuilderService';
import { SubcomponentSelectionData } from '../types/QRABuilderInterfaces';

interface UseQRADataLoadingProps {
  selectedBusinessId: string;
  selectedYear: number;
  activities: Array<{ name: string; active: boolean }>;
}

export const useQRADataLoading = ({ selectedBusinessId, selectedYear, activities }: UseQRADataLoadingProps) => {
  const [qraDataCache, setQraDataCache] = useState<Record<string, SubcomponentSelectionData>>({});
  const [loadingQRAData, setLoadingQRAData] = useState(false);
  
  // Ref to track which activities have been loaded to prevent duplicate loading
  const loadedActivitiesRef = useRef<{
    set: Set<string>;
    activityNamesString: string;
  }>({ set: new Set(), activityNamesString: '' });

  // Load QRA data for a specific activity
  const loadQRADataForActivity = useCallback(async (activityName: string): Promise<SubcomponentSelectionData | null> => {
    if (!selectedBusinessId || !selectedYear) return null;
    
    try {
      console.log(`[QRABuilderService] Loading QRA data for activity: ${activityName}`);
      const qraData = await QRABuilderService.loadQRAData(selectedBusinessId, selectedYear, activityName);
      
      if (qraData) {
        console.log(`[QRABuilderService] QRA data loaded for activity: ${activityName}`);
        return qraData;
      } else {
        console.log(`[QRABuilderService] No QRA data found for activity: ${activityName}`);
        return null;
      }
    } catch (error) {
      console.error(`[QRABuilderService] Error loading QRA data for activity ${activityName}:`, error);
      return null;
    }
  }, [selectedBusinessId, selectedYear]);

  // Load QRA data for all activities when business/year changes
  useEffect(() => {
    const loadAllQRAData = async () => {
      if (!selectedBusinessId || !selectedYear || activities.length === 0) return;
      
      setLoadingQRAData(true);
      console.log(`[useQRADataLoading] Loading QRA data for all activities (${activities.length} activities)`);
      
      // Clear cache and loaded activities tracking
      setQraDataCache({});
      loadedActivitiesRef.current.set.clear();
      loadedActivitiesRef.current.activityNamesString = '';
      
      // Load QRA data for all active activities
      for (const activity of activities) {
        if (activity.active) {
          try {
            const qraData = await loadQRADataForActivity(activity.name);
            if (qraData) {
              setQraDataCache(prev => ({
                ...prev,
                [activity.name]: qraData
              }));
              loadedActivitiesRef.current.set.add(activity.name);
            }
          } catch (error) {
            console.error(`[useQRADataLoading] Error loading QRA data for ${activity.name}:`, error);
          }
        }
      }
      
      setLoadingQRAData(false);
    };

    loadAllQRAData();
  }, [selectedBusinessId, selectedYear]); // Only depend on business/year changes

  // Load QRA data for new activities when activities list changes
  useEffect(() => {
    const loadNewActivitiesQRAData = async () => {
      if (!selectedBusinessId || !selectedYear || activities.length === 0) return;
      
      // Use a ref to track if we've already processed the current activities
      const currentActivityNames = activities.map(a => a.name).join(',');
      if (currentActivityNames !== loadedActivitiesRef.current.activityNamesString) {
        loadedActivitiesRef.current.activityNamesString = currentActivityNames;
        
        // Only load QRA data for active activities that don't already have cached data
        for (const activity of activities) {
          if (activity.active && !loadedActivitiesRef.current.set.has(activity.name)) {
            try {
              console.log(`[useQRADataLoading] Loading QRA data for new activity: ${activity.name}`);
              const qraData = await loadQRADataForActivity(activity.name);
              if (qraData) {
                setQraDataCache(prev => ({
                  ...prev,
                  [activity.name]: qraData
                }));
                loadedActivitiesRef.current.set.add(activity.name);
              }
            } catch (error) {
              console.error(`[useQRADataLoading] Error loading QRA data for new activity ${activity.name}:`, error);
            }
          }
        }
      }
    };

    loadNewActivitiesQRAData();
  }, [activities.map(a => a.name).join(',')]); // Only depend on activity names string

  // Function to refresh QRA data for a specific activity
  const refreshQRADataForActivity = useCallback(async (activityName: string) => {
    if (!selectedBusinessId || !selectedYear) return;
    
    try {
      console.log(`[useQRADataLoading] Refreshing QRA data for activity: ${activityName}`);
      const qraData = await loadQRADataForActivity(activityName);
      
      setQraDataCache(prev => ({
        ...prev,
        [activityName]: qraData || prev[activityName]
      }));
      
      // Mark as loaded
      loadedActivitiesRef.current.set.add(activityName);
    } catch (error) {
      console.error(`[useQRADataLoading] Error refreshing QRA data for ${activityName}:`, error);
    }
  }, [selectedBusinessId, selectedYear, loadQRADataForActivity]);

  // Function to update QRA data in cache
  const updateQRADataInCache = useCallback((activityName: string, qraData: SubcomponentSelectionData) => {
    setQraDataCache(prev => ({
      ...prev,
      [activityName]: qraData
    }));
  }, []);

  return {
    qraDataCache,
    loadingQRAData,
    loadQRADataForActivity,
    refreshQRADataForActivity,
    updateQRADataInCache
  };
}; 