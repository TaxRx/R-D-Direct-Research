import React from 'react';
import {
  Box,
  Card,
  Typography,
  LinearProgress,
  Grid,
  Chip
} from '@mui/material';
import { formatCurrency } from '../../../utils/currencyFormatting';

interface ExpenseSummaryProps {
  employees: any[];
  contractors: any[];
  supplies: any[];
  selectedYear: number;
  federalCredit?: number;
  yearTotals?: {
    totalWages: number;
    totalAppliedWages: number;
    totalContractorAmounts: number;
    totalAppliedContractorAmounts: number;
    totalSupplyValues: number;
    totalAppliedSupplyAmounts: number;
  };
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  employees,
  contractors,
  supplies,
  selectedYear,
  federalCredit = 0,
  yearTotals
}) => {
  // Use yearTotals if provided, otherwise calculate from raw data
  const totalWages = yearTotals?.totalWages ?? employees.reduce((sum, emp) => sum + (emp.wage || 0), 0);
  const totalAppliedWages = yearTotals?.totalAppliedWages ?? employees.reduce((sum, emp) => sum + (emp.appliedAmount || 0), 0);
  const totalContractorAmounts = yearTotals?.totalContractorAmounts ?? contractors.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalAppliedContractorAmounts = yearTotals?.totalAppliedContractorAmounts ?? contractors.reduce((sum, c) => sum + (c.appliedAmount || 0), 0);
  const totalSupplyValues = yearTotals?.totalSupplyValues ?? supplies.reduce((sum, s) => sum + (s.totalValue || 0), 0);
  const totalAppliedSupplyAmounts = yearTotals?.totalAppliedSupplyAmounts ?? supplies.reduce((sum, s) => sum + (s.appliedAmount || 0), 0);

  const totalExpenses = totalWages + totalContractorAmounts + totalSupplyValues;
  const totalAppliedExpenses = totalAppliedWages + totalAppliedContractorAmounts + totalAppliedSupplyAmounts;
  const overallPercentage = totalExpenses > 0 ? (totalAppliedExpenses / totalExpenses) * 100 : 0;

  // Get color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#4caf50'; // Green
    if (percentage >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        R&D Expenses Summary - {selectedYear}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Overall Progress */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Overall R&D Application Rate
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {overallPercentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(overallPercentage, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getProgressColor(overallPercentage),
                  borderRadius: 4
                }
              }}
            />
          </Box>
        </Grid>

        {/* Employee Summary */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
              {employees.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Employees
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrency(totalWages)} → {formatCurrency(totalAppliedWages)}
            </Typography>
            <Chip
              label={`${totalWages > 0 ? ((totalAppliedWages / totalWages) * 100).toFixed(1) : 0}% Applied`}
              size="small"
              color={totalWages > 0 && (totalAppliedWages / totalWages) * 100 >= 80 ? 'success' : 'default'}
              sx={{ mt: 1 }}
            />
          </Box>
        </Grid>

        {/* Contractor Summary */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
              {contractors.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Contractors
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrency(totalContractorAmounts)} → {formatCurrency(totalAppliedContractorAmounts)}
            </Typography>
            <Chip
              label={`${totalContractorAmounts > 0 ? ((totalAppliedContractorAmounts / totalContractorAmounts) * 100).toFixed(1) : 0}% Applied`}
              size="small"
              color={totalContractorAmounts > 0 && (totalAppliedContractorAmounts / totalContractorAmounts) * 100 >= 80 ? 'success' : 'default'}
              sx={{ mt: 1 }}
            />
          </Box>
        </Grid>

        {/* Supply Summary */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
              {supplies.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Supplies
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrency(totalSupplyValues)} → {formatCurrency(totalAppliedSupplyAmounts)}
            </Typography>
            <Chip
              label={`${totalSupplyValues > 0 ? ((totalAppliedSupplyAmounts / totalSupplyValues) * 100).toFixed(1) : 0}% Applied`}
              size="small"
              color={totalSupplyValues > 0 && (totalAppliedSupplyAmounts / totalSupplyValues) * 100 >= 80 ? 'success' : 'default'}
              sx={{ mt: 1 }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Total Summary */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2" color="text.secondary">
              Total Expenses
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {formatCurrency(totalExpenses)}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Applied
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: getProgressColor(overallPercentage) }}>
                {formatCurrency(totalAppliedExpenses)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Federal Credit
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#81c784' }}>
                {formatCurrency(federalCredit)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}; 