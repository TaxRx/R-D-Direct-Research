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
  LinearProgress,
  Fab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';

interface SubcomponentCardProps {
  title: string;
  step: string;
  hint: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  frequencyPercent: number;
  timePercent: number;
  onFrequencyChange: (value: number) => void;
  onTimeChange: (value: number) => void;
  onAdd?: () => void;
  roles?: Array<{ id: string; name: string; selected: boolean }>;
  onRoleToggle?: (roleId: string) => void;
}

const SubcomponentCard: React.FC<SubcomponentCardProps> = ({
  title,
  step,
  hint,
  isSelected,
  onSelect,
  onEdit,
  frequencyPercent,
  timePercent,
  onFrequencyChange,
  onTimeChange,
  onAdd,
  roles = [],
  onRoleToggle,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const getFrequencyColor = (value: number) => {
    if (value <= 30) return 'success';
    if (value <= 45) return 'warning';
    return 'error';
  };

  const getTimeColor = (value: number) => {
    if (value <= 5) return 'success';
    if (value <= 8) return 'warning';
    return 'error';
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': {
          boxShadow: 3,
          borderColor: 'primary.main',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 0, fontWeight: 600, pr: 0.5 }}>
            {title}
          </Typography>
          <Tooltip title={hint} placement="top">
            <IconButton size="small" sx={{ ml: 0, mr: 0.5 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Chip 
            label={step} 
            size="small" 
            color="primary" 
            variant="outlined" 
            sx={{ ml: 0, mr: 1 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          {onAdd && !isSelected && (
            <Tooltip title="Add">
              <IconButton size="small" color="primary" onClick={onAdd} sx={{ ml: 1 }}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton size="small" onClick={onEdit} sx={{ ml: 0.5 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
            <IconButton size="small" onClick={handleExpandClick} sx={{ ml: 0.5 }}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Role chips */}
        {roles.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {roles.map(role => (
              <Chip
                key={role.id}
                label={role.name}
                size="small"
                color={role.selected ? 'primary' : 'default'}
                onClick={() => onRoleToggle?.(role.id)}
                variant={role.selected ? 'filled' : 'outlined'}
                sx={{ 
                  bgcolor: role.selected ? 'primary.light' : 'grey.100',
                  color: role.selected ? 'primary.contrastText' : 'text.primary',
                  border: role.selected ? 'none' : '1px solid',
                  borderColor: 'grey.300',
                  '&:hover': {
                    bgcolor: role.selected ? 'primary.main' : 'grey.200',
                  },
                  cursor: 'pointer',
                }}
              />
            ))}
          </Box>
        )}

        <Collapse in={expanded || isSelected}>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Frequency: {frequencyPercent}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Slider
                  value={frequencyPercent}
                  onChange={(_, value) => onFrequencyChange(value as number)}
                  min={25}
                  max={55}
                  step={1}
                  sx={{ flexGrow: 1 }}
                />
                <Chip 
                  label={`${frequencyPercent}%`}
                  size="small"
                  color={getFrequencyColor(frequencyPercent)}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(frequencyPercent - 25) / 30 * 100}
                color={getFrequencyColor(frequencyPercent)}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Time: {timePercent}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Slider
                  value={timePercent}
                  onChange={(_, value) => onTimeChange(value as number)}
                  min={4}
                  max={11}
                  step={1}
                  sx={{ flexGrow: 1 }}
                />
                <Chip 
                  label={`${timePercent}%`}
                  size="small"
                  color={getTimeColor(timePercent)}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(timePercent - 4) / 7 * 100}
                color={getTimeColor(timePercent)}
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SubcomponentCard; 