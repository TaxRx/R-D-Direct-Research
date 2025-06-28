import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, Card, CardContent, CircularProgress, Alert, Button, AppBar, Toolbar, IconButton, Tooltip
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ScienceIcon from '@mui/icons-material/Science';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTheme } from '@mui/material/styles';
import { QRAActivityData, ResearchStep } from '../../../types/ReportQRA';
import { Business } from '../../../types/Business';
import { loadResearchApiData } from '../../../services/researchApiService';
import { exportResearchDesignData, generateResearchDesignReport, exportResearchDesignToCSV } from '../../../services/researchDesignExportService';
import { approvalsService, TabApproval } from '../../../services/approvals';
import { useResearchDesignData } from '../../../hooks/useResearchDesignData';
import SubcomponentAccordion from './SubcomponentAccordion';

const STEP_COLORS = [
  '#1976d2', '#43a047', '#fbc02d', '#e64a19', '#8e24aa',
  '#00838f', '#c62828', '#6d4c41', '#3949ab', '#00acc1'
];
const SUBCOMPONENT_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#009688',
  '#f44336', '#795548', '#3f51b5', '#00bcd4', '#ff5722'
];

interface ActivityTabProps {
  activity: QRAActivityData;
  selectedYear: number;
  businessId: string;
  year: number;
  business?: Business;
}

