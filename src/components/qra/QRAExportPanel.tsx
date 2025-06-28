import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Divider,
  Grid, Alert, CircularProgress, Accordion, AccordionSummary,
  AccordionDetails, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CodeIcon from '@mui/icons-material/Code';
import TableChartIcon from '@mui/icons-material/TableChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { QRABuilderService } from '../../services/qrabuilderService';
import { SubcomponentSelectionData } from '../../types/QRABuilderInterfaces';

interface QRAExportPanelProps {
  businessId: string;
  businessName: string;
  year: number;
}

interface ExportRow {
  year: number;
  researchActivityTitle: string;
  researchActivityPracticePercent: number;
  step: string;
  subcomponentTitle: string;
  subcomponentYearPercent: number;
  subcomponentFrequencyPercent: number;
  subcomponentTimePercent: number;
  roles: string;
}

const QRAExportPanel: React.FC<QRAExportPanelProps> = ({
  businessId,
  businessName,
  year
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<ExportRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generate export data from QRA configurations
  const generateExportData = async () => {
    setExporting(true);
    setError(null);
    
    try {
      // Get all QRA data from Supabase
      const qraDataMap = await QRABuilderService.getAllQRAData(businessId, year);
      
      // Get all activities from research API
      const { getAllActivities } = await import('../../services/researchActivitiesService');
      const activities = await getAllActivities();
      
      const rows: ExportRow[] = [];
      
      // Process each activity that has QRA data
      Object.entries(qraDataMap).forEach(([activityId, qraData]) => {
        if (!qraData || !qraData.selectedSubcomponents) return;
        
        // Find the activity in the activities array - try multiple lookup strategies
        let activity = activities.find(a => a.id === activityId);
        if (!activity) {
          // Try finding by name if ID doesn't match
          activity = activities.find(a => a.name === activityId);
        }
        if (!activity) {
          // Try finding by title if name doesn't match
          activity = activities.find(a => a.title === activityId);
        }
        
        if (!activity) {
          console.warn(`Activity not found for ID: ${activityId}`);
          return;
        }

        const practicePercent = qraData.practicePercent ?? 0;
        
        // Process each selected subcomponent
        Object.entries(qraData.selectedSubcomponents).forEach(([subId, subConfig]) => {
          const sub = subConfig as any;
          
          // Extract data from subcomponent config
          let stepName = sub.step || '';
          let subcomponentTitle = sub.subcomponent || '';
          let yearPercent = sub.yearPercent ?? 0;
          let frequencyPercent = sub.frequencyPercent ?? 0;
          let timePercent = sub.timePercent ?? 0;
          let roles = Array.isArray(sub.selectedRoles)
            ? sub.selectedRoles.join(', ')
            : (sub.selectedRoles || '');
          
          // Fallback: try to get step/subcomponent names from activity if missing
          if ((!stepName || !subcomponentTitle) && activity.steps) {
            for (const step of activity.steps) {
              if (step.subcomponents) {
                for (const subcomponent of step.subcomponents) {
                  if (subcomponent.id === subId || subcomponent.title === subcomponentTitle) {
                    stepName = step.name || stepName;
                    subcomponentTitle = subcomponent.title || subcomponentTitle;
                    break;
                  }
                }
              }
            }
          }
          
          // Handle subcomponent title if it's an object
          if (typeof subcomponentTitle === 'object' && subcomponentTitle.title) {
            subcomponentTitle = subcomponentTitle.title;
          }

          rows.push({
            year,
            researchActivityTitle: activity.name || activity.title || activityId,
            researchActivityPracticePercent: practicePercent,
            step: stepName,
            subcomponentTitle,
            subcomponentYearPercent: yearPercent,
            subcomponentFrequencyPercent: frequencyPercent,
            subcomponentTimePercent: timePercent,
            roles
          });
        });
      });
      
      setExportData(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate export data');
    } finally {
      setExporting(false);
    }
  };

  // Download handlers
  const handleDownloadCSV = () => {
    if (exportData.length === 0) return;
    
    const headers = [
      'Year',
      'Research Activity Title',
      'Research Activity Practice Percent',
      'Step',
      'Subcomponent Title',
      'Subcomponent Year %',
      'Subcomponent Frequency %',
      'Subcomponent Time %',
      'Role(s)'
    ];
    
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => [
        row.year,
        `"${row.researchActivityTitle}"`,
        row.researchActivityPracticePercent,
        `"${row.step}"`,
        `"${row.subcomponentTitle}"`,
        row.subcomponentYearPercent,
        row.subcomponentFrequencyPercent,
        row.subcomponentTimePercent,
        `"${row.roles}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qra-export-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (exportData.length === 0) return;
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qra-export-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (exportData.length === 0) return null;
    
    const uniqueActivities = new Set(exportData.map(row => row.researchActivityTitle));
    const uniqueSteps = new Set(exportData.map(row => row.step));
    const uniqueSubcomponents = new Set(exportData.map(row => row.subcomponentTitle));
    
    // Calculate practice percentages correctly - average per activity, not sum
    const activityPracticePercentages = Array.from(uniqueActivities).map(activityTitle => {
      const activityRows = exportData.filter(row => row.researchActivityTitle === activityTitle);
      return activityRows[0]?.researchActivityPracticePercent || 0;
    });
    
    const avgPracticePercent = activityPracticePercentages.length > 0 
      ? activityPracticePercentages.reduce((sum, percent) => sum + percent, 0) / activityPracticePercentages.length
      : 0;
    
    const totalPracticePercent = activityPracticePercentages.reduce((sum, percent) => sum + percent, 0);
    
    return {
      totalRows: exportData.length,
      uniqueActivities: uniqueActivities.size,
      uniqueSteps: uniqueSteps.size,
      uniqueSubcomponents: uniqueSubcomponents.size,
      avgPracticePercent: avgPracticePercent.toFixed(1),
      totalPracticePercent: totalPracticePercent.toFixed(1)
    };
  }, [exportData]);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          QRA Data Export
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Export your selected QRA activities, steps, and subcomponents with percentages and roles.
          Only activities you have configured will be included in the export.
        </Typography>

        {/* Generate Export Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={generateExportData}
            disabled={exporting}
            startIcon={exporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
            sx={{ mr: 2 }}
          >
            {exporting ? 'Generating Export...' : 'Generate QRA Export Data'}
          </Button>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Export Data Display */}
        {exportData.length > 0 && (
          <Box>
            {/* Summary Statistics */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Export Summary
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {stats && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Data Overview</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip label={`Activities: ${stats.uniqueActivities}`} color="primary" size="small" />
                        <Chip label={`Steps: ${stats.uniqueSteps}`} color="primary" size="small" />
                        <Chip label={`Subcomponents: ${stats.uniqueSubcomponents}`} color="primary" size="small" />
                        <Chip label={`Total Rows: ${stats.totalRows}`} color="primary" size="small" />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>Practice Percentages</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Average: ${stats.avgPracticePercent}%`} 
                          color="success" 
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                        <Chip 
                          label={`Total: ${stats.totalPracticePercent}%`} 
                          color="info" 
                          size="small"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Data Preview */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TableChartIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Export Data Preview
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Activity</TableCell>
                        <TableCell>Practice %</TableCell>
                        <TableCell>Step</TableCell>
                        <TableCell>Subcomponent</TableCell>
                        <TableCell>Year %</TableCell>
                        <TableCell>Frequency %</TableCell>
                        <TableCell>Time %</TableCell>
                        <TableCell>Roles</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exportData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.researchActivityTitle}</TableCell>
                          <TableCell>{row.researchActivityPracticePercent.toFixed(1)}%</TableCell>
                          <TableCell>{row.step}</TableCell>
                          <TableCell>{row.subcomponentTitle}</TableCell>
                          <TableCell>{row.subcomponentYearPercent.toFixed(1)}%</TableCell>
                          <TableCell>{row.subcomponentFrequencyPercent.toFixed(1)}%</TableCell>
                          <TableCell>{row.subcomponentTimePercent.toFixed(1)}%</TableCell>
                          <TableCell>{row.roles}</TableCell>
                        </TableRow>
                      ))}
                      {exportData.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Showing first 10 rows of {exportData.length} total rows
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            {/* Download Options */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DownloadIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Download Options
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Download your QRA data in the following formats:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Tooltip title="Download as CSV - Normalized data with selected activities only">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleDownloadCSV}
                      startIcon={<TableChartIcon />}
                    >
                      Download CSV
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Download as JSON - Structured data with selected activities only">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleDownloadJSON}
                      startIcon={<CodeIcon />}
                    >
                      Download JSON
                    </Button>
                  </Tooltip>
                </Box>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>CSV Format:</strong> Normalized table with columns: Year, Research Activity Title, Research Activity Practice Percent, Step, Subcomponent Title, Subcomponent Year %, Subcomponent Frequency %, Subcomponent Time %, Role(s)<br/>
                    <strong>JSON Format:</strong> Structured data with the same information in JSON format.
                  </Typography>
                </Alert>
              </AccordionDetails>
            </Accordion>

            {/* Export Metadata */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Export Details:</strong> Business: {businessName} | Year: {year} | 
                Generated: {new Date().toLocaleString()}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QRAExportPanel;
