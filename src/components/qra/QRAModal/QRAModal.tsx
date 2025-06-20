import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  DragIndicator as DragIndicatorIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';

// Types
export interface QRAModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: QRAModalData) => void;
  activity: string;
  csvRows: any[];
  currentYear: number;
  roles: RoleNode[];
  initialData?: QRAModalData;
}

export interface QRAModalData {
  selectedSubcomponents: Record<string, SubcomponentSelection>;
  metrics: Record<string, SubcomponentMetrics>;
  stepTimes: Record<string, number>;
  lockedSteps: Record<string, boolean>;
  nonRDTime: number;
}

export interface SubcomponentSelection {
  phase: string;
  step: string;
  subcomponent: Subcomponent;
}

export interface SubcomponentMetrics {
  timePercent: number;
  frequencyPercent: number;
  yearPercent: number;
  startMonth: number;
  selectedRoles: string[];
}

export interface Subcomponent {
  id: string;
  title: string;
  step: string;
  hint: string;
  frequencyPercent: number;
}

export interface RoleNode {
  id: string;
  name: string;
  color: string;
  children: RoleNode[];
  participatesInRD: boolean;
}

// Constants
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QRA_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2',
  '#303f9f', '#689f38', '#fbc02d', '#f44336', '#9c27b0'
];

const getQRAColor = (index: number) => QRA_COLORS[index % QRA_COLORS.length];

// Utility Functions
const getModalHierarchy = (activity: string, csvRows: any[]) => {
  if (!activity) return {};
  
  const rows = csvRows.filter(row => row['Research Activity'] === activity);
  const hierarchy: Record<string, Record<string, Subcomponent[]>> = {};
  
  rows.forEach((row, idx) => {
    const phase = row['Phase'] || 'Uncategorized Phase';
    const step = row['Step'] || 'Uncategorized Step';
    
    if (!hierarchy[phase]) hierarchy[phase] = {};
    if (!hierarchy[phase][step]) hierarchy[phase][step] = [];
    
    const fallbackId = `${row['Subcomponent'] || row['Step'] || row['Research Activity']}_${idx}`;
    hierarchy[phase][step].push({
      id: row['Subcomponent ID'] || fallbackId,
      title: row['Subcomponent'] || row['Step'] || row['Research Activity'],
      step: row['Step'] || '',
      hint: row['Hint'] || '',
      frequencyPercent: row['Frequency %'] ? Number(row['Frequency %']) : 0,
    });
  });
  
  return hierarchy;
};

const calculateStepTimes = (
  hierarchy: Record<string, Record<string, Subcomponent[]>>,
  lockedSteps: Record<string, boolean>,
  customStepTimes: Record<string, number>,
  nonRDTime: number
) => {
  const allStepKeys: string[] = [];
  Object.entries(hierarchy).forEach(([phaseName, steps]) => {
    Object.keys(steps).forEach(stepName => {
      allStepKeys.push(`${phaseName}__${stepName}`);
    });
  });

  const available = Math.max(0, 100 - nonRDTime);
  const lockedKeys = allStepKeys.filter(k => lockedSteps[k]);
  const unlockedKeys = allStepKeys.filter(k => !lockedSteps[k]);
  
  const lockedTotal = lockedKeys.reduce((sum, k) => sum + (customStepTimes[k] || 0), 0);
  const unlockedTotal = Math.max(0, available - lockedTotal);
  
  const stepTimeMap: Record<string, number> = {};
  
  // Set locked times
  lockedKeys.forEach(k => {
    stepTimeMap[k] = Math.max(0, Math.min(available, customStepTimes[k] || 0));
  });
  
  // Distribute unlocked times
  if (unlockedKeys.length > 0 && unlockedTotal > 0) {
    const timePerStep = unlockedTotal / unlockedKeys.length;
    unlockedKeys.forEach(k => {
      stepTimeMap[k] = Math.round(timePerStep * 10) / 10;
    });
  } else {
    unlockedKeys.forEach(k => {
      stepTimeMap[k] = 0;
    });
  }
  
  return stepTimeMap;
};

