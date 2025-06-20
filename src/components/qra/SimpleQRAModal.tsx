import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Slider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { parseResearchApiCsv } from '../../utils/parseResearchApi';

// Types
export interface SimpleQRAModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: SubcomponentSelectionData) => void;
  activity: string;
  currentYear: number;
  practicePercent: number;
  selectedRoles?: string[]; // Roles from parent activity
  initialData?: SubcomponentSelectionData | null; // Existing QRA data to initialize with
}

export interface SubcomponentSelectionData {
  // Core selection data
  selectedSubcomponents: Record<string, SubcomponentConfig>;
  totalAppliedPercent: number;
  stepFrequencies: Record<string, number>;
  stepTimeMap: Record<string, number>; // Step time allocation
  stepTimeLocked: Record<string, boolean>; // Which steps have locked time
  
  // Enhanced metadata for R&D Expenses foundation
  activityName: string; // The research activity this data belongs to
  practicePercent: number; // Practice percentage for this activity
  currentYear: number; // Year this configuration applies to
  selectedRoles: string[]; // Roles associated with this activity
  
  // Calculation metadata
  calculationFormula: string; // Formula used: (practicePercent × stepTime × frequency × year) / 1000000
  lastUpdated: string; // ISO timestamp of last modification
  
  // Summary statistics for validation
  totalSubcomponents: number; // Count of selected subcomponents
  rdSubcomponents: number; // Count of R&D subcomponents (excluding Non-R&D alternatives)
  nonRdSubcomponents: number; // Count of Non-R&D alternative subcomponents
  
  // Step-level summaries for employee time allocation
  stepSummaries: Record<string, StepSummary>; // Detailed breakdown per step
}

interface StepSummary {
  stepName: string;
  timePercent: number; // Time allocated to this step
  subcomponentCount: number; // Number of subcomponents in this step
  totalAppliedPercent: number; // Sum of applied percentages for this step
  isLocked: boolean; // Whether time allocation is locked
}

interface SubcomponentConfig {
  phase: string;
  step: string;
  subcomponent: string;
  timePercent: number; // This will now be inherited from step time
  frequencyPercent: number;
  yearPercent: number;
  startYear: number;
  selectedRoles: string[];
  appliedPercent: number;
  isNonRD?: boolean; // Flag for Non-R&D Alternative subcomponents
}