const ActivityTab: React.FC<ActivityTabProps> = ({
  activity,
  selectedYear,
  businessId,
  year,
  business
}) => {
  const theme = useTheme();
  const { steps, loading: stepsLoading, error: stepsError, setSteps } = useResearchDesignData(activity, selectedYear, businessId, year);
  const [researchApiData, setResearchApiData] = useState<any[]>([]);
  const [loadingApiData, setLoadingApiData] = useState(false);
  const [apiDataError, setApiDataError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalData, setApprovalData] = useState<TabApproval | null>(null);

  // Load approval state
  useEffect(() => {
    const approvalKey = `researchDesign_${activity.id}_${year}`;
    const approved = approvalsService.isTabApproved(approvalKey, year);
    const data = approvalsService.getApprovalData(approvalKey, year);
    setIsApproved(approved);
    setApprovalData(data?.approvalData || null);
  }, [activity.id, year]);

  // Load Research API data
  useEffect(() => {
    const loadApiData = async () => {
      setLoadingApiData(true);
      setApiDataError(null);
      try {
        const data = await loadResearchApiData();
        setResearchApiData(data);
      } catch (error) {
        console.error('Error loading Research API data:', error);
        setApiDataError('Failed to load Research API data. Some subcomponent details may not be available.');
      } finally {
        setLoadingApiData(false);
      }
    };

    loadApiData();
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newSteps = [...steps];
    const [removed] = newSteps.splice(result.source.index, 1);
    newSteps.splice(result.destination.index, 0, removed);
    setSteps(newSteps);
  };

  const handleDataChange = () => {
    console.log('Research design data changed');
  };

  const handleExport = async (format: 'markdown' | 'csv') => {
    if (!businessId || !year) {
      console.error('Missing required data for export');
      return;
    }

    setExporting(true);
    try {
      const exportData = await exportResearchDesignData(
        activity.id,
        activity.name,
        steps,
        businessId,
        year,
        researchApiData
      );

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'markdown') {
        content = generateResearchDesignReport(exportData);
        filename = `research-design-${activity.name.replace(/[^a-zA-Z0-9]/g, '-')}-${year}.md`;
        mimeType = 'text/markdown';
      } else {
        content = exportResearchDesignToCSV(exportData);
        filename = `research-design-${activity.name.replace(/[^a-zA-Z0-9]/g, '-')}-${year}.csv`;
        mimeType = 'text/csv';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Exported research design data as ${format}`);
    } catch (error) {
      console.error('Error exporting research design data:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleApprove = async () => {
    try {
      // Get IP address (simplified for now)
      const ipAddress = '127.0.0.1'; // In production, get actual IP
      
      const approval: TabApproval = {
        timestamp: new Date().toISOString(),
        ipAddress,
        data: {
          activityId: activity.id,
          activityName: activity.name,
          steps: steps,
          year: year,
          businessId: businessId
        }
      };
      
      const approvalKey = `researchDesign_${activity.id}_${year}`;
      approvalsService.recordApproval(approvalKey, approval, year);
      setApprovalData(approval);
      setIsApproved(true);
    } catch (error) {
      console.error('Error approving research design:', error);
    }
  };

  const handleUnapprove = () => {
    const approvalKey = `researchDesign_${activity.id}_${year}`;
    approvalsService.removeApproval(approvalKey, year);
    setApprovalData(null);
    setIsApproved(false);
  };

  const renderStep = (step: ResearchStep, index: number) => {
    const stepSubcomponents = step.subcomponents || [];
    const stepColor = STEP_COLORS[index % STEP_COLORS.length];
    return (
      <Draggable key={step.id} draggableId={step.id} index={index}>
        {(dragProvided) => (
          <Box
            ref={dragProvided.innerRef}
            {...dragProvided.draggableProps}
            sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'background.paper' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <span {...dragProvided.dragHandleProps} style={{ cursor: 'grab' }}>⠿</span>
              <Chip
                label={step.name}
                sx={{ bgcolor: stepColor + '22', color: '#222', border: `2px solid ${stepColor}`, fontWeight: 600 }}
              />
            </Box>
            {stepSubcomponents.length > 0 && (
              <Box sx={{ ml: 4 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 1 }}>
                  Subcomponents ({stepSubcomponents.length})
                </Typography>
                {stepSubcomponents.map((subcomponent, subIndex) => {
                  const subColor = SUBCOMPONENT_COLORS[subIndex % SUBCOMPONENT_COLORS.length];
                  return (
                    <SubcomponentAccordion
                      key={subcomponent.id}
                      subcomponent={subcomponent}
                      researchActivityName={activity.name}
                      researchApiData={researchApiData}
                      businessId={businessId}
                      year={year}
                      activityId={activity.id}
                      subColor={subColor}
                      onDataChange={handleDataChange}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Draggable>
    );
  };

  const totalSubcomponents = steps.reduce((sum, s) => sum + s.subcomponents.length, 0);

  return (
    <Box>
      {/* AppBar with approval logic */}
      <AppBar
        position="static"
        color="default"
        elevation={1}
        sx={{
          mb: 2,
          bgcolor: isApproved ? theme.palette.success.light : undefined,
          color: isApproved ? theme.palette.success.contrastText : undefined,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              {activity.name}
              {isApproved && (
                <CheckCircleIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
              )}
            </Typography>
            {isApproved && approvalData && (
              <Box sx={{ ml: 3, fontSize: 14 }}>
                Approved: {new Date(approvalData.timestamp).toLocaleString()} (IP: {approvalData.ipAddress})
              </Box>
            )}
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
            {/* Export buttons */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExport('markdown')}
              disabled={exporting || totalSubcomponents === 0}
            >
              Export MD
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExport('csv')}
              disabled={exporting || totalSubcomponents === 0}
            >
              Export CSV
            </Button>
            {isApproved ? (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LockOpenIcon />}
                onClick={handleUnapprove}
              >
                Unapprove
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<LockIcon />}
                onClick={handleApprove}
                sx={{ 
                  bgcolor: theme.palette.success.light, 
                  color: theme.palette.success.contrastText, 
                  '&:hover': { bgcolor: theme.palette.success.main } 
                }}
              >
                Approve
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Activity Summary */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`${steps.length} Steps`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={`${totalSubcomponents} Subcomponents`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
            {loadingApiData && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption">Loading Research API...</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* API Data Error Alert */}
      {apiDataError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {apiDataError}
        </Alert>
      )}

      {/* Research Steps */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScienceIcon color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Research Steps
            </Typography>
            <Chip 
              label={steps.length} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        </Box>
        <Box sx={{ p: 2 }}>
          {steps.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No steps defined for this research activity
            </Typography>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="steps">
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps}>
                    {steps.map((step, index) => renderStep(step, index))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default ActivityTab; 