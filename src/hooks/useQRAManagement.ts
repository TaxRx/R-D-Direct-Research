import { useState, useEffect, useCallback, useMemo } from 'react';
import { QRAModalData } from '../components/qra/QRAModal/QRAModal';
import { Employee, Contractor, Supply } from '../types/Employee';
import { Business } from '../types/Business';
import { ExpensesService } from '../services/expensesService';
import { useQRACalculations } from './expenses/useQRACalculations';
import { useActivityCalculations } from './expenses/useActivityCalculations';

// Types
interface QRAData {
  [businessId: string]: {
    [year: string]: {
      [activity: string]: QRAModalData;
    };
  };
}

interface QRAState {
  qrasByYear: Record<string, string[]>;
  qraSliderByYear: Record<string, Record<string, { value: number; locked: boolean }>>;
  nonRDByYear: Record<string, number>;
}

interface UseQRAManagementProps {
  businessId: string;
  year: string;
  businesses: any[];
  setBusinesses: (updater: (prev: any[]) => any[]) => void;
}

export const useQRAManagement = ({
  businessId,
  year,
  businesses,
  setBusinesses
}: UseQRAManagementProps) => {
  
  // Get current business data
  const selectedBusiness = useMemo(() => 
    businesses.find(b => b.id === businessId),
    [businesses, businessId]
  );

  // QRA Lists
  const addedQRAs = useMemo(() => 
    selectedBusiness?.qrasByYear?.[year] || [],
    [selectedBusiness, year]
  );

  // QRA Slider State
  const qraSliderState = useMemo(() => 
    selectedBusiness?.qraSliderByYear?.[year] || {},
    [selectedBusiness, year]
  );

  // Non-R&D Time
  const nonRDTime = useMemo(() => 
    selectedBusiness?.nonRDByYear?.[year] ?? 10,
    [selectedBusiness, year]
  );

  // QRA Modal Data Persistence
  const getQRAModalData = useCallback((activity: string): QRAModalData | undefined => {
    const storageKey = `qra_data_${businessId}_${year}_${activity}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : undefined;
  }, [businessId, year]);

  const saveQRAModalData = useCallback((activity: string, data: QRAModalData) => {
    const storageKey = `qra_data_${businessId}_${year}_${activity}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [businessId, year]);

  // QRA Management Functions
  const handleAddQRA = useCallback((activity: string) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === businessId) {
        const qrasByYear = { ...(b.qrasByYear || {}) };
        const yearQRAs = [...(qrasByYear[year] || [])];
        
        if (!yearQRAs.includes(activity)) {
          yearQRAs.push(activity);
          qrasByYear[year] = yearQRAs;
        }
        
        return { ...b, qrasByYear };
      }
      return b;
    }));
  }, [setBusinesses, businessId, year]);

  const handleRemoveQRA = useCallback((activity: string) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === businessId) {
        const qrasByYear = { ...(b.qrasByYear || {}) };
        const yearQRAs = [...(qrasByYear[year] || [])];
        const index = yearQRAs.indexOf(activity);
        
        if (index > -1) {
          yearQRAs.splice(index, 1);
          qrasByYear[year] = yearQRAs;
        }
        
        return { ...b, qrasByYear };
      }
      return b;
    }));

    // Clean up stored modal data
    const storageKey = `qra_data_${businessId}_${year}_${activity}`;
    localStorage.removeItem(storageKey);
  }, [setBusinesses, businessId, year]);

  // QRA Slider Management
  const handleQRASliderChange = useCallback((activity: string, value: number) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === businessId) {
        const qraSliderByYear = { ...(b.qraSliderByYear || {}) };
        const yearState = { ...(qraSliderByYear[year] || {}) };
        
        yearState[activity] = { value, locked: true };
        qraSliderByYear[year] = yearState;
        
        return { ...b, qraSliderByYear };
      }
      return b;
    }));
  }, [setBusinesses, businessId, year]);

  // Non-R&D Time Management
  const handleNonRDTimeChange = useCallback((newNonRDTime: number) => {
    setBusinesses(prev => prev.map(b => {
      if (b.id === businessId) {
        const nonRDByYear = { ...(b.nonRDByYear || {}) };
        nonRDByYear[year] = newNonRDTime;
        return { ...b, nonRDByYear };
      }
      return b;
    }));
  }, [setBusinesses, businessId, year]);

  // Calculate QRA Percentages with Pro-rata Distribution
  const getQraPercentages = useCallback(() => {
    const available = 100 - nonRDTime;
    const locked = addedQRAs.filter((activity: string) => qraSliderState[activity]?.locked);
    const unlocked = addedQRAs.filter((activity: string) => !qraSliderState[activity]?.locked);
    
    const lockedTotal = locked.reduce((sum: number, activity: string) => 
      sum + (qraSliderState[activity]?.value || 0), 0
    );
    
    const remaining = Math.max(0, available - lockedTotal);
    const unlockedValue = unlocked.length > 0 ? remaining / unlocked.length : 0;
    
    const result: Record<string, { value: number; locked: boolean }> = {};
    
    locked.forEach((activity: string) => {
      result[activity] = {
        value: qraSliderState[activity]?.value || 0,
        locked: true
      };
    });
    
    unlocked.forEach((activity: string) => {
      result[activity] = {
        value: unlockedValue,
        locked: false
      };
    });
    
    return result;
  }, [addedQRAs, qraSliderState, nonRDTime]);

  // Calculate Applied Percentages
  const calculateAppliedPercentages = useCallback(() => {
    const appliedPercentages: Record<string, number> = {};
    const qraPercentages = getQraPercentages();
    
    addedQRAs.forEach((activity: string) => {
      const modalData = getQRAModalData(activity);
      const practicePercent = qraPercentages[activity]?.value || 0;
      
      if (modalData) {
        let totalApplied = 0;
        
        Object.entries(modalData.selectedSubcomponents).forEach(([key, selection]) => {
          const metrics = modalData.metrics[key];
          if (metrics) {
            const applied = (practicePercent * metrics.frequencyPercent * metrics.yearPercent) / 10000;
            totalApplied += applied;
          }
        });
        
        appliedPercentages[activity] = Math.min(practicePercent, totalApplied);
      } else {
        appliedPercentages[activity] = 0;
      }
    });
    
    return appliedPercentages;
  }, [addedQRAs, getQRAModalData, getQraPercentages]);

  // Initialize business data structure if needed
  useEffect(() => {
    if (selectedBusiness && !selectedBusiness.qrasByYear) {
      setBusinesses(prev => prev.map(b => {
        if (b.id === businessId) {
          return {
            ...b,
            qrasByYear: { [year]: [] },
            qraSliderByYear: { [year]: {} },
            nonRDByYear: { [year]: 10 }
          };
        }
        return b;
      }));
    }
  }, [selectedBusiness, businessId, year, setBusinesses]);

  return {
    // Data
    addedQRAs,
    qraSliderState,
    nonRDTime,
    
    // Calculated Values
    qraPercentages: getQraPercentages(),
    appliedPercentages: calculateAppliedPercentages(),
    
    // Actions
    handleAddQRA,
    handleRemoveQRA,
    handleQRASliderChange,
    handleNonRDTimeChange,
    
    // Modal Data Management
    getQRAModalData,
    saveQRAModalData,
    
    // Utilities
    getQraPercentages,
    calculateAppliedPercentages
  };
}; 