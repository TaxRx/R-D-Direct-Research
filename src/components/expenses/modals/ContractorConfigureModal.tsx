import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Slider,
  Card,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';
import { Contractor } from '../../../types/Employee';
import { Role } from '../../../types/Business';
import { getRoleName } from '../../../pages/QRABuilderTabs/RDExpensesTab/utils/roleHelpers';
import { NON_RD_ROLE, OTHER_ROLE } from '../../../types/Employee';
import { formatCurrency } from '../../../utils/currencyFormatting';

interface ContractorConfigureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedContractor: Contractor | null;
  contractorPracticePercentages: Record<string, number>;
  contractorTimePercentages: Record<string, Record<string, number>>;
  setContractorPracticePercentages: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setContractorTimePercentages: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  getContractorActivities: (contractor: Contractor) => any[];
  calculateContractorAppliedPercentage: (contractor: Contractor, activities: any[], practicePercentages: Record<string, number>, timePercentages: Record<string, Record<string, number>>) => number;
  calculateContractorActivityAppliedPercentage: (activity: any, practicePercentages?: Record<string, number>, timePercentages?: Record<string, Record<string, number>>) => number;
  getQRAData: (activityName: string) => any;
  hasAnyQRAData: () => Promise<boolean>;
  getActivityColor: (activityName: string, allActivities: any[]) => string;
  roles: Role[];
  selectedYear: number;
  selectedBusinessId: string;
  onContractorUpdate?: (updatedContractor: Contractor) => void;
}

