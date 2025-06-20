import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { SubcomponentMetrics, SubcomponentSelection } from './types';

interface StepTwoProps {
  selectedModalSubs: Record<string, SubcomponentSelection>;
  modalMetrics: Record<string, SubcomponentMetrics>;
  modalNonRD: number;
  customStepTimes: Record<string, number>;
  currentYear: number;
}

export function StepTwo({
  selectedModalSubs,
  modalMetrics,
  modalNonRD,
  customStepTimes,
  currentYear
}: StepTwoProps) {
  // Group selections by phase and step
  const groupedSelections = Object.entries(selectedModalSubs).reduce((acc, [key, { phase, step, sub }]) => {
    if (!acc[phase]) {
      acc[phase] = {};
    }
    if (!acc[phase][step]) {
      acc[phase][step] = [];
    }
    acc[phase][step].push({ key, sub, metrics: modalMetrics[key] });
    return acc;
  }, {} as Record<string, Record<string, Array<{ key: string; sub: any; metrics?: SubcomponentMetrics }>>>);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Selections
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Non-R&D Time: {modalNonRD}%
        </Typography>
      </Box>

      {Object.entries(groupedSelections).map(([phase, steps]) => (
        <Box key={phase} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {phase}
          </Typography>

          {Object.entries(steps).map(([step, subs]) => {
            const stepKey = `${phase}__${step}`;
            const stepTime = customStepTimes[stepKey] || 0;

            return (
              <Box key={step} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {step} (Time: {stepTime}%)
                </Typography>

                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subcomponent</TableCell>
                        <TableCell align="right">Time %</TableCell>
                        <TableCell align="right">Frequency %</TableCell>
                        <TableCell align="right">Year %</TableCell>
                        <TableCell align="right">Start Month</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subs.map(({ key, sub, metrics }) => (
                        <TableRow key={key}>
                          <TableCell component="th" scope="row">
                            {sub.name}
                          </TableCell>
                          <TableCell align="right">
                            {metrics?.timePercent || 0}%
                          </TableCell>
                          <TableCell align="right">
                            {metrics?.frequencyPercent || 0}%
                          </TableCell>
                          <TableCell align="right">
                            {metrics?.yearPercent || 0}%
                          </TableCell>
                          <TableCell align="right">
                            {metrics?.startMonth !== undefined ? `${currentYear} (Month ${metrics.startMonth + 1})` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
} 