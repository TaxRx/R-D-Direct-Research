import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Slider,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Collapse,
  Divider,
  Alert
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { Employee } from '../../../types/Employee';
import { Role } from '../../../types/Business';
import { getRoleName } from '../../../pages/QRABuilderTabs/RDExpensesTab/utils/roleHelpers';
import { NON_RD_ROLE, OTHER_ROLE } from '../../../types/Employee';

interface EmployeeConfigureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  employee: Employee | null;
  roles: Role[];
  employeePracticePercentages: Record<string, number>;
  employeeTimePercentages: Record<string, Record<string, number>>;
  onPracticePercentageChange: (activityName: string, percentage: number) => void;
  onTimePercentageChange: (activityName: string, subcomponentId: string, percentage: number) => void;
  getEmployeeActivities: (employee: Employee) => any[];
  calculateActivityAppliedPercentage: (activity: any, practicePercentages?: Record<string, number>, timePercentages?: Record<string, Record<string, number>>) => number;
  calculateEmployeeAppliedPercentage: (employee: Employee, activities: any[], practicePercentages: Record<string, number>, timePercentages: Record<string, Record<string, number>>) => number;
  getQRAData: (activityName: string) => any;
  getActivityColor: (activityName: string, allActivities: any[]) => string;
  hasAnyQRAData: () => Promise<boolean>;
  selectedBusinessId: string;
  selectedYear: number;
  onEmployeeUpdate?: (updatedEmployee: Employee) => void;
}

