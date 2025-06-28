import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Storage as StorageIcon,
  Storage as DatabaseIcon
} from '@mui/icons-material';
import { SupabaseMigrationService, MigrationResult } from '../services/supabaseMigrationService';

interface MigrationStatus {
  hasLocalData: boolean;
  hasSupabaseData: boolean;
  localDataCount: number;
  supabaseDataCount: number;
}

export const SupabaseMigrationPanel: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const status = await SupabaseMigrationService.checkMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const handleStartMigration = async () => {
    setIsMigrating(true);
    setActiveStep(0);
    
    try {
      const result = await SupabaseMigrationService.migrateAllData();
      setMigrationResult(result);
      
      if (result.success) {
        setActiveStep(3); // Success step
        // Refresh status after successful migration
        await checkMigrationStatus();
      } else {
        setActiveStep(4); // Error step
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationResult({
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setActiveStep(4);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearLocalStorage = () => {
    SupabaseMigrationService.clearLocalStorageData();
    setShowConfirmDialog(false);
    checkMigrationStatus();
  };

  const getMigrationRecommendation = () => {
    if (!migrationStatus) return null;

    if (migrationStatus.hasLocalData && !migrationStatus.hasSupabaseData) {
      return {
        type: 'warning' as const,
        message: 'You have local data that should be migrated to Supabase for persistence.',
        action: 'Migrate Now'
      };
    }

    if (migrationStatus.hasLocalData && migrationStatus.hasSupabaseData) {
      return {
        type: 'info' as const,
        message: 'You have both local and Supabase data. Consider clearing local data after verifying migration.',
        action: 'Clear Local Data'
      };
    }

    if (!migrationStatus.hasLocalData && migrationStatus.hasSupabaseData) {
      return {
        type: 'success' as const,
        message: 'All data is successfully stored in Supabase.',
        action: null
      };
    }

    return {
      type: 'info' as const,
      message: 'No data found. Start by creating some data in the application.',
      action: null
    };
  };

  const recommendation = getMigrationRecommendation();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Supabase Migration Panel
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Migration to Supabase
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This will migrate all QRE data from localStorage to Supabase, creating a normalized database structure.
            Each row will represent one employee/contractor/supply participation in one subcomponent.
          </Typography>

          {migrationStatus && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Data Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  icon={<StorageIcon />}
                  label={`Local: ${migrationStatus.localDataCount} items`}
                  color={migrationStatus.hasLocalData ? 'warning' : 'default'}
                  variant={migrationStatus.hasLocalData ? 'filled' : 'outlined'}
                />
                <Chip
                  icon={<DatabaseIcon />}
                  label={`Supabase: ${migrationStatus.supabaseDataCount} records`}
                  color={migrationStatus.hasSupabaseData ? 'success' : 'default'}
                  variant={migrationStatus.hasSupabaseData ? 'filled' : 'outlined'}
                />
              </Box>
            </Box>
          )}

          {recommendation && (
            <Alert severity={recommendation.type} sx={{ mb: 3 }}>
              <Typography variant="body2">
                {recommendation.message}
              </Typography>
            </Alert>
          )}

          {migrationStatus?.hasLocalData && !migrationStatus?.hasSupabaseData && (
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                startIcon={isMigrating ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                onClick={() => setShowConfirmDialog(true)}
                disabled={isMigrating}
                fullWidth
              >
                {isMigrating ? 'Migrating...' : 'Migrate to Supabase'}
              </Button>
            </Box>
          )}

          {migrationStatus?.hasLocalData && migrationStatus?.hasSupabaseData && (
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setShowConfirmDialog(true)}
                fullWidth
              >
                Clear Local Storage Data
              </Button>
            </Box>
          )}

          {migrationResult && (
            <Box sx={{ mt: 3 }}>
              <Alert 
                severity={migrationResult.success ? 'success' : 'error'}
                icon={migrationResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
              >
                <Typography variant="body2" fontWeight="bold">
                  {migrationResult.message}
                </Typography>
                {migrationResult.details && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" component="div">
                      Migration Details:
                    </Typography>
                    <List dense>
                      {Object.entries(migrationResult.details).map(([key, value]: [string, any]) => (
                        <ListItem key={key} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            {value.migrated > 0 ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                          </ListItemIcon>
                          <ListItemText
                            primary={`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.migrated} migrated, ${value.errors} errors`}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
        <Step>
          <StepLabel>Check Data Status</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              Analyzing local storage and Supabase data...
            </Typography>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>Migrate Clients</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              Migrating client data to Supabase...
            </Typography>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>Migrate Businesses & QRA Data</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              Migrating businesses, research activities, and QRA data...
            </Typography>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>Migration Complete</StepLabel>
          <StepContent>
            <Typography variant="body2" color="success.main">
              All data successfully migrated to Supabase!
            </Typography>
          </StepContent>
        </Step>
        <Step>
          <StepLabel>Migration Failed</StepLabel>
          <StepContent>
            <Typography variant="body2" color="error.main">
              Some errors occurred during migration. Check the details above.
            </Typography>
          </StepContent>
        </Step>
      </Stepper>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>
          {migrationStatus?.hasSupabaseData ? 'Clear Local Data' : 'Migrate to Supabase'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {migrationStatus?.hasSupabaseData 
              ? 'This will permanently delete all local storage data. Make sure your Supabase data is complete before proceeding.'
              : 'This will migrate all your local data to Supabase for persistent storage. This process cannot be undone.'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={migrationStatus?.hasSupabaseData ? handleClearLocalStorage : handleStartMigration}
            variant="contained"
            color={migrationStatus?.hasSupabaseData ? 'warning' : 'primary'}
          >
            {migrationStatus?.hasSupabaseData ? 'Clear Data' : 'Start Migration'}
          </Button>
        </DialogActions>
      </Dialog>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Database Schema Overview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The migration creates the following normalized structure:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemText 
                primary="qre_allocations (Main Table)"
                secondary="One row per employee/contractor/supply per subcomponent with all percentage data"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="research_activities"
                secondary="Research activities with practice percentages"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="steps"
                secondary="Steps within research activities"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="subcomponents"
                secondary="Subcomponents with year%, frequency%, time%"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="employees, contractors, supplies"
                secondary="Entity data with wages/amounts"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="roles"
                secondary="Employee and contractor roles"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}; 