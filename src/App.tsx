import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Layout from './components/Layout';
import BusinessInfo from './pages/BusinessInfo';
import QRABuilder from './pages/QRABuilder';
import QRECalculator from './pages/QRECalculator';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';
import { Business } from './types/Business';
import { AdminService } from './services/adminService';

const STORAGE_KEY = 'rd-app-data';

// Create theme with Roboto font
const theme = createTheme({
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function normalizeBusiness(business: any): Business {
  return {
    ...business,
    tabApprovals: business.tabApprovals ?? {
      basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
      ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
      financial: { isApproved: false, approvedAt: '', approvedBy: '' }
    },
    // Contact information with defaults
    mailingStreetAddress: business.mailingStreetAddress ?? '',
    mailingCity: business.mailingCity ?? '',
    mailingState: business.mailingState ?? '',
    mailingZip: business.mailingZip ?? '',
    website: business.website ?? '',
    phoneNumber: business.phoneNumber ?? '',
    rolesByYear: business.rolesByYear ?? {},
    years: business.years ?? {}
  };
}

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  // Business state
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Admin state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Load from localStorage and Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // First, try to load from Supabase
        const { SupabaseBusinessService } = await import('./services/supabaseBusinessService');
        const freshBusinesses = await SupabaseBusinessService.getBusinesses();
        
        if (freshBusinesses && freshBusinesses.length > 0) {
          // Use Supabase data as primary source
          setBusinesses(freshBusinesses.map(normalizeBusiness));
          
          // Try to restore selected business from localStorage if it exists in Supabase data
          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              const businessExists = freshBusinesses.find((b: Business) => b.id === parsedData.selectedBusinessId);
              if (businessExists) {
                setSelectedBusinessId(parsedData.selectedBusinessId);
                // Set selectedYear to most recent year in selected business, or current year
                if (businessExists.financialHistory && businessExists.financialHistory.length > 0) {
                  setSelectedYear(Math.max(...businessExists.financialHistory.map((y: any) => y.year)));
                } else {
                  setSelectedYear(new Date().getFullYear());
                }
              } else {
                // Fallback to first business
                setSelectedBusinessId(freshBusinesses[0].id);
                if (freshBusinesses[0].financialHistory && freshBusinesses[0].financialHistory.length > 0) {
                  setSelectedYear(Math.max(...freshBusinesses[0].financialHistory.map((y: any) => y.year)));
                } else {
                  setSelectedYear(new Date().getFullYear());
                }
              }
            } catch (error) {
              console.error('Error parsing saved data:', error);
              // Fallback to first business
              setSelectedBusinessId(freshBusinesses[0].id);
              if (freshBusinesses[0].financialHistory && freshBusinesses[0].financialHistory.length > 0) {
                setSelectedYear(Math.max(...freshBusinesses[0].financialHistory.map((y: any) => y.year)));
              } else {
                setSelectedYear(new Date().getFullYear());
              }
            }
          } else {
            // No saved data, use first business
            setSelectedBusinessId(freshBusinesses[0].id);
            if (freshBusinesses[0].financialHistory && freshBusinesses[0].financialHistory.length > 0) {
              setSelectedYear(Math.max(...freshBusinesses[0].financialHistory.map((y: any) => y.year)));
            } else {
              setSelectedYear(new Date().getFullYear());
            }
          }
        } else {
          // No Supabase data, fallback to localStorage
          const savedData = localStorage.getItem(STORAGE_KEY);
          if (savedData) {
            try {
              const parsedData = JSON.parse(savedData);
              setBusinesses(parsedData.businesses.map(normalizeBusiness));
              setSelectedBusinessId(parsedData.selectedBusinessId);
              // Set selectedYear to most recent year in selected business, or current year
              const selectedBiz = parsedData.businesses.find((b: any) => b.id === parsedData.selectedBusinessId);
              if (selectedBiz && selectedBiz.financialHistory && selectedBiz.financialHistory.length > 0) {
                setSelectedYear(Math.max(...selectedBiz.financialHistory.map((y: any) => y.year)));
              } else {
                setSelectedYear(new Date().getFullYear());
              }
            } catch (error) {
              console.error('Error loading saved data:', error);
              createInitialBusiness();
            }
          } else {
            createInitialBusiness();
          }
        }
      } catch (error) {
        console.error('Error loading from Supabase:', error);
        // Fallback to localStorage
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            setBusinesses(parsedData.businesses.map(normalizeBusiness));
            setSelectedBusinessId(parsedData.selectedBusinessId);
            // Set selectedYear to most recent year in selected business, or current year
            const selectedBiz = parsedData.businesses.find((b: any) => b.id === parsedData.selectedBusinessId);
            if (selectedBiz && selectedBiz.financialHistory && selectedBiz.financialHistory.length > 0) {
              setSelectedYear(Math.max(...selectedBiz.financialHistory.map((y: any) => y.year)));
            } else {
              setSelectedYear(new Date().getFullYear());
            }
          } catch (error) {
            console.error('Error loading saved data:', error);
            createInitialBusiness();
          }
        } else {
          createInitialBusiness();
        }
      }
    };

    const createInitialBusiness = () => {
      const currentYear = new Date().getFullYear();
      const initialBusiness: Business = {
        id: Date.now().toString(),
        businessName: '',
        dbaName: '',
        ein: '',
        entityType: '',
        entityState: '',
        startYear: currentYear,
        owners: [],
        financialHistory: [],
        tabApprovals: {
          basicInfo: { isApproved: false, approvedAt: '', approvedBy: '' },
          ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
          financial: { isApproved: false, approvedAt: '', approvedBy: '' }
        },
        // Contact information
        mailingStreetAddress: '',
        mailingCity: '',
        mailingState: '',
        mailingZip: '',
        website: '',
        phoneNumber: '',
        rolesByYear: {},
        years: {}
      };
      setBusinesses([initialBusiness]);
      setSelectedBusinessId(initialBusiness.id);
      setSelectedYear(currentYear);
    };

    loadData();

    // Load admin state
    const adminState = AdminService.getAdminState();
    setIsAdminMode(adminState.isAdminMode);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (businesses.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        businesses,
        selectedBusinessId
      }));
    }
  }, [businesses, selectedBusinessId]);

  // Save admin state
  useEffect(() => {
    AdminService.saveAdminState({
      selectedClientId: null,
      selectedBusinessId: null,
      isAdminMode
    });
  }, [isAdminMode]);

  const handleEnterAdminMode = () => {
    setIsAdminMode(true);
  };

  const handleExitAdminMode = async () => {
    setIsAdminMode(false);
    
    // Refresh businesses from Supabase to get the latest data
    try {
      const { SupabaseBusinessService } = await import('./services/supabaseBusinessService');
      const freshBusinesses = await SupabaseBusinessService.getBusinesses();
      if (freshBusinesses && freshBusinesses.length > 0) {
        setBusinesses(freshBusinesses.map(normalizeBusiness));
        
        // If the current selectedBusinessId doesn't exist in fresh data, select the first one
        const businessExists = freshBusinesses.find((b: Business) => b.id === selectedBusinessId);
        if (!businessExists) {
          setSelectedBusinessId(freshBusinesses[0].id);
          // Set selectedYear to most recent year in selected business, or current year
          if (freshBusinesses[0].financialHistory && freshBusinesses[0].financialHistory.length > 0) {
            setSelectedYear(Math.max(...freshBusinesses[0].financialHistory.map((y: any) => y.year)));
          } else {
            setSelectedYear(new Date().getFullYear());
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing businesses from Supabase:', error);
    }
  };

  const handleSelectBusiness = async (businessId: string) => {
    console.log('handleSelectBusiness called with businessId:', businessId);
    setSelectedBusinessId(businessId);
    
    // Exit admin mode
    console.log('Setting isAdminMode to false');
    setIsAdminMode(false);
    
    // Load the selected business from Supabase and update the businesses array
    try {
      console.log('Loading business from Supabase...');
      const { SupabaseBusinessService } = await import('./services/supabaseBusinessService');
      const business = await SupabaseBusinessService.getBusiness(businessId);
      console.log('Business loaded from Supabase:', business);
      if (business) {
        // Update the businesses array with the selected business
        setBusinesses(prev => {
          const existingIndex = prev.findIndex(b => b.id === businessId);
          if (existingIndex >= 0) {
            // Update existing business
            const updated = [...prev];
            updated[existingIndex] = business;
            console.log('Updated existing business in array');
            return updated;
          } else {
            // Add new business
            console.log('Added new business to array');
            return [...prev, business];
          }
        });
        
        // Set selectedYear to most recent year in selected business, or current year
        if (business.financialHistory && business.financialHistory.length > 0) {
          const maxYear = Math.max(...business.financialHistory.map((y: any) => y.year));
          console.log('Setting selectedYear to max year from financial history:', maxYear);
          setSelectedYear(maxYear);
        } else {
          console.log('Setting selectedYear to current year');
          setSelectedYear(new Date().getFullYear());
        }
      }
    } catch (error) {
      console.error('Error loading business from Supabase:', error);
      // Fallback to current year if loading fails
      setSelectedYear(new Date().getFullYear());
    }
    
    // Navigate to business-info page
    console.log('Navigating to /business-info');
    navigate('/business-info');
  };

  const refreshBusinessesFromSupabase = async () => {
    try {
      const { SupabaseBusinessService } = await import('./services/supabaseBusinessService');
      const freshBusinesses = await SupabaseBusinessService.getBusinesses();
      if (freshBusinesses && freshBusinesses.length > 0) {
        setBusinesses(freshBusinesses.map(normalizeBusiness));
      }
    } catch (error) {
      console.error('Error refreshing businesses from Supabase:', error);
    }
  };

  // If in admin mode, show admin dashboard
  if (isAdminMode) {
    return (
      <AdminDashboard 
        businesses={businesses} 
        onExitAdmin={handleExitAdminMode}
        onSelectBusiness={handleSelectBusiness}
      />
    );
  }

  // Regular app mode
  return (
    <Layout
      businesses={businesses}
      selectedBusinessId={selectedBusinessId}
      setBusinesses={setBusinesses}
      setSelectedBusinessId={setSelectedBusinessId}
      selectedYear={selectedYear}
      setSelectedYear={setSelectedYear}
      onEnterAdminMode={handleEnterAdminMode}
    >
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/business-info" replace />}
        />
        <Route
          path="/admin"
          element={
            <AdminDashboard 
              businesses={businesses} 
              onExitAdmin={handleExitAdminMode}
              onSelectBusiness={handleSelectBusiness}
            />
          }
        />
        <Route
          path="/business-info"
          element={
            <BusinessInfo
              businesses={businesses}
              selectedBusinessId={selectedBusinessId}
              setBusinesses={setBusinesses}
              setSelectedBusinessId={setSelectedBusinessId}
              onRefreshBusinesses={refreshBusinessesFromSupabase}
            />
          }
        />
        <Route path="/qra-builder" element={<QRABuilder selectedYear={selectedYear} setSelectedYear={setSelectedYear} businesses={businesses} selectedBusinessId={selectedBusinessId} setBusinesses={setBusinesses} />} />
        <Route path="/qre-calculator" element={<QRECalculator />} />
        <Route path="/reports" element={<Reports businesses={businesses} selectedBusinessId={selectedBusinessId} selectedYear={selectedYear} />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AppContent />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App; 