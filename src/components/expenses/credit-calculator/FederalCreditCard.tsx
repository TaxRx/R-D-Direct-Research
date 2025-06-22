import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Tooltip,
  IconButton,
  Collapse,
  Divider,
  Paper,
} from '@mui/material';
import { HelpOutline, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useFederalCreditCalculations, CreditCalculatorInput } from './useFederalCreditCalculations';
import { formatCurrency } from '../../../utils/currencyFormatting';

interface FederalCreditCardProps {
  input: CreditCalculatorInput;
}

export const FederalCreditCard: React.FC<FederalCreditCardProps> = ({ input }) => {
  const [showMath, setShowMath] = useState(false);
  
  const {
    method,
    setMethod,
    apply280c,
    setApply280c,
    isStandardMethodAvailable,
    grossCredit,
    finalCredit,
    federalTaxRate,
  } = useFederalCreditCalculations(input);

  // Calculate intermediate values for display
  const getCalculationDetails = () => {
    const { currentYearQREs, priorYearQREs, priorYearGrossReceipts } = input;
    
    if (method === 'asc') {
      const validPriorYearQREs = priorYearQREs.slice(0, 3).filter(qre => qre > 0);
      if (validPriorYearQREs.length === 3) {
        const ascBase = validPriorYearQREs.reduce((sum, qre) => sum + qre, 0) / 3;
        const halfBase = 0.5 * ascBase;
        const incrementalQREs = currentYearQREs - halfBase;
        return {
          method: 'ASC',
          basePeriodAverage: ascBase,
          halfBase,
          incrementalQREs,
          rate: 0.14,
          grossCredit,
        };
      } else {
        return {
          method: 'ASC (No Base Period)',
          currentYearQREs,
          rate: 0.06,
          grossCredit,
        };
      }
    } else {
      const avgGrossReceipts = priorYearGrossReceipts.reduce((sum, r) => sum + r, 0) / 4;
      let baseAmount = 0.03 * avgGrossReceipts;
      if (baseAmount < 0.5 * currentYearQREs) {
        baseAmount = 0.5 * currentYearQREs;
      }
      const incrementalQREs = currentYearQREs - baseAmount;
      return {
        method: 'Standard',
        avgGrossReceipts,
        baseAmount,
        incrementalQREs,
        rate: 0.20,
        grossCredit,
      };
    }
  };

  const details = getCalculationDetails();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header Section */}
        <Typography variant="h6" gutterBottom>
          Federal R&D Credit
        </Typography>
        <Typography variant="h4" color="primary" sx={{ mb: 3 }}>
          {formatCurrency(finalCredit)}
        </Typography>

        {/* Controls Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Calculation Method
          </Typography>
          <RadioGroup row value={method} onChange={(e) => setMethod(e.target.value as 'asc' | 'standard')}>
            <FormControlLabel value="asc" control={<Radio />} label="Alternative Simplified Credit (ASC)" />
            <Tooltip title={!isStandardMethodAvailable ? "Standard Method unavailable due to missing gross receipt or expense data." : ""}>
              <span>
                <FormControlLabel
                  value="standard"
                  control={<Radio />}
                  label="Regular (Standard) Credit"
                  disabled={!isStandardMethodAvailable}
                />
              </span>
            </Tooltip>
          </RadioGroup>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={<Switch checked={apply280c} onChange={(e) => setApply280c(e.target.checked)} />}
            label="Apply 280C Election"
          />
          <Tooltip title="Reduces the credit to account for disallowed wage deductions.">
            <IconButton size="small">
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Math Breakdown Section */}
        <Box>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'action.hover' },
              borderRadius: 1,
              p: 1,
              mb: 1
            }}
            onClick={() => setShowMath(!showMath)}
          >
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Calculation Details
            </Typography>
            {showMath ? <ExpandLess /> : <ExpandMore />}
          </Box>

          <Collapse in={showMath}>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                {details.method} Method
              </Typography>

              {method === 'asc' && details.method === 'ASC' && (
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Base Period Average (3-year average of QREs):
                    </Typography>
                    <Typography variant="body2">
                      ({input.priorYearQREs.slice(0, 3).map((qre: number, i: number) => `${formatCurrency(qre)}`).join(' + ')}) ÷ 3 = {formatCurrency(details.basePeriodAverage || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      50% of Base Period Average:
                    </Typography>
                    <Typography variant="body2">
                      0.5 × {formatCurrency(details.basePeriodAverage || 0)} = {formatCurrency(details.halfBase || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Incremental QREs:
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(input.currentYearQREs)} - {formatCurrency(details.halfBase || 0)} = {formatCurrency(details.incrementalQREs || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Gross Credit (14% rate):
                    </Typography>
                    <Typography variant="body2">
                      0.14 × {formatCurrency(details.incrementalQREs || 0)} = {formatCurrency(details.grossCredit)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {method === 'asc' && details.method === 'ASC (No Base Period)' && (
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      No valid base period (insufficient prior year data)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Gross Credit (6% rate):
                    </Typography>
                    <Typography variant="body2">
                      0.06 × {formatCurrency(details.currentYearQREs || 0)} = {formatCurrency(details.grossCredit)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {method === 'standard' && (
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Average Gross Receipts (4-year average):
                    </Typography>
                    <Typography variant="body2">
                      ({input.priorYearGrossReceipts.map((r: number, i: number) => `${formatCurrency(r)}`).join(' + ')}) ÷ 4 = {formatCurrency(details.avgGrossReceipts || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Base Amount (3% of average gross receipts):
                    </Typography>
                    <Typography variant="body2">
                      0.03 × {formatCurrency(details.avgGrossReceipts || 0)} = {formatCurrency(details.baseAmount || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Incremental QREs:
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(input.currentYearQREs)} - {formatCurrency(details.baseAmount || 0)} = {formatCurrency(details.incrementalQREs || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Gross Credit (20% rate):
                    </Typography>
                    <Typography variant="body2">
                      0.20 × {formatCurrency(details.incrementalQREs || 0)} = {formatCurrency(details.grossCredit)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {apply280c && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    280C Election Adjustment:
                  </Typography>
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    <Typography variant="body2">
                      Final Credit = {formatCurrency(details.grossCredit)} × 0.79 = {formatCurrency(finalCredit)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {!apply280c && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">
                    No 280C election applied. Final credit equals gross credit.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
}; 