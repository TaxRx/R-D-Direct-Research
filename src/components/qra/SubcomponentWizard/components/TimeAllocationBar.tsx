import React, { Dispatch, SetStateAction } from 'react';
import { Box, Typography, Slider, IconButton, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { ModalHierarchy } from '../types';

interface TimeAllocationBarProps {
  modalHierarchyState: ModalHierarchy;
  modalNonRD: number;
  setModalNonRD: (value: number) => void;
  customStepTimes: Record<string, number>;
  setCustomStepTimes: Dispatch<SetStateAction<Record<string, number>>>;
  lockedSteps: Record<string, boolean>;
  setLockedSteps: Dispatch<SetStateAction<Record<string, boolean>>>;
  stepTimeMap: Record<string, number>;
}

export function TimeAllocationBar({
  modalHierarchyState,
  modalNonRD,
  setModalNonRD,
  customStepTimes,
  setCustomStepTimes,
  lockedSteps,
  setLockedSteps,
  stepTimeMap
}: TimeAllocationBarProps) {
  const handleTimeChange = (stepKey: string, value: number) => {
    setCustomStepTimes(prev => ({
      ...prev,
      [stepKey]: value
    }));
  };

  const toggleStepLock = (stepKey: string) => {
    setLockedSteps(prev => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Time Allocation
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Non-R&D Time (%)
        </Typography>
        <Slider
          value={modalNonRD}
          onChange={(_, value) => setModalNonRD(value as number)}
          min={0}
          max={100}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}%`}
        />
      </Box>
      {Object.entries(modalHierarchyState).map(([phaseName, steps]) => (
        <Box key={phaseName} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {phaseName}
          </Typography>
          {Object.entries(steps).map(([stepName]) => {
            const stepKey = `${phaseName}__${stepName}`;
            const isLocked = lockedSteps[stepKey] || false;
            const timeValue = customStepTimes[stepKey] || 0;

            return (
              <Box key={stepKey} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {stepName}
                  </Typography>
                  <Slider
                    value={timeValue}
                    onChange={(_, value) => handleTimeChange(stepKey, value as number)}
                    min={0}
                    max={100}
                    disabled={isLocked}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
                <Tooltip title={isLocked ? "Unlock time allocation" : "Lock time allocation"}>
                  <IconButton
                    size="small"
                    onClick={() => toggleStepLock(stepKey)}
                    color={isLocked ? "primary" : "default"}
                  >
                    {isLocked ? <LockIcon /> : <LockOpenIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
} 