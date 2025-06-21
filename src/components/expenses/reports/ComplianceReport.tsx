import React, { useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

interface ComplianceReportProps {
  employees: any[];
  contractors: any[];
  supplies: any[];
  selectedYear: number;
  isExpensesApproved: boolean;
}

export const ComplianceReport: React.FC<ComplianceReportProps> = ({
  employees,
  contractors,
  supplies,
  selectedYear,
  isExpensesApproved
}) => {
  // Calculate compliance metrics
  const complianceData = useMemo(() => {
    // Employee compliance checks
    const employeeIssues: string[] = [];
    const employeeWarnings: string[] = [];
    const employeePasses: string[] = [];

    employees.forEach((emp, index) => {
      const empName = emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : `Employee ${index + 1}`;
      if (!emp.firstName || !emp.lastName) {
        employeeIssues.push(`Employee ${index + 1}: Missing first or last name`);
      } else if (!emp.roleId || emp.roleId === 'NON_RD_ROLE') {
        employeeWarnings.push(`${empName}: Non-R&D role assigned`);
      } else if ((emp.appliedPercentage || 0) === 0) {
        employeeWarnings.push(`${empName}: No applied percentage set`);
      } else if ((emp.appliedPercentage || 0) > 100) {
        employeeIssues.push(`${empName}: Applied percentage exceeds 100% (${emp.appliedPercentage}%)`);
      } else if ((emp.appliedPercentage || 0) > 45) {
        employeeWarnings.push(`${empName}: Applied percentage is high (${emp.appliedPercentage}%)`);
      } else {
        employeePasses.push(`${empName}: Compliant`);
      }
    });

    // Contractor compliance checks
    const contractorIssues: string[] = [];
    const contractorWarnings: string[] = [];
    const contractorPasses: string[] = [];

    contractors.forEach((cont, index) => {
      const contName = cont.contractorType === 'individual'
        ? (cont.firstName && cont.lastName ? `${cont.firstName} ${cont.lastName}` : `Contractor ${index + 1}`)
        : (cont.businessName || `Contractor ${index + 1}`);

      const hasName = cont.contractorType === 'individual' ? (cont.firstName && cont.lastName) : cont.businessName;

      if (!hasName) {
        contractorIssues.push(`Contractor ${index + 1}: Missing name`);
      } else if (!cont.roleId || cont.roleId === 'NON_RD_ROLE') {
        contractorWarnings.push(`${contName}: Non-R&D role assigned`);
      } else if ((cont.appliedPercentage || 0) === 0) {
        contractorWarnings.push(`${contName}: No applied percentage set`);
      } else if ((cont.appliedPercentage || 0) > 100) {
        contractorIssues.push(`${contName}: Applied percentage exceeds 100% (${cont.appliedPercentage}%)`);
      } else if ((cont.appliedPercentage || 0) > 45) {
        contractorWarnings.push(`${contName}: Applied percentage is high (${cont.appliedPercentage}%)`);
      } else {
        contractorPasses.push(`${contName}: Compliant`);
      }
    });

    // Supply compliance checks
    const supplyIssues: string[] = [];
    const supplyWarnings: string[] = [];
    const supplyPasses: string[] = [];

    // Calculate total wages and contractor amounts for supply ratio check
    const totalWages = employees.reduce((sum, emp) => sum + (emp.wage || 0), 0);
    const totalContractorAmounts = contractors.reduce((sum, cont) => sum + (cont.totalAmount || 0), 0);
    const totalSupplyAmounts = supplies.reduce((sum, sup) => sum + (sup.totalAmount || 0), 0);

    if (totalWages + totalContractorAmounts > 0) {
      const supplyRatio = totalSupplyAmounts / (totalWages + totalContractorAmounts);
      if (supplyRatio > 0.35) {
        supplyWarnings.push(`High supply to labor cost ratio (${(supplyRatio * 100).toFixed(1)}%). Review for necessity.`);
      }
    }

    supplies.forEach((sup, index) => {
      const supName = sup.title || `Supply ${index + 1}`;
      if (!sup.title || sup.title.trim() === '') {
        supplyIssues.push(`Supply ${index + 1}: Missing title`);
      } else if (!sup.category) {
        supplyWarnings.push(`${supName}: No category assigned`);
      } else if ((sup.appliedPercentage || 0) === 0) {
        supplyWarnings.push(`${supName}: No applied percentage set`);
      } else if ((sup.appliedPercentage || 0) > 100) {
        supplyIssues.push(`${supName}: Applied percentage exceeds 100% (${sup.appliedPercentage}%)`);
      } else {
        supplyPasses.push(`${supName}: Compliant`);
      }
    });

    // Overall compliance calculation
    const totalItems = employees.length + contractors.length + supplies.length;
    const totalIssues = employeeIssues.length + contractorIssues.length + supplyIssues.length;
    const totalWarnings = employeeWarnings.length + contractorWarnings.length + supplyWarnings.length;
    const totalPasses = employeePasses.length + contractorPasses.length + supplyPasses.length;

    const complianceScore = totalItems > 0 ? ((totalPasses - totalIssues) / totalItems) * 100 : 100;
    const riskLevel = totalIssues > 0 ? 'HIGH' : totalWarnings > 0 ? 'MEDIUM' : 'LOW';

    return {
      employeeIssues,
      employeeWarnings,
      employeePasses,
      contractorIssues,
      contractorWarnings,
      contractorPasses,
      supplyIssues,
      supplyWarnings,
      supplyPasses,
      totalItems,
      totalIssues,
      totalWarnings,
      totalPasses,
      complianceScore,
      riskLevel
    };
  }, [employees, contractors, supplies]);

  // Calculate 65% rule compliance for contractors
  const contractor65RuleCompliance = useMemo(() => {
    const contractorsWithActivities = contractors.filter(cont => cont.activities && cont.activities.length > 0);
    const compliantContractors = contractorsWithActivities.filter(cont => {
      const totalPractice = cont.activities.reduce((sum: number, activity: any) => {
        return sum + (activity.currentPracticePercent || 0);
      }, 0);
      return totalPractice <= 100;
    });

    return {
      total: contractorsWithActivities.length,
      compliant: compliantContractors.length,
      percentage: contractorsWithActivities.length > 0 ? (compliantContractors.length / contractorsWithActivities.length) * 100 : 100
    };
  }, [contractors]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getComplianceIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon color="success" />;
    if (score >= 70) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon color="primary" />
        R&D Tax Credit Compliance Report - {selectedYear}
      </Typography>

      {/* Overall Compliance Summary */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overall Compliance Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  {getComplianceIcon(complianceData.complianceScore)}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {complianceData.complianceScore.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compliance Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Chip
                  label={complianceData.riskLevel}
                  color={getRiskLevelColor(complianceData.riskLevel) as any}
                  size="medium"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Risk Level
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {complianceData.totalItems}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {complianceData.totalIssues}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical Issues
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Critical Issues Alert */}
      {complianceData.totalIssues > 0 && (
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Critical Compliance Issues Found
          </Typography>
          <Typography variant="body2">
            {complianceData.totalIssues} critical issue(s) must be resolved before submission. 
            These issues may prevent your R&D tax credit claim from being accepted.
          </Typography>
        </Alert>
      )}

      {/* Warnings Alert */}
      {complianceData.totalWarnings > 0 && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Compliance Warnings
          </Typography>
          <Typography variant="body2">
            {complianceData.totalWarnings} warning(s) identified. While these won't prevent submission, 
            addressing them will improve your claim quality and reduce audit risk.
          </Typography>
        </Alert>
      )}

      {/* Detailed Compliance Breakdown */}
      <Grid container spacing={3}>
        {/* Employee Compliance */}
        <Grid item xs={12} md={4}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Employee Compliance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {employees.length} employees • {complianceData.employeePasses.length} compliant
                </Typography>
              </Box>
              
              {complianceData.employeeIssues.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Critical Issues ({complianceData.employeeIssues.length})
                  </Typography>
                  <List dense>
                    {complianceData.employeeIssues.slice(0, 3).map((issue, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <ErrorIcon color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={issue} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {complianceData.employeeIssues.length > 3 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`... and ${complianceData.employeeIssues.length - 3} more issues`}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {complianceData.employeeWarnings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Warnings ({complianceData.employeeWarnings.length})
                  </Typography>
                  <List dense>
                    {complianceData.employeeWarnings.slice(0, 2).map((warning, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <WarningIcon color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={warning} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {complianceData.employeeWarnings.length > 2 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`... and ${complianceData.employeeWarnings.length - 2} more warnings`}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Contractor Compliance */}
        <Grid item xs={12} md={4}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                Contractor Compliance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {contractors.length} contractors • {complianceData.contractorPasses.length} compliant
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  65% Rule: {contractor65RuleCompliance.compliant}/{contractor65RuleCompliance.total} compliant
                </Typography>
              </Box>
              
              {complianceData.contractorIssues.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Critical Issues ({complianceData.contractorIssues.length})
                  </Typography>
                  <List dense>
                    {complianceData.contractorIssues.slice(0, 3).map((issue, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <ErrorIcon color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={issue} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {complianceData.contractorIssues.length > 3 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`... and ${complianceData.contractorIssues.length - 3} more issues`}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {complianceData.contractorWarnings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Warnings ({complianceData.contractorWarnings.length})
                  </Typography>
                  <List dense>
                    {complianceData.contractorWarnings.slice(0, 2).map((warning, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <WarningIcon color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={warning} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {complianceData.contractorWarnings.length > 2 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`... and ${complianceData.contractorWarnings.length - 2} more warnings`}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Supply Compliance */}
        <Grid item xs={12} md={4}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="primary" />
                Supply Compliance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {supplies.length} supplies • {complianceData.supplyPasses.length} compliant
                </Typography>
              </Box>
              
              {complianceData.supplyIssues.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Critical Issues ({complianceData.supplyIssues.length})
                  </Typography>
                  <List dense>
                    {complianceData.supplyIssues.slice(0, 3).map((issue, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <ErrorIcon color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={issue} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {complianceData.supplyIssues.length > 3 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`... and ${complianceData.supplyIssues.length - 3} more issues`}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {complianceData.supplyWarnings.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Warnings ({complianceData.supplyWarnings.length})
                  </Typography>
                  <List dense>
                    {complianceData.supplyWarnings.slice(0, 2).map((warning, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <WarningIcon color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={warning} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {complianceData.supplyWarnings.length > 2 && (
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`... and ${complianceData.supplyWarnings.length - 2} more warnings`}
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Requirements Checklist */}
      <Card sx={{ mt: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            R&D Tax Credit Compliance Requirements
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Requirement</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>All employees have valid names</TableCell>
                  <TableCell>
                    <Chip
                      label={complianceData.employeeIssues.filter(issue => issue.includes('Missing name')).length === 0 ? 'PASS' : 'FAIL'}
                      color={complianceData.employeeIssues.filter(issue => issue.includes('Missing name')).length === 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {complianceData.employeeIssues.filter(issue => issue.includes('Missing name')).length === 0 
                      ? 'All employees have valid names'
                      : `${complianceData.employeeIssues.filter(issue => issue.includes('Missing name')).length} employees missing names`
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>All contractors have valid names</TableCell>
                  <TableCell>
                    <Chip
                      label={complianceData.contractorIssues.filter(issue => issue.includes('Missing name')).length === 0 ? 'PASS' : 'FAIL'}
                      color={complianceData.contractorIssues.filter(issue => issue.includes('Missing name')).length === 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {complianceData.contractorIssues.filter(issue => issue.includes('Missing name')).length === 0 
                      ? 'All contractors have valid names'
                      : `${complianceData.contractorIssues.filter(issue => issue.includes('Missing name')).length} contractors missing names`
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>All supplies have valid titles</TableCell>
                  <TableCell>
                    <Chip
                      label={complianceData.supplyIssues.filter(issue => issue.includes('Missing title')).length === 0 ? 'PASS' : 'FAIL'}
                      color={complianceData.supplyIssues.filter(issue => issue.includes('Missing title')).length === 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {complianceData.supplyIssues.filter(issue => issue.includes('Missing title')).length === 0 
                      ? 'All supplies have valid titles'
                      : `${complianceData.supplyIssues.filter(issue => issue.includes('Missing title')).length} supplies missing titles`
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Applied percentages do not exceed 100%</TableCell>
                  <TableCell>
                    <Chip
                      label={complianceData.totalIssues - complianceData.employeeIssues.filter(issue => issue.includes('Missing name')).length - 
                             complianceData.contractorIssues.filter(issue => issue.includes('Missing name')).length - 
                             complianceData.supplyIssues.filter(issue => issue.includes('Missing title')).length === 0 ? 'PASS' : 'FAIL'}
                      color={complianceData.totalIssues - complianceData.employeeIssues.filter(issue => issue.includes('Missing name')).length - 
                             complianceData.contractorIssues.filter(issue => issue.includes('Missing name')).length - 
                             complianceData.supplyIssues.filter(issue => issue.includes('Missing title')).length === 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {complianceData.totalIssues - complianceData.employeeIssues.filter(issue => issue.includes('Missing name')).length - 
                     complianceData.contractorIssues.filter(issue => issue.includes('Missing name')).length - 
                     complianceData.supplyIssues.filter(issue => issue.includes('Missing title')).length === 0 
                      ? 'All applied percentages are within limits'
                      : `${complianceData.totalIssues - complianceData.employeeIssues.filter(issue => issue.includes('Missing name')).length - 
                         complianceData.contractorIssues.filter(issue => issue.includes('Missing name')).length - 
                         complianceData.supplyIssues.filter(issue => issue.includes('Missing title')).length} items exceed 100%`
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Contractor 65% Rule Compliance</TableCell>
                  <TableCell>
                    <Chip
                      label={contractor65RuleCompliance.percentage >= 100 ? 'PASS' : 'WARNING'}
                      color={contractor65RuleCompliance.percentage >= 100 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {contractor65RuleCompliance.compliant}/{contractor65RuleCompliance.total} contractors comply with 65% rule
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Expenses Approval Status</TableCell>
                  <TableCell>
                    <Chip
                      label={isExpensesApproved ? 'APPROVED' : 'PENDING'}
                      color={isExpensesApproved ? 'success' : 'warning'}
                      size="medium"
                      sx={{ mb: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    {isExpensesApproved 
                      ? 'Expenses have been approved for submission'
                      : 'Expenses are pending approval'
                    }
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>
    </Box>
  );
}; 