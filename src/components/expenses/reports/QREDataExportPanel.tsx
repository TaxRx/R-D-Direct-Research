import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Employee, Contractor, Supply } from '../../../types/Employee';
import { Business } from '../../../types/Business';
import { SubcomponentSelectionData } from '../../../types/QRABuilderInterfaces';

interface QREDataExportPanelProps {
  selectedYear: number;
  selectedBusinessId: string;
  businessName: string;
  employees: Employee[];
  contractors: Contractor[];
  supplies: Supply[];
  activities: any[];
  qraDataMap: Record<string, SubcomponentSelectionData>;
  isExpensesApproved: boolean;
}

export const QREDataExportPanel: React.FC<QREDataExportPanelProps> = ({
  selectedYear,
  selectedBusinessId,
  businessName,
  employees,
  contractors,
  supplies,
  activities,
  qraDataMap,
  isExpensesApproved
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      // Dynamic import to avoid circular dependencies
      const { QREDataExportService } = await import('../../../services/qreDataExportService');
      
      const exportData = QREDataExportService.generateExportData(
        selectedBusinessId,
        businessName,
        selectedYear,
        employees,
        contractors,
        supplies,
        activities,
        qraDataMap
      );

      const filename = `qre-data-export-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}-${selectedYear}.csv`;
      QREDataExportService.downloadExport(exportData, filename);
      
      setExportStatus('success');
    } catch (error) {
      console.error('QRE Export error:', error);
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate summary statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.isActive).length;
  const totalContractors = contractors.length;
  const activeContractors = contractors.filter(con => con.isActive).length;
  const totalSupplies = supplies.length;
  const activeSupplies = supplies.filter(sup => sup.isActive).length;
  
  const totalEmployeeWages = employees.reduce((sum, emp) => sum + emp.wage, 0);
  const totalContractorWages = contractors.reduce((sum, con) => sum + con.totalAmount, 0);
  const totalSupplyCosts = supplies.reduce((sum, sup) => sum + sup.totalValue, 0);
  
  const totalEmployeeApplied = employees.reduce((sum, emp) => sum + emp.appliedAmount, 0);
  const totalContractorApplied = contractors.reduce((sum, con) => sum + con.appliedAmount, 0);
  const totalSupplyApplied = supplies.reduce((sum, sup) => sum + sup.appliedAmount, 0);
  
  const totalQRE = totalEmployeeApplied + totalContractorApplied + totalSupplyApplied;
  const totalExpenses = totalEmployeeWages + totalContractorWages + totalSupplyCosts;

  return (
    <Card sx={{ mt: 3, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            QRE Data Export
          </Typography>
          <Chip 
            label="External Verification" 
            size="small" 
            color="secondary" 
            sx={{ ml: 2 }}
          />
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Purpose:</strong> Generate a comprehensive CSV data dump containing all QRE-related data points 
            for external verification in Google Sheets or other analysis tools.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Includes:</strong> Research Activities, Steps, Subcomponents, Employees, Contractors, Supplies, 
            practice percentages, time percentages, frequency percentages, wages, costs, applied amounts, and all relationships.
          </Typography>
        </Alert>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Data Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Employees:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {activeEmployees}/{totalEmployees} active
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Contractors:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {activeContractors}/{totalContractors} active
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Supplies:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {activeSupplies}/{totalSupplies} active
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Research Activities:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {activities.length}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Financial Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Total Expenses:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${totalExpenses.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Total QRE:</Typography>
                <Typography variant="body2" fontWeight="medium" color="primary.main">
                  ${totalQRE.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Applied %:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {totalExpenses > 0 ? ((totalQRE / totalExpenses) * 100).toFixed(1) : 0}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={isExporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            onClick={handleExport}
            disabled={isExporting || !isExpensesApproved}
            sx={{ minWidth: 200 }}
          >
            {isExporting ? 'Generating Export...' : 'Export QRE Data'}
          </Button>

          {!isExpensesApproved && (
            <Alert severity="warning" sx={{ flex: 1 }}>
              <Typography variant="body2">
                Expenses must be approved before exporting QRE data.
              </Typography>
            </Alert>
          )}
        </Box>

        {exportStatus === 'success' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              QRE data export completed successfully! The CSV file has been downloaded.
            </Typography>
          </Alert>
        )}

        {exportStatus === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Export failed: {errorMessage}
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
            <strong>Export Format:</strong> CSV with multiple sections including Research Activities, Steps, 
            Subcomponents, Employee/Contractor/Supply data with activity breakdowns, and summary statistics. 
            All percentages, amounts, and relationships are included for complete external verification.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 