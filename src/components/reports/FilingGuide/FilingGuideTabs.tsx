import React from 'react';
import { Box, Typography, Paper, Grid, Chip, Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { QRAActivityData } from '../../../types/ReportQRA';

interface FilingGuideTabsProps {
  activities: QRAActivityData[];
  businessId: string;
  year: number;
}

const FilingGuideTabs: React.FC<FilingGuideTabsProps> = ({ activities, businessId, year }) => {
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

  // Calculate totals across all activities
  const totalAppliedPercent = activities.reduce((sum, activity) => sum + (activity.appliedPercent || 0), 0);
  const totalPracticePercent = activities.reduce((sum, activity) => sum + (activity.practicePercent || 0), 0);
  const totalSubcomponents = activities.reduce((sum, activity) => sum + (activity.subcomponentCount || 0), 0);
  const uniqueRoles = Array.from(new Set(activities.flatMap(activity => activity.selectedRoles || [])));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: colors.text }}>
          Filing Guide Report
        </Typography>
        <Button variant="contained" startIcon={<DownloadIcon />}>
          Generate PDF
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Setup Inputs
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Entity Type
              </Typography>
              <Typography variant="body1">
                C Corporation
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Calculation Method
              </Typography>
              <Typography variant="body1">
                Regular Method
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                State of Domicile
              </Typography>
              <Typography variant="body1">
                California
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Research Activities
              </Typography>
              <Typography variant="body1">
                {activities.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Credit Calculation Preview
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Applied Percentage
              </Typography>
              <Typography variant="h6" color="primary">
                {totalAppliedPercent.toFixed(1)}%
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Practice Percentage
              </Typography>
              <Typography variant="h6" color="success.main">
                {totalPracticePercent.toFixed(1)}%
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Subcomponents
              </Typography>
              <Typography variant="h6" color="warning.main">
                {totalSubcomponents}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Unique Roles Involved
              </Typography>
              <Typography variant="h6" color="info.main">
                {uniqueRoles.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Research Activities Summary
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Overview of all research activities included in this filing
            </Typography>
            
            {activities.map((activity, index) => (
              <Box key={activity.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {index + 1}. {activity.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip label={`${activity.appliedPercent?.toFixed(1) || '0.0'}% applied`} size="small" color="primary" />
                  <Chip label={`${activity.subcomponentCount || 0} subcomponents`} size="small" variant="outlined" />
                  <Chip label={`${activity.selectedRoles?.length || 0} roles`} size="small" variant="outlined" />
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filing Summary
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Summary of estimated Form 6765 values and filing requirements
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label="Form 6765 Required" color="primary" />
              <Chip label="State Credit Available" color="success" />
              <Chip label="280C Election Recommended" color="warning" />
              <Chip label={`${activities.length} Activities`} variant="outlined" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FilingGuideTabs; 