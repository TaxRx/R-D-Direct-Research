import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import chroma from 'chroma-js';

// Material-UI Components
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Slide,
  Slider,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

// Material-UI Icons
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';

// Custom Components
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

// Types
import { Business } from '../types/Business';
import { TabKey } from '../types/TabKey';
import { Phase } from '../types/Phase';
import { YearData } from '../types/YearData';

// Utils
import { loadQRASelections, saveQRASelections } from '../utils/qraSelections';

import IdentifyActivitiesTab from './QRABuilderTabs/IdentifyActivitiesTab';
import IdentifyRolesTab from './QRABuilderTabs/IdentifyRolesTab';
import RDExpensesTab from './QRABuilderTabs/RDExpensesTab';
import { approvalsService, ExportDataset, approvalStorageService } from '../services/approvals';
import { getAllActivities, clearActivitiesLocalStorage, clearAllLocalStorage } from '../services/researchActivitiesService';

interface QRABuilderProps {
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  businesses: Business[];
  selectedBusinessId: string;
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  onApprovalStatusChange?: (year: number, isFullyApproved: boolean) => void;
}

function getTabApproved(tabKey: string, year: number) {
  return approvalsService.isTabApproved(tabKey, year);
}

const QRABuilder: React.FC<QRABuilderProps> = ({
  selectedYear,
  setSelectedYear,
  businesses,
  selectedBusinessId,
  setBusinesses,
  onApprovalStatusChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [tabReadOnly, setTabReadOnly] = useState<boolean[]>([false, false, false]);
  const [approvedTabs, setApprovedTabs] = useState<boolean[]>([false, false, false]);
  const [isFullyApproved, setIsFullyApproved] = useState(false);
  const [exportDataset, setExportDataset] = useState<ExportDataset | null>(null);
  const [masterActivities, setMasterActivities] = useState<Record<string, any>[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const onEdit = () => {};

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
  const yearData = selectedBusiness?.years?.[selectedYear];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Function to clear localStorage and reload activities
  const handleClearAndReload = async () => {
    try {
      console.log('Clearing localStorage and reloading activities...');
      clearAllLocalStorage();
      setLoadingActivities(true);
      const data = await getAllActivities();
      setMasterActivities(data);
      setLoadingActivities(false);
      console.log('Successfully cleared localStorage and reloaded activities');
    } catch (error) {
      console.error('Error clearing and reloading:', error);
      setLoadingActivities(false);
    }
  };

  // Check approval status for all tabs
  useEffect(() => {
    const rolesApproved = getTabApproved('roles', selectedYear);
    const activitiesApproved = getTabApproved('activities', selectedYear);
    const expensesApproved = getTabApproved('expenses', selectedYear);
    
    setApprovedTabs([rolesApproved, activitiesApproved, expensesApproved]);
    
    // Notify parent component if all tabs are approved
    const isFullyApproved = rolesApproved && activitiesApproved && expensesApproved;
    if (onApprovalStatusChange) {
      onApprovalStatusChange(selectedYear, isFullyApproved);
    }
  }, [selectedYear, onApprovalStatusChange]);

  useEffect(() => {
    let mounted = true;
    setLoadingActivities(true);
    getAllActivities().then(data => {
      if (mounted) {
        setMasterActivities(data);
        setLoadingActivities(false);
      }
    }).catch(() => setLoadingActivities(false));
    return () => { mounted = false; };
  }, []);

  // Handle final approval and export
  const handleFinalApproval = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ipAddress = data.ip;
      
      const dataset = await approvalsService.createExportDataset(ipAddress);
      setExportDataset(dataset);
      
      // Create and download the export file
      const exportData = JSON.stringify(dataset, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qra-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating export dataset:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      {/* Header with clear/reload button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          QRA Builder
        </Typography>
        <Button
          variant="outlined"
          color="warning"
          onClick={handleClearAndReload}
          disabled={loadingActivities}
          startIcon={<RefreshIcon />}
        >
          {loadingActivities ? 'Reloading...' : 'Clear Cache & Reload'}
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Identify Roles
                {getTabApproved('roles', selectedYear) && (
                  <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                )}
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Activities
                {getTabApproved('activities', selectedYear) && (
                  <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                )}
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                R&D Expenses
                {getTabApproved('expenses', selectedYear) && (
                  <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                )}
                {!getTabApproved('activities', selectedYear) && (
                  <LockIcon sx={{ ml: 1, color: 'warning.main', fontSize: 16 }} />
                )}
              </Box>
            }
            sx={{
              opacity: getTabApproved('activities', selectedYear) ? 1 : 0.6,
              '&:hover': {
                opacity: getTabApproved('activities', selectedYear) ? 1 : 0.8,
              }
            }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && (
          <IdentifyRolesTab
            selectedYear={selectedYear}
            selectedBusinessId={selectedBusinessId}
            businesses={businesses}
            setBusinesses={setBusinesses}
            tabReadOnly={tabReadOnly}
            setTabReadOnly={setTabReadOnly}
            approvedTabs={approvedTabs}
            setApprovedTabs={setApprovedTabs}
            onEdit={onEdit}
          />
        )}
        {activeTab === 1 && (
          <IdentifyActivitiesTab
            selectedYear={selectedYear}
            selectedBusinessId={selectedBusinessId}
            businesses={businesses}
            setBusinesses={setBusinesses}
            tabReadOnly={tabReadOnly}
            setTabReadOnly={setTabReadOnly}
            approvedTabs={approvedTabs}
            setApprovedTabs={setApprovedTabs}
            onEdit={onEdit}
            masterActivities={masterActivities}
            loadingActivities={loadingActivities}
          />
        )}
        {activeTab === 2 && (
          <RDExpensesTab
            selectedYear={selectedYear}
            selectedBusinessId={selectedBusinessId}
            businesses={businesses}
            setBusinesses={setBusinesses}
            tabReadOnly={tabReadOnly}
            setTabReadOnly={setTabReadOnly}
            approvedTabs={approvedTabs}
            setApprovedTabs={setApprovedTabs}
            onEdit={onEdit}
          />
        )}
      </Box>
    </Box>
  );
};

export default QRABuilder;