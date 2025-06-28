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
  IconButton,
  Grid,
  FormControlLabel,
  Switch,
  Tooltip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
import { SubcomponentSelectionData, SubcomponentConfig, StepSummary } from '../../types/QRABuilderInterfaces';
import { getAllActivities } from '../../services/researchActivitiesService';

// Types
interface SimpleQRAModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: SubcomponentSelectionData) => void;
  activity: string;
  currentYear: number;
  practicePercent: number;
  selectedRoles?: string[]; // Roles from parent activity
  initialData?: SubcomponentSelectionData | null; // Existing QRA data to initialize with
  isActivityLocked?: boolean; // Whether the activity is locked in the parent component
}

interface ActivityData {
  id: string;
  category: string;
  area: string;
  focus: string;
  researchActivity: string;
  'Research Activity'?: string; // Legacy support
  step?: string;
  subcomponent?: string;
  'Subcomponent'?: string; // Legacy support
  hint?: string;
  generalDescription?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmentalProcess?: string;
  primaryGoal?: string;
  expectedOutcomeType?: string;
  cptCodes?: string[];
  cdtCodes?: string[];
  alternativePaths?: string;
  isLimitedAccess?: boolean;
  phase?: string; // Lowercase to match Supabase
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
  initialData = null,
  isActivityLocked = false
}) => {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<Record<string, SubcomponentConfig>>({});
  const [selectedStepFilter, setSelectedStepFilter] = useState<string>('');
  const [stepTimeMap, setStepTimeMap] = useState<Record<string, number>>({});
  const [stepTimeLocked, setStepTimeLocked] = useState<Record<string, boolean>>({});

  // State for expanded steps (only one at a time)
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  
  // Load activities from Supabase
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const activities = await getAllActivities();
        
        // Transform the data to match ActivityData interface
        const transformedActivities: ActivityData[] = activities.map((activity: any, index: number) => ({
          id: activity.id || `activity-${index}`,
          category: activity.category || '',
          area: activity.area || '',
          focus: activity.focus || '',
          researchActivity: activity.research_activity || activity.researchActivity || '',
          'Research Activity': activity.research_activity || activity.researchActivity || '', // Legacy support
          step: activity.step || '',
          subcomponent: activity.subcomponent || '',
          'Subcomponent': activity.subcomponent || '', // Legacy support
          hint: activity.hint || '',
          generalDescription: activity.general_description || '',
          goal: activity.goal || '',
          hypothesis: activity.hypothesis || '',
          alternatives: activity.alternatives || '',
          uncertainties: activity.uncertainties || '',
          developmentalProcess: activity.developmental_process || '',
          primaryGoal: activity.primary_goal || '',
          expectedOutcomeType: activity.expected_outcome_type || '',
          cptCodes: activity.cpt_codes || [],
          cdtCodes: activity.cdt_codes || [],
          alternativePaths: activity.alternative_paths || '',
          isLimitedAccess: activity.is_limited_access || false,
          phase: activity.phase || '' // Legacy support
        }));
        
        setData(transformedActivities);
      } catch (error) {
        console.error('Error loading activities from Supabase:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadActivities();
    }
  }, [open]);

  // Initialize with existing data if provided
  useEffect(() => {
    if (open) {
      console.log(`[SimpleQRAModal] Modal opened for activity: "${activity}". Received initialData:`, initialData);
      if (initialData) {
        console.log('[SimpleQRAModal] Initializing with provided data.');
        setSelectedSubcomponents(initialData.selectedSubcomponents || {});
        setStepTimeMap(initialData.stepTimeMap || {});
        setStepTimeLocked(initialData.stepTimeLocked || {});
        setExpandedStep(null);
        setSelectedStepFilter('');
      } else {
        // Clear all state to prevent leakage between research activities
        console.log('[SimpleQRAModal] No initialData provided, clearing state.');
        setSelectedSubcomponents({});
        setStepTimeMap({}); // Clear step time map for new activity
        setStepTimeLocked({}); // Clear step time locks for new activity
        setExpandedStep(null);
        setSelectedStepFilter('');
      }
    }
  }, [open, initialData, activity]);

  // Filter data for current activity
  const filteredData = useMemo(() => {
    return data.filter(row => 
      row.researchActivity === activity || row['Research Activity'] === activity
    );
  }, [data, activity]);

  // Organize data by step
  const organizedData = useMemo(() => {
    const organized: Record<string, ActivityData[]> = {};
    filteredData.forEach(row => {
      if (row.researchActivity === activity || row['Research Activity'] === activity) {
        const step = row.step || 'Unknown';
        if (!organized[step]) {
          organized[step] = [];
        }
        organized[step].push(row);
      }
    });
    return organized;
  }, [filteredData, activity]);

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
  const handleSubcomponentToggle = (step: string, subcomponent: ActivityData) => {
    const subcomponentName = subcomponent.subcomponent || subcomponent['Subcomponent'] || 'Unknown';
    const key = `${step}-${subcomponentName}`;
    const isNonRD = subcomponentName.toLowerCase().includes('non-r&d alternative');
    
    setSelectedSubcomponents(prev => {
      const updated = { ...prev };
      
      if (isNonRD) {
        // For Non-R&D Alternative, toggle all other subcomponents
        const stepSubcomponents = organizedData[step] || [];
        stepSubcomponents.forEach(sub => {
          const subKey = `${step}-${sub.subcomponent || sub['Subcomponent'] || 'Unknown'}`;
          if (subKey !== key) {
            if (updated[key]) {
              // Non-R&D is being added, reduce others
              updated[subKey] = {
                ...updated[subKey],
                timePercent: Math.max(0, (updated[subKey]?.timePercent || 0) - 10)
              };
            } else {
              // Non-R&D is being removed, restore others
              updated[subKey] = {
                ...updated[subKey],
                timePercent: Math.min(100, (updated[subKey]?.timePercent || 0) + 10)
              };
            }
          }
        });
      }
      
      if (updated[key]) {
        delete updated[key];
      } else {
        // Add the new subcomponent
        updated[key] = {
          phase: subcomponent.phase || 'Unknown',
          step: step,
          subcomponent: subcomponentName,
          timePercent: stepTimeMap[step] || 0,
          frequencyPercent: 0,
          yearPercent: 100,
          selectedRoles: [...selectedRoles],
          appliedPercent: 0,
          isNonRD: isNonRD
        };
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
      name: typeof config.subcomponent === 'string' ? config.subcomponent : config.subcomponent?.title || 'Unknown',
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="h5" component="div">
              Configure Subcomponents for {activity}
            </Typography>
            {isActivityLocked && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.5, borderRadius: 1 }}>
                <LockIcon fontSize="small" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  LOCKED
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Practice Percentage: {Math.round(practicePercent * 100) / 100}% | Available Steps: {Object.keys(organizedData).length}
            {selectedCount > 0 && (
              <>
                {' | '}Selected: {selectedCount} ({Object.values(selectedSubcomponents).filter(c => !c.isNonRD).length} R&D, {Object.values(selectedSubcomponents).filter(c => c.isNonRD).length} Non-R&D)
                {' | '}Applied: {Math.round(getTotalAppliedPercent() * 100) / 100}%
              </>
            )}
            {isActivityLocked && (
              <>
                {' | '}<span style={{ color: '#ffd700', fontWeight: 600 }}>Activity is locked - view only mode</span>
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
            {filteredData.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Available activities in CSV ({[...new Set(filteredData.map(row => row.researchActivity))].length} total):
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {[...new Set(filteredData.map(row => row.researchActivity))].slice(0, 20).map((act, idx) => (
                    <Typography key={idx} variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                      "{act}"
                    </Typography>
                  ))}
                  {[...new Set(filteredData.map(row => row.researchActivity))].length > 20 && (
                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                      ... and {[...new Set(filteredData.map(row => row.researchActivity))].length - 20} more
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
                            disabled={isActivityLocked}
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
                        disabled={stepTimeLocked[step] || isActivityLocked}
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
                            const key = `${step}-${sub.subcomponent || sub['Subcomponent'] || 'Unknown'}`;
                            const isSelected = !!selectedSubcomponents[key];
                            const isNonRD = (sub.subcomponent || sub['Subcomponent'] || '').toLowerCase().includes('non-r&d alternative');
                            
                            return (
                              <Card 
                                key={idx}
                                sx={{ 
                                  cursor: isActivityLocked ? 'not-allowed' : 'pointer',
                                  border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                  bgcolor: isSelected ? '#f3f6ff' : 'white',
                                  opacity: isActivityLocked ? 0.6 : 1
                                }}
                                onClick={() => !isActivityLocked && handleSubcomponentToggle(step, sub)}
                              >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Checkbox
                                      checked={isSelected}
                                      disabled={isActivityLocked}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isActivityLocked) {
                                          handleSubcomponentToggle(step, sub);
                                        }
                                      }}
                                    />
                                    <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>
                                      {sub.subcomponent || sub['Subcomponent'] || 'Unknown'}
                                    </Typography>
                                    {isNonRD && (
                                      <Chip 
                                        label="Non-R&D" 
                                        size="small" 
                                        color="warning" 
                                        variant="outlined"
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Box>
                                  {sub.hint && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                      {sub.hint}
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
                          const isSelected = !!selectedSubcomponents[nonRDKey];
                          
                          return (
                            <Card 
                              sx={{ 
                                cursor: isActivityLocked ? 'not-allowed' : 'pointer',
                                border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                bgcolor: isSelected ? '#f3f6ff' : 'white',
                                opacity: isActivityLocked ? 0.6 : 1
                              }}
                              onClick={() => !isActivityLocked && handleSubcomponentToggle(step, {
                                id: 'non-rd-alternative',
                                category: '',
                                area: '',
                                focus: '',
                                researchActivity: activity,
                                step: step,
                                subcomponent: 'Non-R&D Alternative',
                                phase: '',
                                hint: 'Reduces the percentage of every other applied subcomponent but is not added to the calculation.'
                              })}
                            >
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isActivityLocked}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isActivityLocked) {
                                        handleSubcomponentToggle(step, {
                                          id: 'non-rd-alternative',
                                          category: '',
                                          area: '',
                                          focus: '',
                                          researchActivity: activity,
                                          step: step,
                                          subcomponent: 'Non-R&D Alternative',
                                          phase: '',
                                          hint: ''
                                        });
                                      }
                                    }}
                                  />
                                  <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>
                                    Non-R&D Alternative
                                  </Typography>
                                  <Chip 
                                    label="Non-R&D" 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
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
                              {typeof config.subcomponent === 'string' ? config.subcomponent : (config.subcomponent as any)?.title || 'Unknown'}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={isActivityLocked}
                              onClick={() => !isActivityLocked && handleSubcomponentToggle(config.step, {
                                id: `selected-${config.step}-${config.subcomponent}`,
                                category: '',
                                area: '',
                                focus: '',
                                researchActivity: activity,
                                step: config.step,
                                subcomponent: typeof config.subcomponent === 'string' ? config.subcomponent : (config.subcomponent as any)?.title || 'Unknown',
                                phase: config.phase || '',
                                hint: ''
                              })}
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
                              disabled={isActivityLocked}
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
                                  disabled={isActivityLocked}
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
                                disabled={isActivityLocked}
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
                                    onClick={() => !isActivityLocked && handleRoleToggle(key, role)}
                                    variant={(config.selectedRoles || []).includes(role) ? 'filled' : 'outlined'}
                                    sx={{ 
                                      cursor: isActivityLocked ? 'not-allowed' : 'pointer', 
                                      fontSize: '0.7rem',
                                      opacity: isActivityLocked ? 0.6 : 1
                                    }}
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
            disabled={selectedCount === 0 || isActivityLocked}
            title={isActivityLocked ? "Cannot export while activity is locked" : "Export QRA configuration for R&D Expenses foundation"}
          >
            Export Config
          </Button>
          
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            style={{ display: 'none' }}
            id="import-qra-config"
            disabled={isActivityLocked}
          />
          <label htmlFor="import-qra-config">
            <Button 
              component="span"
              variant="outlined"
              size="small"
              disabled={isActivityLocked}
              title={isActivityLocked ? "Cannot import while activity is locked" : "Import QRA configuration"}
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
            disabled={selectedCount === 0 || !validation.isValid || isActivityLocked}
            color={exceedsPractice ? "warning" : validation.isValid ? "primary" : "error"}
            title={!validation.isValid ? "Please resolve validation errors before completing" : isActivityLocked ? "Cannot complete while activity is locked" : ""}
          >
            {!validation.isValid 
              ? `Cannot Complete (${validation.errors.length} errors)` 
              : isActivityLocked
                ? 'Activity Locked'
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