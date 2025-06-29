import { useState, useEffect, useCallback } from 'react';
import { QRADataExportService, QRAExportData } from '../services/qraDataExportService';

interface UseQRAExportProps {
  businessId: string;
  businessName: string;
  year: number;
  autoExport?: boolean;
  onExportComplete?: (data: QRAExportData) => void;
}

export const useQRAExport = ({
  businessId,
  businessName,
  year,
  autoExport = false,
  onExportComplete
}: UseQRAExportProps) => {
  const [exportData, setExportData] = useState<QRAExportData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportTime, setLastExportTime] = useState<Date | null>(null);

  // Generate export data using normalized Supabase structure
  const generateExport = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const data = await QRADataExportService.generateExportData(
        businessId,
        businessName,
        year
      );
      
      setExportData(data);
      setLastExportTime(new Date());
      
      if (onExportComplete) {
        onExportComplete(data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to generate QRA export:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [businessId, businessName, year, onExportComplete]);

  // Download export in specified format
  const downloadExport = useCallback((format: 'json' | 'csv' | 'sql', filename?: string) => {
    if (exportData) {
      QRADataExportService.downloadExport(exportData, format, filename);
    } else {
      throw new Error('No export data available. Generate export first.');
    }
  }, [exportData]);

  // Auto-export if enabled (simplified since we don't need to monitor localStorage)
  useEffect(() => {
    if (autoExport && !exportData) {
      // Auto-generate export when hook is initialized with autoExport enabled
        generateExport().catch(console.error);
    }
  }, [autoExport, exportData, generateExport]);

  // Get completion statistics from export data
  const getCompletionStats = useCallback(() => {
    if (!exportData) {
      return {
        completed: 0,
        total: 0,
        percentage: 0,
        status: {}
      };
    }
    
    const { qraConfigurations } = exportData;
    const completed = qraConfigurations.filter(config => config.qraCompleted).length;
    const total = qraConfigurations.length;
    
    const status: Record<string, boolean> = {};
    qraConfigurations.forEach(config => {
      status[config.activityName] = config.qraCompleted;
    });
    
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      status
    };
  }, [exportData]);

  // Check if export is ready
  const isExportReady = useCallback(() => {
    const stats = getCompletionStats();
    return stats.completed > 0;
  }, [getCompletionStats]);

  return {
    // State
    exportData,
    isExporting,
    lastExportTime,
    
    // Actions
    generateExport,
    downloadExport,
    
    // Computed values
    completionStats: getCompletionStats(),
    isExportReady: isExportReady(),
    
    // Utilities
    checkQRACompletion: getCompletionStats
  };
}; 