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
  Divider,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Science as ScienceIcon,
  SmartToy as AIIcon,
} from '@mui/icons-material';
import { ResearchSubcomponent } from '../../../types/ReportQRA';
import { 
  loadSubcomponentResearchData, 
  saveSubcomponentResearchData,
  ResearchApiData,
  findResearchDataForSubcomponent
} from '../../../services/researchApiService';
import { 
  generateSubcomponentAIContent,
  loadSubcomponentAIContent,
  saveSubcomponentAIContent,
  SubcomponentAIContent
} from '../../../services/aiReportService';
import { Business } from '../../../types/Business';
import {
  getPromptForActivity,
  saveUserPrompt,
  getDefaultPromptTemplate,
  processPromptTemplate
} from '../../../services/promptTemplateService';

interface SubcomponentAccordionProps {
  subcomponent: ResearchSubcomponent;
  researchActivityName: string;
  researchApiData: any[];
  businessId: string;
  year: number;
  activityId: string;
  subColor: string;
  onDataChange?: () => void;
  showAIPrompt?: boolean;
  parentStepName?: string;
  activityDescription?: string;
  business?: Business;
}

const SubcomponentAccordion: React.FC<SubcomponentAccordionProps> = ({
  subcomponent,
  researchActivityName,
  researchApiData,
  businessId,
  year,
  activityId,
  subColor,
  onDataChange,
  showAIPrompt,
  parentStepName,
  activityDescription,
  business,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedAIContent, setGeneratedAIContent] = useState<SubcomponentAIContent | null>(null);
  const [researchData, setResearchData] = useState<ResearchApiData | null>(null);
  const [userNotes, setUserNotes] = useState('');

  // Load saved data on component mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        // Load Research API data
        if (researchApiData && researchApiData.length > 0) {
          console.log('🔍 Looking for Research API data for subcomponent:', subcomponent.name, 'in activity:', researchActivityName);
          console.log('📊 Available Research API data count:', researchApiData.length);
          
          const matchingData = findResearchDataForSubcomponent(
            subcomponent.name,
            researchActivityName,
            researchApiData
          );
          
          if (matchingData) {
            console.log('✅ Found Research API data for subcomponent:', subcomponent.name);
            console.log('📋 Data includes:', {
              generalDescription: matchingData.generalDescription?.substring(0, 50) + '...',
              goal: matchingData.goal?.substring(0, 50) + '...',
              hypothesis: matchingData.hypothesis?.substring(0, 50) + '...',
              uncertainties: matchingData.uncertainties?.substring(0, 50) + '...',
              alternatives: matchingData.alternatives?.substring(0, 50) + '...',
              developmentalProcess: matchingData.developmentalProcess?.substring(0, 50) + '...'
            });
            setResearchData(matchingData);
          } else {
            console.log('❌ No Research API data found for subcomponent:', subcomponent.name);
          }
        } else {
          console.log('⚠️ No Research API data available for subcomponent:', subcomponent.name);
        }

        // Load user modifications
        const savedData = loadSubcomponentResearchData(businessId, year, activityId, subcomponent.id);
        if (savedData) {
          setUserNotes(savedData.userNotes || '');
          if (savedData.userModifications) {
            setResearchData(prev => prev ? { ...prev, ...savedData.userModifications } : null);
          }
        }

        // Load saved AI content
        const savedAIContent = loadSubcomponentAIContent(businessId, year, activityId, subcomponent.id);
        if (savedAIContent) {
          console.log('📥 Loaded saved AI content for subcomponent:', subcomponent.name, savedAIContent);
          setGeneratedAIContent(savedAIContent);
        } else {
          console.log('📭 No saved AI content found for subcomponent:', subcomponent.name);
          console.log('🔍 Looking for key:', `ai_subcomponent_${businessId}_${year}_${activityId}_${subcomponent.id}`);
          
          // Debug: Check all localStorage keys for this subcomponent
          const allKeys = Object.keys(localStorage);
          const relevantKeys = allKeys.filter(key => 
            key.includes('ai_subcomponent') && 
            key.includes(subcomponent.id)
          );
          console.log('🔍 Relevant localStorage keys for subcomponent:', subcomponent.id, relevantKeys);
          
          if (relevantKeys.length > 0) {
            console.log('🔍 Found potential keys, checking content:');
            relevantKeys.forEach(key => {
              const content = localStorage.getItem(key);
              console.log('🔍 Key:', key, 'Content:', content ? 'EXISTS' : 'NULL');
            });
          }
        }

        // Load saved prompt
        const savedPrompt = getPromptForActivity(businessId, year, activityId, subcomponent.id);
        if (savedPrompt) {
          setPrompt(savedPrompt);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, [businessId, year, activityId, subcomponent.id, researchApiData]);

  // Prepare data for prompt template
  const getPromptData = () => {
    const data = {
      'insert subcomponent name': subcomponent.name,
      'insert parent activity name': researchActivityName,
      'insert parent step name': parentStepName || '',
      'insert any user-provided notes': userNotes || '',
      'insert available research data': researchData
        ? [
            `General Description: ${researchData.generalDescription || ''}`,
            `Goal: ${researchData.goal || ''}`,
            `Hypothesis: ${researchData.hypothesis || ''}`,
            `Uncertainties: ${researchData.uncertainties || ''}`,
            `Alternatives: ${researchData.alternatives || ''}`,
            `Developmental Process: ${researchData.developmentalProcess || ''}`
          ].join('\n')
        : '',
      Name: subcomponent.name,
    };
    
    console.log('🎯 Prompt data for subcomponent:', subcomponent.name, data);
    return data;
  };

  // Get the processed prompt (with data integration)
  const getProcessedPrompt = () => {
    const template = prompt || getDefaultPromptTemplate('subcomponent')?.template || '';
    return processPromptTemplate(template, getPromptData());
  };

  // When entering edit mode, pre-fill with processed prompt
  const handleEdit = () => {
    setIsEditing(true);
    setPrompt(getProcessedPrompt());
    setOriginalPrompt(getProcessedPrompt());
    setHasChanges(false);
  };

  const handleSave = () => {
    saveUserPrompt(businessId, year, activityId, prompt, subcomponent.id);
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
    if (!business) return;
    setIsGeneratingAI(true);
    try {
      console.log('🚀 Starting AI generation for subcomponent:', subcomponent.name);
      const content = await generateSubcomponentAIContent({
        subcomponentName: subcomponent.name,
        stepName: parentStepName || 'Unknown Step',
        activityName: researchActivityName,
        subcomponentId: subcomponent.id,
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
        researchApiData: researchApiData || {},
        userNotes: userNotes,
        userModifications: {},
        year
      });
      console.log('✅ AI content generated for subcomponent:', subcomponent.name, content);
      setGeneratedAIContent(content);
      saveSubcomponentAIContent(businessId, year, activityId, subcomponent.id, content);
      console.log('💾 AI content saved for subcomponent:', subcomponent.name);
    } catch (error) {
      console.error('❌ Error generating AI content:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const renderField = (label: string, field: keyof ResearchApiData, value: string, multiline = true) => (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={(e) => {
        if (researchData) {
          const newData = { ...researchData, [field]: e.target.value };
          setResearchData(newData);
          setHasChanges(true);
        }
      }}
      disabled={!isEditing}
      multiline={multiline}
      rows={multiline ? 3 : 1}
      variant="outlined"
      size="small"
      sx={{ mb: 2 }}
    />
  );

  const renderReadOnlyField = (label: string, value: string) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ 
        p: 1.5, 
        bgcolor: 'grey.50', 
        borderRadius: 1, 
        border: '1px solid',
        borderColor: 'grey.200',
        minHeight: '2.5rem',
        whiteSpace: 'pre-wrap'
      }}>
        {value || 'No data available'}
      </Typography>
    </Box>
  );

  return (
    <Accordion 
      expanded={expanded} 
      onChange={() => setExpanded(!expanded)}
      sx={{ 
        mb: 1, 
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
            label={subcomponent.name}
            size="small"
            sx={{ 
              bgcolor: subColor + '22', 
              color: '#222', 
              border: `1px solid ${subColor}`, 
              fontWeight: 500 
            }}
          />
          {hasChanges && (
            <Chip 
              label="Modified" 
              size="small" 
              color="warning" 
              variant="outlined"
            />
          )}
          {researchData && (
            <Tooltip title="Research API data available">
              <ScienceIcon color="primary" sx={{ fontSize: 16 }} />
            </Tooltip>
          )}
        </Box>
      </AccordionSummary>
      
      <AccordionDetails sx={{ p: 3 }}>
        {showAIPrompt ? (
          // Show AI Prompt instead of Research API data
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              AI Generation Prompt
            </Typography>
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 3 }}>
              {!isEditing ? (
                <>
                  <Tooltip title="Edit Prompt">
                    <IconButton 
                      size="small" 
                      onClick={handleEdit}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {business && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={isGeneratingAI ? <CircularProgress size={16} /> : <AIIcon />}
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      color="secondary"
                    >
                      {isGeneratingAI ? 'Generating...' : 'Generate AI Content'}
                    </Button>
                  )}
                </>
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
            </Box>

            {/* Processed Prompt Display/Edit */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Processed Prompt (with data integration):
              </Typography>
              {isEditing ? (
                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              ) : (
                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  value={getProcessedPrompt()}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                    sx: {
                      backgroundColor: 'grey.50',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            </Box>

            {/* Generated AI Content Display */}
            {generatedAIContent && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Generated AI Content:
                </Typography>
                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  value={typeof generatedAIContent === 'string' ? generatedAIContent : generatedAIContent.content}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                    style: { 
                      backgroundColor: 'grey.50',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        ) : !researchData ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No Research API data found for this subcomponent. 
            The data may not be available in the Research API or the subcomponent name doesn't match exactly.
          </Alert>
        ) : (
          <>
            {/* Action buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 3 }}>
              {!isEditing ? (
                <>
                  <Tooltip title="Edit Prompt">
                    <IconButton 
                      size="small" 
                      onClick={handleEdit}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={isGeneratingAI ? <CircularProgress size={16} /> : <AIIcon />}
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                  >
                    {isGeneratingAI ? 'Generating...' : 'Generate AI Content'}
                  </Button>
                </>
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
            </Box>

            {/* Generated AI Content */}
            {generatedAIContent && (
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
                  {generatedAIContent.content}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Research API Data Fields */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Research Data
            </Typography>

            {isEditing ? (
              <>
                {renderField('General Description', 'generalDescription', researchData.generalDescription)}
                {renderField('Goal', 'goal', researchData.goal)}
                {renderField('Hypothesis', 'hypothesis', researchData.hypothesis)}
                {renderField('Uncertainties', 'uncertainties', researchData.uncertainties)}
                {renderField('Alternatives', 'alternatives', researchData.alternatives)}
                {renderField('Developmental Process', 'developmentalProcess', researchData.developmentalProcess)}
              </>
            ) : (
              <>
                {renderReadOnlyField('General Description', researchData.generalDescription)}
                {renderReadOnlyField('Goal', researchData.goal)}
                {renderReadOnlyField('Hypothesis', researchData.hypothesis)}
                {renderReadOnlyField('Uncertainties', researchData.uncertainties)}
                {renderReadOnlyField('Alternatives', researchData.alternatives)}
                {renderReadOnlyField('Developmental Process', researchData.developmentalProcess)}
              </>
            )}

            {/* Additional metadata */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Additional Information
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {isEditing ? (
                <>
                  {renderField('Hint', 'hint', researchData.hint, false)}
                  {renderField('Phase', 'phase', researchData.phase, false)}
                  {renderField('Step', 'step', researchData.step, false)}
                  {renderField('Roles', 'roles', researchData.roles, false)}
                  {renderField('Decision Category', 'decisionCategory', researchData.decisionCategory, false)}
                  {renderField('Expected Outcome Type', 'expectedOutcomeType', researchData.expectedOutcomeType, false)}
                  {renderField('CPT Codes', 'cptCodes', researchData.cptCodes, false)}
                  {renderField('CDT Codes', 'cdtCodes', researchData.cdtCodes, false)}
                </>
              ) : (
                <>
                  {renderReadOnlyField('Hint', researchData.hint)}
                  {renderReadOnlyField('Phase', researchData.phase)}
                  {renderReadOnlyField('Step', researchData.step)}
                  {renderReadOnlyField('Roles', researchData.roles)}
                  {renderReadOnlyField('Decision Category', researchData.decisionCategory)}
                  {renderReadOnlyField('Expected Outcome Type', researchData.expectedOutcomeType)}
                  {renderReadOnlyField('CPT Codes', researchData.cptCodes)}
                  {renderReadOnlyField('CDT Codes', researchData.cdtCodes)}
                </>
              )}
            </Box>

            {/* Product/Technology Options */}
            {isEditing ? (
              renderField('Product/Technology Options', 'productTechnologyOptions', researchData.productTechnologyOptions)
            ) : (
              renderReadOnlyField('Product/Technology Options', researchData.productTechnologyOptions)
            )}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default SubcomponentAccordion; 