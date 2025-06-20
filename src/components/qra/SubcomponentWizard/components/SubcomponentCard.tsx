import React from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import EditIcon from '@mui/icons-material/Edit';
import { SubcomponentMetrics } from '../types';

interface SubcomponentCardProps {
  sub: {
    id: string;
    name: string;
    description?: string;
    metrics?: {
      time?: number;
      frequency?: number;
      year?: number;
    };
  };
  metrics?: SubcomponentMetrics;
  onSelect?: () => void;
  onMetricsChange?: (metrics: Partial<SubcomponentMetrics>) => void;
  currentYear?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function SubcomponentCard({
  sub,
  metrics,
  onSelect,
  onMetricsChange,
  currentYear
}: SubcomponentCardProps) {
  const chartData = [
    { name: 'Time', value: metrics?.timePercent || 0 },
    { name: 'Frequency', value: metrics?.frequencyPercent || 0 },
    { name: 'Year', value: metrics?.yearPercent || 0 }
  ];

  const handleEdit = () => {
    if (onMetricsChange) {
      // Open edit dialog or form
      // For now, just toggle between 100% and 0% for demo
      onMetricsChange({
        timePercent: metrics?.timePercent === 100 ? 0 : 100,
        frequencyPercent: metrics?.frequencyPercent === 100 ? 0 : 100,
        yearPercent: metrics?.yearPercent === 100 ? 0 : 100
      });
    }
  };

  return (
    <Card
      sx={{
        cursor: onSelect ? 'pointer' : 'default',
        '&:hover': {
          boxShadow: onSelect ? 3 : 1
        }
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              {sub.name}
            </Typography>
            {sub.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {sub.description}
              </Typography>
            )}
          </Box>
          {onMetricsChange && (
            <Tooltip title="Edit metrics">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {metrics && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 100, height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Time: ${metrics.timePercent}%`}
                  size="small"
                  color={metrics.timePercent === 100 ? 'success' : 'default'}
                />
                <Chip
                  label={`Freq: ${metrics.frequencyPercent}%`}
                  size="small"
                  color={metrics.frequencyPercent === 100 ? 'success' : 'default'}
                />
                <Chip
                  label={`Year: ${metrics.yearPercent}%`}
                  size="small"
                  color={metrics.yearPercent === 100 ? 'success' : 'default'}
                />
              </Box>
              {currentYear && metrics.startMonth !== undefined && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Start: {currentYear} (Month {metrics.startMonth + 1})
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 