export const QRAModal: React.FC<QRAModalProps> = ({
  open,
  onClose,
  onComplete,
  activity,
  csvRows,
  currentYear,
  roles,
  initialData
}) => {
  // State
  const [selectedSubcomponents, setSelectedSubcomponents] = useState<Record<string, SubcomponentSelection>>({});
  const [metrics, setMetrics] = useState<Record<string, SubcomponentMetrics>>({});
  const [customStepTimes, setCustomStepTimes] = useState<Record<string, number>>({});
  const [lockedSteps, setLockedSteps] = useState<Record<string, boolean>>({});
  const [nonRDTime, setNonRDTime] = useState(10);
  const [openStep, setOpenStep] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Memoized values
  const hierarchy = useMemo(() => getModalHierarchy(activity, csvRows), [activity, csvRows]);
  
  const stepTimeMap = useMemo(() => 
    calculateStepTimes(hierarchy, lockedSteps, customStepTimes, nonRDTime),
    [hierarchy, lockedSteps, customStepTimes, nonRDTime]
  );

  // Initialize with existing data
  useEffect(() => {
    if (initialData && open) {
      setSelectedSubcomponents(initialData.selectedSubcomponents || {});
      setMetrics(initialData.metrics || {});
      setCustomStepTimes(initialData.stepTimes || {});
      setLockedSteps(initialData.lockedSteps || {});
      setNonRDTime(initialData.nonRDTime || 10);
    }
  }, [initialData, open]);

  // Event Handlers
  const handleSubcomponentToggle = useCallback((phase: string, step: string, sub: Subcomponent, idx: number) => {
    const key = `${phase}__${step}__${sub.id}__${idx}`;
    
    if (selectedSubcomponents[key]) {
      // Remove
      const newSelected = { ...selectedSubcomponents };
      const newMetrics = { ...metrics };
      delete newSelected[key];
      delete newMetrics[key];
      setSelectedSubcomponents(newSelected);
      setMetrics(newMetrics);
    } else {
      // Add
      setSelectedSubcomponents(prev => ({
        ...prev,
        [key]: { phase, step, subcomponent: sub }
      }));
      
      setMetrics(prev => ({
        ...prev,
        [key]: {
          timePercent: stepTimeMap[`${phase}__${step}`] || 0,
          frequencyPercent: 100,
          yearPercent: 100,
          startMonth: 0,
          selectedRoles: roles.map(r => r.id)
        }
      }));
    }
  }, [selectedSubcomponents, metrics, stepTimeMap, roles]);

  const handleMetricChange = useCallback((key: string, field: keyof SubcomponentMetrics, value: any) => {
    setMetrics(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  }, []);

  const handleStepTimeChange = useCallback((stepKey: string, value: number) => {
    setCustomStepTimes(prev => ({
      ...prev,
      [stepKey]: value
    }));
    setLockedSteps(prev => ({
      ...prev,
      [stepKey]: true
    }));
  }, []);

  const handleStepAccordionChange = useCallback((stepKey: string) => {
    setOpenStep(prev => prev === stepKey ? null : stepKey);
  }, []);

  const handleComplete = useCallback(() => {
    const data: QRAModalData = {
      selectedSubcomponents,
      metrics,
      stepTimes: stepTimeMap,
      lockedSteps,
      nonRDTime
    };
    
    onComplete(data);
    onClose();
  }, [selectedSubcomponents, metrics, stepTimeMap, lockedSteps, nonRDTime, onComplete, onClose]);

  // Render Components
  const renderStepTimeBar = () => {
    const segments = [];
    const percentLabels: { color: string; label: string; percent: number }[] = [];
    let left = 0;
    let colorIdx = 0;

    // Non R&D segment
    segments.push(
      <Box
        key="nonrd"
        sx={{
          position: 'absolute',
          left: `${left}%`,
          top: 0,
          height: 16,
          width: `${nonRDTime}%`,
          bgcolor: '#bdbdbd',
          borderRadius: '8px 0 0 8px',
          zIndex: 1
        }}
      />
    );
    percentLabels.push({ color: '#bdbdbd', label: 'Non R&D', percent: nonRDTime });
    left += nonRDTime;

    // Step segments
    Object.entries(hierarchy).forEach(([phaseName, steps]) => {
      Object.keys(steps).forEach(stepName => {
        const stepKey = `${phaseName}__${stepName}`;
        const percent = stepTimeMap[stepKey] || 0;
        
        segments.push(
          <Box
            key={stepKey}
            sx={{
              position: 'absolute',
              left: `${left}%`,
              top: 0,
              height: 16,
              width: `${percent}%`,
              bgcolor: getQRAColor(colorIdx),
              zIndex: 2
            }}
          />
        );
        
        percentLabels.push({
          color: getQRAColor(colorIdx),
          label: stepName,
          percent
        });
        
        left += percent;
        colorIdx++;
      });
    });

    return (
      <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: '#fafcff' }}>
        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700, mb: 1 }}>
          Step Time Allocation
        </Typography>
        <Box sx={{ position: 'relative', width: '100%', height: 16, mb: 1 }}>
          {segments}
          <Box sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: 16,
            width: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            zIndex: 3,
            pointerEvents: 'none'
          }} />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          {percentLabels.map(seg => (
            <Box key={seg.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FiberManualRecordIcon sx={{ color: seg.color, fontSize: 14 }} />
              <Typography variant="caption" sx={{ color: '#757575' }}>
                {`${seg.label} (${seg.percent.toFixed(1)}%)`}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>
    );
  };

  const renderPhaseAccordions = () => {
    return Object.entries(hierarchy).map(([phaseName, steps], phaseIdx) => (
      <Box key={phaseName} sx={{ mb: 2 }}>
        {Object.entries(steps).map(([stepName, subcomponents], stepIdx) => {
          const stepKey = `${phaseName}__${stepName}`;
          const isOpen = openStep === stepKey;
          const stepTime = stepTimeMap[stepKey] || 0;
          const isLocked = lockedSteps[stepKey];

          return (
            <Accordion
              key={stepKey}
              expanded={isOpen}
              onChange={() => handleStepAccordionChange(stepKey)}
              sx={{ mb: 1, boxShadow: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: 200 }}>
                    {stepName}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 300 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Time: {stepTime.toFixed(1)}%
                    </Typography>
                    <Slider
                      value={stepTime}
                      min={0}
                      max={100}
                      step={1}
                      sx={{ flex: 1 }}
                      onChange={(_, value) => handleStepTimeChange(stepKey, value as number)}
                      valueLabelDisplay="auto"
                      valueLabelFormat={v => `${v}%`}
                    />
                    <Tooltip title={isLocked ? 'Unlock step' : 'Lock step'}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLockedSteps(prev => ({
                            ...prev,
                            [stepKey]: !prev[stepKey]
                          }));
                        }}
                      >
                        {isLocked ? <LockIcon /> : <LockOpenIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Available Subcomponents */}
                  <Box sx={{ flex: 1, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Available</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {subcomponents.map((sub, idx) => {
                        const key = `${phaseName}__${stepName}__${sub.id}__${idx}`;
                        const isSelected = !!selectedSubcomponents[key];
                        
                        if (isSelected) return null;
                        
                        return (
                          <Card
                            key={key}
                            sx={{
                              cursor: 'pointer',
                              border: `2px solid ${getQRAColor(idx)}`,
                              '&:hover': { boxShadow: 2 }
                            }}
                            onClick={() => handleSubcomponentToggle(phaseName, stepName, sub, idx)}
                          >
                            <CardContent sx={{ p: '8px !important' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DragIndicatorIcon sx={{ color: 'text.secondary' }} />
                                <Typography variant="body2">{sub.title}</Typography>
                                <Tooltip title={sub.hint}>
                                  <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                </Tooltip>
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Selected Subcomponents */}
                  <Box sx={{ flex: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Selected</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {subcomponents.map((sub, idx) => {
                        const key = `${phaseName}__${stepName}__${sub.id}__${idx}`;
                        const isSelected = !!selectedSubcomponents[key];
                        const subMetrics = metrics[key];
                        
                        if (!isSelected) return null;
                        
                        return (
                          <Card key={key} sx={{ borderTop: `4px solid ${getQRAColor(idx)}` }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {sub.title}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleSubcomponentToggle(phaseName, stepName, sub, idx)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>

                              {/* Frequency Slider */}
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                  Frequency: {subMetrics?.frequencyPercent || 0}%
                                </Typography>
                                <Slider
                                  value={subMetrics?.frequencyPercent || 0}
                                  min={0}
                                  max={100}
                                  step={1}
                                  onChange={(_, value) => handleMetricChange(key, 'frequencyPercent', value)}
                                  valueLabelDisplay="auto"
                                  valueLabelFormat={v => `${v}%`}
                                />
                              </Box>

                              {/* Year Slider */}
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                  Year Coverage: {subMetrics?.yearPercent || 0}%
                                </Typography>
                                <Slider
                                  value={subMetrics?.yearPercent || 0}
                                  min={0}
                                  max={100}
                                  step={100/11}
                                  onChange={(_, value) => handleMetricChange(key, 'yearPercent', value)}
                                  valueLabelDisplay="auto"
                                  valueLabelFormat={value => {
                                    const month = 12 - Math.round((value/(100/11)));
                                    return MONTHS[month] || 'Dec';
                                  }}
                                />
                              </Box>

                              {/* Role Selection */}
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {roles.map(role => {
                                  const isResearchLeader = role.id === 'research-leader';
                                  const isRoleSelected = subMetrics?.selectedRoles?.includes(role.id) ?? true;
                                  
                                  return (
                                    <Chip
                                      key={role.id}
                                      label={role.name}
                                      clickable={!isResearchLeader}
                                      sx={{
                                        bgcolor: isResearchLeader ? '#fff' : (isRoleSelected ? role.color + '22' : '#f5f5f5'),
                                        border: isResearchLeader ? '2px solid #111' : `2px solid ${role.color}`,
                                        opacity: isResearchLeader ? 1 : (isRoleSelected ? 1 : 0.5)
                                      }}
                                      onClick={() => {
                                        if (!isResearchLeader) {
                                          const currentRoles = subMetrics?.selectedRoles || roles.map(r => r.id);
                                          const newRoles = isRoleSelected
                                            ? currentRoles.filter(id => id !== role.id)
                                            : [...currentRoles, role.id];
                                          handleMetricChange(key, 'selectedRoles', newRoles);
                                        }
                                      }}
                                    />
                                  );
                                })}
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    ));
  };

  const hasSelections = Object.keys(selectedSubcomponents).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh', maxHeight: '90vh' } }}
    >
      <AppBar position="sticky" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Configure Subcomponents for {activity}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 3 }}>
        {renderStepTimeBar()}
        <Divider sx={{ my: 2 }} />
        {renderPhaseAccordions()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          variant="contained"
          size="large"
          disabled={!hasSelections}
        >
          Complete Selection
        </Button>
      </DialogActions>

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Dialog>
  );
}; 