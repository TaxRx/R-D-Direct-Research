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
import { SupplyFormData, SUPPLY_CATEGORIES } from '../../../types/Employee';

interface SupplyFormProps {
  formData: SupplyFormData;
  onFormChange: (field: keyof SupplyFormData, value: string) => void;
  onAddSupply: () => void;
  formError: string;
  disabled?: boolean;
}

export const SupplyForm: React.FC<SupplyFormProps> = ({
  formData,
  onFormChange,
  onAddSupply,
  formError,
  disabled = false
}) => {
  const isFormValid = formData.title && 
    formData.description && 
    formData.totalValue && 
    formData.category && 
    (formData.category !== 'Other' || formData.customCategory);

  return (
    <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'secondary.50' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <AddIcon sx={{ mr: 1 }} />
          Quick Supply Entry
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Add supplies used in R&D activities
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Supply Title"
              value={formData.title}
              onChange={(e) => onFormChange('title', e.target.value)}
              fullWidth
              size="small"
              placeholder="e.g., Laboratory Equipment"
              error={!!formError && formError.includes('Title')}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => onFormChange('description', e.target.value)}
              fullWidth
              size="small"
              placeholder="What it is and what it does"
              error={!!formError && formError.includes('Description')}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Total Value"
              value={formData.totalValue}
              onChange={(e) => onFormChange('totalValue', e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder="5,000"
              error={!!formError && formError.includes('Total value')}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" error={!!formError && formError.includes('Category')}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => onFormChange('category', e.target.value)}
                label="Category"
                disabled={disabled}
              >
                {SUPPLY_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Custom Category Field - Only show when Other is selected */}
          {formData.category === 'Other' && (
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                value={formData.customCategory}
                onChange={(e) => onFormChange('customCategory', e.target.value)}
                fullWidth
                size="small"
                label="Custom Category"
                placeholder="e.g., Custom Equipment"
                error={!!formError && formError.includes('Custom category')}
                disabled={disabled}
              />
            </Grid>
          )}
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              onClick={onAddSupply}
              fullWidth
              startIcon={<AddIcon />}
              disabled={!isFormValid || disabled}
            >
              Add Supply
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