export default function ContractorConfigureModal({
  open,
  onClose,
  onSave,
  selectedContractor,
  contractorPracticePercentages,
  contractorTimePercentages,
  setContractorPracticePercentages,
  setContractorTimePercentages,
  getContractorActivities,
  calculateContractorAppliedPercentage,
  calculateContractorActivityAppliedPercentage,
  getQRAData,
  hasAnyQRAData,
  getActivityColor,
  roles,
  selectedYear,
  selectedBusinessId,
  onContractorUpdate
}: ContractorConfigureModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contractor>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasQraData, setHasQraData] = useState<boolean>(false);

  // Initialize edit data when modal opens
  React.useEffect(() => {
    if (open && selectedContractor) {
      setEditData({
        contractorType: selectedContractor.contractorType,
        firstName: selectedContractor.firstName,
        lastName: selectedContractor.lastName,
        businessName: selectedContractor.businessName,
        totalAmount: selectedContractor.totalAmount,
        roleId: selectedContractor.roleId,
        customRoleName: selectedContractor.customRoleName
      });
      setValidationErrors({});
      
      // Check if QRA data exists
      hasAnyQRAData().then(setHasQraData).catch(() => setHasQraData(false));
    }
  }, [open, selectedContractor, hasAnyQRAData]);

  if (!selectedContractor) return null;

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setEditData({
        contractorType: selectedContractor.contractorType,
        firstName: selectedContractor.firstName,
        lastName: selectedContractor.lastName,
        businessName: selectedContractor.businessName,
        totalAmount: selectedContractor.totalAmount,
        roleId: selectedContractor.roleId,
        customRoleName: selectedContractor.customRoleName
      });
      setValidationErrors({});
    }
    setIsEditing(!isEditing);
  };

  const validateEditData = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editData.contractorType) {
      errors.contractorType = 'Contractor type is required';
    }

    if (editData.contractorType === 'individual') {
      if (!editData.firstName?.trim()) {
        errors.firstName = 'First name is required for individual contractors';
      }
      if (!editData.lastName?.trim()) {
        errors.lastName = 'Last name is required for individual contractors';
      }
    } else if (editData.contractorType === 'business') {
      if (!editData.businessName?.trim()) {
        errors.businessName = 'Business name is required for business contractors';
      }
    }

    if (!editData.totalAmount || editData.totalAmount <= 0) {
      errors.totalAmount = 'Total amount must be greater than 0';
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

    const updatedContractor: Contractor = {
      ...selectedContractor,
      ...editData,
      updatedAt: new Date().toISOString()
    };

    if (onContractorUpdate) {
      onContractorUpdate(updatedContractor);
    }

    setIsEditing(false);
    setValidationErrors({});
  };

  const handleInputChange = (field: keyof Contractor, value: any) => {
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
            Configure Applied Percentage (Contractor)
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {selectedContractor.contractorType === 'individual' 
              ? `${selectedContractor.firstName} ${selectedContractor.lastName}` 
              : selectedContractor.businessName} - {getRoleName(selectedContractor.roleId, selectedContractor.customRoleName, roles, NON_RD_ROLE, OTHER_ROLE)}
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
          {/* Editable Contractor Information Section */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Contractor Information
              </Typography>
              <Button
                startIcon={<EditIcon />}
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
                  <FormControl fullWidth error={!!validationErrors.contractorType}>
                    <InputLabel>Contractor Type</InputLabel>
                    <Select
                      value={editData.contractorType || ''}
                      onChange={(e) => handleInputChange('contractorType', e.target.value)}
                      label="Contractor Type"
                    >
                      <MenuItem value="individual">Individual</MenuItem>
                      <MenuItem value="business">Business</MenuItem>
                    </Select>
                  </FormControl>

                  {editData.contractorType === 'individual' ? (
                    <>
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
                    </>
                  ) : (
                    <TextField
                      label="Business Name"
                      value={editData.businessName || ''}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      error={!!validationErrors.businessName}
                      helperText={validationErrors.businessName}
                      fullWidth
                    />
                  )}

                  <TextField
                    label="Total Amount"
                    type="number"
                    value={editData.totalAmount || ''}
                    onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                    error={!!validationErrors.totalAmount}
                    helperText={validationErrors.totalAmount}
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
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedContractor.contractorType === 'individual' ? 'Individual' : 'Business'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedContractor.contractorType === 'individual' 
                      ? `${selectedContractor.firstName} ${selectedContractor.lastName}`
                      : selectedContractor.businessName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Amount</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatCurrency(selectedContractor.totalAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Role</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {getRoleName(selectedContractor.roleId, selectedContractor.customRoleName, roles, NON_RD_ROLE, OTHER_ROLE)}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* Practice Percentage Breakdown */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Practice Percentage Breakdown
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {(() => {
                  const activities = getContractorActivities(selectedContractor);
                  const totalPractice = activities.reduce((sum, activity) => {
                    return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                  }, 0);
                  return totalPractice.toFixed(1);
                })()}%
              </Typography>
            </Box>

            {/* Practice Percentage Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Practice Distribution by Activity
                </Typography>
                <Chip 
                  label={`${getContractorActivities(selectedContractor).length} Activities`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Box>
              
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
                    const activities = getContractorActivities(selectedContractor);
                    const totalPractice = activities.reduce((sum, activity) => {
                      return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
                    }, 0);
                    
                    let currentLeft = 0;
                    
                    return activities.map((activity, idx) => {
                      const percentage = contractorPracticePercentages[activity.name] || activity.currentPracticePercent;
                      // Calculate proportional width - each activity's share of the total bar (100%)
                      const width = percentage;
                      const color = getActivityColor(activity.name, getContractorActivities(selectedContractor));
                      
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
                    const activities = getContractorActivities(selectedContractor);
                    const totalPractice = activities.reduce((sum, activity) => {
                      return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
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
                  const activities = getContractorActivities(selectedContractor);
                  const totalPractice = activities.reduce((sum, activity) => {
                    return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
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
                {getContractorActivities(selectedContractor).map((activity, idx) => (
                  <Box key={activity.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: getActivityColor(activity.name, getContractorActivities(selectedContractor)),
                        borderRadius: '50%'
                      }}
                    />
                    <Typography variant="caption">
                      {activity.name}: {(contractorPracticePercentages[activity.name] || activity.currentPracticePercent).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
                {(() => {
                  const activities = getContractorActivities(selectedContractor);
                  const totalPractice = activities.reduce((sum, activity) => {
                    return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
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
                Applied Percentage Breakdown (65% Rule Applied)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {(() => {
                  // REAL-TIME CALCULATION: Use the actual calculation function to get live updates including time percentages
                  const appliedPercentage = calculateContractorAppliedPercentage(
                    selectedContractor, 
                    getContractorActivities(selectedContractor),
                    contractorPracticePercentages,
                    contractorTimePercentages
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
                   label={`${getContractorActivities(selectedContractor).length} Activities`}
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
                     const activities = getContractorActivities(selectedContractor);
                     let currentLeft = 0;
                     
                     // Calculate individual contributions using the full QRA formula
                     const activityContributions = activities.map(activity => {
                       const contributedApplied = calculateContractorActivityAppliedPercentage(activity, contractorPracticePercentages, contractorTimePercentages);
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
                   const activities = getContractorActivities(selectedContractor);
                   
                   // Calculate contributions using the full QRA formula
                   return activities.map((activity, idx) => {
                     const contributedApplied = calculateContractorActivityAppliedPercentage(activity, contractorPracticePercentages, contractorTimePercentages);
                     
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

             {/* Practice Percentage Total Check */}
             <Box sx={{ mb: 2 }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                 <Typography variant="body2" color="text.secondary">
                   Total Practice Distribution
                 </Typography>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   {(() => {
                     const activities = getContractorActivities(selectedContractor);
                     const totalPractice = activities.reduce((sum, activity) => {
                       return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
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
                 const activities = getContractorActivities(selectedContractor);
                 const totalPractice = activities.reduce((sum, activity) => {
                   return sum + (contractorPracticePercentages[activity.name] || activity.currentPracticePercent);
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
             </Box>
           </Box>

          {/* Activities and Subcomponents Configuration */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Activity Configuration
              </Typography>
              
              {getContractorActivities(selectedContractor).map((activity, activityIdx) => {
                const qraData = getQRAData(activity.name);
                const subcomponents = qraData?.selectedSubcomponents || {};
                const rdSubcomponents = Object.entries(subcomponents).filter(([_, sub]) => {
                  const subConfig = sub as any;
                  return subConfig && !subConfig.isNonRD;
                });
                
                return (
                  <Card key={activity.name} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {activity.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Applied Percentage: {calculateContractorActivityAppliedPercentage(activity, contractorPracticePercentages, contractorTimePercentages).toFixed(1)}% (65% rule will be applied)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2 }}>
                      {/* Practice Percentage Slider */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                          Practice Percentage
                        </Typography>
                        <Slider
                          value={contractorPracticePercentages[activity.name] !== undefined 
                            ? contractorPracticePercentages[activity.name] 
                            : activity.currentPracticePercent}
                          onChange={(_, value) => {
                            const newValue = value as number;
                            
                            // Calculate what the total would be with this change
                            const activities = getContractorActivities(selectedContractor);
                            const otherActivitiesTotal = activities.reduce((sum, act) => {
                              if (act.name === activity.name) return sum;
                              return sum + (contractorPracticePercentages[act.name] !== undefined 
                                ? contractorPracticePercentages[act.name] 
                                : act.currentPracticePercent);
                            }, 0);
                            
                            // Prevent exceeding 100% total practice percentage
                            const maxAllowed = 100 - otherActivitiesTotal;
                            const constrainedValue = Math.min(newValue, maxAllowed);
                            
                            if (constrainedValue !== newValue) {
                              console.warn(`Practice percentage for ${activity.name} limited to ${constrainedValue}% to stay within 100% total`);
                            }
                            
                            setContractorPracticePercentages(prev => ({
                              ...prev,
                              [activity.name]: constrainedValue
                            }));
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
                                {rdSubcomponents.map(([subId, subConfig]) => {
                                  const typedSubConfig = subConfig as any;
                                  return (
                                    <Box key={subId} sx={{ 
                                      p: 2, 
                                      border: '1px solid', 
                                      borderColor: 'divider', 
                                      borderRadius: 1,
                                      bgcolor: 'background.paper'
                                    }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                        {typedSubConfig.subcomponent}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                        Step: {typedSubConfig.step} | Phase: {typedSubConfig.phase}
                                      </Typography>
                                      
                                      {/* Time Percentage Slider */}
                                      <Box sx={{ mt: 2 }}>
                                        <Typography variant="caption" color="text.secondary" gutterBottom>
                                          Time % (Currently: {(contractorTimePercentages[activity.name]?.[subId] || typedSubConfig.timePercent || 0).toFixed(1)}%)
                                        </Typography>
                                        <Slider
                                          value={contractorTimePercentages[activity.name]?.[subId] || typedSubConfig.timePercent || 0}
                                          onChange={(_, value) => {
                                            setContractorTimePercentages(prev => ({
                                              ...prev,
                                              [activity.name]: {
                                                ...prev[activity.name],
                                                [subId]: value as number
                                              }
                                            }));
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
                                  );
                                })}
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
                          <Typography variant="caption" color="text.secondary">
                            Expected localStorage key: qra_{selectedBusinessId}_{selectedYear}_{activity.name}
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
          Save Configuration (65% Applied)
        </Button>
      </DialogActions>
    </Dialog>
  );
} 