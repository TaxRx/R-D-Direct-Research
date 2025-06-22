import React from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Switch
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Contractor } from '../../../types/Employee';
import { Role } from '../../../types/Business';
import { formatCurrency } from '../../../pages/QRABuilderTabs/RDExpensesTab/utils/currencyFormatting';
import { NON_RD_ROLE, OTHER_ROLE } from '../../../types/Employee';

interface ContractorListProps {
  contractors: Contractor[];
  roles: Role[];
  yearTotals: {
    totalAppliedContractorAmounts: number;
  };
  onToggleLock: (contractor: Contractor) => void;
  onConfigure: (contractor: Contractor) => void;
  onToggleActive: (contractor: Contractor) => void;
  onDelete: (contractorId: string) => void;
  calculateContractorAppliedPercentage: (contractor: Contractor, activities: any[]) => number;
  getContractorActivities: (contractor: Contractor) => any[];
  getRoleName: (roleId: string, customRoleName: string, roles: Role[], nonRdRole: any, otherRole: any) => string;
  disabled?: boolean;
}

export const ContractorList: React.FC<ContractorListProps> = ({
  contractors,
  roles,
  yearTotals,
  onToggleLock,
  onConfigure,
  onToggleActive,
  onDelete,
  calculateContractorAppliedPercentage,
  getContractorActivities,
  getRoleName,
  disabled = false
}) => {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Contractors
            </Typography>
            <Chip 
              label={`${contractors.length} contractor${contractors.length !== 1 ? 's' : ''}`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Total Applied: {formatCurrency(yearTotals.totalAppliedContractorAmounts || 0)} (65% applied)
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {contractors.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Contractors Added
            </Typography>
            <Typography color="text.secondary">
              Use the quick entry form above to add your first contractor.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {contractors.map((contractor) => {
              const contractorName = contractor.contractorType === 'individual' 
                ? `${contractor.firstName} ${contractor.lastName}` 
                : contractor.businessName;
              
              return (
                <Box
                  key={contractor.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: contractor.isActive ? 'background.paper' : 'grey.50',
                    opacity: contractor.isActive ? 1 : 0.7,
                  }}
                >
                  {/* Contractor Info */}
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {contractorName}
                        </Typography>
                        <Chip 
                          label={contractor.contractorType === 'individual' ? 'Individual' : 'Business'} 
                          size="small" 
                          color={contractor.contractorType === 'individual' ? 'primary' : 'secondary'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {getRoleName(contractor.roleId, contractor.customRoleName || '', roles, NON_RD_ROLE, OTHER_ROLE)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Total Amount */}
                  <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatCurrency(contractor.totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                  </Box>

                  {/* Applied Percentage & Amount */}
                  <Box sx={{ display: 'flex', gap: 2, minWidth: 180, textAlign: 'right', mr: 2 }}>
                    {/* Applied Percentage */}
                    <Box sx={{ minWidth: 80 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {(() => {
                          // Check if contractor has custom configuration by looking for non-empty custom objects
                          const hasCustomPracticePercentages = contractor.customPracticePercentages && 
                            Object.keys(contractor.customPracticePercentages).length > 0;
                          const hasCustomTimePercentages = contractor.customTimePercentages && 
                            Object.keys(contractor.customTimePercentages).length > 0;
                          
                          // Use saved applied percentage if contractor has custom configuration, otherwise calculate dynamically
                          const appliedPercentage = hasCustomPracticePercentages || hasCustomTimePercentages
                            ? contractor.appliedPercentage // Use saved percentage from modal configuration
                            : calculateContractorAppliedPercentage(contractor, getContractorActivities(contractor)); // Calculate from role defaults
                          
                          return appliedPercentage.toFixed(1);
                        })()}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Applied %
                      </Typography>
                    </Box>
                    
                    {/* R&D Amount */}
                    <Box sx={{ minWidth: 90 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {(() => {
                          // Check if contractor has custom configuration by looking for non-empty custom objects
                          const hasCustomPracticePercentages = contractor.customPracticePercentages && 
                            Object.keys(contractor.customPracticePercentages).length > 0;
                          const hasCustomTimePercentages = contractor.customTimePercentages && 
                            Object.keys(contractor.customTimePercentages).length > 0;
                          
                          // Use saved applied amount if contractor has custom configuration, otherwise calculate dynamically
                          let appliedAmount;
                          if (hasCustomPracticePercentages || hasCustomTimePercentages) {
                            appliedAmount = contractor.totalAmount * (contractor.appliedPercentage / 100) * 0.65; // 65% rule
                          } else {
                            appliedAmount = contractor.totalAmount * calculateContractorAppliedPercentage(contractor, getContractorActivities(contractor)) / 100 * 0.65; // 65% rule
                          }
                          
                          return formatCurrency(appliedAmount);
                        })()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        R&D Amount
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (65% applied)
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title={contractor.isLocked ? 'Unlock contractor' : 'Lock contractor'}>
                      <IconButton
                        size="small"
                        onClick={() => onToggleLock(contractor)}
                        color={contractor.isLocked ? 'warning' : 'default'}
                        disabled={disabled}
                      >
                        {contractor.isLocked ? <LockIcon /> : <UnlockIcon />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Configure applied percentage">
                      <span>
                        <IconButton 
                          size="small" 
                          disabled={contractor.isLocked || disabled}
                          onClick={() => onConfigure(contractor)}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    
                    <Tooltip title={contractor.isActive ? 'Deactivate contractor' : 'Activate contractor'}>
                      <span>
                        <Switch
                          checked={contractor.isActive}
                          onChange={() => onToggleActive(contractor)}
                          size="small"
                          disabled={contractor.isLocked || disabled}
                        />
                      </span>
                    </Tooltip>
                    
                    <Tooltip title="Delete contractor">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(contractor.id)}
                          color="error"
                          disabled={contractor.isLocked || disabled}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Card>
  );
}; 