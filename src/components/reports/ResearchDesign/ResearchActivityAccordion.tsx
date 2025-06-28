import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import { QRAActivityData, ResearchStep } from '../../../types/ReportQRA';
import { Business } from '../../../types/Business';
import { 
  getPromptForActivity, 
  saveUserPrompt 
} from '../../../services/promptTemplateService';
import { 
  generateAIReportContent 
} from '../../../services/aiReportService';
import { useResearchDesignData } from '../../../hooks/useResearchDesignData';
import { loadResearchApiData } from '../../../services/researchApiService';
import SubcomponentAccordion from './SubcomponentAccordion';

const STEP_COLORS = [
  '#1976d2', '#43a047', '#fbc02d', '#e64a19', '#8e24aa',
  '#00838f', '#c62828', '#6d4c41', '#3949ab', '#00acc1'
];
const SUBCOMPONENT_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#009688',
  '#f44336', '#795548', '#3f51b5', '#00bcd4', '#ff5722'
];

interface ResearchActivityAccordionProps {
  activity: QRAActivityData;
  business: Business;
  year: number;
  onDataChange?: () => void;
}

const ResearchActivityAccordion: React.FC<ResearchActivityAccordionProps> = ({
  activity,
  business,
  year,
  onDataChange
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [researchApiData, setResearchApiData] = useState<any[]>([]);
  const [loadingApiData, setLoadingApiData] = useState(false);
  const [apiDataError, setApiDataError] = useState<string | null>(null);

  // Use the same hook as ActivityTab to load steps and subcomponents
  const { steps, loading: stepsLoading, error: stepsError } = useResearchDesignData(
    activity, 
    year, // selectedYear
    business.id, // businessId
    year
  );

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

  useEffect(() => {
    if (expanded) {
      // Load prompt
      const currentPrompt = getPromptForActivity(business.id, year, activity.id);
      setPrompt(currentPrompt);
      setOriginalPrompt(currentPrompt);
    }
  }, [expanded, activity, business.id, year]);

  const handleSave = () => {
    saveUserPrompt(business.id, year, activity.id, prompt);
    setIsEditing(false);
    setHasChanges(false);
    setOriginalPrompt(prompt);
    onDataChange?.();
  };

  const handleCancel = () => {
    setPrompt(originalPrompt);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    setHasChanges(newPrompt !== originalPrompt);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const content = await generateAIReportContent({
        activityName: activity.name,
        businessInfo: {
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
        },
        subcomponentData: steps.flatMap(step => 
          step.subcomponents?.map(sub => ({
            stepName: step.name,
            subcomponentName: sub.name,
            subcomponentId: sub.id,
            userNotes: '',
            userModifications: {}
          })) || []
        ),
        year: year
      });
      
      // Convert AIReportContent object to formatted string
      const formattedContent = `
${content.title}

EXECUTIVE SUMMARY
${content.executiveSummary}

RESEARCH DESCRIPTION
${content.researchDescription}

METHODOLOGY
${content.methodology}

FINDINGS
${content.findings}

CONCLUSIONS
${content.conclusions}

RECOMMENDATIONS
${content.recommendations}
      `.trim();
      
      setGeneratedContent(formattedContent);
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = (step: ResearchStep, index: number) => {
    const stepSubcomponents = step.subcomponents || [];
    const stepColor = STEP_COLORS[index % STEP_COLORS.length];
    
    return (
      <Box
        key={step.id}
        sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'background.paper' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
                  researchApiData={researchApiData} // Pass actual research API data for prompt generation
                  businessId={business.id}
                  year={year}
                  activityId={activity.id}
                  subColor={subColor}
                  onDataChange={onDataChange}
                  showAIPrompt={true} // Show AI prompt instead of Research API data
                  parentStepName={step.name} // Pass parent step name for the prompt
                  activityDescription={activity.name} // Pass activity name as description
                  business={business} // Pass business data for AI generation
                />
              );
            })}
          </Box>
        )}
      </Box>
    );
  };

  const totalSubcomponents = steps.reduce((sum, s) => sum + (s.subcomponents?.length || 0), 0);

  return (
    <Accordion 
      expanded={expanded} 
      onChange={() => setExpanded(!expanded)}
      sx={{ 
        mb: 2, 
        '&:before': { display: 'none' },
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          bgcolor: 'grey.50',
          '&:hover': { bgcolor: 'grey.100' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Chip
            label={activity.name}
            size="medium"
            sx={{ 
              bgcolor: '#1976d222', 
              color: '#222', 
              border: '2px solid #1976d2', 
              fontWeight: 600 
            }}
          />
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
          {hasChanges && (
            <Chip 
              label="Modified" 
              size="small" 
              color="warning" 
              variant="outlined"
            />
          )}
          {generatedContent && (
            <Chip 
              label="AI Generated" 
              size="small" 
              color="success" 
              variant="outlined"
            />
          )}
        </Box>
      </AccordionSummary>
      
      <AccordionDetails sx={{ p: 3 }}>
        {/* Loading state */}
        {stepsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error state */}
        {stepsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {stepsError}
          </Alert>
        )}

        {/* AI Prompt Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Generation Prompt
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isEditing ? (
                <Tooltip title="Edit Prompt">
                  <IconButton 
                    size="small" 
                    onClick={() => setIsEditing(true)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <>
                  <Tooltip title="Save Changes">
                    <IconButton 
                      size="small" 
                      onClick={handleSave}
                      color="primary"
                      disabled={!hasChanges}
                    >
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel Changes">
                    <IconButton 
                      size="small" 
                      onClick={handleCancel}
                      color="error"
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={isGenerating ? <CircularProgress size={16} /> : <AIIcon />}
                onClick={handleGenerateAI}
                disabled={isGenerating || steps.length === 0}
              >
                {isGenerating ? 'Generating...' : 'Generate AI Content'}
              </Button>
            </Box>
          </Box>
          
          <TextField
            fullWidth
            label="AI Generation Prompt"
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            disabled={!isEditing}
            multiline
            rows={6}
            variant="outlined"
            placeholder="Enter the prompt for AI content generation..."
          />
        </Box>

        {/* Generated AI Content */}
        {generatedContent && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Generated AI Content
            </Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1, 
              border: '1px solid',
              borderColor: 'grey.200',
              whiteSpace: 'pre-wrap'
            }}>
              {generatedContent}
            </Box>
          </Box>
        )}

        {/* Research Steps */}
        {steps.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Research Steps
            </Typography>
            {steps.map((step, index) => renderStep(step, index))}
          </Box>
        )}

        {steps.length === 0 && !stepsLoading && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No steps defined for this research activity
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default ResearchActivityAccordion; 