import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { ModalHierarchy, SubcomponentMetrics, SubcomponentSelection } from '../types';

interface UseWizardStateProps {
  activity: string;
  csvRows: any[];
}

interface UseWizardStateReturn {
  modalHierarchyState: ModalHierarchy;
  selectedModalSubs: Record<string, SubcomponentSelection>;
  setSelectedModalSubs: Dispatch<SetStateAction<Record<string, SubcomponentSelection>>>;
  modalMetrics: Record<string, SubcomponentMetrics>;
  setModalMetrics: Dispatch<SetStateAction<Record<string, SubcomponentMetrics>>>;
  modalNonRD: number;
  setModalNonRD: (value: number) => void;
  enabledSteps: Record<string, boolean>;
  setEnabledSteps: (steps: Record<string, boolean>) => void;
  lockedSteps: Record<string, boolean>;
  setLockedSteps: (steps: Record<string, boolean>) => void;
  customStepTimes: Record<string, number>;
  setCustomStepTimes: Dispatch<SetStateAction<Record<string, number>>>;
  openStep: string | null;
  setOpenStep: (step: string | null) => void;
  resetState: () => void;
}

export function useWizardState({ activity, csvRows }: UseWizardStateProps): UseWizardStateReturn {
  const [modalHierarchyState, setModalHierarchyState] = useState<ModalHierarchy>({});
  const [selectedModalSubs, setSelectedModalSubs] = useState<Record<string, SubcomponentSelection>>({});
  const [modalMetrics, setModalMetrics] = useState<Record<string, SubcomponentMetrics>>({});
  const [modalNonRD, setModalNonRD] = useState(0);
  const [enabledSteps, setEnabledSteps] = useState<Record<string, boolean>>({});
  const [lockedSteps, setLockedSteps] = useState<Record<string, boolean>>({});
  const [customStepTimes, setCustomStepTimes] = useState<Record<string, number>>({});
  const [openStep, setOpenStep] = useState<string | null>(null);

  // Helper function to structure the modal hierarchy
  const getModalHierarchy = (activity: string, rows: any[]): ModalHierarchy => {
    const hierarchy: ModalHierarchy = {};
    
    rows.forEach(row => {
      if (row.Activity === activity) {
        const phase = row.Phase || 'Uncategorized';
        const step = row.Step || 'Uncategorized';
        
        if (!hierarchy[phase]) {
          hierarchy[phase] = {};
        }
        if (!hierarchy[phase][step]) {
          hierarchy[phase][step] = [];
        }
        
        hierarchy[phase][step].push({
          id: row.ID || String(Math.random()),
          name: row.Subcomponent || 'Unnamed',
          description: row.Description || '',
          metrics: {
            time: row.Time || 0,
            frequency: row.Frequency || 0,
            year: row.Year || 0
          }
        });
      }
    });
    
    return hierarchy;
  };

  // Initialize modal hierarchy when activity changes
  useEffect(() => {
    if (activity && csvRows.length > 0) {
      const hierarchy = getModalHierarchy(activity, csvRows);
      setModalHierarchyState(hierarchy);
    }
  }, [activity, csvRows]);

  const resetState = () => {
    setSelectedModalSubs({});
    setModalMetrics({});
    setModalNonRD(0);
    setEnabledSteps({});
    setLockedSteps({});
    setCustomStepTimes({});
    setOpenStep(null);
  };

  return {
    modalHierarchyState,
    selectedModalSubs,
    setSelectedModalSubs,
    modalMetrics,
    setModalMetrics,
    modalNonRD,
    setModalNonRD,
    enabledSteps,
    setEnabledSteps,
    lockedSteps,
    setLockedSteps,
    customStepTimes,
    setCustomStepTimes,
    openStep,
    setOpenStep,
    resetState
  };
} 