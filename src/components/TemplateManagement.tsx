import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Box,
  Tooltip,
  Alert,
  Snackbar,
  Chip,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import ApplyIcon from '@mui/icons-material/PlayArrow';
import { UnifiedTemplateService, UnifiedTemplateData } from '../services/templateService';
import { RoleNode } from '../types/Business';

interface UnifiedTemplateManagementProps {
  currentYear: number;
  businessId: string;
  getCurrentActivitiesData: () => any;
  getCurrentRolesData: () => RoleNode[];
  getCurrentQRAData: () => Record<string, any>;
  onTemplateApplied: (template: UnifiedTemplateData) => void;
  updateActivities: (data: any) => void;
  updateRoles: (roles: RoleNode[]) => void;
  updateQRAData: (data: Record<string, any>) => void;
}

export const UnifiedTemplateManagement: React.FC<UnifiedTemplateManagementProps> = ({
  currentYear,
  businessId,
  getCurrentActivitiesData,
  getCurrentRolesData,
  getCurrentQRAData,
  onTemplateApplied,
  updateActivities,
  updateRoles,
  updateQRAData
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [templates, setTemplates] = useState<UnifiedTemplateData[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadTemplates = useCallback(() => {
    const loadedTemplates = UnifiedTemplateService.getTemplates();
    setTemplates(loadedTemplates);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setNotification({
        open: true,
        message: 'Please enter a template name',
        severity: 'error'
      });
      return;
    }

    try {
      UnifiedTemplateService.saveTemplate(
        businessId,
        currentYear,
        templateName.trim(),
        getCurrentActivitiesData,
        getCurrentRolesData,
        getCurrentQRAData
      );

      setNotification({
        open: true,
        message: `Template "${templateName}" saved successfully!`,
        severity: 'success'
      });

      setTemplateName('');
      setSaveDialogOpen(false);
      loadTemplates();
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to save template: ${error}`,
        severity: 'error'
      });
    }
  };

  const handleApplyTemplate = async (template: UnifiedTemplateData) => {
    try {
      await UnifiedTemplateService.applyTemplate(
        template.templateName,
        businessId,
        currentYear,
        updateActivities,
        updateRoles,
        updateQRAData
      );

      setNotification({
        open: true,
        message: `Template "${template.templateName}" applied successfully! Activities, roles, and QRA data have been updated.`,
        severity: 'success'
      });

      onTemplateApplied(template);
      handleMenuClose();
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to apply template: ${error}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteTemplate = (templateNameToDelete: string) => {
    try {
      UnifiedTemplateService.deleteTemplate(templateNameToDelete);
      
      setNotification({
        open: true,
        message: `Template "${templateNameToDelete}" deleted successfully!`,
        severity: 'success'
      });

      loadTemplates();
    } catch (error) {
      setNotification({
        open: true,
        message: `Failed to delete template: ${error}`,
        severity: 'error'
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Tooltip title="Template Management">
        <IconButton
          onClick={handleMenuClick}
          size="small"
          sx={{ ml: 1 }}
        >
          <FolderIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            R&D Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Save and apply complete R&D configurations including activities, roles, and QRA data.
          </Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            sx={{ mt: 1 }}
            size="small"
          >
            Save Current Setup
          </Button>
        </Box>

        {templates.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No templates saved yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {templates.map((template) => (
              <ListItem key={template.templateName} divider>
                <ListItemIcon>
                  <FolderIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {template.templateName}
                      </Typography>
                      <Chip 
                        label={`${template.donorYear}`} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </Box>
                  }
                  secondary={
                    <span>
                      <Typography variant="caption" display="block">
                        {formatDate(template.timestamp)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.activities.length} activities • {template.roles.length} roles
                      </Typography>
                    </span>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Apply Template">
                      <IconButton
                        size="small"
                        onClick={() => handleApplyTemplate(template)}
                        color="primary"
                      >
                        <ApplyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Template">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTemplate(template.templateName)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Menu>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save R&D Template</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will save your current activities, roles, QRA configurations, and practice percentages as a reusable template.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            type="text"
            fullWidth
            variant="outlined"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., 'Software Development 2024' or 'Manufacturing Setup'"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}; 