import React, { useState, useEffect } from 'react';

// Material-UI Components
import {
  Box,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

// Material-UI Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';

// Types
import { Business } from '../types/Business';

// Services
import { approvalsService, ExportDataset } from '../services/approvals';
import { getAllActivities } from '../services/researchActivitiesService';

// Components
import IdentifyActivitiesTab from './QRABuilderTabs/IdentifyActivitiesTab';
import IdentifyRolesTab from './QRABuilderTabs/IdentifyRolesTab';
import RDExpensesTab from './QRABuilderTabs/RDExpensesTab';

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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          QRA Builder
        </Typography>
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