import React, { useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../../utils/currencyFormatting';

interface ExpenseAnalyticsProps {
  employees: any[];
  contractors: any[];
  supplies: any[];
  selectedYear: number;
  previousYear?: number;
  previousYearData?: {
    employees: any[];
    contractors: any[];
    supplies: any[];
  };
}

export const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({
  employees,
  contractors,
  supplies,
  selectedYear,
  previousYear,
  previousYearData
}) => {
  // Calculate current year metrics
  const currentMetrics = useMemo(() => {
    const totalWages = employees.reduce((sum, emp) => sum + (emp.wage || 0), 0);
    const totalAppliedWages = employees.reduce((sum, emp) => sum + (emp.appliedAmount || 0), 0);
    const totalContractorAmounts = contractors.reduce((sum, cont) => sum + (cont.totalAmount || 0), 0);
    const totalAppliedContractorAmounts = contractors.reduce((sum, cont) => sum + (cont.appliedAmount || 0), 0);
    const totalSupplyAmounts = supplies.reduce((sum, sup) => sum + (sup.totalValue || 0), 0);
    const totalAppliedSupplyAmounts = supplies.reduce((sum, sup) => sum + (sup.appliedAmount || 0), 0);

    const totalExpenses = totalWages + totalContractorAmounts + totalSupplyAmounts;
    const totalAppliedExpenses = totalAppliedWages + totalAppliedContractorAmounts + totalAppliedSupplyAmounts;
    const overallEfficiency = totalExpenses > 0 ? (totalAppliedExpenses / totalExpenses) * 100 : 0;

    return {
      totalWages,
      totalAppliedWages,
      totalContractorAmounts,
      totalAppliedContractorAmounts,
      totalSupplyAmounts,
      totalAppliedSupplyAmounts,
      totalExpenses,
      totalAppliedExpenses,
      overallEfficiency
    };
  }, [employees, contractors, supplies]);

  // Calculate year-over-year changes if previous year data is available
  const yearOverYearChanges = useMemo(() => {
    if (!previousYearData) return null;

    const prevMetrics = {
      totalWages: previousYearData.employees.reduce((sum, emp) => sum + (emp.wage || 0), 0),
      totalContractorAmounts: previousYearData.contractors.reduce((sum, cont) => sum + (cont.totalAmount || 0), 0),
      totalSupplyAmounts: previousYearData.supplies.reduce((sum, sup) => sum + (sup.totalValue || 0), 0),
      totalExpenses: 0
    };
    prevMetrics.totalExpenses = prevMetrics.totalWages + prevMetrics.totalContractorAmounts + prevMetrics.totalSupplyAmounts;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      wagesChange: calculateChange(currentMetrics.totalWages, prevMetrics.totalWages),
      contractorChange: calculateChange(currentMetrics.totalContractorAmounts, prevMetrics.totalContractorAmounts),
      supplyChange: calculateChange(currentMetrics.totalSupplyAmounts, prevMetrics.totalSupplyAmounts),
      totalChange: calculateChange(currentMetrics.totalExpenses, prevMetrics.totalExpenses)
    };
  }, [currentMetrics, previousYearData]);

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    const totalEmployees = employees.length;
    const employeesWithValidRoles = employees.filter(emp => emp.role && emp.role !== 'NON_RD_ROLE').length;
    const employeesWithValidPercentages = employees.filter(emp => (emp.appliedPercentage || 0) > 0).length;
    
    const totalContractors = contractors.length;
    const contractorsWithValidPercentages = contractors.filter(cont => (cont.appliedPercentage || 0) > 0).length;
    
    const totalSupplies = supplies.length;
    const suppliesWithValidPercentages = supplies.filter(sup => (sup.appliedPercentage || 0) > 0).length;

    return {
      employeeCompliance: totalEmployees > 0 ? (employeesWithValidRoles / totalEmployees) * 100 : 0,
      employeePercentageCompliance: totalEmployees > 0 ? (employeesWithValidPercentages / totalEmployees) * 100 : 0,
      contractorCompliance: totalContractors > 0 ? (contractorsWithValidPercentages / totalContractors) * 100 : 0,
      supplyCompliance: totalSupplies > 0 ? (suppliesWithValidPercentages / totalSupplies) * 100 : 0
    };
  }, [employees, contractors, supplies]);

  // Calculate distribution metrics
  const distributionMetrics = useMemo(() => {
    const totalExpenses = currentMetrics.totalExpenses;
    if (totalExpenses === 0) return { wages: 0, contractors: 0, supplies: 0 };

    return {
      wages: (currentMetrics.totalWages / totalExpenses) * 100,
      contractors: (currentMetrics.totalContractorAmounts / totalExpenses) * 100,
      supplies: (currentMetrics.totalSupplyAmounts / totalExpenses) * 100
    };
  }, [currentMetrics]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUpIcon color="success" />;
    if (change < 0) return <TrendingDownIcon color="error" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'success';
    if (change < 0) return 'error';
    return 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon color="primary" />
        R&D Expenses Analytics - {selectedYear}
      </Typography>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total Expenses
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(currentMetrics.totalExpenses)}
            </Typography>
            {yearOverYearChanges && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                {getChangeIcon(yearOverYearChanges.totalChange)}
                <Chip
                  label={`${yearOverYearChanges.totalChange > 0 ? '+' : ''}${yearOverYearChanges.totalChange.toFixed(1)}%`}
                  color={getChangeColor(yearOverYearChanges.totalChange) as any}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Applied Expenses
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(currentMetrics.totalAppliedExpenses)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentMetrics.overallEfficiency.toFixed(1)}% efficiency
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total Items
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {employees.length + contractors.length + supplies.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employees.length} employees, {contractors.length} contractors, {supplies.length} supplies
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Compliance Score
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {((complianceMetrics.employeeCompliance + complianceMetrics.contractorCompliance + complianceMetrics.supplyCompliance) / 3).toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overall compliance
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Expense Distribution */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Expense Distribution
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Wages</Typography>
                  <Typography variant="body2">{distributionMetrics.wages.toFixed(1)}%</Typography>
                </Box>
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress
                    variant="determinate"
                    value={distributionMetrics.wages}
                    sx={{ height: 20, borderRadius: 1, bgcolor: 'blue.100' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${currentMetrics.totalWages > 0 ? (currentMetrics.totalAppliedWages / currentMetrics.totalWages) * 100 : 0}%`,
                      bgcolor: 'blue.600',
                      borderRadius: '4px 0 0 4px',
                      opacity: 0.7
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total: {formatCurrency(currentMetrics.totalWages)}
                  </Typography>
                  <Typography variant="caption" color="blue.600">
                    Applied: {formatCurrency(currentMetrics.totalAppliedWages)} (
                    {currentMetrics.totalWages > 0 ? ((currentMetrics.totalAppliedWages / currentMetrics.totalWages) * 100).toFixed(1) : 0}%)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Contractors</Typography>
                  <Typography variant="body2">{distributionMetrics.contractors.toFixed(1)}%</Typography>
                </Box>
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress
                    variant="determinate"
                    value={distributionMetrics.contractors}
                    sx={{ height: 20, borderRadius: 1, bgcolor: 'green.100' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${currentMetrics.totalContractorAmounts > 0 ? (currentMetrics.totalAppliedContractorAmounts / currentMetrics.totalContractorAmounts) * 100 : 0}%`,
                      bgcolor: 'green.600',
                      borderRadius: '4px 0 0 4px',
                      opacity: 0.7
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total: {formatCurrency(currentMetrics.totalContractorAmounts)}
                  </Typography>
                  <Typography variant="caption" color="green.600">
                    Applied: {formatCurrency(currentMetrics.totalAppliedContractorAmounts)} (
                    {currentMetrics.totalContractorAmounts > 0 ? ((currentMetrics.totalAppliedContractorAmounts / currentMetrics.totalContractorAmounts) * 100).toFixed(1) : 0}%)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Supplies</Typography>
                  <Typography variant="body2">{distributionMetrics.supplies.toFixed(1)}%</Typography>
                </Box>
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress
                    variant="determinate"
                    value={distributionMetrics.supplies}
                    sx={{ height: 20, borderRadius: 1, bgcolor: 'orange.100' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${currentMetrics.totalSupplyAmounts > 0 ? (currentMetrics.totalAppliedSupplyAmounts / currentMetrics.totalSupplyAmounts) * 100 : 0}%`,
                      bgcolor: 'orange.600',
                      borderRadius: '4px 0 0 4px',
                      opacity: 0.7
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total: {formatCurrency(currentMetrics.totalSupplyAmounts)}
                  </Typography>
                  <Typography variant="caption" color="orange.600">
                    Applied: {formatCurrency(currentMetrics.totalAppliedSupplyAmounts)} (
                    {currentMetrics.totalSupplyAmounts > 0 ? ((currentMetrics.totalAppliedSupplyAmounts / currentMetrics.totalSupplyAmounts) * 100).toFixed(1) : 0}%)
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Compliance Analysis */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Compliance Analysis
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {complianceMetrics.employeeCompliance >= 80 ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                </Box>
                <Typography variant="h6">{complianceMetrics.employeeCompliance.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text.secondary">Employee Compliance</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {complianceMetrics.contractorCompliance >= 80 ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                </Box>
                <Typography variant="h6">{complianceMetrics.contractorCompliance.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text.secondary">Contractor Compliance</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {complianceMetrics.supplyCompliance >= 80 ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                </Box>
                <Typography variant="h6">{complianceMetrics.supplyCompliance.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text.secondary">Supply Compliance</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{currentMetrics.overallEfficiency.toFixed(1)}%</Typography>
                <Typography variant="body2" color="text.secondary">Overall Efficiency</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={currentMetrics.overallEfficiency} 
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Year-over-Year Comparison */}
      {yearOverYearChanges && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Year-over-Year Comparison ({previousYear} → {selectedYear})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Previous Year</TableCell>
                    <TableCell align="right">Current Year</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell align="center">Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Wages</TableCell>
                    <TableCell align="right">
                      {formatCurrency(previousYearData!.employees.reduce((sum, emp) => sum + (emp.wage || 0), 0))}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(currentMetrics.totalWages)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${yearOverYearChanges.wagesChange > 0 ? '+' : ''}${yearOverYearChanges.wagesChange.toFixed(1)}%`}
                        color={getChangeColor(yearOverYearChanges.wagesChange) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {getChangeIcon(yearOverYearChanges.wagesChange)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Contractors</TableCell>
                    <TableCell align="right">
                      {formatCurrency(previousYearData!.contractors.reduce((sum, cont) => sum + (cont.totalAmount || 0), 0))}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(currentMetrics.totalContractorAmounts)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${yearOverYearChanges.contractorChange > 0 ? '+' : ''}${yearOverYearChanges.contractorChange.toFixed(1)}%`}
                        color={getChangeColor(yearOverYearChanges.contractorChange) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {getChangeIcon(yearOverYearChanges.contractorChange)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Supplies</TableCell>
                    <TableCell align="right">
                      {formatCurrency(previousYearData!.supplies.reduce((sum, sup) => sum + (sup.totalValue || 0), 0))}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(currentMetrics.totalSupplyAmounts)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${yearOverYearChanges.supplyChange > 0 ? '+' : ''}${yearOverYearChanges.supplyChange.toFixed(1)}%`}
                        color={getChangeColor(yearOverYearChanges.supplyChange) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {getChangeIcon(yearOverYearChanges.supplyChange)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      )}
    </Box>
  );
}; 