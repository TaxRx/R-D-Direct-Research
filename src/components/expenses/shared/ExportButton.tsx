import React from 'react';
import {
  Button,
  Tooltip
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
  tooltipText?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  disabled = false,
  tooltipText = "Export expenses data to CSV"
}) => {
  return (
    <Tooltip title={tooltipText}>
      <span>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={onExport}
          disabled={disabled}
          sx={{
            minWidth: 'auto',
            px: 2,
            py: 1,
            fontSize: '0.875rem'
          }}
        >
          Export CSV
        </Button>
      </span>
    </Tooltip>
  );
}; 