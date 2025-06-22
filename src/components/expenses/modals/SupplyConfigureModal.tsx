import React from 'react';
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
  Tooltip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Supply } from '../../../types/Employee';
import { formatCurrency } from '../../../pages/QRABuilderTabs/RDExpensesTab/utils/currencyFormatting';

interface SupplyConfigureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedSupply: Supply | null;
  supplyActivityPercentages: Record<string, number>;
  supplySubcomponentPercentages: Record<string, Record<string, number>>;
  selectedSubcomponents: Record<string, string[]>;
  setSupplyActivityPercentages: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setSupplySubcomponentPercentages: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  setSelectedSubcomponents: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  getSupplyActivities: () => any[];
  getSupplyActivitySubcomponents: (activityName: string) => any[];
  handleActivityPercentageChange: (activityName: string, newPercentage: number) => void;
  handleSubcomponentToggle: (activityName: string, subcomponentId: string) => void;
  getSubcomponentPercentage: (activityName: string, subcomponentId: string) => number;
  isSubcomponentSelected: (activityName: string, subcomponentId: string) => boolean;
  getActivityColor: (activityName: string, allActivities: any[]) => string;
}

export default function SupplyConfigureModal({
  open,
  onClose,
  onSave,
  selectedSupply,
  supplyActivityPercentages,
  supplySubcomponentPercentages,
  selectedSubcomponents,
  setSupplyActivityPercentages,
  setSupplySubcomponentPercentages,
  setSelectedSubcomponents,
  getSupplyActivities,
  getSupplyActivitySubcomponents,
  handleActivityPercentageChange,
  handleSubcomponentToggle,
  getSubcomponentPercentage,
  isSubcomponentSelected,
  getActivityColor
}: SupplyConfigureModalProps) {
  if (!selectedSupply) return null;

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
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white', position: 'relative' }}>
        <Box sx={{ pr: 6 }}>
          <Typography variant="h5" component="div">
            Configure Supply Allocation
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {selectedSupply.title} - {selectedSupply.category}
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
          {/* Applied Percentage Summary */}
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Applied Percentage Breakdown
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  {(() => {
                    // Calculate total applied percentage from all subcomponents (same as list calculation)
                    const totalApplied = Object.values(supplySubcomponentPercentages).reduce((activitySum, subcomponents) => {
                      return activitySum + Object.values(subcomponents).reduce((subSum, percentage) => subSum + percentage, 0);
                    }, 0);
                    return totalApplied.toFixed(1);
                  })()}%
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatCurrency(selectedSupply.totalValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Applied Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {(() => {
                    // Calculate total applied percentage from all subcomponents (same as list calculation)
                    const totalApplied = Object.values(supplySubcomponentPercentages).reduce((activitySum, subcomponents) => {
                      return activitySum + Object.values(subcomponents).reduce((subSum, percentage) => subSum + percentage, 0);
                    }, 0);
                    return formatCurrency(selectedSupply.totalValue * (totalApplied / 100));
                  })()}
                </Typography>
              </Box>
            </Box>

            {/* Validation Warning */}
            {(() => {
              // Calculate total applied percentage from all subcomponents (same as list calculation)
              const totalApplied = Object.values(supplySubcomponentPercentages).reduce((activitySum, subcomponents) => {
                return activitySum + Object.values(subcomponents).reduce((subSum, percentage) => subSum + percentage, 0);
              }, 0);
              
              if (totalApplied > 100) {
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
                      ⚠️ Total exceeds 100% by {(totalApplied - 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'error.dark', display: 'block' }}>
                      Adjust activity percentages to total 100% or less.
                    </Typography>
                  </Box>
                );
              }
              return null;
            })()}

            {/* Progress Bar */}
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
                  const activities = getSupplyActivities();
                  let currentLeft = 0;
                  
                  return activities.map((activity, idx) => {
                    const percentage = supplyActivityPercentages[activity.name] || 0;
                    const color = getActivityColor(activity.name, activities);
                    
                    if (percentage <= 0) return null;
                    
                    const segment = (
                      <Box
                        key={activity.name}
                        sx={{
                          position: 'absolute',
                          left: `${currentLeft}%`,
                          width: `${percentage}%`,
                          height: '100%',
                          bgcolor: color,
                          borderRight: currentLeft + percentage < 100 ? '1px solid white' : 'none'
                        }}
                      />
                    );
                    
                    currentLeft += percentage;
                    return segment;
                  });
                })()}
              </Box>
            </Box>

            {/* Activity Contribution Chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getSupplyActivities().map((activity) => {
                const percentage = supplyActivityPercentages[activity.name] || 0;
                const selectedSubs = selectedSubcomponents[activity.name] || [];
                if (percentage <= 0) return null;
                
                return (
                  <Tooltip 
                    key={activity.name}
                    title={
                      selectedSubs.length > 0 
                        ? `${selectedSubs.length} subcomponent${selectedSubs.length !== 1 ? 's' : ''} selected`
                        : 'No subcomponents selected'
                    }
                  >
                    <Chip
                      label={`${activity.name}: ${percentage.toFixed(1)}% ${selectedSubs.length > 0 ? `(${selectedSubs.length} sub${selectedSubs.length !== 1 ? 's' : ''})` : '(0 subs)'}`}
                      size="small"
                      sx={{
                        bgcolor: getActivityColor(activity.name, getSupplyActivities()),
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          {/* Activities Configuration */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Activity Allocation
              </Typography>
              
              {getSupplyActivities().map((activity) => {
                const subcomponents = getSupplyActivitySubcomponents(activity.name);
                
                return (
                  <Card key={activity.name} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {activity.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Allocation: {(supplyActivityPercentages[activity.name] || 0).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2 }}>
                      {/* Activity Percentage Slider */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                          Activity Usage Percentage
                        </Typography>
                        <Slider
                          value={supplyActivityPercentages[activity.name] || 0}
                          onChange={(_, value) => {
                            const newValue = value as number;
                            
                            // Calculate what the total would be with this change
                            const activities = getSupplyActivities();
                            const otherActivitiesTotal = activities.reduce((sum, act) => {
                              if (act.name === activity.name) return sum;
                              return sum + (supplyActivityPercentages[act.name] || 0);
                            }, 0);
                            
                            // Prevent exceeding 100% total
                            const maxAllowed = 100 - otherActivitiesTotal;
                            const constrainedValue = Math.min(newValue, maxAllowed);
                            
                            if (constrainedValue !== newValue) {
                              console.warn(`Activity percentage for ${activity.name} limited to ${constrainedValue}% to stay within 100% total`);
                            }
                            
                            handleActivityPercentageChange(activity.name, constrainedValue);
                          }}
                          min={0}
                          max={100}
                          step={0.1}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                          sx={{ 
                            mt: 1,
                            '& .MuiSlider-track': {
                              background: 'linear-gradient(90deg, #9c27b0 0%, #ba68c8 100%)'
                            },
                            '& .MuiSlider-thumb': {
                              boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)'
                            }
                          }}
                        />
                      </Box>

                      {/* Subcomponents Selection */}
                      {subcomponents.length > 0 ? (
                        <Box>
                          <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                            Select Subcomponents ({selectedSubcomponents[activity.name]?.length || 0} of {subcomponents.length} selected)
                          </Typography>
                          
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, mb: 2 }}>
                            {subcomponents.map((subcomponent) => {
                              const isSelected = isSubcomponentSelected(activity.name, subcomponent.id);
                              const percentage = getSubcomponentPercentage(activity.name, subcomponent.id);
                              
                              return (
                                <Box 
                                  key={subcomponent.id} 
                                  onClick={() => handleSubcomponentToggle(activity.name, subcomponent.id)}
                                  sx={{ 
                                    p: 2, 
                                    border: '2px solid', 
                                    borderColor: isSelected ? 'secondary.main' : 'divider', 
                                    borderRadius: 1,
                                    bgcolor: isSelected ? 'secondary.light' : 'background.paper',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                      borderColor: isSelected ? 'secondary.dark' : 'secondary.light',
                                      bgcolor: isSelected ? 'secondary.main' : 'secondary.light',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 600, 
                                      color: isSelected ? 'white' : 'text.primary',
                                      flex: 1
                                    }}>
                                      {subcomponent.name}
                                    </Typography>
                                    {isSelected && (
                                      <Chip 
                                        label={`${percentage.toFixed(1)}%`}
                                        size="small"
                                        sx={{ 
                                          bgcolor: 'white', 
                                          color: 'secondary.main',
                                          fontWeight: 600,
                                          ml: 1
                                        }}
                                      />
                                    )}
                                  </Box>
                                  
                                  <Typography variant="caption" sx={{ 
                                    color: isSelected ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                                    display: 'block',
                                    mb: 1
                                  }}>
                                    Step: {subcomponent.step} | Phase: {subcomponent.phase}
                                  </Typography>
                                  
                                  {isSelected && (
                                    <Box sx={{ 
                                      mt: 1, 
                                      p: 1, 
                                      bgcolor: 'rgba(255,255,255,0.2)', 
                                      borderRadius: 0.5 
                                    }}>
                                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                        ✓ Selected - {percentage.toFixed(1)}% of supply allocated
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                          
                          {selectedSubcomponents[activity.name]?.length > 0 ? (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                              <Typography variant="caption" color="success.dark" sx={{ fontWeight: 600 }}>
                                ✓ {(supplyActivityPercentages[activity.name] || 0).toFixed(1)}% distributed equally across {selectedSubcomponents[activity.name].length} subcomponent{selectedSubcomponents[activity.name].length !== 1 ? 's' : ''}
                              </Typography>
                              <Typography variant="caption" color="success.dark" sx={{ display: 'block', mt: 0.5 }}>
                                Each subcomponent: {((supplyActivityPercentages[activity.name] || 0) / selectedSubcomponents[activity.name].length).toFixed(1)}%
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                              <Typography variant="caption" color="warning.dark">
                                ⚠️ Click on subcomponents above to select which ones this supply applies to. 
                                The activity percentage will be distributed equally across selected subcomponents.
                              </Typography>
                            </Box>
                          )}
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
                          <Typography variant="caption" color="text.secondary">
                            Configure subcomponents in the Activities tab first.
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
        <Button onClick={onSave} variant="contained" color="secondary">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
} 