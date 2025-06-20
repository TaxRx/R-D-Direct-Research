import React, { Dispatch, SetStateAction, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  TextField,
  Grid,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ModalHierarchy, Subcomponent, SubcomponentSelection, SubcomponentMetrics } from './types';
import { DEFAULT_METRICS, CHART_COLORS, UI, VALIDATION } from './constants';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StepOneProps {
  activity: string;
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
  currentYear: number;
}

const DonutChart: React.FC<{ metrics: SubcomponentMetrics }> = ({ metrics }) => {
  const data = [
    { name: 'Time', value: metrics.timePercent },
    { name: 'Frequency', value: metrics.frequencyPercent },
    { name: 'Year', value: metrics.yearPercent }
  ];

  return (
    <ResponsiveContainer width={UI.CHART.WIDTH} height={UI.CHART.HEIGHT}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={UI.CHART.INNER_RADIUS}
          outerRadius={UI.CHART.OUTER_RADIUS}
          paddingAngle={UI.CHART.PADDING_ANGLE}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={Object.values(CHART_COLORS)[index]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

// Helper to recalculate frequency (stub, implement as needed)
function recalculateFrequency(metrics: SubcomponentMetrics, newStep: string): SubcomponentMetrics {
  // Example: just return metrics for now; implement your logic here
  return { ...metrics };
}

export function StepOne({
  activity,
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
  currentYear
}: StepOneProps) {
  const handleStepAccordionChange = (step: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setOpenStep(isExpanded ? step : null);
  };

  const handleSubcomponentToggle = (sub: Subcomponent, phase: string, step: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      setSelectedModalSubs((prev: Record<string, SubcomponentSelection>) => {
        const newSubs = { ...prev, [sub.id]: { phase, step, sub } };
        return newSubs;
      });
      setModalMetrics((prevMetrics: Record<string, SubcomponentMetrics>) => ({
        ...prevMetrics,
        [sub.id]: { ...DEFAULT_METRICS }
      }));
    } else {
      setSelectedModalSubs((prev: Record<string, SubcomponentSelection>) => {
        const newSubs = { ...prev };
        delete newSubs[sub.id];
        return newSubs;
      });
      setModalMetrics((prevMetrics: Record<string, SubcomponentMetrics>) => {
        const newMetrics = { ...prevMetrics };
        delete newMetrics[sub.id];
        return newMetrics;
      });
    }
  };

  const handleMetricChange = (subId: string, field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(0, Number(event.target.value)), VALIDATION.MAX_PERCENT);
    setModalMetrics((prev: Record<string, SubcomponentMetrics>) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        [field]: value
      }
    }));
  };

  const handleNonRDChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(0, Number(event.target.value)), VALIDATION.MAX_PERCENT);
    setModalNonRD(value);
  };

  const handleStepTimeChange = (step: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(0, Number(event.target.value)), VALIDATION.MAX_PERCENT);
    setCustomStepTimes((prev: Record<string, number>) => ({
      ...prev,
      [step]: value
    }));
  };

  useEffect(() => {
    // Reset metrics when modal metrics change
    setModalMetrics(prev => {
      const newMetrics = { ...prev };
      Object.keys(newMetrics).forEach(key => {
        if (!selectedModalSubs[key]) {
          delete newMetrics[key];
        }
      });
      return newMetrics;
    });
  }, [selectedModalSubs, setModalMetrics]);

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Non-R&D Time Allocation
            </Typography>
            <TextField
              type="number"
              label="Non-R&D Time (%)"
              value={modalNonRD}
              onChange={handleNonRDChange}
              inputProps={{
                min: VALIDATION.MIN_PERCENT,
                max: VALIDATION.MAX_PERCENT,
                step: 1
              }}
              sx={{ width: 200 }}
            />
          </Paper>
        </Grid>

        {Object.entries(modalHierarchyState).map(([phase, steps]) => (
          Object.entries(steps).map(([step, subcomponents]) => (
            <Grid item xs={12} key={phase + '__' + step}>
              <Accordion
                expanded={openStep === step}
                onChange={handleStepAccordionChange(step)}
                sx={{
                  boxShadow: UI.CARD.SHADOW,
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    gap: 2,
                    flexWrap: 'wrap'
                  }}>
                    <Typography variant="h6" sx={{ flexBasis: '20%', minWidth: 120, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step}</Typography>
                    <Box sx={{ flexBasis: '30%', minWidth: 180, maxWidth: 300, px: 2 }}>
                      <TextField
                        type="number"
                        label="Time (%)"
                        value={customStepTimes[step] || 0}
                        onChange={handleStepTimeChange(step)}
                        inputProps={{ min: VALIDATION.MIN_PERCENT, max: VALIDATION.MAX_PERCENT, step: 1 }}
                        fullWidth
                      />
                    </Box>
                    <Box sx={{ flexBasis: '50%', minWidth: 180, maxWidth: 500, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {subcomponents.map(sub => (
                        <Box key={sub.id} sx={{ mb: 0.5 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!selectedModalSubs[sub.id]}
                                onChange={handleSubcomponentToggle(sub, phase, step)}
                              />
                            }
                            label={sub.name}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {subcomponents.map(sub => (
                      <Grid item xs={12} sm={6} md={4} key={sub.id}>
                        <Paper
                          sx={{
                            p: 2,
                            boxShadow: UI.CARD.SHADOW,
                            height: '100%'
                          }}
                        >
                          {selectedModalSubs[sub.id] && (
                            <Box sx={{ mt: 2 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <DonutChart metrics={modalMetrics[sub.id]} />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    type="number"
                                    label="Time (%)"
                                    value={modalMetrics[sub.id]?.timePercent || 0}
                                    onChange={handleMetricChange(sub.id, 'timePercent')}
                                    inputProps={{
                                      min: VALIDATION.MIN_PERCENT,
                                      max: VALIDATION.MAX_PERCENT,
                                      step: 1
                                    }}
                                    fullWidth
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    type="number"
                                    label="Frequency (%)"
                                    value={modalMetrics[sub.id]?.frequencyPercent || 0}
                                    onChange={handleMetricChange(sub.id, 'frequencyPercent')}
                                    inputProps={{
                                      min: VALIDATION.MIN_PERCENT,
                                      max: VALIDATION.MAX_PERCENT,
                                      step: 1
                                    }}
                                    fullWidth
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    type="number"
                                    label="Year (%)"
                                    value={modalMetrics[sub.id]?.yearPercent || 0}
                                    onChange={handleMetricChange(sub.id, 'yearPercent')}
                                    inputProps={{
                                      min: VALIDATION.MIN_PERCENT,
                                      max: VALIDATION.MAX_PERCENT,
                                      step: 1
                                    }}
                                    fullWidth
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))
        ))}
      </Grid>
    </Box>
  );
} 