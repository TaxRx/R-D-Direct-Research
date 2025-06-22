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
  Calculate as CalculateIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Supply } from '../../../types/Employee';
import { formatCurrency } from '../../../pages/QRABuilderTabs/RDExpensesTab/utils/currencyFormatting';

interface SupplyListProps {
  supplies: Supply[];
  yearTotals: {
    totalAppliedSupplyAmounts: number;
  };
  onToggleLock: (supply: Supply) => void;
  onConfigure: (supply: Supply) => void;
  onToggleActive: (supply: Supply) => void;
  onDelete: (supplyId: string) => void;
  calculateSupplyAppliedPercentage: (supply: Supply) => number;
  disabled?: boolean;
}

export const SupplyList: React.FC<SupplyListProps> = ({
  supplies,
  yearTotals,
  onToggleLock,
  onConfigure,
  onToggleActive,
  onDelete,
  calculateSupplyAppliedPercentage,
  disabled = false
}) => {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Supply Expenses
            </Typography>
            <Chip 
              label={`${supplies.length} supply${supplies.length !== 1 ? 's' : ''}`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Total Applied: {formatCurrency(yearTotals.totalAppliedSupplyAmounts || 0)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {supplies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CalculateIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Supplies Added
            </Typography>
            <Typography color="text.secondary">
              Use the quick entry form above to add your first supply.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {supplies.map((supply) => (
              <Box
                key={supply.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: supply.isActive ? 'background.paper' : 'grey.50',
                  opacity: supply.isActive ? 1 : 0.7,
                }}
              >
                {/* Supply Info */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {supply.title}
                      </Typography>
                      <Chip 
                        label={supply.category} 
                        size="small" 
                        color="info"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {supply.description}
                    </Typography>
                  </Box>
                </Box>

                {/* Total Value */}
                <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(supply.totalValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                </Box>

                {/* Applied Percentage & Amount */}
                <Box sx={{ display: 'flex', gap: 2, minWidth: 180, textAlign: 'right', mr: 2 }}>
                  {/* Applied Percentage */}
                  <Box sx={{ minWidth: 80 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {calculateSupplyAppliedPercentage(supply).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applied %
                    </Typography>
                  </Box>
                  
                  {/* R&D Amount */}
                  <Box sx={{ minWidth: 90 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(supply.totalValue * (calculateSupplyAppliedPercentage(supply) / 100))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      R&D Amount
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title={supply.isLocked ? 'Unlock supply' : 'Lock supply'}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleLock(supply)}
                      color={supply.isLocked ? 'warning' : 'default'}
                      disabled={disabled}
                    >
                      {supply.isLocked ? <LockIcon /> : <UnlockIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Configure applied percentage">
                    <span>
                      <IconButton 
                        size="small" 
                        disabled={supply.isLocked || disabled}
                        onClick={() => onConfigure(supply)}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title={supply.isActive ? 'Deactivate supply' : 'Activate supply'}>
                    <span>
                      <Switch
                        checked={supply.isActive}
                        onChange={() => onToggleActive(supply)}
                        size="small"
                        disabled={supply.isLocked || disabled}
                      />
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Delete supply">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(supply.id)}
                        color="error"
                        disabled={supply.isLocked || disabled}
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