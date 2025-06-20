import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Layout from './components/Layout';
import BusinessInfo from './pages/BusinessInfo';
import QRABuilder from './pages/QRABuilder';
import QRECalculator from './pages/QRECalculator';
import { Business, Owner, FinancialYear, TabApproval } from './types/Business';

const STORAGE_KEY = 'businessInfoData';

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
    rolesByYear: business.rolesByYear ?? {},
    years: business.years ?? {}
  };
}

const App: React.FC = () => {
  // Business state
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Load from localStorage
  useEffect(() => {
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
      }
    } else {
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
        rolesByYear: {},
        years: {}
      };
      setBusinesses([initialBusiness]);
      setSelectedBusinessId(initialBusiness.id);
      setSelectedYear(currentYear);
    }
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Layout
          businesses={businesses}
          selectedBusinessId={selectedBusinessId}
          setBusinesses={setBusinesses}
          setSelectedBusinessId={setSelectedBusinessId}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        >
          <Routes>
            <Route
              path="/"
              element={
                <BusinessInfo
                  businesses={businesses}
                  selectedBusinessId={selectedBusinessId}
                  setBusinesses={setBusinesses}
                  setSelectedBusinessId={setSelectedBusinessId}
                />
              }
            />
            <Route path="/qra-builder" element={<QRABuilder selectedYear={selectedYear} setSelectedYear={setSelectedYear} businesses={businesses} selectedBusinessId={selectedBusinessId} setBusinesses={setBusinesses} />} />
            <Route path="/qre-calculator" element={<QRECalculator />} />
          </Routes>
        </Layout>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App; 