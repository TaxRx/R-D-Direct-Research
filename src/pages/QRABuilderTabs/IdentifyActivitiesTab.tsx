import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box, Card, Typography, Chip, IconButton, Button, Tabs, Tab, AppBar, Toolbar, Switch, Collapse, InputAdornment, TextField, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Slider, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useTheme } from '@mui/material/styles';
import { green, grey } from '@mui/material/colors';
import { Business } from '../../types/Business';
import { activitiesDataService, ActivitiesTabData } from '../../services/activitiesDataService';
import { Notification } from '../../components/Notification';
import { QRABuilderService } from '../../services/qrabuilderService';
import SettingsIcon from '@mui/icons-material/Settings';
import FilterListIcon from '@mui/icons-material/FilterList';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { SubcomponentSelectionData } from '../../types/QRABuilderInterfaces';
import { approvalsService, TabApproval } from '../../services/approvals';
import { UnifiedTemplateManagement } from '../../components/TemplateManagement';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ResearchActivityCard from '../../components/ResearchActivityCard';
import { saveQRADataToSupabase } from '../../services/qraDataService';
import QRAExportPanel from '../../components/qra/QRAExportPanel';
import SimpleQRAModal from '../../components/qra/SimpleQRAModal';

// Enhanced color palette using bright, vibrant colors for cheerful activities
const getQRAColor = (index: number): string => {
  const brightColors = [
    '#42a5f5', // Light Blue
    '#ba68c8', // Purple
    '#ff9800', // Orange
    '#03a9f4', // Blue
    '#4caf50', // Green
    '#ff5722', // Deep Orange
    '#9c27b0', // Purple
    '#2196f3', // Blue
    '#8bc34a', // Light Green
    '#ffc107', // Amber
    '#e91e63', // Pink
    '#00bcd4', // Cyan
    '#cddc39', // Lime
    '#ff6f00', // Orange
    '#7b1fa2', // Deep Purple
    '#1976d2', // Blue
    '#388e3c', // Green
    '#f57c00', // Orange
    '#512da8', // Deep Purple
    '#0277bd', // Light Blue
    '#689f38', // Light Green
    '#f9a825', // Yellow
    '#c2185b', // Pink
    '#0097a7', // Cyan
    '#827717', // Lime
  ];
  return brightColors[index % brightColors.length];
};

interface ActivityState {
  id: string;
  name: string;
  practicePercent: number;
  nonRDTime: number;
  active: boolean;
  selectedRoles: string[];
  category?: string;
  area?: string;
  focus?: string;
}

// QRA Slider State interface
interface QRASliderState {
  [activityId: string]: {
    value: number;
    locked: boolean;
  };
}

interface IdentifyActivitiesTabProps {
  selectedYear: number;
  selectedBusinessId: string;
  businesses: Business[];
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  tabReadOnly: boolean[];
  setTabReadOnly: React.Dispatch<React.SetStateAction<boolean[]>>;
  approvedTabs: boolean[];
  setApprovedTabs: React.Dispatch<React.SetStateAction<boolean[]>>;
  onEdit: () => void;
  masterActivities: Record<string, any>[];
  loadingActivities: boolean;
}

// Data persistence will be handled by activitiesDataService

