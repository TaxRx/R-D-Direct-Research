import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  LocationOn as LocationOnIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useFederalCreditCalculations, CreditCalculatorInput } from '../credit-calculator/useFederalCreditCalculations';
import { useStateCreditCalculations } from '../../../hooks/expenses/useStateCreditCalculations';
import { StateCreditInput } from '../../../types/StateCredit';
import { Employee, Contractor, Supply } from '../../../types/Employee';
import { Business } from '../../../types/Business';

interface ExpenseAnalyticsProps {
  employees: Employee[];
  contractors: Contractor[];
  supplies: Supply[];
  selectedYear: number;
  selectedBusinessId: string;
  businessType: 'C-Corp' | 'Pass-Through';
  stateCode?: string;
  employeeCount?: number;
  grossReceipts?: number;
  businesses: Business[];
}

export const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({
  employees,
  contractors,
  supplies,
  selectedYear,
  selectedBusinessId,
  businessType,
  stateCode,
  employeeCount,
  grossReceipts,
  businesses
}) => {
  // Calculate total QREs
  const totalQREs = React.useMemo(() => {
    const employeeQREs = employees
      .filter(emp => emp.isActive)
      .reduce((sum, emp) => sum + (emp.appliedAmount || 0), 0);
    
    const contractorQREs = contractors
      .filter(con => con.isActive)
      .reduce((sum, con) => sum + (con.appliedAmount || 0), 0);
    
    const supplyQREs = supplies
      .filter(sup => sup.isActive)
      .reduce((sum, sup) => sum + (sup.appliedAmount || 0), 0);
    
    return Math.round(employeeQREs + contractorQREs + supplyQREs);
  }, [employees, contractors, supplies]);

  // Get business financial history for real data
  const businessData = React.useMemo(() => {
    return businesses.find(b => b.id === selectedBusinessId);
  }, [businesses, selectedBusinessId]);

  // Federal credit calculations with real data
  const creditCalculatorInput: CreditCalculatorInput = React.useMemo(() => {
    const financialHistory = businessData?.financialHistory || [];
    const sortedHistory = [...financialHistory].sort((a, b) => b.year - a.year);

    const getPriorYearsData = (numberOfYears: number, dataKey: 'qre' | 'grossReceipts') => {
      const result: number[] = [];
      for (let i = 1; i <= numberOfYears; i++) {
        const yearData = sortedHistory.find(h => h.year === selectedYear - i);
        result.push(yearData?.[dataKey] || 0);
      }
      return result;
    };

    return {
      currentYearQREs: totalQREs,
      priorYearQREs: getPriorYearsData(4, 'qre'),
      priorYearGrossReceipts: getPriorYearsData(4, 'grossReceipts'),
      businessType,
    };
  }, [businessData, selectedYear, totalQREs, businessType]);

  const {
    method,
    setMethod,
    apply280c,
    setApply280c,
    isStandardMethodAvailable,
    grossCredit,
    finalCredit,
    federalTaxRate
  } = useFederalCreditCalculations(creditCalculatorInput);

  // State credit calculations
  const stateCreditInput: StateCreditInput = React.useMemo(() => {
    const financialHistory = businessData?.financialHistory || [];
    const sortedHistory = [...financialHistory].sort((a, b) => b.year - a.year);

    const getPriorYearsData = (numberOfYears: number, dataKey: 'qre' | 'grossReceipts') => {
      const result: number[] = [];
      for (let i = 1; i <= numberOfYears; i++) {
        const yearData = sortedHistory.find(h => h.year === selectedYear - i);
        result.push(yearData?.[dataKey] || 0);
      }
      return result;
    };

    return {
      stateQREs: totalQREs,
      priorYearQREs: getPriorYearsData(4, 'qre'),
      federalCredit: Math.round(finalCredit),
      stateCode: stateCode || 'CA',
      year: selectedYear,
      calculationYear: selectedYear,
      businessType: businessType === 'C-Corp' ? 'C-Corp' : 'LLC',
      employeeCount,
      grossReceipts
    };
  }, [businessData, selectedYear, totalQREs, finalCredit, stateCode, businessType, employeeCount, grossReceipts]);

  const {
    result: stateCreditResult,
    eligibility: stateEligibility,
    config: stateConfig
  } = useStateCreditCalculations(stateCreditInput);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Credit Calculations & Analytics
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total QREs</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ${totalQREs.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Qualified Research Expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Federal Credit</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                ${Math.round(finalCredit).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {method.toUpperCase()} Method
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">State Credit</Typography>
              </Box>
              <Typography variant="h4" color="secondary.main">
                ${Math.round(stateCreditResult?.credit || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stateCode || 'No State'} Credit
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalculateIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Credit</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                ${Math.round(finalCredit + (stateCreditResult?.credit || 0)).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Combined Benefits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Federal Credit Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Federal R&D Credit Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Calculation Method</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label="ASC Method"
                  color={method === 'asc' ? 'primary' : 'default'}
                  onClick={() => setMethod('asc')}
                  clickable
                  variant={method === 'asc' ? 'filled' : 'outlined'}
                />
                <Chip
                  label="Standard Method"
                  color={method === 'standard' ? 'primary' : 'default'}
                  onClick={() => setMethod('standard')}
                  clickable
                  disabled={!isStandardMethodAvailable}
                  variant={method === 'standard' ? 'filled' : 'outlined'}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Section 280C</Typography>
              <Chip
                label={apply280c ? 'Applied' : 'Not Applied'}
                color={apply280c ? 'success' : 'default'}
                onClick={() => setApply280c(!apply280c)}
                clickable
                variant={apply280c ? 'filled' : 'outlined'}
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Gross Credit</Typography>
              <Typography variant="h6">${Math.round(grossCredit).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Tax Rate</Typography>
              <Typography variant="h6">{(federalTaxRate * 100).toFixed(1)}%</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Final Credit</Typography>
              <Typography variant="h6" color="success.main">${Math.round(finalCredit).toLocaleString()}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* State Credit Details */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            State R&D Credit Details
          </Typography>

          {stateEligibility.isEligible ? (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">State</Typography>
                  <Typography variant="h6">{stateCode || 'Not Selected'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Calculation Method</Typography>
                  <Typography variant="h6">{stateConfig?.calculationMethod || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Base Amount</Typography>
                  <Typography variant="h6">${Math.round(stateCreditResult?.baseAmount || 0).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Excess QREs</Typography>
                  <Typography variant="h6">${Math.round(stateCreditResult?.excessQREs || 0).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Credit Rate</Typography>
                  <Typography variant="h6">{(stateConfig?.creditRate || 0) * 100}%</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Credit Amount</Typography>
                  <Typography variant="h6" color="secondary.main">
                    ${Math.round(stateCreditResult?.credit || 0).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              {stateConfig?.notes && stateConfig.notes.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Important Notes:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {stateConfig.notes.map((note, index) => (
                      <Typography key={index} component="li" variant="body2">
                        {note}
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
            </>
          ) : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Not eligible for state credit:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                {stateEligibility.reasons.map((reason, index) => (
                  <Typography key={index} component="li" variant="body2">
                    {reason}
                  </Typography>
                ))}
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}; 