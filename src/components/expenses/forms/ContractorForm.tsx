import React from 'react';
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
  Button,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { ContractorFormData, OTHER_ROLE } from '../../../types/Employee';
import { Role } from '../../../types/Business';

interface ContractorFormProps {
  formData: ContractorFormData;
  onFormChange: (field: keyof ContractorFormData, value: string) => void;
  onAddContractor: () => void;
  formError: string;
  availableRoles: Role[];
  disabled?: boolean;
}

export const ContractorForm: React.FC<ContractorFormProps> = ({
  formData,
  onFormChange,
  onAddContractor,
  formError,
  availableRoles,
  disabled = false
}) => {
  const isFormValid = formData.totalAmount && 
    formData.roleId && 
    (formData.roleId !== OTHER_ROLE.id || formData.customRoleName) &&
    (formData.contractorType === 'individual' ? (formData.firstName && formData.lastName) : formData.businessName);

  return (
    <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.50' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <AddIcon sx={{ mr: 1 }} />
          Quick Contractor Entry
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Add contractors (65% of amount applied to R&D)
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={formData.contractorType}
                onChange={(e) => onFormChange('contractorType', e.target.value)}
                disabled={disabled}
              >
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="business">Business</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {formData.contractorType === 'individual' ? (
            <>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => onFormChange('firstName', e.target.value)}
                  fullWidth
                  size="small"
                  error={!!formError && formError.includes('First name')}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => onFormChange('lastName', e.target.value)}
                  fullWidth
                  size="small"
                  error={!!formError && formError.includes('Last name')}
                  disabled={disabled}
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Business Name"
                value={formData.businessName}
                onChange={(e) => onFormChange('businessName', e.target.value)}
                fullWidth
                size="small"
                error={!!formError && formError.includes('Business name')}
                disabled={disabled}
              />
            </Grid>
          )}
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Total Amount"
              value={formData.totalAmount}
              onChange={(e) => onFormChange('totalAmount', e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder="50,000"
              error={!!formError && formError.includes('Total amount')}
              disabled={disabled}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.roleId}
                onChange={(e) => onFormChange('roleId', e.target.value)}
                disabled={disabled}
              >
                {availableRoles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {formData.roleId === OTHER_ROLE.id && (
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Custom Role Name"
                value={formData.customRoleName}
                onChange={(e) => onFormChange('customRoleName', e.target.value)}
                fullWidth
                size="small"
                error={!!formError && formError.includes('Custom role name')}
                disabled={disabled}
              />
            </Grid>
          )}
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              onClick={onAddContractor}
              fullWidth
              startIcon={<AddIcon />}
              disabled={!isFormValid || disabled}
            >
              Add Contractor
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