export const EmployeeConfigureModal: React.FC<EmployeeConfigureModalProps> = ({
  open,
  onClose,
  onSave,
  employee,
  roles,
  employeePracticePercentages,
  employeeTimePercentages,
  onPracticePercentageChange,
  onTimePercentageChange,
  getEmployeeActivities,
  calculateActivityAppliedPercentage,
  calculateEmployeeAppliedPercentage,
  getQRAData,
  getActivityColor,
  hasAnyQRAData,
  selectedBusinessId,
  selectedYear,
  onEmployeeUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Employee>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasQraData, setHasQraData] = useState<boolean>(false);

  // Initialize edit data when modal opens
  React.useEffect(() => {
    if (open && employee) {
      setEditData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        wage: employee.wage,
        roleId: employee.roleId,
        customRoleName: employee.customRoleName,
        isBusinessOwner: employee.isBusinessOwner
      });
      setValidationErrors({});
      
      // Check if QRA data exists
      hasAnyQRAData().then(setHasQraData).catch(() => setHasQraData(false));
    }
  }, [open, employee, hasAnyQRAData]);

  if (!employee) return null;

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setEditData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        wage: employee.wage,
        roleId: employee.roleId,
        customRoleName: employee.customRoleName,
        isBusinessOwner: employee.isBusinessOwner
      });
      setValidationErrors({});
    }
    setIsEditing(!isEditing);
  };

  const validateEditData = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!editData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!editData.wage || editData.wage <= 0) {
      errors.wage = 'Wage must be greater than 0';
    }

    if (!editData.roleId) {
      errors.roleId = 'Role is required';
    }

    if (editData.roleId === 'other' && !editData.customRoleName?.trim()) {
      errors.customRoleName = 'Custom role name is required when "Other" is selected';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = () => {
    if (!validateEditData()) return;

    const updatedEmployee: Employee = {
      ...employee,
      ...editData,
      updatedAt: new Date().toISOString()
    };

    if (onEmployeeUpdate) {
      onEmployeeUpdate(updatedEmployee);
    }

    setIsEditing(false);
    setValidationErrors({});
  };

  const handleInputChange = (field: keyof Employee, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
        <Box sx={{ pr: 6 }}>
          <Typography variant="h5" component="div">
            Configure Applied Percentage
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {employee.firstName} {employee.lastName} - {getRoleName(employee.roleId, employee.customRoleName, roles, NON_RD_ROLE, OTHER_ROLE)}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
          {/* Editable Employee Information Section */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Employee Information
              </Typography>
              <Button
                startIcon={isEditing ? <ExpandLessIcon /> : <EditIcon />}
                onClick={handleEditToggle}
                variant={isEditing ? "contained" : "outlined"}
                size="small"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Info'}
              </Button>
            </Box>

            <Collapse in={isEditing}>
              <Card sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="First Name"
                    value={editData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    error={!!validationErrors.firstName}
                    helperText={validationErrors.firstName}
                    fullWidth
                  />
                  <TextField
                    label="Last Name"
                    value={editData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    error={!!validationErrors.lastName}
                    helperText={validationErrors.lastName}
                    fullWidth
                  />
                  <TextField
                    label="Wage"
                    type="number"
                    value={editData.wage || ''}
                    onChange={(e) => handleInputChange('wage', parseFloat(e.target.value) || 0)}
                    error={!!validationErrors.wage}
                    helperText={validationErrors.wage}
                    fullWidth
                    InputProps={{
                      startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                    }}
                  />
                  <FormControl fullWidth error={!!validationErrors.roleId}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={editData.roleId || ''}
                      onChange={(e) => handleInputChange('roleId', e.target.value)}
                      label="Role"
                    >
                      {roles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name}
                        </MenuItem>
                      ))}
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  {editData.roleId === 'other' && (
                    <TextField
                      label="Custom Role Name"
                      value={editData.customRoleName || ''}
                      onChange={(e) => handleInputChange('customRoleName', e.target.value)}
                      error={!!validationErrors.customRoleName}
                      helperText={validationErrors.customRoleName}
                      fullWidth
                    />
                  )}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editData.isBusinessOwner || false}
                        onChange={(e) => handleInputChange('isBusinessOwner', e.target.checked)}
                      />
                    }
                    label="Business Owner"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                  <Button variant="outlined" onClick={handleEditToggle}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                </Box>
              </Card>
            </Collapse>

            {/* Read-only summary when not editing */}
            <Collapse in={!isEditing}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Wage</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    ${employee.wage.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Role</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {getRoleName(employee.roleId, employee.customRoleName, roles, NON_RD_ROLE, OTHER_ROLE)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Owner Status</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {employee.isBusinessOwner ? 'Owner' : 'Employee'}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* Practice Percentage Breakdown */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              Practice Percentage Breakdown
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Practice Distribution
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {(() => {
                    const activities = getEmployeeActivities(employee);
                    const totalPractice = activities.reduce((sum, activity) => {
                      return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                    }, 0);
                    const isOverLimit = totalPractice > 100;
                    
                    return (
                      <>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: isOverLimit ? 'error.main' : totalPractice === 100 ? 'success.main' : 'text.primary'
                          }}
                        >
                          {totalPractice.toFixed(1)}% Total
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({activities.length} Activities)
                        </Typography>
                      </>
                    );
                  })()}
                </Box>
              </Box>
              
              {(() => {
                const activities = getEmployeeActivities(employee);
                const totalPractice = activities.reduce((sum, activity) => {
                  return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                }, 0);
                
                if (totalPractice > 100) {
                  return (
                    <Box sx={{ 
                      mb: 2, 
                      p: 1.5, 
                      bgcolor: 'error.light', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'error.main'
                    }}>
                      <Typography variant="caption" sx={{ color: 'error.dark', fontWeight: 600 }}>
                        ⚠️ Total exceeds 100% by {(totalPractice - 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'error.dark', display: 'block' }}>
                        Adjust practice percentages to total 100% or less.
                      </Typography>
                    </Box>
                  );
                }
                return null;
              })()}
              
              {/* Practice Percentage Progress Bar */}
              <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 2 }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%',
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  {(() => {
                    const activities = getEmployeeActivities(employee);
                    const totalPractice = activities.reduce((sum, activity) => {
                      return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                    }, 0);
                    
                    let currentLeft = 0;
                    
                    return activities.map((activity, idx) => {
                      const percentage = employeePracticePercentages[activity.name] || activity.currentPracticePercent;
                      // Calculate proportional width - each activity's share of the total bar (100%)
                      const width = percentage;
                      const color = getActivityColor(activity.name, getEmployeeActivities(employee));
                      
                      if (percentage <= 0) return null;
                      
                      const segment = (
                        <Box
                          key={activity.name}
                          sx={{
                            position: 'absolute',
                            left: `${currentLeft}%`,
                            width: `${width}%`,
                            height: '100%',
                            bgcolor: color,
                            borderRight: currentLeft + width < Math.min(totalPractice, 100) ? '1px solid white' : 'none'
                          }}
                        />
                      );
                      
                      currentLeft += width;
                      return segment;
                    });
                  })()}
                  
                  {/* Non-R&D Section */}
                  {(() => {
                    const activities = getEmployeeActivities(employee);
                    const totalPractice = activities.reduce((sum, activity) => {
                      return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                    }, 0);
                    const nonRDPercent = Math.max(0, 100 - totalPractice);
                    
                    if (nonRDPercent > 0) {
                      return (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: `${Math.min(totalPractice, 100)}%`,
                            width: `${nonRDPercent}%`,
                            height: '100%',
                            bgcolor: 'grey.400',
                            borderLeft: totalPractice > 0 ? '1px solid white' : 'none'
                          }}
                        />
                      );
                    }
                    return null;
                  })()}
                </Box>
                
                {/* Border overlay with overflow indicator */}
                {(() => {
                  const activities = getEmployeeActivities(employee);
                  const totalPractice = activities.reduce((sum, activity) => {
                    return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                  }, 0);
                  const isOverLimit = totalPractice > 100;
                  
                  return (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%',
                      border: '2px solid',
                      borderColor: isOverLimit ? 'error.main' : 'divider',
                      borderRadius: 1,
                      pointerEvents: 'none',
                      ...(isOverLimit && {
                        boxShadow: '0 0 0 2px rgba(211, 47, 47, 0.2)'
                      })
                    }} />
                  );
                })()}
              </Box>
              
              {/* Practice Percentage Labels */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                {getEmployeeActivities(employee).map((activity, idx) => (
                  <Box key={activity.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: getActivityColor(activity.name, getEmployeeActivities(employee)),
                        borderRadius: '50%'
                      }}
                    />
                    <Typography variant="caption">
                      {activity.name}: {(employeePracticePercentages[activity.name] || activity.currentPracticePercent).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
                {(() => {
                  const activities = getEmployeeActivities(employee);
                  const totalPractice = activities.reduce((sum, activity) => {
                    return sum + (employeePracticePercentages[activity.name] || activity.currentPracticePercent);
                  }, 0);
                  const nonRDPercent = Math.max(0, 100 - totalPractice);
                  if (nonRDPercent > 0) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: 'grey.400',
                            borderRadius: '50%'
                          }}
                        />
                        <Typography variant="caption">
                          Non-R&D: {nonRDPercent.toFixed(1)}%
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                })()}
              </Box>
            </Box>
          </Box>

          {/* Applied Percentage Breakdown */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Applied Percentage Breakdown
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {(() => {
                  // REAL-TIME CALCULATION: Use the actual calculation function to get live updates including time percentages
                  const appliedPercentage = calculateEmployeeAppliedPercentage(
                    employee, 
                    getEmployeeActivities(employee),
                    employeePracticePercentages,
                    employeeTimePercentages
                  );
                  
                  return appliedPercentage.toFixed(1);
                })()}%
              </Typography>
            </Box>

            {/* Applied Percentage Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Applied Distribution by Activity
                </Typography>
                <Chip 
                  label={`${getEmployeeActivities(employee).length} Activities`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Box>
              
              <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%',
                  bgcolor: 'grey.100'
                }}>
                  {(() => {
                    const activities = getEmployeeActivities(employee);
                    let currentLeft = 0;
                    
                    // Calculate individual contributions using the full QRA formula
                    const activityContributions = activities.map(activity => {
                      const contributedApplied = calculateActivityAppliedPercentage(
                        activity,
                        employeePracticePercentages,
                        employeeTimePercentages
                      );
                      return { activity, contributedApplied };
                    });
                    
                    const totalApplied = activityContributions.reduce((total, item) => total + item.contributedApplied, 0);
                    
                    return activityContributions.map((item, idx) => {
                      const { activity, contributedApplied } = item;
                      const width = totalApplied > 0 ? (contributedApplied / totalApplied) * 100 : 0;
                      const activityColor = getActivityColor(activity.name, activities);
                      
                      if (width <= 0) return null;
                      
                      const segment = (
                        <Box
                          key={activity.name}
                          sx={{
                            position: 'absolute',
                            left: `${currentLeft}%`,
                            width: `${width}%`,
                            height: '100%',
                            backgroundColor: activityColor,
                            borderRight: currentLeft + width < 100 ? '2px solid white' : 'none',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              filter: 'brightness(1.1)'
                            }
                          }}
                          title={`${activity.name}: ${contributedApplied.toFixed(1)}%`}
                        />
                      );
                      
                      currentLeft += width;
                      return segment;
                    });
                  })()}
                </Box>
              </Box>
              
              {/* Applied Percentage Labels */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {(() => {
                  const activities = getEmployeeActivities(employee);
                  
                  // Calculate contributions using the full QRA formula
                  return activities.map((activity, idx) => {
                    const contributedApplied = calculateActivityAppliedPercentage(
                      activity,
                      employeePracticePercentages,
                      employeeTimePercentages
                    );
                    
                    if (contributedApplied <= 0) return null;
                    
                    const activityColor = getActivityColor(activity.name, activities);
                  
                    return (
                      <Chip
                        key={activity.name}
                        label={`${activity.name}: ${contributedApplied.toFixed(1)}%`}
                        size="small"
                        sx={{
                          bgcolor: activityColor + '20', // 20% opacity
                          color: activityColor,
                          border: `1px solid ${activityColor}`,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    );
                  });
                })()}
              </Box>
            </Box>
          </Box>

          {/* Activities and Subcomponents Configuration */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Activity Configuration
              </Typography>
              
              {getEmployeeActivities(employee).map((activity, activityIdx) => {
                const qraData = getQRAData(activity.name);
                const subcomponents = qraData?.selectedSubcomponents || {};
                const rdSubcomponents = Object.entries(subcomponents).filter(([_, sub]) => sub && !(sub as any).isNonRD);
                
                return (
                  <Card key={activity.name} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {activity.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Applied Percentage: {calculateActivityAppliedPercentage(
                          activity,
                          employeePracticePercentages,
                          employeeTimePercentages
                        ).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2 }}>
                      {/* Practice Percentage Slider */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                          Practice Percentage
                        </Typography>
                        <Slider
                          value={employeePracticePercentages[activity.name] !== undefined 
                            ? employeePracticePercentages[activity.name] 
                            : activity.currentPracticePercent}
                          onChange={(_, value) => {
                            const newValue = value as number;
                            
                            // Calculate what the total would be with this change
                            const activities = getEmployeeActivities(employee);
                            const otherActivitiesTotal = activities.reduce((sum, act) => {
                              if (act.name === activity.name) return sum;
                              return sum + (employeePracticePercentages[act.name] !== undefined 
                                ? employeePracticePercentages[act.name] 
                                : act.currentPracticePercent);
                            }, 0);
                            
                            // Prevent exceeding 100% total practice percentage
                            const maxAllowed = 100 - otherActivitiesTotal;
                            const constrainedValue = Math.min(newValue, maxAllowed);
                            
                            if (constrainedValue !== newValue) {
                              console.warn(`Practice percentage for ${activity.name} limited to ${constrainedValue}% to stay within 100% total`);
                            }
                            
                            onPracticePercentageChange(activity.name, constrainedValue);
                          }}
                          min={0}
                          max={100}
                          step={0.1}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                          sx={{ 
                            mt: 1,
                            '& .MuiSlider-track': {
                              background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                            },
                            '& .MuiSlider-thumb': {
                              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                            }
                          }}
                        />
                      </Box>

                      {/* Subcomponents Section */}
                      {rdSubcomponents.length > 0 ? (
                        <Box>
                          <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                            Subcomponents ({rdSubcomponents.length})
                          </Typography>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Research Activity
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {activity.name}
                              </Typography>
                            </Box>
                            
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Subcomponents
                              </Typography>
                              
                              {/* Subcomponent List with Time% Sliders */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {rdSubcomponents.map(([subId, subConfig]) => (
                                  <Box key={subId} sx={{ 
                                    p: 2, 
                                    border: '1px solid', 
                                    borderColor: 'divider', 
                                    borderRadius: 1,
                                    bgcolor: 'background.paper'
                                  }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                      {(subConfig as any).subcomponent}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                      Step: {(subConfig as any).step} | Phase: {(subConfig as any).phase}
                                    </Typography>
                                    
                                    {/* Time Percentage Slider */}
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="caption" color="text.secondary" gutterBottom>
                                        Time % (Currently: {(employeeTimePercentages[activity.name]?.[subId] || (subConfig as any).timePercent || 0).toFixed(1)}%)
                                      </Typography>
                                      <Slider
                                        value={employeeTimePercentages[activity.name]?.[subId] || (subConfig as any).timePercent || 0}
                                        onChange={(_, value) => {
                                          onTimePercentageChange(activity.name, subId, value as number);
                                        }}
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                                        size="small"
                                        sx={{ mt: 1 }}
                                      />
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          bgcolor: 'grey.50', 
                          borderRadius: 1,
                          border: '1px dashed',
                          borderColor: 'grey.300'
                        }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            No QRA subcomponents found for "{activity.name}"
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {hasQraData 
                              ? `QRA data exists for this business/year, but not for this specific activity.`
                              : `No QRA data found for ${selectedYear}. Configure subcomponents in the Activities tab first.`
                            }
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>
                );
              })}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 