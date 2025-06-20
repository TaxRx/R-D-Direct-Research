import React from 'react';
import { Card, CardContent, Box, Typography, Tooltip, IconButton } from '@mui/material';
import { InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';

// Types
interface QRAProgressBarProps {
  title: string;
  nonRDTime: number;
  activities: Array<{
    name: string;
    focus?: string;
    percentage: number;
    color: string;
  }>;
  showNonRDEdit?: boolean;
  onNonRDEdit?: () => void;
  variant?: 'practice' | 'applied';
  sticky?: boolean;
}

const QRA_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2',
  '#303f9f', '#689f38', '#fbc02d', '#f44336', '#9c27b0'
];

export const getQRAColor = (index: number) => QRA_COLORS[index % QRA_COLORS.length];

export const QRAProgressBar: React.FC<QRAProgressBarProps> = ({
  title,
  nonRDTime,
  activities,
  showNonRDEdit = false,
  onNonRDEdit,
  variant = 'practice',
  sticky = false
}) => {
  // For Applied percentage, don't show Non-R&D
  const showNonRD = variant === 'practice';
  
  // Calculate segments
  const segments = [];
  const percentLabels: { color: string; label: string; percent: number }[] = [];
  let left = 0;

  // Non R&D segment (only for Practice percentage)
  if (showNonRD && nonRDTime > 0) {
    segments.push(
      <Box
        key="nonrd"
        sx={{
          position: 'absolute',
          left: `${left}%`,
          top: 0,
          height: 16,
          width: `${nonRDTime}%`,
          bgcolor: '#bdbdbd',
          borderRadius: '8px 0 0 8px',
          zIndex: 1
        }}
      />
    );
    
    percentLabels.push({
      color: '#bdbdbd',
      label: 'Non R&D',
      percent: nonRDTime
    });
    
    left += nonRDTime;
  }

  // Activity segments
  activities.forEach((activity, idx) => {
    const percent = activity.percentage;
    let borderRadius = '0';
    
    // First activity and no non-R&D shown
    if (idx === 0 && (!showNonRD || nonRDTime === 0)) {
      borderRadius = '8px 0 0 8px';
    }
    
    // Last activity
    if (idx === activities.length - 1) {
      borderRadius = '0 8px 8px 0';
    }

    segments.push(
      <Box
        key={`activity-${idx}`}
        sx={{
          position: 'absolute',
          left: `${left}%`,
          top: 0,
          height: 16,
          width: `${percent}%`,
          bgcolor: activity.color,
          borderRadius,
          zIndex: 2
        }}
      />
    );

    const label = activity.focus 
      ? `${activity.name} (${activity.focus})`
      : activity.name;
      
    percentLabels.push({
      color: activity.color,
      label,
      percent
    });

    left += percent;
  });

  // Calculate total and show warning if not 100%
  const totalPercent = percentLabels.reduce((sum, seg) => sum + seg.percent, 0);
  const hasWarning = Math.abs(totalPercent - 100) > 0.01;

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 3, 
        p: 2, 
        bgcolor: '#fafcff',
        position: sticky ? 'sticky' : 'static',
        top: sticky ? 0 : 'auto',
        zIndex: sticky ? 1201 : 'auto',
        boxShadow: sticky ? 2 : 1
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700, mr: 1 }}>
            {title}
          </Typography>
          {showNonRDEdit && onNonRDEdit && (
            <Tooltip title="Set Non R&D time">
              <IconButton size="small" onClick={onNonRDEdit}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Progress Bar */}
        <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 1 }}>
          {/* Segments */}
          {segments}
          
          {/* Border overlay */}
          <Box 
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: 16,
              width: '100%',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              zIndex: 3,
              pointerEvents: 'none'
            }}
          />
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1, alignItems: 'center' }}>
          {percentLabels.map(seg => (
            <Box key={`${seg.label}-legend`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FiberManualRecordIcon sx={{ color: seg.color, fontSize: 14 }} />
              <Typography variant="caption" sx={{ color: '#757575' }}>
                {`${seg.label} (${seg.percent.toFixed(2)}%)`}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Warning */}
        {hasWarning && (
          <Typography color="warning.main" sx={{ mt: 1, fontSize: '0.875rem' }}>
            Warning: The sum of all percentages is {totalPercent.toFixed(2)}% (should be 100%).
          </Typography>
        )}

        {/* Footer info */}
        {showNonRD && (
          <Typography variant="caption" sx={{ color: '#757575', mt: 1, display: 'block' }}>
            Non R&D time: {nonRDTime}%
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}; 