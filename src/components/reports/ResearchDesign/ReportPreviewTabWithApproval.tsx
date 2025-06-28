import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, AppBar, Toolbar, IconButton, Tooltip,
  CircularProgress, Alert, Chip, TextField, FormControl, InputLabel, Select, MenuItem,
  Grid, Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme } from '@mui/material/styles';
import { QRAActivityData, ResearchStep, ResearchActivity } from '../../../types/ReportQRA';
import { Business } from '../../../types/Business';
import { approvalsService, TabApproval } from '../../../services/approvals';
import { exportResearchDesignPDF, exportRDTaxCreditReport, generatePDFPreview } from '../../../services/pdfExportService';
import { loadSubcomponentResearchData } from '../../../services/researchApiService';
import { generateBulkAIContent, saveBulkAIContent } from '../../../services/aiReportService';
import { loadResearchDesign } from '../../../services/researchDesignService';
import ResearchActivityAccordion from './ResearchActivityAccordion';

interface ReportPreviewTabWithApprovalProps {
  activities: QRAActivityData[];
  business: Business;
  year: number;
}

const ReportPreviewTabWithApproval: React.FC<ReportPreviewTabWithApprovalProps> = ({
  activities,
  business,
  year
}) => {
  const theme = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [previewingPDF, setPreviewingPDF] = useState(false);
  const [approvalData, setApprovalData] = useState<any>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  
  // Business configuration state
  const [businessName, setBusinessName] = useState(business.businessName || '');
  const [researchLeaders, setResearchLeaders] = useState<string[]>(
    business.owners?.filter(owner => owner.isResearchLeader).map(owner => owner.name) || []
  );
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Load approval status
  useEffect(() => {
    const approval = approvalsService.getApprovalData('reportPreview', year);
    setApprovalData(approval);
    setIsApproved(approval?.isApproved || false);
  }, [year]);

  // Load business configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(`businessConfig_${business.id}_${year}`);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setBusinessName(config.businessName || business.businessName || '');
        setResearchLeaders(config.researchLeaders || []);
        setBusinessLogo(config.businessLogo || null);
      } catch (error) {
        console.error('Error loading business config:', error);
      }
    }
  }, [business.id, year, business.businessName]);

  const handleSaveBusinessConfig = () => {
    const config = {
      businessName,
      researchLeaders,
      businessLogo
    };
    localStorage.setItem(`businessConfig_${business.id}_${year}`, JSON.stringify(config));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBusinessLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddResearchLeader = () => {
    const newLeader = prompt('Enter research leader name:');
    if (newLeader && !researchLeaders.includes(newLeader)) {
      setResearchLeaders([...researchLeaders, newLeader]);
    }
  };

  const handleRemoveResearchLeader = (leader: string) => {
    setResearchLeaders(researchLeaders.filter(l => l !== leader));
  };

  const handleExportPDF = async () => {
    if (!business) return;
    
    try {
      setExportingPDF(true);
      
      // Get research leaders from business owners
      const researchLeaders = business.owners
        .filter(owner => owner.isResearchLeader)
        .map(owner => owner.name);
      
      // If no research leaders, use all owners
      const leaders = researchLeaders.length > 0 ? researchLeaders : business.owners.map(owner => owner.name);
      
      // Prepare the data for PDF export - fix the conversion
      const activitiesForPDF = activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        steps: activity.steps.map(step => ({
          id: step.id,
          name: step.name,
          timePercentage: step.timePercent || 0,
          subcomponents: (step.subcomponents || []).map(subcomponent => ({
            id: subcomponent.id,
            name: subcomponent.name,
            frequencyPercentage: subcomponent.usageWeight || 0,
            parentId: step.id
          })),
          parentId: activity.id
        }))
      })) as ResearchActivity[];
      
      console.log('📄 Exporting PDF with activities:', activitiesForPDF);
      
      await exportResearchDesignPDF({
        business,
        year: year,
        activities: activitiesForPDF,
        researchLeaders: leaders,
        logo: businessLogo || undefined
      });
      
      setExportingPDF(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setExportingPDF(false);
      // You might want to show an error message to the user
    }
  };

  const handlePreviewPDF = async () => {
    if (!business) return;
    
    try {
      console.log('🚀 Starting PDF preview generation...');
      setPreviewingPDF(true);
      
      // Get research leaders from business owners
      const researchLeaders = business.owners
        .filter(owner => owner.isResearchLeader)
        .map(owner => owner.name);
      
      // If no research leaders, use all owners
      const leaders = researchLeaders.length > 0 ? researchLeaders : business.owners.map(owner => owner.name);
      
      console.log('📊 Business data:', business);
      console.log('👥 Research leaders:', leaders);
      console.log('📋 Activities data:', activities);
      
      // Prepare the data for PDF export - fix the conversion
      const activitiesForPDF = activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        steps: activity.steps.map(step => ({
          id: step.id,
          name: step.name,
          timePercentage: step.timePercent || 0,
          subcomponents: (step.subcomponents || []).map(subcomponent => ({
            id: subcomponent.id,
            name: subcomponent.name,
            frequencyPercentage: subcomponent.usageWeight || 0,
            parentId: step.id
          })),
          parentId: activity.id
        }))
      })) as ResearchActivity[];
      
      console.log('📄 Prepared activities for PDF:', activitiesForPDF);
      
      const pdfDataUri = await generatePDFPreview({
        business,
        year: year,
        activities: activitiesForPDF,
        researchLeaders: leaders,
        logo: businessLogo || undefined
      });
      
      console.log('✅ PDF preview generated successfully');
      
      // Open PDF in new window with better popup handling
      const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>R&D Tax Credit Report Preview</title>
              <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .pdf-container { width: 100%; height: 100vh; }
                .pdf-embed { width: 100%; height: 100%; border: none; }
                .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
              </style>
            </head>
            <body>
              <div class="pdf-container">
                <embed src="${pdfDataUri}" type="application/pdf" class="pdf-embed">
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
        console.log('✅ PDF preview window opened successfully');
      } else {
        console.error('❌ Popup blocked! Please allow popups for this site.');
        // Fallback: Create a download link
        const link = document.createElement('a');
        link.href = pdfDataUri;
        link.download = `research-design-${business.businessName}-${year}.pdf`;
        link.click();
        console.log('✅ PDF downloaded as fallback');
      }
      
      setPreviewingPDF(false);
    } catch (error) {
      console.error('❌ Error previewing PDF:', error);
      setPreviewingPDF(false);
      // You might want to show an error message to the user
    }
  };

  const handleApprove = () => {
    const approval: TabApproval = {
      timestamp: new Date().toISOString(),
      ipAddress: 'localhost',
      data: { approved: true }
    };
    approvalsService.recordApproval('reportPreview', approval, year);
    setApprovalData(approval);
    setIsApproved(true);
  };

  const handleUnapprove = () => {
    const approval: TabApproval = {
      timestamp: new Date().toISOString(),
      ipAddress: 'localhost',
      data: { approved: false }
    };
    approvalsService.recordApproval('reportPreview', approval, year);
    setApprovalData(approval);
    setIsApproved(false);
  };

  const handleDataChange = () => {
    console.log('Report preview data changed');
  };

  const handleBulkGenerateAI = async () => {
    setBulkGenerating(true);
    setBulkError(null);

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
      const activitiesData = [];
      for (const activity of activities) {
        const activitySteps = loadResearchDesign(activity.id, year);
        const subcomponentData = [];
        
        for (const step of activitySteps) {
          for (const subcomponent of step.subcomponents) {
            const savedData = loadSubcomponentResearchData(business.id, year, activity.id, subcomponent.id);
            subcomponentData.push({
              stepName: step.name,
              subcomponentName: subcomponent.name,
              subcomponentId: subcomponent.id,
              userNotes: savedData?.userNotes || '',
              userModifications: savedData?.userModifications || {}
            });
          }
        }

        activitiesData.push({
          activityName: activity.name,
          activityId: activity.id,
          subcomponents: subcomponentData
        });
      }

      console.log('🚀 Starting bulk AI generation for activities:', activitiesData.map(a => a.activityName));

      const bulkResults = await generateBulkAIContent({
        activities: activitiesData,
        businessInfo,
        year
      });

      console.log('✅ Bulk AI generation completed, saving results:', bulkResults);

      // Save all generated content
      saveBulkAIContent(business.id, year, bulkResults.activities, bulkResults.subcomponents);

      // Show success message
      setBulkError(null);
      console.log('💾 Bulk AI content saved successfully');

    } catch (err) {
      setBulkError('Failed to generate bulk AI content');
      console.error('❌ Error generating bulk AI content:', err);
    } finally {
      setBulkGenerating(false);
    }
  };

  const totalActivities = activities.length;
  const totalSteps = activities.reduce((sum, activity) => sum + (activity.steps?.length || 0), 0);
  const totalSubcomponents = activities.reduce((sum, activity) => 
    sum + (activity.steps?.reduce((stepSum, step) => stepSum + (step.subcomponents?.length || 0), 0) || 0), 0
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* AppBar */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: isApproved ? theme.palette.success.main : theme.palette.primary.main 
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Report Preview
            {isApproved && (
              <CheckCircleIcon sx={{ ml: 1, verticalAlign: 'middle' }} />
            )}
          </Typography>
          
          <Tooltip title="Help">
            <IconButton color="inherit">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>

          {isApproved ? (
            <Tooltip title="Unapprove">
              <IconButton color="inherit" onClick={handleUnapprove}>
                <LockIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Approve">
              <IconButton color="inherit" onClick={handleApprove}>
                <LockOpenIcon />
              </IconButton>
            </Tooltip>
          )}

          {isApproved && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <CheckCircleIcon sx={{ color: 'white', mr: 1 }} />
              <Typography variant="body2" sx={{ color: 'white' }}>
                Approved
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {/* Business Configuration Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon />
              Business Configuration
            </Typography>
            
            <Grid container spacing={3}>
              {/* Business Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>

              {/* Research Leaders */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Research Leaders
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {researchLeaders.map((leader, index) => (
                      <Chip
                        key={index}
                        label={leader}
                        onDelete={() => handleRemoveResearchLeader(leader)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Button
                    size="small"
                    startIcon={<PersonIcon />}
                    onClick={handleAddResearchLeader}
                    variant="outlined"
                  >
                    Add Research Leader
                  </Button>
                </Box>
              </Grid>

              {/* Business Logo */}
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Business Logo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {businessLogo && (
                      <Box
                        component="img"
                        src={businessLogo}
                        alt="Business Logo"
                        sx={{ 
                          width: 100, 
                          height: 60, 
                          objectFit: 'contain',
                          border: '1px solid',
                          borderColor: 'grey.300',
                          borderRadius: 1
                        }}
                      />
                    )}
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      size="small"
                    >
                      Upload Logo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </Button>
                    {businessLogo && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setBusinessLogo(null);
                          setLogoFile(null);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Logo will be displayed on the cover page and in the top margin of every page
                  </Typography>
                </Box>
              </Grid>

              {/* Save Configuration Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleSaveBusinessConfig}
                  sx={{ mt: 1 }}
                >
                  Save Configuration
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Research Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${totalActivities} Research Activities`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`${totalSteps} Steps`} 
                color="secondary" 
                variant="outlined"
              />
              <Chip 
                label={`${totalSubcomponents} Subcomponents`} 
                color="info" 
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>

        {/* PDF Export Section */}
        <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            PDF Export Options
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePreviewPDF}
              disabled={previewingPDF}
              startIcon={previewingPDF ? <CircularProgress size={16} /> : <VisibilityIcon />}
            >
              {previewingPDF ? 'Generating Preview...' : 'Preview PDF'}
            </Button>
            
            <Button
              variant="contained"
              onClick={handleExportPDF}
              disabled={exportingPDF}
              startIcon={exportingPDF ? <CircularProgress size={16} /> : <FileDownloadIcon />}
              sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            >
              {exportingPDF ? 'Generating PDF...' : 'Export Complete PDF Report'}
            </Button>
            
            {/* Debug button */}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                console.log('🔍 Debug: Activities count:', activities.length);
                console.log('🔍 Debug: Business:', business);
                console.log('🔍 Debug: Year:', year);
                if (activities.length > 0) {
                  console.log('🔍 Debug: First activity:', activities[0]);
                }
              }}
            >
              Debug Data
            </Button>
          </Box>
          
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            The PDF report includes: Title page, table of contents, research activity overview with org charts, 
            detailed subcomponent sections with AI-generated content, and technical specifications appendix.
          </Typography>
        </Box>

        {/* Export Button */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleBulkGenerateAI}
            disabled={bulkGenerating}
            startIcon={bulkGenerating ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {bulkGenerating ? 'Generating All...' : 'Generate All AI Content'}
          </Button>
        </Box>

        {/* Bulk Generation Progress */}
        {bulkGenerating && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">
                Generating AI content for all activities and subcomponents...
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Bulk Generation Error */}
        {bulkError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {bulkError}
          </Alert>
        )}

        {/* Research Activities */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Research Activities
        </Typography>

        {activities.length === 0 ? (
          <Alert severity="info">
            No research activities found. Please add activities in the QRA Builder first.
          </Alert>
        ) : (
          <Box>
            {activities.map((activity) => (
              <ResearchActivityAccordion
                key={activity.id}
                activity={activity}
                business={business}
                year={year}
                onDataChange={handleDataChange}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ReportPreviewTabWithApproval; 