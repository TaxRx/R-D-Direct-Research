import React from 'react';
import {
  Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails,
  Card, CardContent, Divider, CircularProgress, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ScienceIcon from '@mui/icons-material/Science';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { QRAActivityData, QRAStep, ResearchStep } from '../../../types/ReportQRA';
import { useResearchDesignData } from '../../../hooks/useResearchDesignData';

const STEP_COLORS = [
  '#1976d2', '#43a047', '#fbc02d', '#e64a19', '#8e24aa',
  '#00838f', '#c62828', '#6d4c41', '#3949ab', '#00acc1'
];

const SUBCOMPONENT_COLORS = [
  '#ff9800', '#9c27b0', '#607d8b', '#795548', '#ff5722',
  '#3f51b5', '#009688', '#8bc34a', '#cddc39', '#ffeb3b'
];

interface ResearchActivityOrgChartProps {
  activities: QRAActivityData[];
  selectedYear: number;
  businessId: string;
  year: number;
}

const ResearchActivityOrgChart: React.FC<ResearchActivityOrgChartProps> = ({
  activities,
  selectedYear,
  businessId,
  year
}) => {
  // Load data for all activities at once
  const [allStepsData, setAllStepsData] = React.useState<{ [activityId: string]: ResearchStep[] }>({});
  const [loadingStates, setLoadingStates] = React.useState<{ [activityId: string]: boolean }>({});
  const [errorStates, setErrorStates] = React.useState<{ [activityId: string]: string | null }>({});

  // Load data for each activity
  React.useEffect(() => {
    const loadAllActivityData = async () => {
      const newStepsData: { [activityId: string]: ResearchStep[] } = {};
      const newLoadingStates: { [activityId: string]: boolean } = {};
      const newErrorStates: { [activityId: string]: string | null } = {};

      // Initialize loading states
      activities.forEach(activity => {
        newLoadingStates[activity.id] = true;
        newErrorStates[activity.id] = null;
      });

      setLoadingStates(newLoadingStates);

      // Load data for each activity
      for (const activity of activities) {
        try {
          // Use the research design service to get steps data
          const { convertActivityToResearchSteps } = await import('../../../services/researchDesignService');
          const steps = convertActivityToResearchSteps(activity, businessId, year);
          
          newStepsData[activity.id] = steps;
          newLoadingStates[activity.id] = false;
          
          console.log(`🔍 ResearchActivityOrgChart - Activity: ${activity.name}`, {
            activity,
            steps,
            totalSubcomponents: steps.reduce((sum, step) => sum + (step.subcomponents?.length || 0), 0)
          });
        } catch (error) {
          console.error(`Error loading data for activity ${activity.name}:`, error);
          newErrorStates[activity.id] = error instanceof Error ? error.message : 'Unknown error';
          newLoadingStates[activity.id] = false;
        }
      }

      setAllStepsData(newStepsData);
      setLoadingStates(newLoadingStates);
      setErrorStates(newErrorStates);
    };

    loadAllActivityData();
  }, [activities, businessId, year]);

  const renderSubcomponents = (subcomponents: any[], stepIndex: number) => {
    if (!subcomponents || subcomponents.length === 0) {
      return (
        <Box sx={{ ml: 4, mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No subcomponents
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ ml: 4, mt: 1 }}>
        {subcomponents.map((subcomponent, subIndex) => {
          const subColor = SUBCOMPONENT_COLORS[subIndex % SUBCOMPONENT_COLORS.length];
          // Handle both property names
          const timePercent = subcomponent.timePercent || subcomponent.timePercentage || 0;
          
          return (
            <Card key={subcomponent.id} sx={{ mb: 1, ml: 2, border: `1px solid ${subColor}22` }}>
              <CardContent sx={{ py: 1, px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: subColor,
                      flexShrink: 0
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                    {subcomponent.name}
                  </Typography>
                  {timePercent > 0 && (
                    <Chip
                      label={`${timePercent.toFixed(1)}%`}
                      size="small"
                      sx={{
                        bgcolor: subColor + '22',
                        color: subColor,
                        fontWeight: 600
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  if (activities.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No research activities available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccountTreeIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Research Activity Organization Chart
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Hierarchical view of research activities, steps, and subcomponents
      </Typography>

      <Box>
        {activities.map((activity, index) => {
          const steps = allStepsData[activity.id] || [];
          const loading = loadingStates[activity.id] || false;
          const error = errorStates[activity.id];
          const totalSubcomponents = steps.reduce((sum, step) => sum + (step.subcomponents?.length || 0), 0);
          
          return (
            <Accordion key={activity.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: '#f8f9fa',
                  '&:hover': { bgcolor: '#e9ecef' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <ScienceIcon sx={{ color: 'primary.main' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {activity.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {steps.length} steps • {totalSubcomponents} subcomponents
                    </Typography>
                  </Box>
                  {loading && <CircularProgress size={20} />}
                </Box>
              </AccordionSummary>
              
              <AccordionDetails sx={{ p: 0 }}>
                {error ? (
                  <Alert severity="error" sx={{ m: 2 }}>
                    Error loading data: {error}
                  </Alert>
                ) : loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : steps.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No steps found for this activity
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 2 }}>
                    {steps.map((step, stepIndex) => {
                      const stepColor = STEP_COLORS[stepIndex % STEP_COLORS.length];
                      
                      return (
                        <Box key={step.id} sx={{ mb: 3 }}>
                          <Card sx={{ border: `2px solid ${stepColor}22` }}>
                            <CardContent sx={{ py: 2, px: 3 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: stepColor,
                                    flexShrink: 0
                                  }}
                                />
                                <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                                  {step.name}
                                </Typography>
                                {step.timePercentage && (
                                  <Chip
                                    label={`${step.timePercentage.toFixed(1)}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: stepColor + '22',
                                      color: stepColor,
                                      fontWeight: 600
                                    }}
                                  />
                                )}
                              </Box>
                              
                              {step.subcomponents && step.subcomponents.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                    Subcomponents ({step.subcomponents.length})
                                  </Typography>
                                  {renderSubcomponents(step.subcomponents, stepIndex)}
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};

export default ResearchActivityOrgChart; 