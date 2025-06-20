import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Slider,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

interface ResearchActivityCardProps {
  title: string;
  hint?: string;
  focus?: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  practicePercent: number;
  onPracticePercentChange?: (value: number) => void;
  onAdd?: () => void;
  onRemove?: () => void;
  roles?: Array<{ id: string; name: string; selected: boolean }>;
  onRoleToggle?: (roleId: string) => void;
}

const ResearchActivityCard: React.FC<ResearchActivityCardProps> = ({
  title,
  hint,
  focus,
  isSelected,
  onSelect,
  onEdit,
  practicePercent,
  onPracticePercentChange,
  onAdd,
  onRemove,
  roles = [],
  onRoleToggle,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const shouldShowSlider = (expanded || isSelected) && !!onPracticePercentChange;

  // Generate consistent color for focus chip based on focus text
  const getFocusChipColor = (focusText: string) => {
    if (!focusText) return { bg: '#e3f2fd', text: '#1976d2', border: '#1976d2' };
    
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < focusText.length; i++) {
      hash = focusText.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with good contrast
    const hue = Math.abs(hash) % 360;
    const saturation = 60;
    const lightness = 85; // Light background
    const textLightness = 25; // Dark text
    
    return {
      bg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      text: `hsl(${hue}, ${saturation}%, ${textLightness}%)`,
      border: `hsl(${hue}, ${saturation}%, ${textLightness}%)`
    };
  };

  return (
    <Card
      sx={{
        mb: 1.5,
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'grey.300',
        boxShadow: isSelected ? 2 : 0,
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.light',
        },
        transition: 'all 0.2s ease-in-out',
        background: isSelected ? 'rgba(25, 118, 210, 0.05)' : 'white',
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '0.95rem',
                color: isSelected ? 'primary.main' : 'text.primary'
              }}
            >
              {title}
            </Typography>
            
            {/* Focus Chip */}
            {focus && (
              <Chip
                label={focus}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  backgroundColor: getFocusChipColor(focus).bg,
                  color: getFocusChipColor(focus).text,
                  border: `1px solid ${getFocusChipColor(focus).border}`,
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            )}
          </Box>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {onAdd && !isSelected && (
              <Tooltip title="Add to My R&D Activities">
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary" 
                  onClick={onAdd} 
                  startIcon={<AddIcon fontSize="small" />}
                  sx={{ minWidth: 'auto', py: 0.5, px: 1.5, fontSize: '0.8rem' }}
                >
                  Add
                </Button>
              </Tooltip>
            )}
            
            {onRemove && isSelected && (
              <Tooltip title="Remove from My R&D Activities">
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error" 
                  onClick={onRemove} 
                  startIcon={<DeleteIcon fontSize="small" />}
                  sx={{ minWidth: 'auto', py: 0.5, px: 1.5, fontSize: '0.8rem' }}
                >
                  Remove
                </Button>
              </Tooltip>
            )}
            
            <Tooltip title={expanded ? 'Collapse details' : 'Expand details'}>
              <IconButton size="small" onClick={handleExpandClick}>
                {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Compact Roles Display - Always Visible if Selected */}
        {roles.length > 0 && isSelected && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
              R&D Roles ({roles.filter(r => r.selected).length} of {roles.length} selected)
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {roles.map(role => (
                <Chip
                  key={role.id}
                  label={role.name}
                  size="small"
                  color={role.selected ? 'primary' : 'default'}
                  onClick={() => onRoleToggle?.(role.id)}
                  variant={role.selected ? 'filled' : 'outlined'}
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    '& .MuiChip-label': { px: 1 },
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: role.selected ? 'primary.dark' : 'grey.100',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Practice Percentage Slider - Only when expanded or selected */}
        <Collapse in={shouldShowSlider}>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Practice Percentage
              </Typography>
              <Chip
                label={`${practicePercent.toFixed(1)}%`}
                size="small"
                color={practicePercent >= 80 ? 'success' : practicePercent >= 50 ? 'warning' : 'primary'}
                sx={{ height: 20, fontSize: '0.7rem', minWidth: 50 }}
              />
            </Box>
            <Slider
              value={practicePercent}
              onChange={(_, value) => onPracticePercentChange?.(value as number)}
              min={0}
              max={100}
              step={0.1}
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${value.toFixed(1)}%`}
              sx={{ 
                height: 6,
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  backgroundColor: 'primary.main',
                },
                '& .MuiSlider-track': {
                  backgroundColor: 'primary.main',
                  border: 'none',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'grey.300',
                }
              }}
            />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ResearchActivityCard; 