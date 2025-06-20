import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Fab,
  InputAdornment
} from '@mui/material';
import {
  Menu as MenuIcon,
  Business as BusinessIcon,
  Calculate as CalculateIcon,
  Build as BuildIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Business } from '../types/Business';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const drawerWidth = 240;

const menuItems = [
  { text: 'Business Info', icon: <BusinessIcon />, path: '/' },
  { text: 'R&D Activities', icon: <BuildIcon />, path: '/qra-builder' },
  { text: 'R&D Expenses', icon: <CalculateIcon />, path: '/qre-calculator' },
  { text: 'Reports', icon: <CalculateIcon />, path: '/reports' },
];

interface LayoutProps {
  children: React.ReactNode;
  businesses: Business[];
  selectedBusinessId: string;
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  setSelectedBusinessId: React.Dispatch<React.SetStateAction<string>>;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  onApprovalStatusChange?: (year: number, isFullyApproved: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, businesses, selectedBusinessId, setBusinesses, setSelectedBusinessId, selectedYear, setSelectedYear, onApprovalStatusChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const [activitiesOpen, setActivitiesOpen] = useState(true);
  const [approvedActivityYears, setApprovedActivityYears] = useState<Set<number>>(new Set());

  // Check if a step is accessible based on previous steps being completed
  const isStepAccessible = (index: number) => {
    if (index === 0) return true;
    if (index === 1) return completedSteps[0]; // R&D Activities requires Business Info
    if (index === 2) return approvedActivityYears.has(selectedYear); // R&D Expenses requires approved activities for selected year
    if (index === 3) return completedSteps[2]; // Reports requires R&D Expenses
    return completedSteps.slice(0, index).every(step => step);
  };

  // Update completed steps based on business data
  useEffect(() => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness) return;

    // Step 1: Business Info is complete if all tabs are approved
    const isBusinessInfoComplete = 
      selectedBusiness.tabApprovals.basicInfo.isApproved &&
      selectedBusiness.tabApprovals.ownership.isApproved &&
      selectedBusiness.tabApprovals.financial.isApproved;

    // Step 2: R&D Activities (placeholder - implement actual logic)
    const isActivitiesComplete = false;

    // Step 3: R&D Expenses (placeholder - implement actual logic)
    const isExpensesComplete = false;

    // Step 4: Reports (placeholder - implement actual logic)
    const isReportsComplete = false;

    setCompletedSteps([isBusinessInfoComplete, isActivitiesComplete, isExpensesComplete, isReportsComplete]);
  }, [businesses, selectedBusinessId]);

  const handleBusinessSelect = (e: any) => {
    setSelectedBusinessId(e.target.value);
  };

  const addNewBusiness = () => {
    const newBusiness: Business = {
      id: Date.now().toString(),
      businessName: '',
      dbaName: '',
      ein: '',
      entityType: '',
      entityState: '',
      startYear: null,
      owners: [],
      financialHistory: [],
      tabApprovals: {
        basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
        ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
        financial: { isApproved: false, approvedAt: '', approvedBy: '' }
      },
      rolesByYear: {},
      years: {}
    };
    setBusinesses(prev => [...prev, newBusiness]);
    setSelectedBusinessId(newBusiness.id);
  };

  const deleteBusiness = (id: string) => {
    setBusinesses(businesses.filter(b => b.id !== id));
    if (selectedBusinessId === id) {
      setSelectedBusinessId(businesses[0]?.id || '');
    }
  };

  const getStepColor = (index: number) => {
    if (!isStepAccessible(index)) return 'grey';
    if (completedSteps[index]) return 'success';
    return ['primary', 'secondary', 'info', 'warning'][index];
  };

  // Helper to get all years with data for R&D Activities
  const getActivityYears = () => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness) return [];
    const currentYear = new Date().getFullYear();
    const startYear = selectedBusiness.startYear || currentYear;
    const dataYears = (selectedBusiness.financialHistory || []).map(y => y.year);
    const minYear = Math.max(startYear, currentYear - 7);
    const allYears = new Set<number>([...dataYears, ...Array.from({length: currentYear - minYear + 1}, (_, i) => currentYear - i)]);
    return Array.from(allYears).sort((a, b) => b - a);
  };

  // Placeholder: track which years are complete for R&D Activities
  const completedActivityYears: number[] = []; // TODO: wire up with real approval logic

  // Handle approval status changes from QRABuilder
  const handleApprovalStatusChange = (year: number, isFullyApproved: boolean) => {
    setApprovedActivityYears(prev => {
      const newSet = new Set(prev);
      if (isFullyApproved) {
        newSet.add(year);
      } else {
        newSet.delete(year);
      }
      return newSet;
    });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ mr: 3 }}>
            R&D Credit Manager
          </Typography>
          <BusinessIcon sx={{ mr: 1 }} />
          <FormControl sx={{ minWidth: 220, mr: 2 }} size="small">
            <InputLabel sx={{ color: 'white' }}>Select Business</InputLabel>
            <Select
              value={selectedBusinessId}
              onChange={handleBusinessSelect}
              label="Select Business"
              sx={{
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                '.MuiSvgIcon-root': { color: 'white' }
              }}
            >
              {businesses.map(business => (
                <MenuItem key={business.id} value={business.id}>
                  {business.businessName || 'New Business'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Add New Business">
            <Fab
              size="small"
              color="secondary"
              onClick={addNewBusiness}
              sx={{ mr: 1 }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
          {businesses.length > 1 && (
            <Tooltip title="Delete Business">
              <Fab
                size="small"
                color="error"
                onClick={() => deleteBusiness(selectedBusinessId)}
              >
                <DeleteIcon />
              </Fab>
            </Tooltip>
          )}
          {/* Year Selector Dropdown */}
          {selectedBusinessId && (
            <FormControl sx={{ minWidth: 120, ml: 2 }} size="small">
              <InputLabel sx={{ color: 'white' }}>Year</InputLabel>
              <Select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                label="Year"
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                {(() => {
                  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
                  if (!selectedBusiness) return null;
                  const currentYear = new Date().getFullYear();
                  const startYear = selectedBusiness.startYear || currentYear;
                  // Collect all years with data in financialHistory
                  const dataYears = (selectedBusiness.financialHistory || []).map(y => y.year);
                  // At least previous 8 years, limited by startYear
                  const minYear = Math.max(startYear, currentYear - 7);
                  const allYears = new Set<number>([...dataYears, ...Array.from({length: currentYear - minYear + 1}, (_, i) => currentYear - i)]);
                  const sortedYears = Array.from(allYears).sort((a, b) => b - a);
                  return sortedYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ));
                })()}
              </Select>
            </FormControl>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', pt: 2 }}>
          <List>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.text}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => isStepAccessible(index) && navigate(item.path)}
                    selected={location.pathname === item.path}
                    disabled={!isStepAccessible(index)}
                    sx={{ 
                      opacity: isStepAccessible(index) ? 1 : 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      },
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      minWidth: 40,
                      mr: 2
                    }}>
                      <Fab
                        size="small"
                        color={getStepColor(index) as any}
                        sx={{ 
                          width: 36, 
                          height: 36,
                          minHeight: 36,
                          boxShadow: completedSteps[index] ? 2 : 1,
                          '& .MuiSvgIcon-root': {
                            fontSize: 20,
                          },
                        }}
                      >
                        {completedSteps[index] ? (
                          <CheckCircleIcon />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                            {index + 1}
                          </Typography>
                        )}
                      </Fab>
                    </Box>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                      }}
                    />
                    {/* Expand/collapse for R&D Activities */}
                    {item.text === 'R&D Activities' && (
                      activitiesOpen ? <ExpandLess /> : <ExpandMore />
                    )}
                  </ListItemButton>
                </ListItem>
                {/* Expandable years under R&D Activities */}
                {item.text === 'R&D Activities' && activitiesOpen && (
                  <List component="div" disablePadding>
                    {getActivityYears().map(year => (
                      <ListItem key={year} disablePadding sx={{ pl: 6 }}>
                        <ListItemButton
                          selected={selectedYear === year && location.pathname === item.path}
                          onClick={() => {
                            if (isStepAccessible(index)) {
                              setSelectedYear(year);
                              navigate(item.path);
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 32, mr: 1 }}>
                            <Fab
                              size="small"
                              color={approvedActivityYears.has(year) ? 'success' : 'default'}
                              sx={{ width: 28, height: 28, minHeight: 28, boxShadow: approvedActivityYears.has(year) ? 2 : 1 }}
                            >
                              {approvedActivityYears.has(year) ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{year % 100}</Typography>}
                            </Fab>
                          </Box>
                          <ListItemText primary={year} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {React.cloneElement(children as React.ReactElement, { 
          onApprovalStatusChange: handleApprovalStatusChange 
        })}
      </Box>
    </Box>
  );
};

export default Layout; 