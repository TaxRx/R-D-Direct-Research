import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Typography,
  Card,
  CardContent,
  CardActions,
  Fab,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { QRAModal } from './QRAModal/QRAModal';
import { QRAProgressBar, getQRAColor } from './ProgressBars/QRAProgressBar';
import { useQRAManagement } from '../../hooks/useQRAManagement';

// Types
interface QRAManagerProps {
  businessId: string;
  year: string;
  businesses: any[];
  setBusinesses: (updater: (prev: any[]) => any[]) => void;
  activities: Array<{
    activity: string;
    focus: string;
    rows: any[];
  }>;
  csvRows: any[];
  roles: RoleNode[];
}

interface RoleNode {
  id: string;
  name: string;
  color: string;
  children: RoleNode[];
  participatesInRD: boolean;
}

export const QRAManager: React.FC<QRAManagerProps> = ({
  businessId,
  year,
  businesses,
  setBusinesses,
  activities,
  csvRows,
  roles
}) => {
  
  // QRA Management Hook
  const {
    addedQRAs,
    nonRDTime,
    qraPercentages,
    appliedPercentages,
    handleAddQRA,
    handleRemoveQRA,
    handleNonRDTimeChange,
    getQRAModalData,
    saveQRAModalData
  } = useQRAManagement({
    businessId,
    year,
    businesses,
    setBusinesses
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  
  // Non-R&D Dialog State
  const [nonRDDialogOpen, setNonRDDialogOpen] = useState(false);
  const [nonRDInput, setNonRDInput] = useState(nonRDTime);

  // Handlers
  const handleEditSubcomponents = useCallback((activity: string) => {
    setSelectedActivity(activity);
    setModalOpen(true);
  }, []);

  const handleModalComplete = useCallback((data: any) => {
    if (selectedActivity) {
      saveQRAModalData(selectedActivity, data);
    }
    setModalOpen(false);
    setSelectedActivity('');
  }, [selectedActivity, saveQRAModalData]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedActivity('');
  }, []);

  const handleNonRDDialogOpen = useCallback(() => {
    setNonRDInput(nonRDTime);
    setNonRDDialogOpen(true);
  }, [nonRDTime]);

  const handleNonRDDialogClose = useCallback(() => {
    setNonRDDialogOpen(false);
  }, []);

  const handleNonRDSave = useCallback(() => {
    handleNonRDTimeChange(nonRDInput);
    setNonRDDialogOpen(false);
  }, [nonRDInput, handleNonRDTimeChange]);

  // Prepare progress bar data
  const practiceActivities = addedQRAs.map((activity: string, idx: number) => ({
    name: activity,
    focus: activities.find(a => a.activity === activity)?.focus || '',
    percentage: qraPercentages[activity]?.value || 0,
    color: getQRAColor(idx)
  }));

  const appliedActivities = addedQRAs.map((activity: string, idx: number) => ({
    name: activity,
    focus: activities.find(a => a.activity === activity)?.focus || '',
    percentage: appliedPercentages[activity] || 0,
    color: getQRAColor(idx)
  }));

  // Render Activity Cards
  const renderActivityCards = () => {
    return activities.map((item, idx) => {
      const { activity, focus, rows } = item;
      const isAdded = addedQRAs.includes(activity);
      
      return (
        <Card
          key={`${activity}-${idx}`}
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: 2,
            borderTop: isAdded ? `6px solid ${getQRAColor(idx)}` : '6px solid #e0e0e0',
            transition: 'all 0.3s ease'
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {activity}{focus ? ` (${focus})` : ''}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Category/Area/Focus chips */}
                {Array.from(new Set(rows.map(r => r.Category))).map(cat => (
                  <Chip key={`cat-${cat}`} label={cat} color="primary" size="small" />
                ))}
                {Array.from(new Set(rows.map(r => r.Area))).map(area => (
                  <Chip key={`area-${area}`} label={area} color="success" size="small" />
                ))}
                {Array.from(new Set(rows.map(r => r.Focus))).map(focus => (
                  <Chip key={`focus-${focus}`} label={focus} color="secondary" size="small" />
                ))}
              </Box>
            </Box>

            {isAdded && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Practice %: {qraPercentages[activity]?.value?.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Applied %: {appliedPercentages[activity]?.toFixed(1) || 0}%
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justify: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => handleEditSubcomponents(activity)}
                    size="small"
                  >
                    Configure Subcomponents
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'flex-end' }}>
            {isAdded ? (
              <Tooltip title="Remove from QRA">
                <IconButton 
                  color="error" 
                  onClick={() => handleRemoveQRA(activity)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Add to QRA">
                <Fab 
                  color="primary" 
                  size="small" 
                  onClick={() => handleAddQRA(activity)}
                >
                  <AddIcon />
                </Fab>
              </Tooltip>
            )}
          </CardActions>
        </Card>
      );
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        QRA Management
      </Typography>

      {/* Progress Bars */}
      <Box sx={{ mb: 4 }}>
        <QRAProgressBar
          title="Practice Percentage"
          nonRDTime={nonRDTime}
          activities={practiceActivities}
          showNonRDEdit
          onNonRDEdit={handleNonRDDialogOpen}
          variant="practice"
        />
        
        <QRAProgressBar
          title="Applied Percentage"
          nonRDTime={nonRDTime}
          activities={appliedActivities}
          variant="applied"
          sticky
        />
      </Box>

      {/* Activity Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Research Activities
        </Typography>
        {renderActivityCards()}
      </Box>

      {/* QRA Modal */}
      <QRAModal
        open={modalOpen}
        onClose={handleModalClose}
        onComplete={handleModalComplete}
        activity={selectedActivity}
        csvRows={csvRows}
        currentYear={parseInt(year)}
        roles={roles}
        initialData={selectedActivity ? getQRAModalData(selectedActivity) : undefined}
      />

      {/* Non-R&D Time Dialog */}
      <Dialog open={nonRDDialogOpen} onClose={handleNonRDDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Set Non R&D Time</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Non R&D Time (%)"
            type="number"
            value={nonRDInput}
            onChange={e => setNonRDInput(Math.max(0, Math.min(100, Number(e.target.value))))}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{ min: 0, max: 100, step: 1 }}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Percentage of time not spent on R&D activities
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNonRDDialogClose}>Cancel</Button>
          <Button onClick={handleNonRDSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 