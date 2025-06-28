import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, AppBar, Toolbar, IconButton, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ScienceIcon from '@mui/icons-material/Science';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useTheme } from '@mui/material/styles';
import { QRAActivityData } from '../../../types/ReportQRA';
import { Business } from '../../../types/Business';
import { approvalsService, TabApproval } from '../../../services/approvals';
import ActivityTab from './ActivityTab';
import ReportPreviewTabWithApproval from './ReportPreviewTabWithApproval';
import ResearchActivityOrgChart from './ResearchActivityOrgChart';

interface ResearchDesignTabsProps {
  activities: QRAActivityData[];
  selectedActivityId: string;
  onActivitySelect: (activityId: string) => void;
  selectedYear?: number;
  businessId?: string;
  year?: number;
  business?: Business;
}

const ResearchDesignTabs: React.FC<ResearchDesignTabsProps> = ({
  activities,
  selectedActivityId,
  onActivitySelect,
  selectedYear = new Date().getFullYear(),
  businessId = '',
  year,
  business
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isReportPreviewApproved, setIsReportPreviewApproved] = useState(false);
  const [reportPreviewApprovalData, setReportPreviewApprovalData] = useState<TabApproval | null>(null);

  // Load report preview approval state
  useEffect(() => {
    const approvalKey = `reportPreview_${year || selectedYear}`;
    const approved = approvalsService.isTabApproved(approvalKey, year || selectedYear);
    const data = approvalsService.getApprovalData(approvalKey, year || selectedYear);
    setIsReportPreviewApproved(approved);
    setReportPreviewApprovalData(data?.approvalData || null);
  }, [year, selectedYear]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // If switching to an activity tab, update the selected activity
    if (newValue < activities.length) {
      onActivitySelect(activities[newValue].id);
    }
  };

  // Get approval status for each activity
  const getActivityApprovalStatus = (activityId: string) => {
    const approvalKey = `researchDesign_${activityId}_${year || selectedYear}`;
    return approvalsService.isTabApproved(approvalKey, year || selectedYear);
  };

  // Set initial tab to selected activity
  useEffect(() => {
    const activityIndex = activities.findIndex(a => a.id === selectedActivityId);
    if (activityIndex >= 0) {
      setActiveTab(activityIndex);
    }
  }, [selectedActivityId, activities]);

  if (activities.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No research activities available
        </Typography>
      </Box>
    );
  }

  const currentYear = year || selectedYear;
  const currentBusinessId = businessId || '';

  return (
    <Box>
      {/* Main AppBar for Research Design */}
      <AppBar
        position="static"
        color="default"
        elevation={1}
        sx={{ mb: 2 }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              Research Design
            </Typography>
            <Tooltip title="View help and statistics">
              <IconButton 
                size="small" 
                sx={{ ml: 1 }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {activities.length} Activities • Year {currentYear}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Activity Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }
          }}
        >
          {/* Activity tabs */}
          {activities.map((activity, index) => {
            const isApproved = getActivityApprovalStatus(activity.id);
            return (
              <Tab
                key={activity.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceIcon sx={{ fontSize: 18 }} />
                    <span>{activity.name}</span>
                    {isApproved && (
                      <CheckCircleIcon 
                        color="success" 
                        sx={{ fontSize: 16, ml: 0.5 }} 
                      />
                    )}
                  </Box>
                }
                sx={{
                  bgcolor: isApproved ? theme.palette.success.light + '22' : undefined,
                  color: isApproved ? theme.palette.success.main : undefined,
                  '&.Mui-selected': {
                    color: isApproved ? theme.palette.success.dark : undefined,
                  }
                }}
              />
            );
          })}
          
          {/* Organization Chart tab */}
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountTreeIcon sx={{ fontSize: 18 }} />
                <span>Organization Chart</span>
              </Box>
            }
          />
          
          {/* Report Preview tab */}
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ fontSize: 18 }} />
                <span>Report Preview</span>
                {isReportPreviewApproved && (
                  <CheckCircleIcon 
                    color="success" 
                    sx={{ fontSize: 16, ml: 0.5 }} 
                  />
                )}
              </Box>
            }
            sx={{
              bgcolor: isReportPreviewApproved ? theme.palette.success.light + '22' : undefined,
              color: isReportPreviewApproved ? theme.palette.success.main : undefined,
              '&.Mui-selected': {
                color: isReportPreviewApproved ? theme.palette.success.dark : undefined,
              }
            }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Activity tabs content */}
        {activities.map((activity, index) => (
          <Box key={activity.id} sx={{ display: activeTab === index ? 'block' : 'none' }}>
            <ActivityTab
              activity={activity}
              selectedYear={selectedYear}
              businessId={currentBusinessId}
              year={currentYear}
              business={business}
            />
          </Box>
        ))}
        
        {/* Organization Chart tab content */}
        {activeTab === activities.length && (
          <ResearchActivityOrgChart 
            activities={activities}
            selectedYear={selectedYear}
            businessId={currentBusinessId}
            year={currentYear}
          />
        )}
        
        {/* Report Preview tab content */}
        {activeTab === activities.length + 1 && (
          <ReportPreviewTabWithApproval
            activities={activities}
            business={business!}
            year={currentYear}
          />
        )}
      </Box>
    </Box>
  );
};

export default ResearchDesignTabs; 