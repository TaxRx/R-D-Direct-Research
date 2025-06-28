import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Science as ScienceIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Web as WebIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { QRAActivityData, ResearchStep, ResearchActivity } from '../../../types/ReportQRA';
import { Business } from '../../../types/Business';
import { generateAIReportContent, generateBulkAIContent, saveBulkAIContent } from '../../../services/aiReportService';
import { exportResearchDesignPDF } from '../../../services/pdfExportService';
import { loadResearchDesign } from '../../../services/researchDesignService';
import { loadResearchApiData, loadSubcomponentResearchData } from '../../../services/researchApiService';

interface ReportPreviewTabProps {
  activities: QRAActivityData[];
  selectedActivityId: string;
  businessId: string;
  year: number;
  business: Business | undefined;
}

interface AIReportContent {
  title: string;
  executiveSummary: string;
  researchDescription: string;
  methodology: string;
  findings: string;
  conclusions: string;
  recommendations: string;
}

const ReportPreviewTab: React.FC<ReportPreviewTabProps> = ({
  activities,
  selectedActivityId,
  businessId,
  year,
  business
}) => {
  const [selectedActivity, setSelectedActivity] = useState<QRAActivityData | null>(null);
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [researchApiData, setResearchApiData] = useState<any[]>([]);
  const [aiContent, setAiContent] = useState<AIReportContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  useEffect(() => {
    const activity = activities.find(a => a.id === selectedActivityId);
    setSelectedActivity(activity || null);
  }, [activities, selectedActivityId]);

  useEffect(() => {
    if (selectedActivity) {
      loadActivityData();
    }
  }, [selectedActivity, businessId, year]);

  const loadActivityData = async () => {
    if (!selectedActivity) return;

    setLoading(true);
    setError(null);

    try {
      // Load research design steps
      const savedSteps = loadResearchDesign(selectedActivity.id, year);
      setSteps(savedSteps);

      // Load Research API data
      const apiData = await loadResearchApiData();
      setResearchApiData(apiData);

      // Load existing AI content if available
      const savedContent = localStorage.getItem(`ai_report_${businessId}_${year}_${selectedActivity.id}`);
      if (savedContent) {
        setAiContent(JSON.parse(savedContent));
      }

      // Check approval status
      const approvalKey = `report_approval_${businessId}_${year}_${selectedActivity.id}`;
      const approvalData = localStorage.getItem(approvalKey);
      if (approvalData) {
        const approval = JSON.parse(approvalData);
        setIsApproved(approval.isApproved);
      }

    } catch (err) {
      setError('Failed to load activity data');
      console.error('Error loading activity data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIContent = async () => {
    if (!selectedActivity || !business) return;

    setGenerating(true);
    setError(null);

    try {
      // Prepare data for AI
      const subcomponentData = steps.flatMap(step => 
        step.subcomponents?.map(sub => {
          const savedData = loadSubcomponentResearchData(businessId, year, selectedActivity.id, sub.id);
          return {
            stepName: step.name,
            subcomponentName: sub.name,
            subcomponentId: sub.id,
            userNotes: savedData?.userNotes || '',
            userModifications: savedData?.userModifications || {}
          };
        }) || []
      );

      const businessInfo = {
        name: business.businessName,
        dbaName: business.dbaName,
        ein: business.ein,
        entityType: business.entityType,
        entityState: business.entityState,
        startYear: business.startYear,
        owners: business.owners.map(owner => ({
          name: owner.name,
          ownershipPercentage: owner.ownershipPercentage,
          isResearchLeader: owner.isResearchLeader
        }))
      };

      const content = await generateAIReportContent({
        activityName: selectedActivity.name,
        businessInfo,
        subcomponentData,
        year
      });

      setAiContent(content);

      // Save AI content
      localStorage.setItem(`ai_report_${businessId}_${year}_${selectedActivity.id}`, JSON.stringify(content));

    } catch (err) {
      setError('Failed to generate AI content');
      console.error('Error generating AI content:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveReport = () => {
    if (!selectedActivity) return;
    
    const approvalKey = `report_approval_${businessId}_${year}_${selectedActivity.id}`;
    const approvalData = {
      isApproved: true,
      approvedAt: new Date().toISOString(),
      approvedBy: 'User'
    };
    localStorage.setItem(approvalKey, JSON.stringify(approvalData));
    setIsApproved(true);
  };

  const handleExportPDF = async () => {
    if (!selectedActivity || !business) return;

    setExporting(true);
    setError(null);

    try {
      // Get research leaders from business owners
      const researchLeaders = business.owners
        .filter(owner => owner.isResearchLeader)
        .map(owner => owner.name);
      
      // If no research leaders, use all owners
      const leaders = researchLeaders.length > 0 ? researchLeaders : business.owners.map(owner => owner.name);
      
      // Convert QRAActivityData to ResearchActivity format
      const researchActivity: ResearchActivity = {
        id: selectedActivity.id,
        name: selectedActivity.name,
        steps: selectedActivity.steps.map(step => ({
          id: step.id,
          name: step.name,
          timePercentage: step.timePercent || 0,
          subcomponents: (step.subcomponents || []).map(subcomponent => ({
            id: subcomponent.id,
            name: subcomponent.name,
            frequencyPercentage: subcomponent.usageWeight || 0,
            parentId: step.id
          })),
          parentId: selectedActivity.id
        }))
      };

      await exportResearchDesignPDF({
        business,
        year: year,
        activities: [researchActivity],
        logo: undefined, // No logo for now
        researchLeaders: leaders
      });
    } catch (err) {
      setError('Failed to export PDF');
      console.error('Error exporting PDF:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleBulkGenerateAI = async () => {
    if (!business) return;

    setBulkGenerating(true);
    setError(null);

    try {
      const businessInfo = {
        name: business.businessName,
        dbaName: business.dbaName,
        ein: business.ein,
        entityType: business.entityType,
        entityState: business.entityState,
        startYear: business.startYear,
        owners: business.owners.map(owner => ({
          name: owner.name,
          ownershipPercentage: owner.ownershipPercentage,
          isResearchLeader: owner.isResearchLeader
        }))
      };

      // Prepare data for all activities
      const activitiesData = activities.map(activity => {
        const activitySteps = loadResearchDesign(activity.id, year);
        const subcomponentData = [];
        
        for (const step of activitySteps) {
          for (const subcomponent of step.subcomponents) {
            const savedData = loadSubcomponentResearchData(businessId, year, activity.id, subcomponent.id);
            subcomponentData.push({
              stepName: step.name,
              subcomponentName: subcomponent.name,
              subcomponentId: subcomponent.id,
              userNotes: savedData?.userNotes || '',
              userModifications: savedData?.userModifications || {}
            });
          }
        }
        
        return {
          activityName: activity.name,
          activityId: activity.id,
          subcomponents: subcomponentData
        };
      });

      const bulkResults = await generateBulkAIContent({
        activities: activitiesData,
        businessInfo,
        year
      });

      // Save all generated content
      saveBulkAIContent(businessId, year, bulkResults.activities, bulkResults.subcomponents);

      // Update current activity content if it was generated
      const currentActivityContent = bulkResults.activities.find(a => a.activityId === selectedActivityId);
      if (currentActivityContent) {
        setAiContent(currentActivityContent.content);
      }

      // Show success message
      setError(null);
      console.log('Bulk AI generation completed successfully');

    } catch (err) {
      setError('Failed to generate bulk AI content');
      console.error('Error generating bulk AI content:', err);
    } finally {
      setBulkGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!selectedActivity) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Please select a research activity to preview the report
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <DescriptionIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Report Preview: {selectedActivity.name}
            </Typography>
            {isApproved && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Approved"
                color="success"
                variant="outlined"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleGenerateAIContent}
              disabled={generating || steps.length === 0}
            >
              {aiContent ? 'Regenerate AI Content' : 'Generate AI Content'}
            </Button>
            <Button
              variant="outlined"
              startIcon={bulkGenerating ? <CircularProgress size={16} /> : <EditIcon />}
              onClick={handleBulkGenerateAI}
              disabled={bulkGenerating}
              color="secondary"
            >
              {bulkGenerating ? 'Generating All...' : 'Generate All AI Content'}
            </Button>
            {aiContent && (
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleApproveReport}
                disabled={isApproved}
                color="success"
              >
                Approve Report
              </Button>
            )}
            {isApproved && (
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={handleExportPDF}
                disabled={exporting}
                color="primary"
              >
                Export PDF
              </Button>
            )}
          </Box>

          {generating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Generating AI content...</Typography>
            </Box>
          )}

          {bulkGenerating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Generating AI content for all activities and subcomponents...</Typography>
            </Box>
          )}

          {exporting && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Generating PDF...</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Report Content */}
      {aiContent ? (
        <Box>
          {/* Title Page */}
          <Paper elevation={2} sx={{ mb: 3, p: 4, textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
              {aiContent.title}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              Research & Development Tax Credit Report
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              {business?.businessName} • {year}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {business?.businessName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  EIN: {business?.ein}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <ScienceIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Research Activity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedActivity.name}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Table of Contents */}
          <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Table of Contents
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="1. Executive Summary" />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Research Activity Description" />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Research Methodology" />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Research Steps and Subcomponents" />
              </ListItem>
              <ListItem>
                <ListItemText primary="5. Findings and Results" />
              </ListItem>
              <ListItem>
                <ListItemText primary="6. Conclusions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="7. Recommendations" />
              </ListItem>
            </List>
          </Paper>

          {/* Executive Summary */}
          <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              1. Executive Summary
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {aiContent.executiveSummary}
            </Typography>
          </Paper>

          {/* Research Activity Description */}
          <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              2. Research Activity Description
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 3 }}>
              {aiContent.researchDescription}
            </Typography>
            
            {/* Business Information */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Business Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Business Name:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{business?.businessName}</Typography>
                    
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>DBA Name:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{business?.dbaName || 'N/A'}</Typography>
                    
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>EIN:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{business?.ein}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Entity Type:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{business?.entityType}</Typography>
                    
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Entity State:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{business?.entityState}</Typography>
                    
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Start Year:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{business?.startYear}</Typography>
                  </Grid>
                </Grid>
                
                {business?.owners && business.owners.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Owners:</Typography>
                    {business.owners.map((owner, index) => (
                      <Chip
                        key={owner.id}
                        label={`${owner.name} (${owner.ownershipPercentage}%)${owner.isResearchLeader ? ' - Research Leader' : ''}`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                        color={owner.isResearchLeader ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Paper>

          {/* Research Methodology */}
          <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              3. Research Methodology
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {aiContent.methodology}
            </Typography>
          </Paper>

          {/* Research Steps and Subcomponents */}
          <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              4. Research Steps and Subcomponents
            </Typography>
            {steps.map((step, stepIndex) => (
              <Accordion key={step.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Step {stepIndex + 1}: {step.name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {step.subcomponents.map((subcomponent, subIndex) => {
                    const savedData = loadSubcomponentResearchData(businessId, year, selectedActivity.id, subcomponent.id);
                    return (
                      <Box key={subcomponent.id} sx={{ mb: 3, pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Subcomponent {subIndex + 1}: {subcomponent.name}
                        </Typography>
                        {savedData?.userNotes && (
                          <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                            <strong>Notes:</strong> {savedData.userNotes}
                          </Typography>
                        )}
                        {savedData?.userModifications && Object.keys(savedData.userModifications).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {Object.entries(savedData.userModifications).map(([key, value]) => (
                              <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                                <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Findings and Results */}
          <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              5. Findings and Results
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {aiContent.findings}
            </Typography>
          </Paper>

          {/* Conclusions */}
          <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              6. Conclusions
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {aiContent.conclusions}
            </Typography>
          </Paper>

          {/* Recommendations */}
          <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              7. Recommendations
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {aiContent.recommendations}
            </Typography>
          </Paper>
        </Box>
      ) : (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            No Report Content Generated
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Generate AI content to create a comprehensive research report for this activity.
          </Typography>
          <Button
            variant="contained"
            onClick={handleGenerateAIContent}
            disabled={generating || steps.length === 0}
            startIcon={<EditIcon />}
          >
            Generate AI Content
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default ReportPreviewTab; 