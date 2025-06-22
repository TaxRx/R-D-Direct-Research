import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Grid,
  Chip
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { ExpenseAnalytics } from './ExpenseAnalytics';
import { ComplianceReport } from './ComplianceReport';
import { FederalCreditCard } from '../credit-calculator/FederalCreditCard';
import { CreditCalculatorInput } from '../credit-calculator/useFederalCreditCalculations';

interface ReportingDashboardProps {
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
  isExpensesApproved: boolean;
  creditCalculatorInput: CreditCalculatorInput;
  onExportReport?: (type: 'analytics' | 'compliance' | 'full') => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reporting-tabpanel-${index}`}
      aria-labelledby={`reporting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ReportingDashboard: React.FC<ReportingDashboardProps> = ({
  employees,
  contractors,
  supplies,
  selectedYear,
  previousYear,
  previousYearData,
  isExpensesApproved,
  creditCalculatorInput,
  onExportReport
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExport = (type: 'analytics' | 'compliance' | 'full') => {
    if (onExportReport) {
      onExportReport(type);
    }
  };

  const getTabLabel = (label: string, count?: number, icon?: React.ReactNode) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <Chip
          label={count}
          size="small"
          sx={{ ml: 1, minWidth: 20, height: 20, fontSize: '0.75rem' }}
        />
      )}
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="primary" />
          R&D Expenses Reporting Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive analytics and compliance reporting for {selectedYear}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('analytics')}
          disabled={activeTab !== 0}
        >
          Export Analytics
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('compliance')}
          disabled={activeTab !== 1}
        >
          Export Compliance Report
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport('full')}
        >
          Export Full Report
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
        >
          Print Report
        </Button>
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={() => {
            // Share functionality could be implemented here
            navigator.clipboard.writeText(window.location.href);
          }}
        >
          Share Report
        </Button>
      </Box>

      {/* Credit Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <FederalCreditCard input={creditCalculatorInput} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                State R&D Credit
              </Typography>
              <Typography variant="h4" color="text.secondary">
                Coming Soon
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="reporting tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label={getTabLabel('Analytics', undefined, <AssessmentIcon />)}
            id="reporting-tab-0"
            aria-controls="reporting-tabpanel-0"
          />
          <Tab
            label={getTabLabel('Compliance', undefined, <AssignmentIcon />)}
            id="reporting-tab-1"
            aria-controls="reporting-tabpanel-1"
          />
        </Tabs>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={0}>
          <ExpenseAnalytics
            employees={employees}
            contractors={contractors}
            supplies={supplies}
            selectedYear={selectedYear}
            previousYear={previousYear}
            previousYearData={previousYearData}
          />
        </TabPanel>

        {/* Compliance Tab */}
        <TabPanel value={activeTab} index={1}>
          <ComplianceReport
            employees={employees}
            contractors={contractors}
            supplies={supplies}
            selectedYear={selectedYear}
            isExpensesApproved={isExpensesApproved}
          />
        </TabPanel>
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          This report is for internal use and should be reviewed by qualified tax professionals before submission.
        </Typography>
      </Box>
    </Box>
  );
}; 