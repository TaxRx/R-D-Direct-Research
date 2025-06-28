import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Alert, Divider } from '@mui/material';
import { useStateCreditCalculations } from '../../../hooks/expenses/useStateCreditCalculations';
import { StateCreditInput, EntityType } from '../../../types/StateCredit';

interface StateCreditCardProps {
  stateCode: string;
  year: number;
  entityType: EntityType;
  qres: number;
  priorYearQREs: number[];
  federalCredit: number;
}

const StateCreditCard: React.FC<StateCreditCardProps> = ({
  stateCode,
  year,
  entityType,
  qres,
  priorYearQREs,
  federalCredit,
}) => {
  // Get all configs for this state
  const { configs, selectedConfig, setSelectedConfigKey, result, eligibility, breakdown } = useStateCreditCalculations({
    stateCode,
    year,
    calculationYear: year,
    businessType: entityType,
    stateQREs: qres,
    priorYearQREs,
    federalCredit,
  });

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedConfigKey(event.target.value);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          State R&D Credit Calculator
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {stateCode} - {selectedConfig?.calculationMethod || 'Standard'} Method
        </Typography>

        {/* Method Selection */}
        {configs.length > 1 && (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Calculation Method</FormLabel>
            <RadioGroup
              value={selectedConfig ? `${selectedConfig.calculationMethod}-${year}` : ''}
              onChange={handleMethodChange}
            >
              {configs.map((cfg: any) => (
                <FormControlLabel
                  key={cfg.key}
                  value={cfg.key}
                  control={<Radio />}
                  label={cfg.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}

        {/* Eligibility Warning */}
        {eligibility && !eligibility.isEligible && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Not eligible: {eligibility.reasons.join(', ')}
          </Alert>
        )}

        {/* Credit Result */}
        {result && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ color: 'green', fontWeight: 700 }}>
              Credit: {result.creditAmount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </Typography>
            {result.maxCredit && (
              <Typography variant="body2" color="text.secondary">
                Max Credit: {result.maxCredit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </Typography>
            )}
          </Box>
        )}

        {/* Requirements */}
        {eligibility && eligibility.requirements.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Requirements:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {eligibility.requirements.map((req, index) => (
                <li key={index}>
                  <Typography variant="body2">{req}</Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {/* Calculation Breakdown */}
        {breakdown && Object.keys(breakdown).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Calculation Breakdown:
            </Typography>
            <Box sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 14 }}>
              {Object.entries(breakdown).map(([key, value]) => (
                <div key={key}>{value}</div>
              ))}
            </Box>
          </Box>
        )}

        {/* Pre-filing Notice */}
        {selectedConfig && selectedConfig.preFilingRequired && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Pre-filing required: {selectedConfig.preFilingForm || 'Form required'}
            {selectedConfig.preFilingDeadline && ` (${selectedConfig.preFilingDeadline})`}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StateCreditCard; 