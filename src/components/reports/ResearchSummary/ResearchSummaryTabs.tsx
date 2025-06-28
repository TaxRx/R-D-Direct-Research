import React, { useState } from 'react';
import { Tabs, Tab, Box, Typography, Paper, Grid, Chip, Button } from '@mui/material';
import { Download as DownloadIcon, Edit as EditIcon } from '@mui/icons-material';
import { QRAActivityData } from '../../../types/ReportQRA';
import ActivitySelector from '../ActivitySelector';

interface ResearchSummaryTabsProps {
  activities: QRAActivityData[];
  businessId: string;
  year: number;
}

const ResearchSummaryTabs: React.FC<ResearchSummaryTabsProps> = ({ activities, businessId, year }) => {
  const [tab, setTab] = useState(0);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');

  const selectedActivity = activities.find(a => a.id === selectedActivityId) || activities[0];
  const activityOptions = activities.map(a => ({ id: a.id, name: a.name }));

  const handleActivityChange = (activityId: string) => {
    setSelectedActivityId(activityId);
  };

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: colors.text }}>
          Research Summary Report
        </Typography>
        <Button variant="contained" startIcon={<DownloadIcon />}>
          Generate PDF
        </Button>
      </Box>

      <ActivitySelector
        activities={activityOptions}
        selectedActivityId={selectedActivityId}
        onActivityChange={handleActivityChange}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Employee Involvement" />
        <Tab label="QRE Calculations" />
        <Tab label="Narrative Generator" />
        <Tab label="PDF Export" />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Employee Involvement
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {selectedActivity?.selectedRoles?.length || 0} roles assigned
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedActivity?.selectedRoles && selectedActivity.selectedRoles.length > 0 ? (
                    selectedActivity.selectedRoles.map((role, index) => (
                      <Chip key={index} label={role} size="small" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No roles assigned yet
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
        {tab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  QRE Calculations
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Practice Percentage
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {selectedActivity?.practicePercent?.toFixed(1) || '0.0'}%
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Applied Percentage
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {selectedActivity?.appliedPercent?.toFixed(1) || '0.0'}%
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Non-R&D Time
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {((100 - (selectedActivity?.appliedPercent || 0))).toFixed(1)}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
        {tab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Technical Narrative
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              AI-generated technical description of the research process
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This research activity focuses on {selectedActivity?.focus?.toLowerCase() || 'research'} within the {selectedActivity?.area?.toLowerCase() || 'technical'} domain. 
              The work involves {selectedActivity?.subcomponentCount || 0} distinct subcomponents, each addressing specific technical challenges 
              and uncertainties in the development process.
            </Typography>
            <Button variant="outlined" startIcon={<EditIcon />}>
              Edit Narrative
            </Button>
          </Paper>
        )}
        {tab === 3 && <Typography>TODO: PDF Export for {selectedActivity?.name}</Typography>}
      </Box>
    </Box>
  );
};

export default ResearchSummaryTabs; 