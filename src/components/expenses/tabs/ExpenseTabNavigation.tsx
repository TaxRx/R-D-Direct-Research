import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

interface ExpenseTabNavigationProps {
  activeTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  employees: any[];
  contractors: any[];
  supplies: any[];
  isExpensesApproved: boolean;
}

export const ExpenseTabNavigation: React.FC<ExpenseTabNavigationProps> = ({
  activeTab,
  onTabChange,
  employees,
  contractors,
  supplies,
  isExpensesApproved
}) => {
  const getTabLabel = (label: string, count: number, icon: React.ReactNode) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="body2">{label}</Typography>
      <Chip
        label={count}
        size="small"
        sx={{ 
          minWidth: 20, 
          height: 20, 
          fontSize: '0.75rem',
          backgroundColor: count > 0 ? '#1976d2' : '#e0e0e0',
          color: count > 0 ? 'white' : 'text.secondary'
        }}
      />
    </Box>
  );

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        aria-label="expense tabs"
        sx={{
          '& .MuiTab-root': {
            minHeight: 64,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500
          }
        }}
      >
        <Tab
          label={getTabLabel('Employees', employees.length, <PersonIcon />)}
          id="expense-tab-0"
          aria-controls="expense-tabpanel-0"
        />
        <Tab
          label={getTabLabel('Contractors', contractors.length, <BusinessIcon />)}
          id="expense-tab-1"
          aria-controls="expense-tabpanel-1"
        />
        <Tab
          label={getTabLabel('Supplies', supplies.length, <InventoryIcon />)}
          id="expense-tab-2"
          aria-controls="expense-tabpanel-2"
        />
      </Tabs>
      
      {isExpensesApproved && (
        <Box sx={{ 
          mt: 1, 
          p: 1, 
          backgroundColor: '#e8f5e8', 
          borderRadius: 1,
          border: '1px solid #4caf50'
        }}>
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
            ✓ Expenses tab is approved and locked
          </Typography>
        </Box>
      )}
    </Box>
  );
}; 