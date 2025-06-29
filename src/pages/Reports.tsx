import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Science as ScienceIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { Business } from '../types/Business';
import { 
  getQRAReportData, 
  getQRAStatistics, 
  exportQRAReportData 
} from '../services/reportsService';
import { QRAActivityData, QRAReportData } from '../types/ReportQRA';
import { ActivitySelector, ResearchDesignTabs, ResearchSummaryTabs, FilingGuideTabs } from '../components/reports';
import { SupabaseMigrationPanel } from '../components/SupabaseMigrationPanel';

// Color palette for accessibility
const colors = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#212121',
  textSecondary: '#757575'
};

interface ReportsProps {
  businesses: Business[];
  selectedBusinessId: string;
  selectedYear: number;
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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Reports: React.FC<ReportsProps> = ({ businesses, selectedBusinessId, selectedYear }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [qraData, setQraData] = useState<QRAReportData | null>(null);
  const [qraStatistics, setQraStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  // Load QRA data when business or year changes
  useEffect(() => {
    if (selectedBusinessId && selectedYear) {
      loadQRAData();
    }
  }, [selectedBusinessId, selectedYear]);

  // Set first activity as selected when data loads
  useEffect(() => {
    if (qraData && qraData.activities.length > 0 && !selectedActivityId) {
      setSelectedActivityId(qraData.activities[0].id);
    }
  }, [qraData, selectedActivityId]);

  const loadQRAData = async () => {
    setLoading(true);
    setError(null);
    try {
      const reportData = await getQRAReportData(selectedBusinessId, selectedYear);
      const statistics = await getQRAStatistics(selectedBusinessId, selectedYear);
      
      setQraData(reportData);
      setQraStatistics(statistics);
    } catch (err) {
      setError('Failed to load QRA data');
      console.error('Error loading QRA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExportQRA = async () => {
    try {
      const exportData = await exportQRAReportData(selectedBusinessId, selectedYear);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qra-report-${selectedBusinessId}-${selectedYear}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting QRA data:', err);
      setError('Failed to export QRA data');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadQRAData} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  if (!qraData || qraData.activities.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No QRA data found for the selected business and year. Please complete the QRA Builder first.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: colors.background, minHeight: '100vh', p: 3 }}>
      <Paper sx={{ mb: 3, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ color: colors.text, fontWeight: 600 }}>
            Reports Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadQRAData}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportQRA}
            >
              Export QRA Data
            </Button>
          </Box>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="🧪 Research Design" />
          <Tab label="📊 Research Summary" />
          <Tab label="📁 Filing Guide" />
          <Tab label="☁️ Supabase Migration" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <ResearchDesignTabs 
            activities={qraData.activities}
            businessId={selectedBusinessId}
            year={selectedYear}
            selectedActivityId={selectedActivityId}
            onActivitySelect={setSelectedActivityId}
            business={selectedBusiness}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <ResearchSummaryTabs 
            activities={qraData.activities}
            businessId={selectedBusinessId}
            year={selectedYear}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <FilingGuideTabs 
            activities={qraData.activities}
            businessId={selectedBusinessId}
            year={selectedYear}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <SupabaseMigrationPanel />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Reports; 