import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface ActivitySelectorProps {
  activities: { id: string; name: string }[];
  selectedActivityId: string;
  onActivityChange: (activityId: string) => void;
}

const ActivitySelector: React.FC<ActivitySelectorProps> = ({ activities, selectedActivityId, onActivityChange }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <FormControl fullWidth>
        <InputLabel id="activity-select-label">Research Activity</InputLabel>
        <Select
          labelId="activity-select-label"
          value={selectedActivityId}
          label="Research Activity"
          onChange={e => onActivityChange(e.target.value as string)}
        >
          {activities.map(activity => (
            <MenuItem key={activity.id} value={activity.id}>
              {activity.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ActivitySelector; 