interface CSVRow {
  Category: string;
  Area: string;
  Focus: string;
  Phase: string;
  Step: string;
  Subcomponent: string;
  Hint: string;
  'Research Activity': string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SimpleQRAModal: React.FC<SimpleQRAModalProps> = ({
  open,
  onClose,
  onComplete,
  activity,
  currentYear,
  practicePercent,
  selectedRoles = [],
  initialData = null
}) => {
  const [data, setData] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<Record<string, SubcomponentConfig>>({});
  const [selectedStepFilter, setSelectedStepFilter] = useState<string>('');
  const [stepTimeMap, setStepTimeMap] = useState<Record<string, number>>({});
  const [stepTimeLocked, setStepTimeLocked] = useState<Record<string, boolean>>({});

  // State for expanded steps (only one at a time)
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  
  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/Research API.csv');
        const csvText = await response.text();
        const parsedData = parseResearchApiCsv(csvText);
        
        // Convert to the expected CSVRow format
        const csvRows: CSVRow[] = parsedData.map(row => ({
          Category: row.category || '',
          Area: row.area || '',
          Focus: row.focus || '',
          Phase: '', // Phase is not available in normalized format
          Step: row.step || '',
          Subcomponent: row.subcomponent || '',
          Hint: row.hint || '',
          'Research Activity': row.researchActivity || ''
        }));
        
        setData(csvRows);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Initialize with existing data if provided
  useEffect(() => {
    if (open) {
      if (initialData) {
        setSelectedSubcomponents(initialData.selectedSubcomponents || {});
        setStepTimeMap(initialData.stepTimeMap || {});
        setStepTimeLocked(initialData.stepTimeLocked || {});
        setExpandedStep(null);
        setSelectedStepFilter('');
      } else {
        // Clear all state to prevent leakage between research activities
        setSelectedSubcomponents({});
        setStepTimeMap({}); // Clear step time map for new activity
        setStepTimeLocked({}); // Clear step time locks for new activity
        setExpandedStep(null);
        setSelectedStepFilter('');
      }
    }
  }, [open, initialData]);

  // Organize data by step
  const organizedData = useMemo(() => {
    if (!data.length) return {};
    
    const organized: Record<string, CSVRow[]> = {};
    data.forEach(row => {
      if (row['Research Activity'] === activity) {
        if (!organized[row.Step]) {
          organized[row.Step] = [];
        }
        organized[row.Step].push(row);
      }
    });
    return organized;
  }, [data, activity]);

  // Initialize stepTimeMap when organizedData changes
  useEffect(() => {
    if (Object.keys(organizedData).length > 0 && Object.keys(stepTimeMap).length === 0) {
      const steps = Object.keys(organizedData);
      const equalTime = Math.round((100 / steps.length) * 100) / 100; // Round to 2 decimal places
      let remainder = Math.round((100 - (equalTime * steps.length)) * 100) / 100;
      
      const initialStepTimes: Record<string, number> = {};
      steps.forEach((step, index) => {
        let time = equalTime;
        // Add remainder to the first step to ensure total is exactly 100%
        if (index === 0 && remainder !== 0) {
          time = Math.round((time + remainder) * 100) / 100;
        }
        initialStepTimes[step] = time;
      });
      
      setStepTimeMap(initialStepTimes);
    }
  }, [organizedData, stepTimeMap, activity]);

  // Get available steps for filter dropdown
  const availableSteps = useMemo(() => {
    const steps = Object.values(selectedSubcomponents)
      .filter(config => config && config.step)
      .map(config => config.step);
    return [...new Set(steps)].sort();
  }, [selectedSubcomponents]);

  // Filter selected subcomponents by step
  const filteredSelectedSubcomponents = useMemo(() => {
    if (!selectedStepFilter) return selectedSubcomponents;
    
    const filtered: Record<string, SubcomponentConfig> = {};
    Object.entries(selectedSubcomponents).forEach(([key, config]) => {
      if (config && config.step === selectedStepFilter) {
        filtered[key] = config;
      }
    });
    return filtered;
  }, [selectedSubcomponents, selectedStepFilter]);

  // Auto-filter selected subcomponents based on expanded step
  const autoFilteredSelectedSubcomponents = useMemo(() => {
    if (expandedStep && selectedStepFilter === '') {
      // If a step is expanded and no manual filter is set, auto-filter to that step
      const filtered: Record<string, SubcomponentConfig> = {};
      Object.entries(selectedSubcomponents).forEach(([key, config]) => {
        if (config && config.step === expandedStep) {
          filtered[key] = config;
        }
      });
      return filtered;
    }
    return filteredSelectedSubcomponents;
  }, [expandedStep, selectedStepFilter, filteredSelectedSubcomponents, selectedSubcomponents]);

  // Count for auto-filtered subcomponents
  const autoFilteredSelectedCount = Object.keys(autoFilteredSelectedSubcomponents).length;

  // Calculate applied percentage for a subcomponent
  const calculateAppliedPercent = useCallback((config: SubcomponentConfig): number => {
    if (!config || !config.step) return 0;
    // Use step time instead of individual time percent
    const stepTime = stepTimeMap[config.step] || 0;
    const frequency = config.frequencyPercent || 0;
    const year = config.yearPercent || 0;
    const result = (practicePercent * stepTime * frequency * year) / 1000000;
    return Math.round(result * 100) / 100; // Round to 2 decimal places
  }, [stepTimeMap, practicePercent]);

  // Get total applied percentage
  const getTotalAppliedPercent = (): number => {
    const total = Object.values(selectedSubcomponents)
      .filter(config => config && !config.isNonRD) // Exclude Non-R&D alternatives from total and null configs
      .reduce((sum, config) => sum + calculateAppliedPercent(config), 0);
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  };

  // Calculate totals for display
  const totalAppliedPercent = getTotalAppliedPercent();
  const exceedsPractice = totalAppliedPercent > practicePercent;

  // Handle subcomponent selection
  const handleSubcomponentToggle = (step: string, subcomponent: CSVRow) => {
    const key = `${step}-${subcomponent.Subcomponent}`;
    const isNonRD = subcomponent.Subcomponent.toLowerCase().includes('non-r&d alternative');
    
    setSelectedSubcomponents(prev => {
      const updated = { ...prev };
      
      if (updated[key]) {
        // Remove subcomponent
        delete updated[key];
        
        // Redistribute remaining subcomponents in the step
        const remainingStepSubcomponents = Object.entries(updated)
          .filter(([_, config]) => config && config.step === step);
        
        if (remainingStepSubcomponents.length > 0) {
          const equalFrequency = Math.round((100 / remainingStepSubcomponents.length) * 100) / 100;
          let remainder = Math.round((100 - (equalFrequency * remainingStepSubcomponents.length)) * 100) / 100;
          
          remainingStepSubcomponents.forEach(([itemKey, _], index) => {
            let frequency = equalFrequency;
            if (index === 0 && remainder !== 0) {
              frequency = Math.round((frequency + remainder) * 100) / 100;
            }
            updated[itemKey] = {
              ...updated[itemKey],
              frequencyPercent: frequency
            };
          });
        }
      } else {
        // Add subcomponent with step time
        const stepTime = stepTimeMap[step] || 0;
        
        // Get existing subcomponents in the step
        const existingStepSubcomponents = Object.entries(prev)
          .filter(([_, config]) => config && config.step === step);
        
        const totalSubcomponentsAfterAdd = existingStepSubcomponents.length + 1;
        const newEqualFrequency = Math.round((100 / totalSubcomponentsAfterAdd) * 100) / 100;
        let remainder = Math.round((100 - (newEqualFrequency * totalSubcomponentsAfterAdd)) * 100) / 100;
        
        // Add the new subcomponent
        updated[key] = {
          phase: subcomponent.Phase,
          step: step,
          subcomponent: subcomponent.Subcomponent,
          timePercent: stepTime, // Use step time
          frequencyPercent: newEqualFrequency, // Start with pro-rata frequency
          yearPercent: 100,
          startYear: currentYear,
          selectedRoles: [...selectedRoles], // Inherit all roles from parent activity
          appliedPercent: 0,
          isNonRD: isNonRD
        };
        
        // Adjust existing subcomponents in the same step to the new equal frequency
        existingStepSubcomponents.forEach(([itemKey, _], index) => {
          let frequency = newEqualFrequency;
          // Add remainder to the first existing item
          if (index === 0 && remainder !== 0) {
            frequency = Math.round((frequency + remainder) * 100) / 100;
          }
          updated[itemKey] = {
            ...updated[itemKey],
            frequencyPercent: frequency
          };
        });
      }
      
      return updated;
    });
  };

  // Handle metric changes
  const handleMetricChange = (key: string, field: keyof SubcomponentConfig, value: any) => {
    setSelectedSubcomponents(prev => {
      const updated = { ...prev };
      if (!updated[key]) return updated; // Safety check
      
      updated[key] = {
        ...updated[key],
        [field]: value
      };
      
      // If frequency changed, redistribute all frequencies in the step pro-rata
      if (field === 'frequencyPercent' && updated[key]) {
        const step = updated[key].step;
        const stepItems = Object.entries(updated)
          .filter(([_, config]) => config && config.step === step);
        
        if (stepItems.length > 1) {
          // Calculate the total frequency for this step
          const stepTotal = stepItems.reduce((sum, [_, config]) => sum + (config.frequencyPercent || 0), 0);
          
          // If total is not 100%, redistribute proportionally to make it 100%
          if (Math.abs(stepTotal - 100) > 0.01 && stepTotal > 0) {
            const scaleFactor = 100 / stepTotal;
            
            stepItems.forEach(([itemKey, config]) => {
              if (config && updated[itemKey]) {
                const newFrequency = Math.round(((config.frequencyPercent || 0) * scaleFactor) * 100) / 100;
                updated[itemKey] = {
                  ...updated[itemKey],
                  frequencyPercent: newFrequency
                };
              }
            });
          }
        }
      }
      
      return updated;
    });
  };

  // Handle role toggle
  const handleRoleToggle = (key: string, role: string) => {
    setSelectedSubcomponents(prev => {
      const updated = { ...prev };
      if (!updated[key]) return updated; // Safety check
      
      const currentRoles = updated[key]?.selectedRoles || [];
      
      if (currentRoles.includes(role)) {
        updated[key] = {
          ...updated[key],
          selectedRoles: currentRoles.filter(r => r !== role)
        };
      } else {
        updated[key] = {
          ...updated[key],
          selectedRoles: [...currentRoles, role]
        };
      }
      
      return updated;
    });
  };

  // Step time management functions
  const handleStepTimeChange = (step: string, newTime: number) => {
    // Round to 2 decimal places
    newTime = Math.round(newTime * 100) / 100;
    
    setStepTimeMap(prev => {
      const updated = { ...prev };
      updated[step] = newTime;
      
      // Pro-rata redistribute other unlocked steps
      const lockedSteps = Object.keys(updated).filter(s => stepTimeLocked[s] && s !== step);
      const unlockedSteps = Object.keys(updated).filter(s => !stepTimeLocked[s] && s !== step);
      
      if (unlockedSteps.length > 0) {
        const lockedTotal = lockedSteps.reduce((sum, s) => sum + (updated[s] || 0), 0);
        const newStepTotal = newTime;
        const remaining = Math.max(0, 100 - lockedTotal - newStepTotal);
        
        // Get current total of unlocked steps (excluding the changed step)
        const currentUnlockedTotal = unlockedSteps.reduce((sum, s) => sum + (updated[s] || 0), 0);
        
        if (currentUnlockedTotal > 0) {
          // Redistribute proportionally
          unlockedSteps.forEach(s => {
            const proportion = (updated[s] || 0) / currentUnlockedTotal;
            updated[s] = Math.round((remaining * proportion) * 100) / 100; // Round to 2 decimal places
          });
        } else {
          // Equal distribution if no current values
          const equalShare = Math.round((remaining / unlockedSteps.length) * 100) / 100;
          unlockedSteps.forEach(s => {
            updated[s] = equalShare;
          });
        }
      }
      
      return updated;
    });
    
    // Update time percent for all subcomponents in this step
    setSelectedSubcomponents(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (updated[key] && updated[key].step === step) {
          updated[key].timePercent = newTime;
        }
      });
      return updated;
    });
  };

  const toggleStepTimeLock = (step: string) => {
    setStepTimeLocked(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  const handleComplete = () => {
    // Calculate step frequencies
    const stepFreqs: Record<string, number> = {};
    Object.values(selectedSubcomponents).forEach(config => {
      if (!config || !config.step) return;
      if (!stepFreqs[config.step]) {
        stepFreqs[config.step] = 0;
      }
      if (!config.isNonRD) { // Only count non-NonRD subcomponents
        stepFreqs[config.step] += (config.frequencyPercent || 0);
      }
    });

    // Generate step summaries for employee time allocation
    const stepSummaries: Record<string, StepSummary> = {};
    Object.keys(stepTimeMap).forEach(stepName => {
      const stepSubcomponents = Object.values(selectedSubcomponents).filter(c => c.step === stepName);
      const stepAppliedPercent = stepSubcomponents.reduce((sum, c) => sum + calculateAppliedPercent(c), 0);
      
      stepSummaries[stepName] = {
        stepName,
        timePercent: stepTimeMap[stepName] || 0,
        subcomponentCount: stepSubcomponents.length,
        totalAppliedPercent: Math.round(stepAppliedPercent * 100) / 100,
        isLocked: stepTimeLocked[stepName] || false
      };
    });

    const data: SubcomponentSelectionData = {
      selectedSubcomponents,
      totalAppliedPercent: getTotalAppliedPercent(),
      stepFrequencies: stepFreqs,
      stepTimeMap,
      stepTimeLocked,
      activityName: activity,
      practicePercent,
      currentYear,
      selectedRoles,
      calculationFormula: '(practicePercent × stepTime × frequency × year) / 1000000',
      lastUpdated: new Date().toISOString(),
      totalSubcomponents: Object.keys(selectedSubcomponents).length,
      rdSubcomponents: Object.values(selectedSubcomponents).filter(c => !c.isNonRD).length,
      nonRdSubcomponents: Object.values(selectedSubcomponents).filter(c => c.isNonRD).length,
      stepSummaries
    };

    onComplete(data);
  };

  const handleClose = () => {
    // Clear all state when closing to prevent leakage between research activities
    setSelectedSubcomponents({});
    setExpandedStep(null);
    setSelectedStepFilter('');
    onClose();
  };

  const selectedCount = Object.keys(selectedSubcomponents).length;
  const filteredSelectedCount = Object.keys(filteredSelectedSubcomponents).length;

  // Generate segmented progress bar data
  const segmentedProgressData = useMemo(() => {
    const segments = Object.entries(selectedSubcomponents).map(([key, config]) => ({
      key,
      name: config.subcomponent,
      step: config.step,
      value: calculateAppliedPercent(config),
      isNonRD: config.isNonRD || false,
      color: config.isNonRD 
        ? '#9e9e9e' // Gray for Non-R&D alternatives
        : `hsl(${(Object.keys(selectedSubcomponents).indexOf(key) * 137.5) % 360}, 70%, 50%)`
    }));
    
    return segments.sort((a, b) => b.value - a.value);
  }, [selectedSubcomponents, calculateAppliedPercent]);

  const handleExportData = () => {
    const exportData = {
      selectedSubcomponents,
      totalAppliedPercent: getTotalAppliedPercent(),
      stepFrequencies: Object.values(selectedSubcomponents).reduce((acc, config) => {
        if (!config || !config.step) return acc;
        if (!acc[config.step]) acc[config.step] = 0;
        if (!config.isNonRD) acc[config.step] += (config.frequencyPercent || 0);
        return acc;
      }, {} as Record<string, number>),
      stepTimeMap,
      stepTimeLocked,
      activityName: activity,
      practicePercent,
      currentYear,
      selectedRoles,
      calculationFormula: '(practicePercent × stepTime × frequency × year) / 1000000',
      lastUpdated: new Date().toISOString(),
      totalSubcomponents: Object.keys(selectedSubcomponents).length,
      rdSubcomponents: Object.values(selectedSubcomponents).filter(c => !c.isNonRD).length,
      nonRdSubcomponents: Object.values(selectedSubcomponents).filter(c => c.isNonRD).length,
      stepSummaries: Object.keys(stepTimeMap).reduce((acc, stepName) => {
        const stepSubcomponents = Object.values(selectedSubcomponents).filter(c => c.step === stepName);
        const stepAppliedPercent = stepSubcomponents.reduce((sum, c) => sum + calculateAppliedPercent(c), 0);
        
        acc[stepName] = {
          stepName,
          timePercent: stepTimeMap[stepName] || 0,
          subcomponentCount: stepSubcomponents.length,
          totalAppliedPercent: Math.round(stepAppliedPercent * 100) / 100,
          isLocked: stepTimeLocked[stepName] || false
        };
        return acc;
      }, {} as Record<string, StepSummary>)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qra-config-${activity.replace(/[^a-zA-Z0-9]/g, '-')}-${currentYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string) as SubcomponentSelectionData;
        
        // Validate the imported data structure
        if (importedData.selectedSubcomponents && importedData.stepTimeMap) {
          setSelectedSubcomponents(importedData.selectedSubcomponents);
          setStepTimeMap(importedData.stepTimeMap);
          setStepTimeLocked(importedData.stepTimeLocked || {});
          
          // Show success message
          console.log('QRA configuration imported successfully');
        } else {
          console.error('Invalid QRA configuration file format');
        }
      } catch (error) {
        console.error('Error importing QRA configuration:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  // Data validation for R&D Expenses readiness
  const validateQRAConfiguration = (): { isValid: boolean; warnings: string[]; errors: string[] } => {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Check if any subcomponents are selected
    if (selectedCount === 0) {
      errors.push('No subcomponents selected. At least one subcomponent is required.');
    }
    
    // Check step time allocation
    const totalStepTime = Object.values(stepTimeMap).reduce((sum, time) => sum + time, 0);
    if (Math.abs(totalStepTime - 100) > 0.01) {
      errors.push(`Step time allocation must total 100%. Currently: ${Math.round(totalStepTime * 100) / 100}%`);
    }
    
    // Check for steps with no subcomponents
    const stepsWithSubcomponents = new Set(Object.values(selectedSubcomponents).map(c => c.step));
    const stepsWithoutSubcomponents = Object.keys(stepTimeMap).filter(step => !stepsWithSubcomponents.has(step));
    if (stepsWithoutSubcomponents.length > 0) {
      warnings.push(`Steps with time allocation but no subcomponents: ${stepsWithoutSubcomponents.join(', ')}`);
    }
    
    // Check for subcomponents with zero frequency
    const zeroFrequencySubcomponents = Object.values(selectedSubcomponents).filter(c => c.frequencyPercent === 0);
    if (zeroFrequencySubcomponents.length > 0) {
      warnings.push(`${zeroFrequencySubcomponents.length} subcomponent(s) have 0% frequency and won't contribute to calculations.`);
    }
    
    // Check for missing role assignments in R&D subcomponents
    const rdSubcomponentsWithoutRoles = Object.values(selectedSubcomponents).filter(c => 
      !c.isNonRD && (!c.selectedRoles || c.selectedRoles.length === 0)
    );
    if (rdSubcomponentsWithoutRoles.length > 0) {
      warnings.push(`${rdSubcomponentsWithoutRoles.length} R&D subcomponent(s) have no roles assigned.`);
    }
    
    // Check applied percentage distribution
    const totalApplied = getTotalAppliedPercent();
    if (totalApplied > practicePercent * 1.1) { // Allow 10% tolerance
      warnings.push(`Total applied percentage (${Math.round(totalApplied * 100) / 100}%) significantly exceeds practice percentage (${Math.round(practicePercent * 100) / 100}%).`);
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  };

  const validation = validateQRAConfiguration();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '95vh' }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
        <Box sx={{ pr: 6 }}>
          <Typography variant="h5" component="div">
            Configure Subcomponents for {activity}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Practice Percentage: {Math.round(practicePercent * 100) / 100}% | Available Steps: {Object.keys(organizedData).length}
            {selectedCount > 0 && (
              <>
                {' | '}Selected: {selectedCount} ({Object.values(selectedSubcomponents).filter(c => !c.isNonRD).length} R&D, {Object.values(selectedSubcomponents).filter(c => c.isNonRD).length} Non-R&D)
                {' | '}Applied: {Math.round(getTotalAppliedPercent() * 100) / 100}%
              </>
            )}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Loading subcomponents for {activity}...</Typography>
          </Box>
        ) : Object.keys(organizedData).length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              No subcomponents found for research activity "{activity}". Please check the CSV data or activity name.
            </Alert>
            {data.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Available activities in CSV ({[...new Set(data.map(row => row['Research Activity']))].length} total):
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {[...new Set(data.map(row => row['Research Activity']))].slice(0, 20).map((act, idx) => (
                    <Typography key={idx} variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                      "{act}"
                    </Typography>
                  ))}
                  {[...new Set(data.map(row => row['Research Activity']))].length > 20 && (
                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                      ... and {[...new Set(data.map(row => row['Research Activity']))].length - 20} more
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
            {/* Activity Time Breakdown Progress Bar */}
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.100' }}>
              <Typography variant="h6" gutterBottom>
                Activity Time Breakdown
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Time Distribution: {Math.round(Object.values(stepTimeMap).reduce((sum, time) => sum + time, 0) * 100) / 100}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Object.keys(stepTimeMap).length} Steps
                  </Typography>
                </Box>
                
                {/* Step Time Progress Bar */}
                <Box sx={{ 
                  height: 24, 
                  borderRadius: 12, 
                  overflow: 'hidden', 
                  bgcolor: 'grey.200',
                  display: 'flex',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  mb: 2
                }}>
                  {Object.entries(stepTimeMap).map(([step, time], index) => {
                    const color = `hsl(${(index * 137.5) % 360}, 60%, 45%)`;
                    return (
                      <Box
                        key={step}
                        sx={{
                          width: `${time}%`,
                          height: '100%',
                          bgcolor: color,
                          borderRight: index < Object.keys(stepTimeMap).length - 1 ? '1px solid white' : 'none',
                          minWidth: time > 0 ? '2px' : 0
                        }}
                        title={`${step}: ${Math.round(time * 100) / 100}%`}
                      />
                    );
                  })}
                </Box>
                
                {/* Step Time Sliders */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                  {Object.entries(stepTimeMap).map(([step, time]) => (
                    <Box key={step} sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {step}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(time * 100) / 100}%
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => toggleStepTimeLock(step)}
                            color={stepTimeLocked[step] ? 'primary' : 'default'}
                            title={stepTimeLocked[step] ? 'Unlock step time' : 'Lock step time'}
                          >
                            {stepTimeLocked[step] ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                      </Box>
                      <Slider
                        value={time}
                        onChange={(_, value) => handleStepTimeChange(step, value as number)}
                        min={0}
                        max={100}
                        step={0.01}
                        disabled={stepTimeLocked[step]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={v => `${Math.round(v * 100) / 100}%`}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Applied Percentage Progress Bar - Segmented */}
            {selectedCount > 0 && (
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Applied Percentage Breakdown
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Applied: {Math.round(totalAppliedPercent * 100) / 100}% / {Math.round(practicePercent * 100) / 100}%
                    </Typography>
                    <Typography variant="body2" color={exceedsPractice ? 'error.main' : 'success.main'}>
                      {exceedsPractice ? 'Exceeds Limit' : 'Within Limit'}
                    </Typography>
                  </Box>
                  
                  {/* Segmented Progress Bar */}
                  <Box sx={{ 
                    height: 24, 
                    borderRadius: 12, 
                    overflow: 'hidden', 
                    bgcolor: 'grey.200',
                    display: 'flex',
                    border: '1px solid',
                    borderColor: 'grey.300'
                  }}>
                    {segmentedProgressData.map((segment, index) => {
                      const widthPercent = Math.min((segment.value / practicePercent) * 100, 100);
                      return (
                        <Box
                          key={segment.key}
                          sx={{
                            width: `${widthPercent}%`,
                            height: '100%',
                            bgcolor: segment.color,
                            borderRight: index < segmentedProgressData.length - 1 ? '1px solid white' : 'none',
                            minWidth: widthPercent > 0 ? '2px' : 0
                          }}
                          title={`${segment.name} (${segment.step}): ${Math.round(segment.value * 100) / 100}%${segment.isNonRD ? ' - Non-R&D Alternative' : ''}`}
                        />
                      );
                    })}
                  </Box>
                  
                  {/* Legend */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {segmentedProgressData.map(segment => (
                      <Chip
                        key={segment.key}
                        label={`${segment.name}: ${Math.round(segment.value * 100) / 100}%`}
                        size="small"
                        sx={{ 
                          bgcolor: segment.color,
                          color: segment.isNonRD ? 'text.primary' : 'white',
                          fontSize: '0.7rem',
                          '& .MuiChip-label': {
                            fontWeight: 500
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                
                {exceedsPractice && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Total applied percentage exceeds practice percentage. Values will be auto-adjusted proportionally on completion.
                  </Alert>
                )}
              </Box>
            )}

            {/* Data Validation Messages */}
            {(validation.errors.length > 0 || validation.warnings.length > 0) && (
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  R&D Expenses Readiness Check
                </Typography>
                
                {validation.errors.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                      Errors (Must be resolved):
                    </Typography>
                    {validation.errors.map((error, index) => (
                      <Alert key={index} severity="error" sx={{ mb: 1 }}>
                        {error}
                      </Alert>
                    ))}
                  </Box>
                )}
                
                {validation.warnings.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      Warnings (Recommended to review):
                    </Typography>
                    {validation.warnings.map((warning, index) => (
                      <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                        {warning}
                      </Alert>
                    ))}
                  </Box>
                )}
                
                {validation.isValid && validation.warnings.length === 0 && (
                  <Alert severity="success">
                    ✅ Configuration is ready for R&D Expenses calculations
                  </Alert>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', flex: 1 }}>
              {/* Left Panel - Step Selection */}
              <Box sx={{ width: '60%', p: 3, borderRight: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  Research Steps & Subcomponents
                </Typography>
                
                {Object.entries(organizedData).map(([step, subcomponents]) => {
                  const stepHasSelections = Object.values(selectedSubcomponents)
                    .some(config => config.step === step);
                  
                  return (
                    <Accordion 
                      key={step}
                      expanded={expandedStep === step}
                      onChange={(_, isExpanded) => {
                        // Only allow one step to be expanded at a time
                        setExpandedStep(isExpanded ? step : null);
                      }}
                      sx={{ mb: 1 }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
                            {step}
                          </Typography>
                          
                          <Typography variant="caption" color="text.secondary">
                            {subcomponents.length} subcomponents
                          </Typography>
                          
                          {stepHasSelections && (
                            <Chip 
                              label={`${Object.values(selectedSubcomponents).filter(c => c.step === step).length} selected`}
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails>
                        {/* Subcomponent Cards */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, mb: 2 }}>
                          {subcomponents.map((sub, idx) => {
                            const key = `${step}-${sub.Subcomponent}`;
                            const isSelected = !!selectedSubcomponents[key];
                            const isNonRD = sub.Subcomponent.toLowerCase().includes('non-r&d alternative');
                            
                            return (
                              <Card 
                                key={idx}
                                sx={{ 
                                  border: '1px solid',
                                  borderColor: isSelected ? (isNonRD ? 'grey.500' : 'primary.main') : 'divider',
                                  cursor: 'pointer',
                                  '&:hover': { boxShadow: 2 },
                                  bgcolor: isSelected ? (isNonRD ? 'grey.200' : 'primary.light') : 'white',
                                  color: isSelected ? (isNonRD ? 'text.primary' : 'primary.contrastText') : 'text.primary'
                                }}
                                onClick={() => !isSelected && handleSubcomponentToggle(step, sub)}
                              >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 600, fontSize: '0.875rem' }}>
                                      {sub.Subcomponent}
                                    </Typography>
                                    
                                    {isSelected ? (
                                      <IconButton 
                                        size="small" 
                                        sx={{ color: 'inherit', p: 0.5 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSubcomponentToggle(step, sub);
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    ) : (
                                      <IconButton size="small" color={isNonRD ? 'default' : 'primary'} sx={{ p: 0.5 }}>
                                        <AddIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </Box>
                                  
                                  {sub.Hint && (
                                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, fontSize: '0.75rem' }}>
                                      {sub.Hint.substring(0, 80)}{sub.Hint.length > 80 ? '...' : ''}
                                    </Typography>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Box>
                        
                        {/* Non-R&D Alternative Option */}
                        {(() => {
                          const nonRDKey = `${step}-Non-R&D Alternative`;
                          const isNonRDSelected = !!selectedSubcomponents[nonRDKey];
                          
                          return (
                            <Card 
                              sx={{ 
                                border: '2px solid',
                                borderColor: isNonRDSelected ? 'grey.500' : 'grey.400',
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 2 },
                                bgcolor: isNonRDSelected ? 'grey.200' : 'grey.100',
                                color: 'text.primary'
                              }}
                              onClick={() => handleSubcomponentToggle(step, {
                                Step: step,
                                Subcomponent: 'Non-R&D Alternative',
                                Phase: '',
                                Category: '',
                                Area: '',
                                Focus: '',
                                Hint: 'Reduces the percentage of every other applied subcomponent but is not added to the calculation.',
                                'Research Activity': activity
                              } as CSVRow)}
                            >
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 600, fontSize: '0.875rem' }}>
                                    Non-R&D Alternative
                                  </Typography>
                                  
                                  {isNonRDSelected ? (
                                    <IconButton 
                                      size="small" 
                                      sx={{ color: 'inherit', p: 0.5 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubcomponentToggle(step, {
                                          Step: step,
                                          Subcomponent: 'Non-R&D Alternative',
                                          Phase: '',
                                          Category: '',
                                          Area: '',
                                          Focus: '',
                                          Hint: '',
                                          'Research Activity': activity
                                        } as CSVRow);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  ) : (
                                    <IconButton size="small" color="default" sx={{ p: 0.5 }}>
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                                
                                <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, fontSize: '0.75rem' }}>
                                  Reduces the percentage of every other applied subcomponent but is not added to the calculation.
                                </Typography>
                              </CardContent>
                            </Card>
                          );
                        })()}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>

              {/* Right Panel - Selected Subcomponents Configuration */}
              <Box sx={{ width: '40%', p: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Selected Subcomponents ({selectedCount})
                  </Typography>
                  
                  {/* Step Filter */}
                  {availableSteps.length > 1 && (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Filter by Step</InputLabel>
                      <Select
                        value={selectedStepFilter}
                        label="Filter by Step"
                        onChange={(e) => setSelectedStepFilter(e.target.value)}
                        startAdornment={<FilterListIcon sx={{ mr: 1, fontSize: 16 }} />}
                      >
                        <MenuItem value="">
                          <em>All Steps ({selectedCount})</em>
                        </MenuItem>
                        {availableSteps.map(step => {
                          const stepCount = Object.values(selectedSubcomponents).filter(c => c && c.step === step).length;
                          return (
                            <MenuItem key={step} value={step}>
                              {step} ({stepCount})
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  )}
                </Box>

                {/* Show filter status */}
                {(selectedStepFilter || (expandedStep && selectedStepFilter === '')) && (
                  <Box sx={{ mb: 2 }}>
                    {selectedStepFilter ? (
                      <Chip 
                        label={`Manual Filter: ${selectedStepFilter} (${filteredSelectedCount} items)`}
                        onDelete={() => setSelectedStepFilter('')}
                        color="primary"
                        variant="outlined"
                      />
                    ) : expandedStep ? (
                      <Chip 
                        label={`Auto-filtered: ${expandedStep} (${autoFilteredSelectedCount} items)`}
                        color="secondary"
                        variant="outlined"
                        sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}
                      />
                    ) : null}
                  </Box>
                )}
                
                {selectedCount === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Select subcomponents from the left panel to configure their settings.
                    </Typography>
                  </Box>
                ) : autoFilteredSelectedCount === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No subcomponents found for the selected step filter.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                    {Object.entries(autoFilteredSelectedSubcomponents).map(([key, config]) => {
                      // Safety check to ensure config is valid
                      if (!config || !config.subcomponent) return null;
                      
                      return (
                      <Card key={key} sx={{ 
                        mb: 2,
                        bgcolor: config.isNonRD ? 'grey.100' : 'white',
                        border: config.isNonRD ? '1px solid' : 'none',
                        borderColor: config.isNonRD ? 'grey.400' : 'transparent'
                      }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {config.subcomponent}
                            </Typography>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleSubcomponentToggle(config.step, { 
                                Step: config.step, 
                                Subcomponent: config.subcomponent,
                                Phase: config.phase,
                                Category: '',
                                Area: '',
                                Focus: '',
                                Hint: '',
                                'Research Activity': activity
                              } as CSVRow)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                            Step: {config.step} | Applied: {Math.round(calculateAppliedPercent(config) * 100) / 100}%
                            {config.isNonRD && (
                              <Chip 
                                label="Non-R&D Alternative" 
                                size="small" 
                                color="default" 
                                variant="outlined" 
                                sx={{ ml: 1, bgcolor: 'grey.300' }} 
                              />
                            )}
                          </Typography>

                          {/* Frequency Percentage - Show for all subcomponents including Non-R&D */}
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="body2" gutterBottom sx={{ fontSize: '0.875rem' }}>
                              Frequency: {Math.round(config.frequencyPercent * 100) / 100}%
                            </Typography>
                            <Slider
                              value={config.frequencyPercent}
                              onChange={(_, value) => handleMetricChange(key, 'frequencyPercent', value)}
                              min={0}
                              max={100}
                              step={0.01}
                              valueLabelDisplay="auto"
                              valueLabelFormat={v => `${Math.round(v * 100) / 100}%`}
                              sx={config.isNonRD ? {
                                '& .MuiSlider-thumb': { bgcolor: 'grey.500' },
                                '& .MuiSlider-track': { bgcolor: 'grey.500' },
                                '& .MuiSlider-rail': { bgcolor: 'grey.300' }
                              } : {}}
                            />
                          </Box>

                          {/* Year/Month Selection - Side by side for non-NonRD subcomponents */}
                          {!config.isNonRD && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                              <FormControl size="small" sx={{ flex: 1 }}>
                                <InputLabel>Start Month</InputLabel>
                                <Select
                                  value={Math.round((100 - config.yearPercent) / (100/11))}
                                  label="Start Month"
                                  onChange={(e) => {
                                    const monthIndex = Number(e.target.value);
                                    const yearPercent = Math.round((100 - (monthIndex * (100/11))) * 100) / 100;
                                    handleMetricChange(key, 'yearPercent', yearPercent);
                                  }}
                                >
                                  {MONTHS.map((month, index) => (
                                    <MenuItem key={index} value={index}>
                                      {month} ({Math.round((100 - index * (100/11)) * 100) / 100}%)
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              
                              <TextField
                                label="Start Year"
                                type="number"
                                value={config.startYear}
                                onChange={(e) => handleMetricChange(key, 'startYear', Number(e.target.value))}
                                size="small"
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          )}

                          {/* Roles - Only show for non-NonRD subcomponents */}
                          {!config.isNonRD && (
                            <Box>
                              <Typography variant="body2" gutterBottom sx={{ fontSize: '0.875rem' }}>
                                R&D Roles ({(config.selectedRoles || []).length}/{selectedRoles.length})
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Inherited from parent activity
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {selectedRoles.map(role => (
                                  <Chip
                                    key={role}
                                    label={role}
                                    size="small"
                                    color={(config.selectedRoles || []).includes(role) ? 'primary' : 'default'}
                                    onClick={() => handleRoleToggle(key, role)}
                                    variant={(config.selectedRoles || []).includes(role) ? 'filled' : 'outlined'}
                                    sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'grey.50', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Export/Import Controls */}
          <Button 
            onClick={handleExportData}
            variant="outlined"
            size="small"
            disabled={selectedCount === 0}
            title="Export QRA configuration for R&D Expenses foundation"
          >
            Export Config
          </Button>
          
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            style={{ display: 'none' }}
            id="import-qra-config"
          />
          <label htmlFor="import-qra-config">
            <Button 
              component="span"
              variant="outlined"
              size="small"
              title="Import QRA configuration"
            >
              Import Config
            </Button>
          </label>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleComplete} 
            variant="contained" 
            disabled={selectedCount === 0 || !validation.isValid}
            color={exceedsPractice ? "warning" : validation.isValid ? "primary" : "error"}
            title={!validation.isValid ? "Please resolve validation errors before completing" : ""}
          >
            {!validation.isValid 
              ? `Cannot Complete (${validation.errors.length} errors)` 
              : exceedsPractice 
                ? 'Complete (Will Auto-Adjust)' 
                : `Complete (${selectedCount} selected)`
            }
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SimpleQRAModal; 