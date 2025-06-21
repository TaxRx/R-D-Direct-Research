import React, { useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { ExpenseFormData, NON_RD_ROLE, OTHER_ROLE } from '../../../types/Employee';
import { Role } from '../../../types/Business';

interface EmployeeFormProps {
  formData: ExpenseFormData;
  onFormChange: (field: keyof ExpenseFormData, value: string | boolean) => void;
  onAddEmployee: () => void;
  onKeyPress: (event: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => void;
  formError: string;
  availableRoles: Role[];
  disabled?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  formData,
  onFormChange,
  onAddEmployee,
  onKeyPress,
  formError,
  availableRoles,
  disabled = false
}) => {
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const wageRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);

  const isFormValid = formData.firstName && 
    formData.lastName && 
    formData.wage && 
    formData.roleId && 
    (formData.roleId !== OTHER_ROLE.id || formData.customRoleName);

  return (
    <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <AddIcon sx={{ mr: 1 }} />
          Quick Employee Entry
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Use Tab to navigate fields, Enter to add employee
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              inputRef={firstNameRef}
              label="First Name"
              value={formData.firstName}
              onChange={(e) => onFormChange('firstName', e.target.value)}
              onKeyPress={(e) => onKeyPress(e, lastNameRef)}
              fullWidth
              size="small"
              error={!!formError && formError.includes('First name')}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              inputRef={lastNameRef}
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => onFormChange('lastName', e.target.value)}
              onKeyPress={(e) => onKeyPress(e, wageRef)}
              fullWidth
              size="small"
              error={!!formError && formError.includes('Last name')}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              inputRef={wageRef}
              label="Annual Wage"
              value={formData.wage}
              onChange={(e) => onFormChange('wage', e.target.value)}
              onKeyPress={(e) => onKeyPress(e, roleRef)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder="50,000"
              error={!!formError && formError.includes('Wage')}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" error={!!formError && formError.includes('Role')}>
              <InputLabel>Role</InputLabel>
              <Select
                inputRef={roleRef}
                value={formData.roleId}
                onChange={(e) => onFormChange('roleId', e.target.value)}
                label="Role"
                disabled={disabled}
              >
                {availableRoles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {role.id === NON_RD_ROLE.id ? (
                        <BusinessIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                      ) : role.id === OTHER_ROLE.id ? (
                        <EditIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                      ) : (
                        <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      )}
                      {role.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Custom Role Name Field - Only show when Other is selected */}
          {formData.roleId === OTHER_ROLE.id && (
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                value={formData.customRoleName}
                onChange={(e) => onFormChange('customRoleName', e.target.value)}
                fullWidth
                size="small"
                label="Custom Role Name"
                placeholder="e.g., Senior Developer"
                error={!!formError && formError.includes('Custom role name')}
                disabled={disabled}
              />
            </Grid>
          )}
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  inputRef={ownerRef}
                  checked={formData.isBusinessOwner}
                  onChange={(e) => onFormChange('isBusinessOwner', e.target.checked)}
                  size="small"
                  disabled={disabled}
                />
              }
              label="Owner"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              onClick={onAddEmployee}
              fullWidth
              startIcon={<AddIcon />}
              disabled={!isFormValid || disabled}
            >
              Add Employee
            </Button>
          </Grid>
        </Grid>
        {formError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        )}
      </Box>
    </Card>
  );
}; 