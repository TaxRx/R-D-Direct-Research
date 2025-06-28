import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { Employee, Contractor, Supply } from '../../../types/Employee';
import { useFederalCreditCalculations, CreditCalculatorInput } from '../credit-calculator/useFederalCreditCalculations';
import { useStateCreditCalculations } from '../../../hooks/expenses/useStateCreditCalculations';
import { StateCreditInput } from '../../../types/StateCredit';
import { Business } from '../../../types/Business';

interface ComplianceReportProps {
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

export const ComplianceReport: React.FC<ComplianceReportProps> = ({
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

  // Calculate compliance metrics
  const complianceMetrics = React.useMemo(() => {
    const activeEmployees = employees.filter(emp => emp.isActive).length;
    const employeesWithAppliedPercentage = employees.filter(emp => emp.isActive && emp.appliedPercentage > 0).length;
    
    const activeContractors = contractors.filter(con => con.isActive).length;
    const contractorsWithAppliedPercentage = contractors.filter(con => con.isActive && con.appliedPercentage > 0).length;
    
    const activeSupplies = supplies.filter(sup => sup.isActive).length;
    const suppliesWithAppliedPercentage = supplies.filter(sup => sup.isActive && sup.appliedPercentage > 0).length;

    return {
      activeEmployees,
      employeesWithAppliedPercentage,
      activeContractors,
      contractorsWithAppliedPercentage,
      activeSupplies,
      suppliesWithAppliedPercentage,
      totalQREs
    };
  }, [employees, contractors, supplies]);

  // Compliance checklist
  const complianceChecklist = React.useMemo(() => [
    {
      id: 1,
      title: 'Business Information Complete',
      description: 'All required business information has been entered and approved.',
      status: businessData?.tabApprovals?.basicInfo?.isApproved ? 'completed' : 'warning',
      details: businessData?.tabApprovals?.basicInfo?.isApproved ? 'Approved' : 'Pending approval'
    },
    {
      id: 2,
      title: 'Ownership Details Complete',
      description: 'All ownership information has been entered and approved.',
      status: businessData?.tabApprovals?.ownership?.isApproved ? 'completed' : 'warning',
      details: businessData?.tabApprovals?.ownership?.isApproved ? 'Approved' : 'Pending approval'
    },
    {
      id: 3,
      title: 'Financial History Complete',
      description: 'Financial history data has been entered and approved.',
      status: businessData?.tabApprovals?.financial?.isApproved ? 'completed' : 'warning',
      details: businessData?.tabApprovals?.financial?.isApproved ? 'Approved' : 'Pending approval'
    },
    {
      id: 4,
      title: 'Employees Allocated',
      description: 'Employee expenses have been allocated to research activities.',
      status: complianceMetrics.employeesWithAppliedPercentage > 0 ? 'completed' : 'error',
      details: `${complianceMetrics.employeesWithAppliedPercentage}/${complianceMetrics.activeEmployees} employees allocated`
    },
    {
      id: 5,
      title: 'Contractors Allocated',
      description: 'Contractor expenses have been allocated to research activities.',
      status: complianceMetrics.contractorsWithAppliedPercentage > 0 ? 'completed' : 'error',
      details: `${complianceMetrics.contractorsWithAppliedPercentage}/${complianceMetrics.activeContractors} contractors allocated`
    },
    {
      id: 6,
      title: 'Supplies Allocated',
      description: 'Supply expenses have been allocated to research activities.',
      status: complianceMetrics.suppliesWithAppliedPercentage > 0 ? 'completed' : 'error',
      details: `${complianceMetrics.suppliesWithAppliedPercentage}/${complianceMetrics.activeSupplies} supplies allocated`
    },
    {
      id: 7,
      title: 'Total QREs Calculated',
      description: 'Total qualified research expenses have been calculated.',
      status: complianceMetrics.totalQREs > 0 ? 'completed' : 'error',
      details: `$${complianceMetrics.totalQREs.toLocaleString()} in QREs`
    }
  ], [businessData, complianceMetrics]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <WarningIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  // Get calculation details for formulas
  const getFederalCalculationDetails = () => {
    const { currentYearQREs, priorYearQREs, priorYearGrossReceipts } = creditCalculatorInput;
    
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

  const federalDetails = getFederalCalculationDetails();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Compliance Report
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Employees</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {complianceMetrics.activeEmployees}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {complianceMetrics.employeesWithAppliedPercentage} allocated
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Contractors</Typography>
              </Box>
              <Typography variant="h4" color="secondary.main">
                {complianceMetrics.activeContractors}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {complianceMetrics.contractorsWithAppliedPercentage} allocated
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Supplies</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {complianceMetrics.activeSupplies}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {complianceMetrics.suppliesWithAppliedPercentage} allocated
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total QREs</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                ${complianceMetrics.totalQREs.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Qualified Research Expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Checklist */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Compliance Checklist
          </Typography>
          
          <List>
            {complianceChecklist.map((check, index) => (
              <React.Fragment key={check.id}>
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(check.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" variant="body1" sx={{ fontWeight: 500 }}>
                          {check.title}
                        </Typography>
                        <Chip
                          label={check.status.toUpperCase()}
                          color={getStatusColor(check.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {check.description}
                        </Typography>
                        <Typography component="span" variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                          {check.details}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < complianceChecklist.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Filing Requirements */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filing Requirements & Deadlines
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Federal Requirements */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Federal Requirements
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Form 6765 - Credit for Increasing Research Activities"
                        secondary="Due with tax return"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Section 280C Election"
                        secondary="Must be made on timely filed return"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon color="info" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Documentation Requirements"
                        secondary="Maintain records for 3 years after return due date"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* State Requirements */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="secondary">
                    State Requirements
                  </Typography>
                  {stateCode ? (
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                          <ListItemText 
                            primary={`${stateCode} State Credit`}
                            secondary="Check state-specific requirements"
                          />
                        </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Pre-filing Requirements"
                          secondary="May require pre-filing notification"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="State Forms"
                          secondary="Check state tax authority website"
                        />
                      </ListItem>
                    </List>
                  ) : (
                    <Alert severity="info">
                      No state selected. Select a state to view specific requirements.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Federal Credit Calculation Formula Card */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ backgroundColor: '#f8f9fa' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Federal Credit Calculation Formula
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Calculation Method
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label="ASC Method"
                        color={method === 'asc' ? 'primary' : 'default'}
                        onClick={() => setMethod('asc')}
                        clickable
                        variant={method === 'asc' ? 'filled' : 'outlined'}
                        size="small"
                      />
                      <Chip
                        label="Standard Method"
                        color={method === 'standard' ? 'primary' : 'default'}
                        onClick={() => setMethod('standard')}
                        clickable
                        disabled={!isStandardMethodAvailable}
                        variant={method === 'standard' ? 'filled' : 'outlined'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Section 280C
                    </Typography>
                    <Chip
                      label={apply280c ? 'Applied' : 'Not Applied'}
                      color={apply280c ? 'success' : 'default'}
                      onClick={() => setApply280c(!apply280c)}
                      clickable
                      variant={apply280c ? 'filled' : 'outlined'}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* ASC Method Formula */}
                  {method === 'asc' && (
                    <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>ASC Method Formula:</strong>
                      </Typography>
                      
                      {federalDetails.method === 'ASC' ? (
                        <>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Base Period Average:
                            </Typography>
                            <Typography variant="body2">
                              ({creditCalculatorInput.priorYearQREs.slice(0, 3).map((qre, i) => `$${qre.toLocaleString()}`).join(' + ')}) ÷ 3 = ${federalDetails.basePeriodAverage?.toLocaleString()}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Half Base Amount:
                            </Typography>
                            <Typography variant="body2">
                              0.5 × ${federalDetails.basePeriodAverage?.toLocaleString()} = ${federalDetails.halfBase?.toLocaleString()}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Incremental QREs:
                            </Typography>
                            <Typography variant="body2">
                              ${totalQREs.toLocaleString()} - ${federalDetails.halfBase?.toLocaleString()} = ${federalDetails.incrementalQREs?.toLocaleString()}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Gross Credit (14% rate):
                            </Typography>
                            <Typography variant="body2">
                              0.14 × ${federalDetails.incrementalQREs?.toLocaleString()} = ${Math.round(grossCredit).toLocaleString()}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              No Base Period Available:
                            </Typography>
                            <Typography variant="body2">
                              ${totalQREs.toLocaleString()} × 0.06 = ${Math.round(grossCredit).toLocaleString()}
                            </Typography>
                          </Box>
                        </>
                      )}
                      
                      {apply280c && (
                        <Box sx={{ mb: 1, mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Section 280C Applied:</strong>
                          </Typography>
                          <Typography variant="body2">
                            ${Math.round(grossCredit).toLocaleString()} × 0.79 = ${Math.round(finalCredit).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Standard Method Formula */}
                  {method === 'standard' && (
                    <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Standard Method Formula:</strong>
                      </Typography>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Average Gross Receipts (4-year average):
                        </Typography>
                        <Typography variant="body2">
                          ({creditCalculatorInput.priorYearGrossReceipts.map((r, i) => `$${r.toLocaleString()}`).join(' + ')}) ÷ 4 = ${federalDetails.avgGrossReceipts?.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Base Amount (3% of average gross receipts):
                        </Typography>
                        <Typography variant="body2">
                          0.03 × ${federalDetails.avgGrossReceipts?.toLocaleString()} = ${federalDetails.baseAmount?.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Incremental QREs:
                        </Typography>
                        <Typography variant="body2">
                          ${totalQREs.toLocaleString()} - ${federalDetails.baseAmount?.toLocaleString()} = ${federalDetails.incrementalQREs?.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Gross Credit (20% rate):
                        </Typography>
                        <Typography variant="body2">
                          0.20 × ${federalDetails.incrementalQREs?.toLocaleString()} = ${Math.round(grossCredit).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {apply280c && (
                        <Box sx={{ mb: 1, mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Section 280C Applied:</strong>
                          </Typography>
                          <Typography variant="body2">
                            ${Math.round(grossCredit).toLocaleString()} × 0.79 = ${Math.round(finalCredit).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* State Credit Calculation Formula Card */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ backgroundColor: '#f8f9fa' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="secondary">
                    <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    State Credit Calculation Formula
                  </Typography>
                  
                  {stateEligibility.isEligible ? (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">State</Typography>
                        <Typography variant="h6">{stateCode || 'Not Selected'}</Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>{stateCode} State Formula:</strong>
                        </Typography>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            State QREs:
                          </Typography>
                          <Typography variant="body2">
                            ${totalQREs.toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Base Amount:
                          </Typography>
                          <Typography variant="body2">
                            ${Math.round(stateCreditResult?.baseAmount || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Excess QREs:
                          </Typography>
                          <Typography variant="body2">
                            ${totalQREs.toLocaleString()} - ${Math.round(stateCreditResult?.baseAmount || 0).toLocaleString()} = ${Math.round(stateCreditResult?.excessQREs || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Credit Rate:
                          </Typography>
                          <Typography variant="body2">
                            {(stateConfig?.creditRate || 0) * 100}%
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Credit Amount:
                          </Typography>
                          <Typography variant="body2">
                            ${Math.round(stateCreditResult?.excessQREs || 0).toLocaleString()} × {(stateConfig?.creditRate || 0) * 100}% = ${Math.round(stateCreditResult?.credit || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography component="span" variant="body2" gutterBottom>
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
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Important Notes */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Important Compliance Notes
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography component="span" variant="body2" gutterBottom>
              <strong>Documentation Requirements:</strong>
            </Typography>
            <Typography component="span" variant="body2">
              Maintain detailed records of all research activities, expenses, and time allocations. 
              Documentation should support the qualified research expenses claimed and the research 
              activities performed.
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography component="span" variant="body2" gutterBottom>
              <strong>Substantiation Requirements:</strong>
            </Typography>
            <Typography component="span" variant="body2">
              Be prepared to substantiate the research activities and expenses with detailed 
              documentation including project descriptions, time records, and expense receipts.
            </Typography>
          </Alert>

          <Alert severity="success">
            <Typography component="span" variant="body2" gutterBottom>
              <strong>Professional Assistance:</strong>
            </Typography>
            <Typography component="span" variant="body2">
              Consider consulting with a qualified tax professional to ensure compliance with 
              all federal and state requirements for R&D tax credits.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}; 