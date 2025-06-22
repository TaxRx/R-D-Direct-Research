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
  Person as PersonIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Employee } from '../../../types/Employee';
import { Role } from '../../../types/Business';
import { formatCurrency } from '../../../utils/currencyFormatting';
import { NON_RD_ROLE, OTHER_ROLE } from '../../../types/Employee';

interface EmployeeListProps {
  employees: Employee[];
  roles: Role[];
  yearTotals: {
    totalAppliedWages: number;
  };
  onToggleLock: (employee: Employee) => void;
  onConfigure: (employee: Employee) => void;
  onToggleActive: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  calculateEmployeeAppliedPercentage: (employee: Employee, activities: any[]) => number;
  getEmployeeActivities: (employee: Employee) => any[];
  getRoleName: (roleId: string, customRoleName: string, roles: Role[], nonRdRole: any, otherRole: any) => string;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  roles,
  yearTotals,
  onToggleLock,
  onConfigure,
  onToggleActive,
  onDelete,
  calculateEmployeeAppliedPercentage,
  getEmployeeActivities,
  getRoleName
}) => {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Employee Wages
            </Typography>
            <Chip 
              label={`${employees.length} employee${employees.length !== 1 ? 's' : ''}`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Total Applied: {formatCurrency(yearTotals.totalAppliedWages)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {employees.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Employees Added
            </Typography>
            <Typography color="text.secondary">
              Use the quick entry form above to add your first employee.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {employees.map((employee) => (
              <Box
                key={employee.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: employee.isActive ? 'background.paper' : 'grey.50',
                  opacity: employee.isActive ? 1 : 0.7,
                }}
              >
                {/* Employee Info */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {employee.firstName} {employee.lastName}
                      </Typography>
                      {employee.isBusinessOwner && (
                        <Chip 
                          label="Owner" 
                          size="small" 
                          color="warning"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {getRoleName(employee.roleId, employee.customRoleName || '', roles, NON_RD_ROLE, OTHER_ROLE)}
                    </Typography>
                  </Box>
                </Box>

                {/* Wage */}
                <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(employee.wage)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Annual Wage
                  </Typography>
                </Box>

                {/* Applied Percentage & Amount - Improved Spacing */}
                <Box sx={{ display: 'flex', gap: 2, minWidth: 180, textAlign: 'right', mr: 2 }}>
                  {/* Applied Percentage */}
                  <Box sx={{ minWidth: 80 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {(() => {
                        // Check if employee has custom configuration by looking for non-empty custom objects
                        const hasCustomPracticePercentages = employee.customPracticePercentages && 
                          Object.keys(employee.customPracticePercentages).length > 0;
                        const hasCustomTimePercentages = employee.customTimePercentages && 
                          Object.keys(employee.customTimePercentages).length > 0;
                        
                        // Use saved applied percentage if employee has custom configuration, otherwise calculate dynamically
                        const appliedPercentage = hasCustomPracticePercentages || hasCustomTimePercentages
                          ? employee.appliedPercentage // Use saved percentage from modal configuration
                          : calculateEmployeeAppliedPercentage(employee, getEmployeeActivities(employee)); // Calculate from role defaults
                        
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
                        // Check if employee has custom configuration by looking for non-empty custom objects
                        const hasCustomPracticePercentages = employee.customPracticePercentages && 
                          Object.keys(employee.customPracticePercentages).length > 0;
                        const hasCustomTimePercentages = employee.customTimePercentages && 
                          Object.keys(employee.customTimePercentages).length > 0;
                        
                        // Use saved applied amount if employee has custom configuration, otherwise calculate dynamically
                        let appliedAmount;
                        if (hasCustomPracticePercentages || hasCustomTimePercentages) {
                          appliedAmount = employee.wage * (employee.appliedPercentage / 100);
                        } else {
                          appliedAmount = employee.wage * calculateEmployeeAppliedPercentage(employee, getEmployeeActivities(employee)) / 100;
                        }
                        
                        return formatCurrency(appliedAmount);
                      })()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      R&D Amount
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title={employee.isLocked ? 'Unlock employee' : 'Lock employee'}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleLock(employee)}
                      color={employee.isLocked ? 'warning' : 'default'}
                    >
                      {employee.isLocked ? <LockIcon /> : <UnlockIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Configure applied percentage">
                    <span>
                      <IconButton 
                        size="small" 
                        disabled={employee.isLocked}
                        onClick={() => onConfigure(employee)}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title={employee.isActive ? 'Deactivate employee' : 'Activate employee'}>
                    <span>
                      <Switch
                        checked={employee.isActive}
                        onChange={() => onToggleActive(employee)}
                        size="small"
                        disabled={employee.isLocked}
                      />
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Delete employee">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(employee.id)}
                        color="error"
                        disabled={employee.isLocked}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
}; 