const IdentifyActivitiesTab: React.FC<IdentifyActivitiesTabProps> = ({
  selectedYear,
  selectedBusinessId,
  businesses,
  setBusinesses,
  tabReadOnly,
  setTabReadOnly,
  approvedTabs,
  setApprovedTabs,
  onEdit,
  masterActivities,
  loadingActivities
}) => {
  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
  const yearData = selectedBusiness?.years?.[selectedYear];
  
  // Helper function to flatten nested roles (same as in IdentifyRolesTab)
  const flattenAllRoles = (nodes: any[]): any[] => {
    if (!Array.isArray(nodes)) return [];
    let result: any[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenAllRoles(node.children));
      }
    });
    return result;
  };
  
  const roles = selectedBusiness?.rolesByYear?.[selectedYear] || [];
  const allRoles = flattenAllRoles(roles);

  // Extract activities from business data for the year
  const initialActivities: ActivityState[] = useMemo(() => yearData
    ? Object.entries(yearData.activities || {}).map(([id, act]: any) => ({
        id,
        name: act.name,
        practicePercent: act.practicePercent || 0,
        nonRDTime: act.nonRDTime || 0,
        active: act.active !== undefined ? act.active : true,
        selectedRoles: act.selectedRoles || [],
        category: act.category,
        area: act.area,
        focus: act.focus,
      }))
    : [], [yearData]);

  const [activities, setActivities] = useState<ActivityState[]>(initialActivities);
  const [filter, setFilter] = useState<{ 
    categories: string[]; 
    areas: string[]; 
    focuses: string[]; 
  }>({
    categories: [],
    areas: [],
    focuses: []
  });
  const [nonRDModalOpen, setNonRDModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityState | null>(null);
  
  // Practice Percentage and QRA state
  const [globalNonRDTime, setGlobalNonRDTime] = useState(10);
  const [nonRDDialogOpen, setNonRDDialogOpen] = useState(false);
  const [nonRDInput, setNonRDInput] = useState(10);
  const [qraSliderState, setQRASliderState] = useState<QRASliderState>({});
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Section locking state - initialize from saved data
  const [filterSectionLocked, setFilterSectionLocked] = useState(() => {
    const savedData = activitiesDataService.getActivitiesData(selectedBusinessId, selectedYear);
    return savedData?.filterSectionLocked !== undefined ? savedData.filterSectionLocked : false;
  });
  const [availableSectionLocked, setAvailableSectionLocked] = useState(() => {
    const savedData = activitiesDataService.getActivitiesData(selectedBusinessId, selectedYear);
    return savedData?.availableSectionLocked !== undefined ? savedData.availableSectionLocked : false;
  });
  const [filterSectionExpanded, setFilterSectionExpanded] = useState(() => {
    const savedData = activitiesDataService.getActivitiesData(selectedBusinessId, selectedYear);
    return savedData?.filterSectionExpanded !== undefined ? savedData.filterSectionExpanded : true;
  });
  const [availableSectionExpanded, setAvailableSectionExpanded] = useState(() => {
    const savedData = activitiesDataService.getActivitiesData(selectedBusinessId, selectedYear);
    return savedData?.availableSectionExpanded !== undefined ? savedData.availableSectionExpanded : true;
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // QRA data state to avoid async calls during rendering
  const [qraDataCache, setQraDataCache] = useState<Record<string, SubcomponentSelectionData>>({});
  
  // Ref to track which activities have been loaded to prevent duplicate loading
  const loadedActivitiesRef = useRef<{
    set: Set<string>;
    activityNamesString: string;
  }>({ set: new Set(), activityNamesString: '' });

  // Simplified QRA data loading - only load when needed, not on every activity change
  const loadQRADataForActivity = useCallback(async (activityName: string) => {
    if (!selectedBusinessId || !selectedYear) return null;
    
    try {
      // Find the activity to get its ID
      const activity = activities.find(a => a.name === activityName);
      if (!activity) {
        console.warn(`Activity not found: ${activityName}`);
        return null;
      }

      const activityId = activity.id;
      
      // Try to load from Supabase
      const qraData = await QRABuilderService.loadQRAData(selectedBusinessId, selectedYear, activityId);
      
      if (qraData) {
        // Cache the result
        setQraDataCache(prev => ({
          ...prev,
          [activityName]: qraData
        }));
        return qraData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error loading QRA data for ${activityName}:`, error);
      return null;
    }
  }, [selectedBusinessId, selectedYear, activities]);

  // Enhanced getQRAData with better error handling
  const getQRAData = async (activityName: string): Promise<SubcomponentSelectionData | null> => {
    try {
      // First check cache
      if (qraDataCache[activityName]) {
        return qraDataCache[activityName];
      }

      // Load from database if not in cache
      return await loadQRADataForActivity(activityName);
    } catch (error) {
      console.error(`Error loading QRA data for ${activityName}:`, error);
      return null;
    }
  };


  // QRA Modal state
  const [qraModalOpen, setQRAModalOpen] = useState(false);
  const [selectedActivityForQRA, setSelectedActivityForQRA] = useState<string>('');
  const [qraInitialData, setQraInitialData] = useState<SubcomponentSelectionData | null>(null);
  const [loadingQRAInitialData, setLoadingQRAInitialData] = useState(false);
  
  // Practice percentage modal state
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [selectedActivityForPractice, setSelectedActivityForPractice] = useState<ActivityState | null>(null);

  // Approval state
  const [isApproved, setIsApproved] = useState(false);
  const [approvalData, setApprovalData] = useState<TabApproval | null>(null);

  const theme = useTheme();

  // Normalize activity name lookup to prevent "Activity not found" errors
  const normalizeActivityName = (name: string): string => {
    return name.trim().toLowerCase();
  };

  // Helper function to get approval key
  const getApprovalKey = () => `activitiesTabApproval-${selectedYear}`;

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  // Load approval state from storage on mount
  useEffect(() => {
    const stored = approvalsService.getApprovalData('activities', selectedYear);
    if (stored) {
      setIsApproved(stored.isApproved);
      setApprovalData(stored.approvalData);
    } else {
      setIsApproved(false);
      setApprovalData(null);
    }
  }, [selectedYear]);

  // Load QRA data for all activities when component mounts or activities change
  useEffect(() => {
    const loadAllQRAData = async () => {
      if (!selectedBusinessId || !selectedYear || activities.length === 0) return;
      
      console.log('[IdentifyActivitiesTab] Loading QRA data for all activities...');
      
      // Clear the loaded activities ref for new business/year
      loadedActivitiesRef.current.set.clear();
      
      // Load QRA data for each active activity
      for (const activity of activities) {
        if (activity.active) {
          try {
            const qraData = await loadQRADataForActivity(activity.name);
            if (qraData) {
              // Update the cache with the loaded data
              setQraDataCache(prev => ({
                ...prev,
                [activity.name]: qraData
              }));
              // Mark this activity as loaded
              loadedActivitiesRef.current.set.add(activity.name);
            }
          } catch (error) {
            console.warn(`Failed to load QRA data for activity ${activity.name}:`, error);
          }
        }
      }
    };

    loadAllQRAData();
  }, [selectedBusinessId, selectedYear]); // Remove activities and loadQRADataForActivity from dependencies

  // Load QRA data for new activities when activities list changes
  useEffect(() => {
    const loadNewActivitiesQRAData = async () => {
      if (!selectedBusinessId || !selectedYear || activities.length === 0) return;
      
      // Only load QRA data for active activities that don't already have cached data
      for (const activity of activities) {
        if (activity.active && !loadedActivitiesRef.current.set.has(activity.name)) {
          try {
            console.log(`[IdentifyActivitiesTab] Loading QRA data for new activity: ${activity.name}`);
            const qraData = await loadQRADataForActivity(activity.name);
            if (qraData) {
              setQraDataCache(prev => ({
                ...prev,
                [activity.name]: qraData
              }));
              // Mark this activity as loaded
              loadedActivitiesRef.current.set.add(activity.name);
            }
          } catch (error) {
            console.warn(`Failed to load QRA data for activity ${activity.name}:`, error);
          }
        }
      }
    };

    // Use a ref to track if we've already processed the current activities
    const currentActivityNames = activities.map(a => a.name).join(',');
    if (currentActivityNames !== loadedActivitiesRef.current.activityNamesString) {
      loadedActivitiesRef.current.activityNamesString = currentActivityNames;
      loadNewActivitiesQRAData();
    }
  }, [activities.map(a => a.name).join(',')]); // Only depend on the string representation of activity names

  // Get or initialize QRA slider state for this business/year
  const getQRASliderState = useCallback((): QRASliderState => {
    return selectedBusiness?.qraSliderByYear?.[selectedYear] || {};
  }, [selectedBusiness, selectedYear]);

  // Update local QRA slider state for immediate UI updates - only when business/year changes
  useEffect(() => {
    const savedState = selectedBusiness?.qraSliderByYear?.[selectedYear] || {};
    if (Object.keys(savedState).length > 0) {
      setQRASliderState(savedState);
    }
  }, [selectedBusinessId, selectedYear, selectedBusiness?.qraSliderByYear]); // Remove getQRASliderState dependency

  // Proportional adjustment system - redistributes percentages when changes occur
  const redistributePercentages = (changedActivityId: string, newValue: number, reason: 'activity' | 'nonrd') => {
    const activeActivities = getActiveActivities();
    const currentNonRD = getNonRDTime();
    const maxTotalAllowed = 100 - currentNonRD;
    
    // Get current state
    const currentState = { ...qraSliderState };
    
    // Update the changed activity if it's an activity change
    if (reason === 'activity') {
      currentState[changedActivityId] = {
        value: newValue,
        locked: currentState[changedActivityId]?.locked || false
      };
    }
    
    // Calculate current total and identify locked/unlocked activities
    const lockedActivities = activeActivities.filter(a => currentState[a.id]?.locked);
    const unlockedActivities = activeActivities.filter(a => !currentState[a.id]?.locked);
    
    const lockedTotal = lockedActivities.reduce((sum, a) => sum + (currentState[a.id]?.value || 0), 0);
    const availableForUnlocked = maxTotalAllowed - lockedTotal;
    
    // If we have unlocked activities and need to redistribute
    if (unlockedActivities.length > 0 && availableForUnlocked > 0) {
      const currentUnlockedTotal = unlockedActivities.reduce((sum, a) => sum + (currentState[a.id]?.value || 0), 0);
      
      if (currentUnlockedTotal > 0) {
        // Redistribute proportionally among unlocked activities
        unlockedActivities.forEach(activity => {
          const currentValue = currentState[activity.id]?.value || 0;
          const proportion = currentValue / currentUnlockedTotal;
          const newProportionalValue = availableForUnlocked * proportion;
          
          currentState[activity.id] = {
            value: Math.max(0, Math.min(100, newProportionalValue)),
            locked: currentState[activity.id]?.locked || false
          };
        });
    } else {
        // Distribute equally among unlocked activities
        const equalShare = availableForUnlocked / unlockedActivities.length;
        unlockedActivities.forEach(activity => {
          currentState[activity.id] = {
            value: equalShare,
            locked: currentState[activity.id]?.locked || false
          };
        });
      }
    }
    
    return currentState;
  };

  // Handler to update QRA slider value with automatic percentage adjustment (Pro-rata)
  const handleQRASliderChange = (activityId: string, value: number) => {
    // Don't allow changes if the activity is locked
    if (qraSliderState[activityId]?.locked) {
      setNotification({
        open: true,
        message: 'Cannot modify locked activity. Unlock it first to make changes.',
        severity: 'warning'
      });
      return;
    }
    
         const newState = redistributePercentages(activityId, value, 'activity');
     
     // Update state and persist
     setQRASliderState(newState);
     
    // Save to business data immediately
     setBusinesses(prev => prev.map(business => {
       if (business.id === selectedBusinessId) {
         return {
           ...business,
           qraSliderByYear: {
             ...business.qraSliderByYear,
             [selectedYear]: newState
           }
         };
       }
       return business;
     }));

    // Also update the activity's practicePercent in the activities array
    setActivities(prev => prev.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          practicePercent: value
        };
      }
      return activity;
    }));
   };

  // Get active activities (added QRAs)
  const getActiveActivities = () => {
    return activities.filter(activity => activity.active);
  };

  // Get QRA percentages from current slider state
  const getQRAPercentages = () => {
    const activeActivities = getActiveActivities();
    const result: Record<string, { value: number; locked: boolean }> = {};
    
    activeActivities.forEach(activity => {
      result[activity.id] = { 
        value: qraSliderState[activity.id]?.value || 0, 
        locked: qraSliderState[activity.id]?.locked || false 
      };
    });

    return result;
  };

  // Get Non-R&D time from business object (per year)
  const getNonRDTime = (): number => {
    return selectedBusiness?.nonRDByYear?.[selectedYear] ?? globalNonRDTime;
  };

  // Update Non-R&D time in business object with proportional adjustment
  const updateNonRDTime = (value: number) => {
    setGlobalNonRDTime(value);
    
    // Redistribute activity percentages when non-R&D time changes
    const newState = redistributePercentages('', value, 'nonrd');
    setQRASliderState(newState);
    
    setBusinesses(bs => bs.map(b => {
      if (b.id === selectedBusinessId) {
        const nonRDByYear = { ...(b.nonRDByYear || {}) };
        nonRDByYear[selectedYear] = value;
        return { 
          ...b, 
          nonRDByYear,
          qraSliderByYear: {
            ...b.qraSliderByYear,
            [selectedYear]: newState
          }
        };
      }
      return b;
    }));
  };

  // Section locking handlers
  const handleToggleFilterSectionLock = () => {
    const newLocked = !filterSectionLocked;
    setFilterSectionLocked(newLocked);
    if (newLocked) {
      setFilterSectionExpanded(false);
    } else {
      setFilterSectionExpanded(true);
    }
  };

  const handleToggleAvailableSectionLock = () => {
    const newLocked = !availableSectionLocked;
    setAvailableSectionLocked(newLocked);
    if (newLocked) {
      setAvailableSectionExpanded(false);
    } else {
      setAvailableSectionExpanded(true);
    }
  };

  // Open Non-R&D dialog and set input to current value
  const handleOpenNonRDDialog = () => {
    const currentNonRD = getNonRDTime();
    setNonRDInput(currentNonRD);
    setNonRDDialogOpen(true);
  };

  const handleCloseNonRDDialog = () => setNonRDDialogOpen(false);

  const handleSaveNonRD = () => {
    updateNonRDTime(nonRDInput);
    setNonRDDialogOpen(false);
    setTimeout(() => {
      const el = document.activeElement;
      if (el && 'blur' in el && typeof (el as HTMLElement).blur === 'function') {
        (el as HTMLElement).blur();
    }
    }, 0); // Fix aria-hidden focus issue
  };

  // --- Practice Percentage Bar with legend and improved segments ---
  const renderPracticeBar = () => {
    const activeActivities = getActiveActivities();
    const qraPercentages = getQRAPercentages();
    const currentNonRD = getNonRDTime();
    
    let left = 0;
    // Create segments for each active activity with bright colors
    const segments: React.ReactElement[] = [];
    const percentLabels: { color: string; label: string; percent: number }[] = [];
    
    activeActivities.forEach((activity, idx) => {
      const percent = qraSliderState[activity.id]?.value || 0;
      if (percent > 0) {
        const bgColor = getQRAColor(idx);
        
        segments.push(
          <Box
            key={activity.id}
            sx={{
              position: 'absolute',
              left: `${left}%`,
              width: `${percent}%`,
              height: '100%',
              backgroundColor: bgColor,
              borderRight: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {percent >= 8 && (
              <Typography variant="caption" sx={{ 
                color: 'white', 
                fontWeight: 600,
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                fontSize: '0.7rem'
              }}>
                {percent.toFixed(1)}%
              </Typography>
            )}
          </Box>
        );

        percentLabels.push({
          color: bgColor,
          label: activity.name + (activity.focus ? ` (${activity.focus})` : ''),
          percent: percent
        });

        left += percent;
      }
    });

    // Add Non-R&D segment using the actual stored non-R&D time value
    if (currentNonRD > 0) {
      segments.push(
        <Box
          key="non-rd"
          sx={{
            position: 'absolute',
            left: `${left}%`,
            width: `${currentNonRD}%`,
            height: '100%',
            backgroundColor: '#e0e0e0',
            borderRight: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {currentNonRD >= 8 && (
            <Typography variant="caption" sx={{ 
              color: '#666', 
              fontWeight: 600,
              fontSize: '0.7rem'
            }}>
              {currentNonRD.toFixed(1)}%
            </Typography>
          )}
        </Box>
      );

      percentLabels.push({
        color: '#e0e0e0',
        label: 'Non-R&D Time',
        percent: currentNonRD
      });
    }

    // Calculate warning for sum of percentages
    const totalPercent = percentLabels.reduce((sum, seg) => sum + seg.percent, 0);
    const percentWarning = Math.abs(totalPercent - 100) > 0.01 ? (
      <Typography color="warning.main" sx={{ mt: 1 }}>
        Warning: The sum of all activity and Non R&D percentages is {totalPercent.toFixed(2)}% (should be 100%).
      </Typography>
    ) : null;

    return (
      <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: '#fafcff', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700, mr: 1 }}>
            Practice Percentage
          </Typography>
          <Tooltip title="Set Non R&D time">
            <IconButton size="small" onClick={handleOpenNonRDDialog}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 1, borderRadius: 1, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
          {/* Segments */}
          {segments}
        </Box>
        {/* Combined legend: Title (number%) */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1, alignItems: 'center' }}>
          {percentLabels.map((seg, index) => (
            <Box key={`legend-${index}-${seg.label || 'unnamed'}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FiberManualRecordIcon sx={{ color: seg.color, fontSize: 14 }} />
              <Typography variant="caption" sx={{ color: '#757575' }}>
                {`${seg.label || 'Unnamed'} (${seg.percent.toFixed(2)}%)`}
              </Typography>
            </Box>
          ))}
        </Box>
        {percentWarning}
        <Typography variant="caption" sx={{ color: '#757575', mt: 1, display: 'block' }}>
          Non R&D time: {currentNonRD}%
        </Typography>
      </Card>
    );
  };

  // Applied Percentage Progress Bar
  const renderAppliedBar = () => {
    const activeActivities = getActiveActivities();
    const activitiesWithQRA = activeActivities.filter(activity => isQRACompleted(activity.name));
    
    if (activitiesWithQRA.length === 0) {
      return null; // Don't show the bar if no activities have completed QRA
    }

    let left = 0;
    const segments: React.ReactElement[] = [];
    const percentLabels: { color: string; label: string; percent: number }[] = [];
    
    activitiesWithQRA.forEach((activity, idx) => {
      const appliedPercent = getAppliedPercentage(activity.name);
      
      if (appliedPercent > 0) {
        // Only first and last segments have rounded ends
        let borderRadius = '0';
        if (idx === 0) borderRadius = '8px 0 0 8px';
        if (idx === activitiesWithQRA.length - 1) borderRadius = '0 8px 8px 0';
        
        segments.push(
          <Box 
            key={`applied-${idx}`} 
            sx={{ 
              position: 'absolute', 
              left: `${left}%`, 
              top: 0, 
              height: '100%', 
              width: `${appliedPercent}%`, 
              bgcolor: getQRAColor(activeActivities.findIndex(a => a.id === activity.id)), 
              borderRight: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }} 
          >
            {appliedPercent >= 8 && (
              <Typography variant="caption" sx={{ 
                color: 'white', 
                fontWeight: 600,
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                fontSize: '0.7rem'
              }}>
                {appliedPercent.toFixed(1)}%
              </Typography>
            )}
          </Box>
        );
        percentLabels.push({ 
          color: getQRAColor(activeActivities.findIndex(a => a.id === activity.id)), 
          label: activity.name + (activity.focus ? ` (${activity.focus})` : ''), 
          percent: appliedPercent 
        });
        left += appliedPercent;
      }
    });

    // Calculate total applied percentage
    const totalAppliedPercent = percentLabels.reduce((sum, seg) => sum + seg.percent, 0);

    return (
      <Card variant="outlined" sx={{ mb: 3, p: 2, bgcolor: '#faf5ff', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 700, mr: 1 }}>
            Applied Percentage
          </Typography>
          <Tooltip title="Sum of applied percentages from configured subcomponents">
            <InfoOutlinedIcon fontSize="small" sx={{ color: '#7b1fa2' }} />
          </Tooltip>
        </Box>
        <Box sx={{ position: 'relative', width: '100%', height: 32, mb: 1, borderRadius: 1, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
          {/* Segments */}
          {segments}
        </Box>
        {/* Combined legend: Title (number%) */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1, alignItems: 'center' }}>
          {percentLabels.map((seg, index) => (
            <Box key={`applied-legend-${index}-${seg.label || 'unnamed'}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FiberManualRecordIcon sx={{ color: seg.color, fontSize: 14 }} />
              <Typography variant="caption" sx={{ color: '#757575' }}>
                {`${seg.label || 'Unnamed'} (${seg.percent.toFixed(2)}%)`}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography variant="caption" sx={{ color: '#757575', mt: 1, display: 'block' }}>
          Total Applied: {totalAppliedPercent.toFixed(2)}%
        </Typography>
      </Card>
    );
  };

  // Dialog for Non R&D time
  const renderNonRDDialog = () => (
    <Dialog open={nonRDDialogOpen} onClose={handleCloseNonRDDialog}>
      <DialogTitle>Set Non R&D Time</DialogTitle>
      <DialogContent>
        <TextField
          label="Non R&D Time (%)"
          type="number"
          value={nonRDInput}
          onChange={e => setNonRDInput(Math.max(0, Math.min(100, Number(e.target.value))))}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
            inputProps: { min: 0, max: 100 }
          }}
          fullWidth
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseNonRDDialog}>Cancel</Button>
        <Button onClick={handleSaveNonRD} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );

  // Data persistence with activitiesDataService - FIXED to prevent infinite loops
  useEffect(() => {
    // Load persisted data when component mounts or year changes
    const savedData = activitiesDataService.getActivitiesData(selectedBusinessId, selectedYear);
    if (savedData) {
      setActivities(savedData.activities || []);
      setQRASliderState(savedData.qraSliderState || {});
      setGlobalNonRDTime(savedData.nonRDTime || 10);
      setFilter(savedData.filter || { categories: [], areas: [], focuses: [] });
      
      // Load locking states with proper defaults
      setFilterSectionLocked(savedData.filterSectionLocked !== undefined ? savedData.filterSectionLocked : false);
      setAvailableSectionLocked(savedData.availableSectionLocked !== undefined ? savedData.availableSectionLocked : false);
      setFilterSectionExpanded(savedData.filterSectionExpanded !== undefined ? savedData.filterSectionExpanded : true);
      setAvailableSectionExpanded(savedData.availableSectionExpanded !== undefined ? savedData.availableSectionExpanded : true);
    } else {
      // Reset to defaults if no saved data - CRITICAL: Clear data for new year
      setActivities([]);
      setQRASliderState({});
      setGlobalNonRDTime(10);
      setFilter({ categories: [], areas: [], focuses: [] });
      setFilterSectionLocked(false);
      setAvailableSectionLocked(false);
      setFilterSectionExpanded(true);
      setAvailableSectionExpanded(true);
    }
  }, [selectedYear, selectedBusinessId]);

  // Persist data changes to activitiesDataService with debouncing
  useEffect(() => {
    const saveData = setTimeout(() => {
      const dataToSave: ActivitiesTabData = {
        activities,
        qraSliderState,
        nonRDTime: globalNonRDTime,
        filter,
        filterSectionLocked,
        availableSectionLocked,
        filterSectionExpanded,
        availableSectionExpanded
      };
      
      activitiesDataService.saveActivitiesData(selectedBusinessId, selectedYear, dataToSave);
    }, 500); // 500ms debounce

    return () => clearTimeout(saveData);
  }, [
    activities, 
    qraSliderState, 
    globalNonRDTime, 
    filter, 
    filterSectionLocked, 
    availableSectionLocked, 
    filterSectionExpanded, 
    availableSectionExpanded, 
    selectedBusinessId, 
    selectedYear
  ]);

  // Update business data when activities change - DEBOUNCED and isolated by year
  useEffect(() => {
    const updateBusinessData = setTimeout(() => {
    setBusinesses(bs => bs.map(b => {
      if (b.id === selectedBusinessId) {
        return {
          ...b,
          years: {
            ...b.years,
            [selectedYear]: {
              ...b.years?.[selectedYear],
              activities: activities.reduce((acc, a) => ({
                ...acc,
                [a.id]: {
                  name: a.name,
                  practicePercent: a.practicePercent,
                  active: a.active,
                  selectedRoles: a.selectedRoles,
                  category: a.category,
                  area: a.area,
                  focus: a.focus,
                }
              }), {})
            }
          }
        };
      }
      return b;
    }));
    }, 300); // 300ms debounce

    return () => clearTimeout(updateBusinessData);
  }, [activities, selectedBusinessId, selectedYear, setBusinesses]);

  // Clean up malformed IDs - ONLY when explicitly called, not in useEffect
  const cleanupMalformedActivityIds = useCallback(() => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness?.years?.[selectedYear]?.activities) return;

    const activities = selectedBusiness.years[selectedYear].activities;
    const malformedIds = Object.keys(activities).filter(id => 
      id.includes('undefined') || id.includes('null')
    );

    if (malformedIds.length > 0) {
      console.log('Cleaning up malformed activity IDs:', malformedIds);
      
      setBusinesses(prev => prev.map(business => {
        if (business.id === selectedBusinessId) {
          const yearData = business.years?.[selectedYear];
          if (!yearData?.activities) return business;

          const cleanedActivities: Record<string, any> = {};
          
          Object.entries(yearData.activities).forEach(([id, activity]: [string, any]) => {
            if (malformedIds.includes(id)) {
              const cleanId = `${activity.category || 'Unknown'}_${activity.area || 'Unknown'}_${activity.focus || 'Unknown'}_${activity.name || 'Activity'}_${Date.now()}`;
              console.log(`Cleaned up activity ID: ${id} -> ${cleanId}`);
              cleanedActivities[cleanId] = { ...activity };
            } else {
              cleanedActivities[id] = activity;
            }
          });

          return {
            ...business,
            years: {
              ...business.years,
              [selectedYear]: {
                ...yearData,
                activities: cleanedActivities
              }
            }
          };
        }
        return business;
      }));
    }
  }, [selectedBusinessId, selectedYear, businesses, setBusinesses]);

  const handlePracticePercentChange = (activityId: string, value: number) => {
    handleQRASliderChange(activityId, value);
    
    // Refresh QRA data for this activity when practice percent changes
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      // Remove from loaded activities so it will be reloaded
      loadedActivitiesRef.current.set.delete(activity.name);
      
      // Reload QRA data for this activity
      loadQRADataForActivity(activity.name).then(qraData => {
        if (qraData) {
          setQraDataCache(prev => ({
            ...prev,
            [activity.name]: qraData
          }));
          // Mark as loaded again
          loadedActivitiesRef.current.set.add(activity.name);
        }
      }).catch(error => {
        console.warn(`Failed to reload QRA data for activity ${activity.name}:`, error);
      });
    }
  };

  // Toggle lock state for QRA slider
  const handleToggleLock = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const isCurrentlyLocked = qraSliderState[activityId]?.locked || false;

    if (isCurrentlyLocked) {
      // Unlocking - allow proportional adjustment
      const newState = { ...qraSliderState };
      newState[activityId] = {
        value: qraSliderState[activityId]?.value || 0,
            locked: false 
      };
      
      // Redistribute percentages among unlocked activities
      const redistributedState = redistributePercentages(activityId, newState[activityId].value, 'activity');
      setQRASliderState(redistributedState);
      
      // Save to business data
      setBusinesses(prev => prev.map(business => {
        if (business.id === selectedBusinessId) {
          return {
            ...business,
            qraSliderByYear: {
              ...business.qraSliderByYear,
              [selectedYear]: redistributedState
            }
          };
        }
        return business;
      }));
    } else {
      // Locking - prevent proportional adjustment
      const newState = { ...qraSliderState };
      newState[activityId] = {
        value: qraSliderState[activityId]?.value || 0,
          locked: true 
      };
      
      setQRASliderState(newState);
      
      // Save to business data
      setBusinesses(prev => prev.map(business => {
        if (business.id === selectedBusinessId) {
          return {
            ...business,
            qraSliderByYear: {
              ...business.qraSliderByYear,
              [selectedYear]: newState
            }
          };
        }
        return business;
      }));
    }
  };

  const handleActiveChange = (activityId: string, checked: boolean) => {
    setActivities(prev => prev.map(a =>
      a.id === activityId ? { ...a, active: checked } : a
    ));
  };

  const handleRolesChange = (activityId: string, roles: string[]) => {
    setActivities(prev => prev.map(a =>
      a.id === activityId ? { ...a, selectedRoles: roles } : a
    ));
  };

  const handleNonRDTimeChange = (activityId: string, value: number) => {
    setActivities(prev => prev.map(a =>
      a.id === activityId ? { ...a, nonRDTime: value } : a
    ));
  };

  // Chips and filtering based on masterActivities - now with multiple selections
  const uniqueCategories = useMemo(() => Array.from(new Set(masterActivities.map(a => a.category).filter(Boolean))), [masterActivities]);
  
  const uniqueAreas = useMemo(() => {
    if (filter.categories.length === 0) return [];
    return Array.from(new Set(
      masterActivities
        .filter(a => filter.categories.includes(a.category))
        .map(a => a.area)
        .filter(Boolean)
    ));
  }, [masterActivities, filter.categories]);
  
  const uniqueFocuses = useMemo(() => {
    if (filter.categories.length === 0 || filter.areas.length === 0) return [];
    return Array.from(new Set(
      masterActivities
        .filter(a => filter.categories.includes(a.category) && filter.areas.includes(a.area))
        .map(a => a.focus)
        .filter(Boolean)
    ));
  }, [masterActivities, filter.categories, filter.areas]);

  // Activities for selected filters - now supports multiple combinations
  const filteredResearchActivities = useMemo(() => {
    if (filter.categories.length === 0 || filter.areas.length === 0 || filter.focuses.length === 0) return [];
    
    const filteredActivities = masterActivities.filter(a => 
      filter.categories.includes(a.category) && 
      filter.areas.includes(a.area) && 
      filter.focuses.includes(a.focus) &&
      a.researchActivity && // Only show items that have a research activity
      a.researchActivity.trim() !== '' // Make sure it's not empty
    );
    
    // Group by research activity to avoid duplicates
    const uniqueActivities = filteredActivities.reduce((acc, activity) => {
      const key = `${activity.category}-${activity.area}-${activity.focus}-${activity.researchActivity}`;
      if (!acc[key]) {
        acc[key] = activity;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(uniqueActivities);
  }, [masterActivities, filter]);

  // Map of configured activities for the year
  const configuredActivities = useMemo(() => {
    const map: Record<string, ActivityState> = {};
    activities.forEach(a => { map[a.id] = a; });
    return map;
  }, [activities]);

  // Handler to add activity to year with practice percentage integration
  const handleAddActivity = (activity: any) => {
    // Prevent changes if available section is locked
    if (availableSectionLocked) {
      setNotification({
        open: true,
        message: 'Cannot add activities while Available Research Activities section is locked.',
        severity: 'warning'
      });
      return;
    }

    const activeActivities = getActiveActivities();
    const currentNonRD = getNonRDTime();
    const availablePercent = 100 - currentNonRD;
    
    // Calculate default percentage for new activity
    // If there are existing activities, give this new one an equal share of the remaining
    const defaultPercent = activeActivities.length > 0 
      ? availablePercent / (activeActivities.length + 1)
      : availablePercent;

    // Extract activity properties with proper fallbacks and validation
    const activityName = activity.researchActivity || activity['Research Activity'] || activity.name || 'Unnamed Activity';
    const category = activity.category || activity['Category'] || 'Healthcare';
    const area = activity.area || activity['Area'] || 'Dentistry';
    const focus = activity.focus || activity['Focus'] || 'General';
    
    // Generate a clean ID based on available data - ensure no undefined values
    const sanitizeForId = (str: string | undefined | null) => {
      if (!str || str === 'undefined' || str === 'null' || str === undefined || str === null) {
        return 'Unknown';
      }
      return String(str).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    };
    
    // Validate all components before generating ID
    const cleanCategory = sanitizeForId(category);
    const cleanArea = sanitizeForId(area);
    const cleanFocus = sanitizeForId(focus);
    const cleanName = sanitizeForId(activityName);
    

    
    const cleanId = activity.id || 
      `${cleanCategory}_${cleanArea}_${cleanFocus}_${cleanName}`;

    const newActivity: ActivityState = {
      id: cleanId,
      name: activityName,
      practicePercent: defaultPercent,
        nonRDTime: 0,
        active: true,
      selectedRoles: allRoles.map(role => role.id), // Preselect all roles
      category,
      area,
      focus,
    };

    // Add new activity to state
    setActivities(prev => [...prev, newActivity]);

    // Initialize QRA slider state with the calculated percentage (unlocked by default)
    const newQRAState = {
      ...qraSliderState,
      [newActivity.id]: { value: defaultPercent, locked: false }
    };

    // Re-distribute existing unlocked activities to accommodate the new one
    const existingUnlocked = activeActivities.filter(act => !qraSliderState[act.id]?.locked);
    if (existingUnlocked.length > 0) {
      const remainingPercent = availablePercent - defaultPercent;
      const perActivityPercent = remainingPercent / existingUnlocked.length;
      
      existingUnlocked.forEach(act => {
        if (!newQRAState[act.id]?.locked) {
          newQRAState[act.id] = { value: perActivityPercent, locked: false };
        }
      });
    }

    setQRASliderState(newQRAState);

    // Update business data immediately
    setBusinesses(bs => bs.map(b => {
      if (b.id === selectedBusinessId) {
        const qraSliderByYear = { ...(b.qraSliderByYear || {}) };
        qraSliderByYear[selectedYear] = newQRAState;
        return { ...b, qraSliderByYear };
      }
      return b;
    }));
  };

  // Handler to remove activity from year
  const handleRemoveActivity = (activityId: string) => {
    // Find the activity being removed to get its name
    const activityToRemove = activities.find(a => a.id === activityId);
    
    // Remove activity from activities array
    setActivities(prev => prev.filter(a => a.id !== activityId));
    
    // Clean up QRA slider state
    setQRASliderState(prev => {
      const newState = { ...prev };
      delete newState[activityId];
      return newState;
    });
    
    // Clean up all associated QRA data from business object
    if (activityToRemove) {
      setBusinesses(prev => prev.map(business => {
        if (business.id === selectedBusinessId) {
          const yearData = business.years?.[selectedYear] || { activities: {} };
          const updatedQRAData = { ...(yearData as any)?.qraData };
          
          // Remove QRA data for this activity
          delete updatedQRAData[activityToRemove.name];
          
          // Remove activity from activities data
          const updatedActivities = { ...yearData.activities };
          delete updatedActivities[activityId];
          
          // Update QRA slider state in business data
          const qraSliderByYear = { ...(business.qraSliderByYear || {}) };
          const updatedQRASliderState = { ...qraSliderByYear[selectedYear] };
          delete updatedQRASliderState[activityId];
          qraSliderByYear[selectedYear] = updatedQRASliderState;
          
          return {
            ...business,
            years: {
              ...business.years,
              [selectedYear]: {
                ...yearData,
                activities: updatedActivities,
                qraData: updatedQRAData
              }
            },
            qraSliderByYear
          };
        }
        return business;
      }));
    }
  };

  // Show all activities by default, filter if categories or areas are selected
  const filteredActivities = activities.filter(a => {
    if (filter.categories.length > 0 && !filter.categories.includes(a.category || '')) return false;
    if (filter.areas.length > 0 && !filter.areas.includes(a.area || '')) return false;
    return true;
  });

  const openNonRDModal = (activity: ActivityState) => {
    setSelectedActivity(activity);
    setNonRDModalOpen(true);
  };

  // Generate QRA tab when activities are ready
  const handleGenerateQRA = () => {
    const activeActivities = getActiveActivities();
    console.log('Generate QRA clicked, active activities:', activeActivities);
    
    if (activeActivities.length === 0) {
      setNotification({
        open: true,
        message: 'Please add at least one active research activity before generating QRA.',
        severity: 'warning'
      });
      return;
    }
    
    // QRA generation completed
    
    // Show success notification
    setNotification({
      open: true,
      message: `QRA tab generated successfully for ${activeActivities.length} research activities!`,
      severity: 'success'
    });
    
    // QRA generation completed - no tab switching needed
    
    console.log(`QRA generated for ${activeActivities.length} activities`);
  };

  // Handle Configure Subcomponents for specific activity
  const handleConfigureSubcomponents = async (activityName: string) => {
    setSelectedActivityForQRA(activityName);
    setLoadingQRAInitialData(true);
    
    try {
      const initialData = await getQRAData(activityName);
      setQraInitialData(initialData);
    } catch (error) {
      console.error('Error loading QRA initial data:', error);
      setQraInitialData(null);
    } finally {
      setLoadingQRAInitialData(false);
    setQRAModalOpen(true);
    }
  };

  // Enhanced handleQRAModalComplete with better error handling
  const handleQRAModalComplete = async (data: SubcomponentSelectionData) => {
    if (!selectedActivityForQRA) return;

    try {
      // Find the activity to get its ID - use normalized comparison
      const normalizedName = normalizeActivityName(selectedActivityForQRA);
      const activity = activities.find(a => normalizeActivityName(a.name) === normalizedName);
      
      if (!activity) {
        console.warn(`Activity not found: ${selectedActivityForQRA}`);
        return;
      }

      const activityId = activity.id;
      
      // Save QRA data to Supabase
      await QRABuilderService.saveQRAData(selectedBusinessId, selectedYear, activityId, selectedActivityForQRA, data);
      
      // Update local cache
      setQraDataCache(prev => ({
        ...prev,
        [selectedActivityForQRA]: data
      }));

    setNotification({
      open: true,
        message: `QRA data saved successfully for ${selectedActivityForQRA}`,
      severity: 'success'
    });
    } catch (error) {
      console.error('Error saving QRA data:', error);
      setNotification({
        open: true,
        message: 'Failed to save QRA data. Please try again.',
        severity: 'error'
      });
    }
  };

  const loadActivities = () => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    const yearData = selectedBusiness?.years?.[selectedYear];
    const loadedActivities: ActivityState[] = yearData
      ? Object.entries(yearData.activities || {}).map(([id, act]: any) => ({
          id,
          name: act.name,
          practicePercent: act.practicePercent || 0,
          nonRDTime: act.nonRDTime || 0,
          active: act.active !== undefined ? act.active : true,
          selectedRoles: act.selectedRoles || [],
          category: act.category,
          area: act.area,
          focus: act.focus,
        }))
      : [];
    setActivities(loadedActivities);
  };

  // Add demo activity for testing
  const addDemoActivity = () => {
    const demoActivity: ActivityState = {
      id: `demo-${Date.now()}`,
      name: `Demo Research Activity ${activities.length + 1}`,
      practicePercent: 20,
      nonRDTime: 0,
      active: true,
      selectedRoles: [],
      category: 'Software Development',
      area: 'Product Development',
      focus: 'AI Research'
    };
    setActivities(prev => [...prev, demoActivity]);
  };

  // Handle unapproval
  const handleUnapprove = () => {
    approvalsService.removeApproval('activities', selectedYear);
    setApprovalData(null);
    setIsApproved(false);
  };

  
  // Add loading guard to prevent activity lookup errors
  if (loadingActivities || !masterActivities || masterActivities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Helper function to get subcomponent count for an activity
  const getSubcomponentCount = (activityName: string): number => {
    const qraData = qraDataCache[activityName];
    return qraData && qraData.selectedSubcomponents ? Object.keys(qraData.selectedSubcomponents).length : 0;
  };

  // Helper function to get applied percentage for an activity
  const getAppliedPercentage = (activityName: string): number => {
    const qraData = qraDataCache[activityName];
    if (!qraData) return 0;
    
    // Applied percentage is directly from the QRA data totalAppliedPercent
    // This represents the percentage of time spent on qualifying R&D activities
    return qraData.totalAppliedPercent || 0;
  };

  // Helper function to check if QRA is completed for an activity
  const isQRACompleted = (activityName: string): boolean => {
    const qraData = qraDataCache[activityName];
    return qraData !== null && qraData !== undefined && qraData.selectedSubcomponents && Object.keys(qraData.selectedSubcomponents).length > 0;
  };

  // Handle practice percentage modal
  const handleOpenPracticeModal = (activity: ActivityState) => {
    setSelectedActivityForPractice(activity);
    setPracticeModalOpen(true);
  };

  const handleClosePracticeModal = () => {
    setPracticeModalOpen(false);
    setSelectedActivityForPractice(null);
  };

  // Get current practice percentage for the selected activity (reactive to slider changes)

  const getCurrentPracticePercent = (activityName: string): number => {
    const activity = activities.find(a => a.name === activityName);
    if (!activity) return 0;
    
    return qraSliderState[activity.id]?.value || activity.practicePercent || 0;
  };

  // Handle approval
  const handleApprove = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ipAddress = data.ip;
      
      const approval: TabApproval = {
        timestamp: new Date().toISOString(),
        ipAddress,
        data: {
          activities,
          qraSliderState,
          nonRDTime: globalNonRDTime,
          filter
        }
      };
      
      approvalsService.recordApproval('activities', approval, selectedYear);
      setApprovalData(approval);
      setIsApproved(true);
    } catch (error) {
      console.error('Error getting IP address:', error);
    }
  };

  return (
    <Box>
      {/* AppBar with template management and approval */}
      <AppBar
        position="static"
        color="default"
        elevation={1}
        sx={{
          mb: 2,
          bgcolor: isApproved ? theme.palette.success.light : undefined,
          color: isApproved ? theme.palette.success.contrastText : undefined,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              Activities
              {isApproved && (
                <CheckCircleIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
              )}
            </Typography>
            {isApproved && approvalData && (
              <Box sx={{ ml: 3, fontSize: 14 }}>
                Approved: {new Date(approvalData.timestamp).toLocaleString()} (IP: {approvalData.ipAddress})
              </Box>
            )}
            <Tooltip title="View help and statistics">
              <IconButton 
                size="small" 
                onClick={() => setHelpDialogOpen(true)}
                sx={{ ml: 1 }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UnifiedTemplateManagement
              currentYear={selectedYear}
              businessId={selectedBusinessId}
              getCurrentActivitiesData={() => ({
                activities: activities,
                qraSliderState: qraSliderState,
                nonRDTime: globalNonRDTime,
                filter: filter,
                approvalState: approvalsService.isTabApproved('activities', selectedYear)
              })}
              getCurrentRolesData={() => roles}
              getCurrentQRAData={() => {
                // Return QRA data from cache for all activities
                return qraDataCache;
              }}
              onTemplateApplied={(template) => {
                // Clear any existing approvals since we're applying new data
                localStorage.removeItem(`activitiesTabApproval-${selectedYear}`);
                localStorage.removeItem(`rolesTabApproval-${selectedYear}`);
                
                // Reload business data to get the updated activities
                const STORAGE_KEY = 'businessInfoData';
                const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                
                if (savedData.businesses) {
                  // Update businesses state to trigger re-render with new data
                  setBusinesses(savedData.businesses.map((business: any) => ({
                    ...business,
                    tabApprovals: business.tabApprovals ?? {
                      basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
                      ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
                      financial: { isApproved: false, approvedAt: '', approvedBy: '' }
                    },
                    rolesByYear: business.rolesByYear ?? {},
                    years: business.years ?? {}
                  })));
                }
                
                // Show success notification
                setNotification({
                  open: true,
                  message: `Template "${template.templateName}" applied successfully! Activities, roles, and QRA data have been updated.`,
                  severity: 'success'
                });
              }}
              updateActivities={(data) => {
                // Update local state
                setActivities(data.activities || []);
                setQRASliderState(data.qraSliderState || {});
                setGlobalNonRDTime(data.nonRDTime || 0);
                setFilter(data.filter || { categories: [], areas: [], focuses: [] });
                
                // Also update the business state to ensure practice percentages are reflected
                setBusinesses(prevBusinesses => prevBusinesses.map(b => {
                  if (b.id === selectedBusinessId) {
                    const updatedYearData = { ...b.years?.[selectedYear] };
                    
                    // Convert activities data to business format
                    const businessActivitiesData: Record<string, any> = {};
                    (data.activities || []).forEach((activity: any) => {
                      businessActivitiesData[activity.id] = {
                        name: activity.name,
                        practicePercent: activity.practicePercent || 0,
                        nonRDTime: activity.nonRDTime || 0,
                        active: activity.active !== undefined ? activity.active : true,
                        selectedRoles: activity.selectedRoles || [],
                        category: activity.category,
                        area: activity.area,
                        focus: activity.focus
                      };
                    });
                    
                    updatedYearData.activities = businessActivitiesData;
                    
                    return {
                      ...b,
                      years: {
                        ...b.years,
                        [selectedYear]: updatedYearData
                      },
                      qraSliderByYear: {
                        ...b.qraSliderByYear,
                        [selectedYear]: data.qraSliderState || {}
                      }
                    };
                  }
                  return b;
                }));
              }}
              updateRoles={(newRoles) => {
                // Update roles in the businesses state
                setBusinesses(bs => bs.map(b => {
                  if (b.id === selectedBusinessId) {
                    return {
                      ...b,
                      rolesByYear: {
                        ...b.rolesByYear,
                        [selectedYear]: newRoles
                      }
                    };
                  }
                  return b;
                }));
              }}
              updateQRAData={async (qraData) => {
                // Apply QRA data to Supabase for each activity
                for (const [activityName, data] of Object.entries(qraData)) {
                  // Find the activity ID by name
                  const activity = activities.find(a => a.name === activityName);
                  if (activity) {
                    try {
                      const success = await saveQRADataToSupabase(selectedBusinessId, selectedYear, activity.id, data);
                      if (success) {
                        console.log(`Applied QRA data to Supabase for activity "${activityName}" with ID "${activity.id}"`);
                      } else {
                        console.warn(`Failed to save QRA data to Supabase for activity "${activityName}", falling back to localStorage`);
                        // Fallback to localStorage
                        const storageKey = `qra_${selectedBusinessId}_${selectedYear}_${activity.id}`;
                        localStorage.setItem(storageKey, JSON.stringify(data));
                      }
                    } catch (error) {
                      console.error(`Error saving QRA data to Supabase for activity "${activityName}":`, error);
                      // Fallback to localStorage
                      const storageKey = `qra_${selectedBusinessId}_${selectedYear}_${activity.id}`;
                      localStorage.setItem(storageKey, JSON.stringify(data));
                    }
                  } else {
                    console.warn(`Could not find activity with name "${activityName}" to apply QRA data`);
                  }
                }
                
                // Update the QRA data cache
                setQraDataCache(prev => ({
                  ...prev,
                  ...qraData
                }));
                
                // Also update the business state for consistency
                setBusinesses(prevBusinesses => prevBusinesses.map(b => {
                  if (b.id === selectedBusinessId) {
                    return {
                      ...b,
                      years: {
                        ...b.years,
                        [selectedYear]: {
                          ...b.years?.[selectedYear],
                          qraData: qraData
                        }
                      }
                    };
                  }
                  return b;
                }));
              }}
            />
            {isApproved ? (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<LockOpenIcon />}
                onClick={handleUnapprove}
              >
                Unapprove
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<LockIcon />}
                onClick={handleApprove}
                sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText, '&:hover': { bgcolor: theme.palette.success.main } }}
              >
                Approve
              </Button>
            )}

          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Practice Percentage Bar */}
      {renderPracticeBar()}
      
      {/* Applied Percentage Bar */}
      {renderAppliedBar()}
      
      {/* My R&D Activities - Sleek and Compact */}
      {activities.length > 0 && (
        <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  My R&D Activities
                </Typography>
                <Chip 
                  label={activities.length} 
                  size="small" 
                  color="success" 
                variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Practice Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {getActiveActivities().reduce((sum, a) => sum + (qraSliderState[a.id]?.value || 0), 0).toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Non-R&D
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                    {getNonRDTime()}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {activities.map((activity, idx) => (
                <Box 
                  key={activity.id} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    p: 1.5, 
                    borderRadius: 2,
                    bgcolor: activity.active ? 'background.paper' : 'grey.50',
                    border: '1px solid',
                    borderColor: activity.active ? getQRAColor(idx) : 'divider',
                    opacity: activity.active ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {/* Color indicator */}
                  <Box
                    sx={{
                      width: 8,
                      height: 32,
                      borderRadius: 1,
                      backgroundColor: getQRAColor(idx),
                      flexShrink: 0
                    }}
                  />
                  
                  {/* Activity name and category */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {activity.name}
                    </Typography>
                    {activity.category && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {activity.category} → {activity.area} → {activity.focus}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Chips section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Subcomponents count chip */}
                    {getSubcomponentCount(activity.name) > 0 && (
                      <Tooltip title={`${getSubcomponentCount(activity.name)} subcomponents configured`}>
                        <Chip 
                          label={`${getSubcomponentCount(activity.name)} subcomponents`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                      </Tooltip>
                    )}
                    
                    {/* Practice percentage chip */}
                    <Tooltip title={`${activity.name} Practice Percent`}>
                      <Chip 
                        label={`${(qraSliderState[activity.id]?.value || 0).toFixed(1)}%`}
                        size="small"
                        onClick={() => handleOpenPracticeModal(activity)}
                        sx={{ 
                          fontSize: '0.75rem', 
                          height: 24,
                          bgcolor: 'rgba(33, 150, 243, 0.1)',
                          border: '1px solid #2196F3',
                          color: '#1976D2',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'rgba(33, 150, 243, 0.2)'
                          }
                        }}
                      />
                    </Tooltip>
                    
                    {/* Applied percentage chip */}
                    {getAppliedPercentage(activity.name) > 0 && (
                      <Tooltip title={`${activity.name} Applied Percent`}>
                        <Chip 
                          label={`${getAppliedPercentage(activity.name).toFixed(1)}%`}
                          size="small"
                          sx={{ 
                            fontSize: '0.75rem', 
                            height: 24,
                            bgcolor: 'rgba(156, 39, 176, 0.1)',
                            border: '1px solid #9C27B0',
                            color: '#7B1FA2'
                          }}
                        />
                      </Tooltip>
                    )}
                    
                    {/* Role count */}
                    {allRoles.length > 0 && (
                      <Chip 
                        label={`${activity.selectedRoles.length} roles`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', height: 24 }}
                      />
                    )}
                    
                    {/* Lock icon with updated color for completed QRA */}
                    <Tooltip title={
                      qraSliderState[activity.id]?.locked 
                        ? 'Unlock activity (allows changes)' 
                        : isQRACompleted(activity.name)
                          ? 'Lock activity (prevents changes)'
                          : 'Configure activity first to enable locking'
                    }>
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleLock(activity.id)}
                        sx={{ 
                          color: qraSliderState[activity.id]?.locked 
                            ? (isQRACompleted(activity.name) ? 'success.main' : 'warning.main')
                            : 'text.secondary',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        {qraSliderState[activity.id]?.locked ? 
                          <LockIcon sx={{ fontSize: 16 }} /> : 
                          <LockOpenIcon sx={{ fontSize: 16 }} />
                        }
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {/* Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="Configure Subcomponents">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleConfigureSubcomponents(activity.name)}
                        startIcon={<SettingsIcon />}
                        sx={{ 
                          fontSize: '0.75rem',
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5
                        }}
                      >
                        Configure
              </Button>
                    </Tooltip>
                    <Tooltip title="Toggle active/inactive">
                      <Switch
                        checked={activity.active}
                        onChange={(e) => handleActiveChange(activity.id, e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Remove activity">
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveActivity(activity.id)}
                        sx={{ 
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
      )}

      {/* Research Activities Header */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Add Research Activities for {selectedYear}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activities.length === 0 && (
              <Button
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={addDemoActivity}
              size="small"
            >
              Add Demo Activity
              </Button>
            )}
          </Box>
      </Box>

      {/* Enhanced Filtering Hierarchy UI - Accordion with Locking */}
      <Accordion 
        expanded={filterSectionExpanded && !filterSectionLocked}
        onChange={() => !filterSectionLocked && setFilterSectionExpanded(!filterSectionExpanded)}
        sx={{ 
          mb: 3, 
          bgcolor: filterSectionLocked ? 'success.light' : 'grey.50',
          '&.Mui-expanded': {
            margin: '0 0 24px 0'
          }
        }}
      >
        <AccordionSummary
          expandIcon={filterSectionLocked ? null : <ExpandMoreIcon />}
          sx={{
            bgcolor: filterSectionLocked ? 'success.main' : 'transparent',
            color: filterSectionLocked ? 'success.contrastText' : 'inherit',
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              justifyContent: 'space-between'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Filter Research Activities
            </Typography>
            {filterSectionLocked && (
              <Chip 
                label="LOCKED" 
                size="small" 
                sx={{ ml: 2, bgcolor: 'success.dark', color: 'white' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(filter.categories.length > 0 || filter.areas.length > 0 || filter.focuses.length > 0) && (
              <Chip 
                label={`${filter.categories.length + filter.areas.length + filter.focuses.length} filters`}
                size="small"
                color="primary"
              />
            )}
            <Tooltip title={filterSectionLocked ? 'Unlock section to make changes' : 'Lock section to prevent changes'}>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFilterSectionLock();
                }}
                size="small"
                sx={{ 
                  color: filterSectionLocked ? 'success.contrastText' : 'primary.main',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                {filterSectionLocked ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          
          {/* Active Filters Display */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Active Filters:
            </Typography>
            {filter.categories.length === 0 && filter.areas.length === 0 && filter.focuses.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                No filters selected - Select categories, areas, and focuses below
              </Typography>
            )}
            
            {/* Category filters */}
            {filter.categories.map(category => (
              <Chip 
                key={`cat-${category}`}
                label={`Category: ${category}`} 
                color="primary" 
                size="small"
                onDelete={() => setFilter(prev => ({ 
                  ...prev, 
                  categories: prev.categories.filter(c => c !== category) 
                }))}
              />
            ))}
            
            {/* Area filters */}
            {filter.areas.map(area => (
              <Chip 
                key={`area-${area}`}
                label={`Area: ${area}`} 
                color="secondary" 
                size="small"
                onDelete={() => setFilter(prev => ({ 
                  ...prev, 
                  areas: prev.areas.filter(a => a !== area) 
                }))}
              />
            ))}
            
            {/* Focus filters */}
            {filter.focuses.map(focus => (
              <Chip 
                key={`focus-${focus}`}
                label={`Focus: ${focus}`} 
                color="info" 
                size="small"
                onDelete={() => setFilter(prev => ({ 
                  ...prev, 
                  focuses: prev.focuses.filter(f => f !== focus) 
                }))}
              />
            ))}
            
            {/* Clear all button */}
            {(filter.categories.length > 0 || filter.areas.length > 0 || filter.focuses.length > 0) && (
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => setFilter({ categories: [], areas: [], focuses: [] })}
              >
                Clear All
              </Button>
            )}
          </Box>

          <Collapse in={filterExpanded}>
            {/* Categories Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                1. Select Categories ({filter.categories.length} selected, {uniqueCategories.length} available)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {uniqueCategories.map(category => (
          <Chip
            key={category}
            label={category}
                    color={filter.categories.includes(category) ? "primary" : "default"}
                    onClick={() => {
                      if (filterSectionLocked) {
                        setNotification({
                          open: true,
                          message: 'Cannot modify filters while Filter section is locked.',
                          severity: 'warning'
                        });
                        return;
                      }
                      setFilter(prev => ({
                        ...prev,
                        categories: prev.categories.includes(category)
                          ? prev.categories.filter(c => c !== category)
                          : [...prev.categories, category]
                      }));
                    }}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.light', color: 'white' } }}
          />
        ))}
              </Box>
            </Box>

            {/* Areas Selection */}
            {filter.categories.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  2. Select Areas ({filter.areas.length} selected, {uniqueAreas.length} available)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {uniqueAreas.map(area => (
          <Chip
            key={area}
            label={area}
                      color={filter.areas.includes(area) ? "secondary" : "default"}
                      onClick={() => setFilter(prev => ({
                        ...prev,
                        areas: prev.areas.includes(area)
                          ? prev.areas.filter(a => a !== area)
                          : [...prev.areas, area]
                      }))}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'secondary.light', color: 'white' } }}
          />
        ))}
                </Box>
              </Box>
            )}

            {/* Focus Areas Selection */}
            {filter.categories.length > 0 && filter.areas.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  3. Select Focus Areas ({filter.focuses.length} selected, {uniqueFocuses.length} available)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {uniqueFocuses.map(focus => (
          <Chip
            key={focus}
            label={focus}
                      color={filter.focuses.includes(focus) ? "info" : "default"}
                      onClick={() => setFilter(prev => ({
                        ...prev,
                        focuses: prev.focuses.includes(focus)
                          ? prev.focuses.filter(f => f !== focus)
                          : [...prev.focuses, focus]
                      }))}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'info.light', color: 'white' } }}
          />
        ))}
      </Box>
              </Box>
            )}
          </Collapse>
        </AccordionDetails>
      </Accordion>
      {/* Research Activities Display - Accordion with Locking */}
      {filter.categories.length > 0 && filter.areas.length > 0 && filter.focuses.length > 0 && (
        <Accordion 
          expanded={availableSectionExpanded && !availableSectionLocked}
          onChange={() => !availableSectionLocked && setAvailableSectionExpanded(!availableSectionExpanded)}
          sx={{ 
            mb: 3,
            bgcolor: availableSectionLocked ? 'success.light' : 'background.paper',
            '&.Mui-expanded': {
              margin: '0 0 24px 0'
            }
          }}
        >
          <AccordionSummary
            expandIcon={availableSectionLocked ? null : <ExpandMoreIcon />}
            sx={{
              bgcolor: availableSectionLocked ? 'success.main' : 'transparent',
              color: availableSectionLocked ? 'success.contrastText' : 'inherit',
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                justifyContent: 'space-between'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6">
                Available Research Activities
              </Typography>
              {availableSectionLocked && (
                <Chip 
                  label="LOCKED" 
                  size="small" 
                  sx={{ ml: 2, bgcolor: 'success.dark', color: 'white' }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${filteredResearchActivities.length} activities`}
                size="small"
                color="primary"
              />
              <Tooltip title={availableSectionLocked ? 'Unlock section to make changes' : 'Lock section to prevent changes'}>
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAvailableSectionLock();
                  }}
                  size="small"
                  sx={{ 
                    color: availableSectionLocked ? 'success.contrastText' : 'primary.main',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  {availableSectionLocked ? <LockIcon /> : <LockOpenIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              <strong>Filters:</strong> {filter.categories.length} categories, {filter.areas.length} areas, {filter.focuses.length} focuses
            </Typography>

            {filteredResearchActivities.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <InfoOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  No Research Activities Found
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Try selecting different combinations of Categories, Areas, and Focuses
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredResearchActivities.map((activity: any, index: number) => {
                  const configured = Object.values(configuredActivities).find(a => 
                    a.name === (activity.researchActivity || activity.name) && 
                    a.category === activity.category && 
                    a.area === activity.area && 
                    a.focus === activity.focus
                  );
                  const uniqueKey = `${activity.id || activity.researchActivity}-${activity.category}-${activity.area}-${activity.focus}`;
            const roles = allRoles.map((role: any) => ({
              id: role.id,
              name: role.name,
              selected: configured ? configured.selectedRoles.includes(role.id) : false
            }));
                  
            return (
                    <Box key={uniqueKey} sx={{ position: 'relative' }}>
                      {/* Activity Number Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          left: 16,
                          backgroundColor: configured ? 'success.main' : 'primary.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                          zIndex: 1
                        }}
                      >
                        {index + 1}
                      </Box>
                      
              <ResearchActivityCard
                        title={activity.researchActivity || activity.name}
                hint={activity.hint}
                focus={activity.focus}
                isSelected={!!configured}
                onSelect={() => {}}
                onEdit={() => {}}
                        practicePercent={configured ? (qraSliderState[configured.id]?.value || configured.practicePercent) : 0}
                        onPracticePercentChange={configured ? (value: number) => handlePracticePercentChange(configured.id, value) : undefined}
                onAdd={configured ? undefined : () => handleAddActivity(activity)}
                onRemove={configured ? () => handleRemoveActivity(configured.id) : undefined}
                        roles={allRoles.map(role => ({
                          id: role.id,
                          name: role.name,
                          selected: configured ? configured.selectedRoles.includes(role.id) : false
                        }))}
                onRoleToggle={configured ? (roleId => handleRolesChange(configured.id, configured.selectedRoles.includes(roleId)
                  ? configured.selectedRoles.filter((id: string) => id !== roleId)
                  : [...configured.selectedRoles, roleId])) : undefined}
              />
                    </Box>
            );
          })}
        </Box>
      )}
          </AccordionDetails>
        </Accordion>
      )}
      
      {/* QRA Export Panel */}
      <QRAExportPanel
        businessId={selectedBusinessId}
        businessName={selectedBusiness?.businessName || 'Unknown Business'}
        year={selectedYear}
      />
      
      <Dialog open={nonRDModalOpen} onClose={() => setNonRDModalOpen(false)}>
        <DialogTitle>Modify Non-R&D Time</DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedActivity.name}
              </Typography>
              <Slider
                value={selectedActivity.nonRDTime}
                onChange={(event: Event, value: number | number[]) => handleNonRDTimeChange(selectedActivity.id, value as number)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                sx={{ width: '100%', mt: 2 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Non-R&D Time: {selectedActivity.nonRDTime}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNonRDModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Non-R&D Time Dialog */}
      {renderNonRDDialog()}
      
      {/* Help Dialog */}
      <Dialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineIcon />
            Activities Tab - Help & Statistics
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Quick Statistics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Available Categories
              </Typography>
              <Typography variant="h5" sx={{ color: 'primary.main' }}>
                {uniqueCategories.length}
      </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                My R&D Activities
              </Typography>
              <Typography variant="h5" sx={{ color: 'success.main' }}>
                {activities.length}
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Active Activities
              </Typography>
              <Typography variant="h5" sx={{ color: 'warning.main' }}>
                {getActiveActivities().length}
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Total Practice Time
              </Typography>
              <Typography variant="h5" sx={{ color: 'info.main' }}>
                {getActiveActivities().reduce((sum, a) => sum + (qraSliderState[a.id]?.value || 0), 0).toFixed(1)}%
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            How to Use This Tab
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                1
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Filter Research Activities
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Use the collapsible filter section to select multiple categories, areas, and focus areas to find relevant research activities from the API database.
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                2
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Add Activities to Your R&D Plan
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Click "Add" on research activity cards to include them in your plan. New activities automatically get assigned practice percentages and all R&D roles are preselected.
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                3
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Configure Practice Percentages
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Adjust practice percentages using the sliders in activity cards. When you change one activity, others auto-adjust proportionally unless locked. Click the lock icon to prevent auto-adjustment.
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                4
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Monitor Your R&D Allocation
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  The Practice Percentage bar at the top shows your total R&D time allocation. The goal is to reach 100% when including Non-R&D time.
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Practice Percentage Modal */}
      <Dialog 
        open={practiceModalOpen} 
        onClose={handleClosePracticeModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 3 }}>
          {selectedActivityForPractice && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                {(qraSliderState[selectedActivityForPractice.id]?.value || 0).toFixed(1)}%
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {selectedActivityForPractice.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Practice Percent
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePracticeModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* QRA Modal */}
      <SimpleQRAModal
        open={qraModalOpen}
        onClose={() => setQRAModalOpen(false)}
        onComplete={handleQRAModalComplete}
        activity={selectedActivityForQRA}
        currentYear={selectedYear}
        practicePercent={getCurrentPracticePercent(selectedActivityForQRA)}
        selectedRoles={
          activities.find(a => a.name === selectedActivityForQRA)?.selectedRoles.map(roleId => 
            allRoles.find(role => role.id === roleId)?.name || roleId
          ) || []
        }
        initialData={qraInitialData}
        isActivityLocked={(() => {
          if (!selectedActivityForQRA) return false;
          const activity = activities.find(a => a.name === selectedActivityForQRA);
          if (!activity) return false;
          const isLocked = qraSliderState[activity.id]?.locked || false;
          return isLocked;
        })()}
      />

      {/* Notification */}
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default IdentifyActivitiesTab; 