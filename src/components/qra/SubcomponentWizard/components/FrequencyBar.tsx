import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { SubcomponentMetrics } from '../types';

interface FrequencyBarProps {
  selectedModalSubs: Record<string, { phase: string; step: string; sub: any }>;
  modalMetrics: Record<string, SubcomponentMetrics>;
  phaseName: string;
  stepName: string;
}

export function FrequencyBar({
  selectedModalSubs,
  modalMetrics,
  phaseName,
  stepName
}: FrequencyBarProps) {
  // Calculate total frequency for this step
  const stepSubs = Object.entries(selectedModalSubs)
    .filter(([_, sel]) => sel.phase === phaseName && sel.step === stepName);

  const totalFrequency = stepSubs.reduce((sum, [key]) => {
    return sum + (modalMetrics[key]?.frequencyPercent || 0);
  }, 0);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Frequency Allocation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {totalFrequency.toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={totalFrequency}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundColor: totalFrequency === 100 ? 'success.main' : 'warning.main'
          }
        }}
      />
      {stepSubs.map(([key, { sub }]) => (
        <Box key={key} sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {sub.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {modalMetrics[key]?.frequencyPercent.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={modalMetrics[key]?.frequencyPercent || 0}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2
              }
            }}
          />
        </Box>
      ))}
    </Box>
  );
} 