import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { QRABuilderMigrationService, MigrationResult } from '../services/qrabuilderMigrationService';

interface QRABuilderMigrationPanelProps {
  businessId: string;
  year: number;
  onMigrationComplete?: (result: MigrationResult) => void;
}

interface ValidationResult {
  success: boolean;
  discrepancies: string[];
  localStorageCount: number;
  supabaseCount: number;
}

export const QRABuilderMigrationPanel: React.FC<QRABuilderMigrationPanelProps> = ({
  businessId,
  year,
  onMigrationComplete
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleStartMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await QRABuilderMigrationService.migrateAllData(businessId, year);
      setMigrationResult(result);
      
      if (onMigrationComplete) {
        onMigrationComplete(result);
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        migrated: { qraData: 0, employeeConfigs: 0, contractorConfigs: 0, supplyConfigs: 0, researchSelections: 0 },
        errors: [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleValidateMigration = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await QRABuilderMigrationService.validateMigration(businessId, year);
      setValidationResult(result);
      setShowValidationDialog(true);
    } catch (error) {
      setValidationResult({
        success: false,
        discrepancies: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        localStorageCount: 0,
        supabaseCount: 0
      });
      setShowValidationDialog(true);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCleanupLocalStorage = async () => {
    if (!migrationResult?.success) {
      alert('Cannot clean up localStorage until migration is successful');
      return;
    }

    setIsCleaningUp(true);

    try {
      const result = await QRABuilderMigrationService.cleanupLocalStorage(businessId, year);
      
      if (result.success) {
        alert(`Successfully cleaned up ${result.cleaned} localStorage keys`);
      } else {
        alert(`Cleanup completed with errors: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      alert(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const getMigrationStatusIcon = () => {
    if (!migrationResult) return <InfoIcon color="info" />;
    if (migrationResult.success) return <CheckIcon color="success" />;
    return <ErrorIcon color="error" />;
  };

  const getMigrationStatusColor = () => {
    if (!migrationResult) return 'info';
    if (migrationResult.success) return 'success';
    return 'error';
  };

  const getTotalMigrated = () => {
    if (!migrationResult) return 0;
    return Object.values(migrationResult.migrated).reduce((sum, count) => sum + count, 0);
  };

  const getTotalErrors = () => {
    return migrationResult?.errors.length || 0;
  };

  const getTotalWarnings = () => {
    return migrationResult?.warnings.length || 0;
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title="QRABuilder Data Migration"
        subheader={`Migrate data from localStorage to Supabase for Business ${businessId}, Year ${year}`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Validate Migration">
              <IconButton 
                onClick={handleValidateMigration}
                disabled={isValidating || !migrationResult}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {migrationResult?.success && (
              <Tooltip title="Clean up localStorage">
                <IconButton 
                  onClick={handleCleanupLocalStorage}
                  disabled={isCleaningUp}
                  color="warning"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      />
      
      <CardContent>
        {/* Migration Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {getMigrationStatusIcon()}
          <Typography variant="h6" color={getMigrationStatusColor()}>
            {!migrationResult ? 'Ready to Migrate' :
             migrationResult.success ? 'Migration Successful' : 'Migration Failed'}
          </Typography>
        </Box>

        {/* Progress Bar */}
        {isMigrating && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Migrating data to Supabase...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Migration Results */}
        {migrationResult && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Migration Results
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip 
                icon={<CheckIcon />} 
                label={`${getTotalMigrated()} Items Migrated`} 
                color="success" 
                variant="outlined"
              />
              {getTotalErrors() > 0 && (
                <Chip 
                  icon={<ErrorIcon />} 
                  label={`${getTotalErrors()} Errors`} 
                  color="error" 
                  variant="outlined"
                />
              )}
              {getTotalWarnings() > 0 && (
                <Chip 
                  icon={<WarningIcon />} 
                  label={`${getTotalWarnings()} Warnings`} 
                  color="warning" 
                  variant="outlined"
                />
              )}
            </Box>

            {/* Detailed Results */}
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="QRA Data" 
                  secondary={`${migrationResult.migrated.qraData} activities migrated`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Employee Configurations" 
                  secondary={`${migrationResult.migrated.employeeConfigs} configurations migrated`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Contractor Configurations" 
                  secondary={`${migrationResult.migrated.contractorConfigs} configurations migrated`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Supply Configurations" 
                  secondary={`${migrationResult.migrated.supplyConfigs} configurations migrated`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Research Activity Selections" 
                  secondary={`${migrationResult.migrated.researchSelections} selections migrated`}
                />
              </ListItem>
            </List>

            {/* Errors */}
            {migrationResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Errors ({migrationResult.errors.length}):
                </Typography>
                <List dense>
                  {migrationResult.errors.map((error, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <ErrorIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* Warnings */}
            {migrationResult.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Warnings ({migrationResult.warnings.length}):
                </Typography>
                <List dense>
                  {migrationResult.warnings.map((warning, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningIcon color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleStartMigration}
            disabled={isMigrating}
            color="primary"
          >
            {isMigrating ? 'Migrating...' : 'Start Migration'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleValidateMigration}
            disabled={isValidating || !migrationResult}
          >
            {isValidating ? 'Validating...' : 'Validate Migration'}
          </Button>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            This migration will move all QRABuilder data from localStorage to Supabase. 
            The process includes QRA data, employee/contractor/supply configurations, and research activity selections.
            After successful migration, you can optionally clean up the localStorage data.
          </Typography>
        </Alert>
      </CardContent>

      {/* Validation Dialog */}
      <Dialog 
        open={showValidationDialog} 
        onClose={() => setShowValidationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Migration Validation Results
          <IconButton
            onClick={() => setShowValidationDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {validationResult && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip 
                  icon={validationResult.success ? <CheckIcon /> : <ErrorIcon />}
                  label={validationResult.success ? 'Validation Passed' : 'Validation Failed'}
                  color={validationResult.success ? 'success' : 'error'}
                />
                <Chip 
                  label={`localStorage: ${validationResult.localStorageCount} items`}
                  variant="outlined"
                />
                <Chip 
                  label={`Supabase: ${validationResult.supabaseCount} items`}
                  variant="outlined"
                />
              </Box>

              {validationResult.discrepancies.length > 0 && (
                <Alert severity="error">
                  <Typography variant="subtitle2" gutterBottom>
                    Discrepancies Found:
                  </Typography>
                  <List dense>
                    {validationResult.discrepancies.map((discrepancy: string, index: number) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <ErrorIcon color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={discrepancy} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {validationResult.success && (
                <Alert severity="success">
                  <Typography variant="body2">
                    Migration validation successful! All data has been properly migrated to Supabase.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowValidationDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}; 