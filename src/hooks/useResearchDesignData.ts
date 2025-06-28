import { useState, useEffect } from 'react';
import { ResearchStep } from '../types/ReportQRA';
import { loadResearchDesign, convertActivityToResearchSteps } from '../services/researchDesignService';
import { QRAActivityData } from '../types/ReportQRA';

export const useResearchDesignData = (
  activity: QRAActivityData,
  selectedYear: number,
  businessId: string,
  year: number
) => {
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSteps = () => {
      setLoading(true);
      setError(null);
      
      try {
        const savedSteps = loadResearchDesign(activity.id, selectedYear);
        let loadedSteps: ResearchStep[];
        
        if (savedSteps.length > 0) {
          loadedSteps = savedSteps;
        } else {
          loadedSteps = convertActivityToResearchSteps(activity, businessId, year);
        }
        
        setSteps(loadedSteps);
      } catch (err) {
        console.error('Error loading research design data:', err);
        setError('Failed to load research design data');
      } finally {
        setLoading(false);
      }
    };

    if (activity && businessId && year) {
      loadSteps();
    }
  }, [activity, selectedYear, businessId, year]);

  return {
    steps,
    loading,
    error,
    setSteps
  };
}; 