import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormHelperText,
  Tooltip,
  Fab,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import SaveIcon from '@mui/icons-material/Save';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { green, grey } from '@mui/material/colors';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Slide from '@mui/material/Slide';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import { Business, Owner, FinancialYear, TabApproval } from '../types/Business';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ padding: '20px 0' }}>
    {value === index && children}
  </div>
);

type TabKey = 'basicInfo' | 'ownership' | 'financial';

interface ValidationErrors {
  businessName?: string;
  ein?: string;
  entityType?: string;
  entityState?: string;
  startYear?: string;
  owners?: { [key: string]: string };
}

interface BusinessInfoProps {
  businesses: Business[];
  selectedBusinessId: string;
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  setSelectedBusinessId: React.Dispatch<React.SetStateAction<string>>;
}

const BusinessInfo: React.FC<BusinessInfoProps> = ({ businesses, selectedBusinessId, setBusinesses, setSelectedBusinessId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [ownershipError, setOwnershipError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [approvedTabs, setApprovedTabs] = useState<boolean[]>([false, false, false]);
  const [showApprovalPrompt, setShowApprovalPrompt] = useState(false);
  const [tabReadOnly, setTabReadOnly] = useState<boolean[]>([false, false, false]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [saveIndicator, setSaveIndicator] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusinesses(businesses.map(business => {
      if (business.id === selectedBusinessId) {
        const updatedBusiness = { ...business, [name]: value };
        const errors = validateBusiness(updatedBusiness);
        setValidationErrors(errors);
        return updatedBusiness;
      }
      return business;
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setBusinesses(businesses.map(business => {
      if (business.id === selectedBusinessId) {
        const updatedBusiness = { ...business, [name]: value };
        const errors = validateBusiness(updatedBusiness);
        setValidationErrors(errors);
        return updatedBusiness;
      }
      return business;
    }));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    return Math.round(parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const parsePercentage = (value: string): number => {
    return Math.round((parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0) * 100);
  };

  const handleOwnerChange = (ownerId: string, field: keyof Owner, value: string | number | boolean) => {
    setBusinesses(businesses.map(business => {
      if (business.id === selectedBusinessId) {
        const updatedOwners = business.owners.map(owner =>
          owner.id === ownerId ? { ...owner, [field]: value } : owner
        );
        const updatedBusiness = { ...business, owners: updatedOwners };
        const errors = validateBusiness(updatedBusiness);
        setValidationErrors(errors);
        return updatedBusiness;
      }
      return business;
    }));
  };

  const addOwner = () => {
    const newOwner: Owner = {
      id: Date.now().toString(),
      name: '',
      ownershipPercentage: 0,
      isResearchLeader: false,
    };
    setBusinesses(businesses.map(business =>
      business.id === selectedBusinessId
        ? { ...business, owners: [...business.owners, newOwner] }
        : business
    ));
  };

  const removeOwner = (ownerId: string) => {
    setBusinesses(businesses.map(business =>
      business.id === selectedBusinessId
        ? { ...business, owners: business.owners.filter(owner => owner.id !== ownerId) }
        : business
    ));
  };

  const validateOwnership = (owners: Owner[]): boolean => {
    const total = owners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);
    if (total !== 100) {
      setOwnershipError(`Total ownership must equal 100%. Current total: ${total}%`);
      return false;
    }
    setOwnershipError('');
    return true;
  };

  const handleStartYearChange = (year: number | null) => {
    setBusinesses(businesses.map(business => {
      if (business.id === selectedBusinessId) {
        const newYears = getFinancialYears(year);
        const existingHistory = business.financialHistory || [];
        const updatedHistory = newYears.map(year => {
          const existing = existingHistory.find(h => h.year === year);
          return existing || { year, grossReceipts: 0, qre: 0 };
        });
        return { ...business, startYear: year, financialHistory: updatedHistory };
      }
      return business;
    }));
  };

  const handleFinancialDataChange = (year: number, field: keyof FinancialYear, value: string) => {
    const numericValue = parseCurrency(value);
    setBusinesses(businesses.map(business => {
      if (business.id === selectedBusinessId) {
        const updatedHistory = [...(business.financialHistory || [])];
        const yearIndex = updatedHistory.findIndex(y => y.year === year);
        if (yearIndex === -1) {
          updatedHistory.push({ year, grossReceipts: 0, qre: 0 });
        }
        const finalHistory = updatedHistory.map(y =>
          y.year === year ? { ...y, [field]: numericValue } : y
        ).sort((a, b) => b.year - a.year);
        return { ...business, financialHistory: finalHistory };
      }
      return business;
    }));
  };

  const getFinancialYears = (startYear: number | null): number[] => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    const start = startYear || currentYear;
    for (let year = currentYear; year >= Math.max(start, currentYear - 7); year--) {
      years.push(year);
    }
    return years;
  };

  const validateBusiness = (business: Business): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!business.businessName?.trim()) {
      errors.businessName = 'Business name is required';
    }
    if (!business.ein?.trim()) {
      errors.ein = 'EIN is required';
    } else if (!/^\d{2}-\d{7}$/.test(business.ein)) {
      errors.ein = 'EIN must be in format XX-XXXXXXX';
    }
    if (!business.entityType) {
      errors.entityType = 'Entity type is required';
    }
    if (!business.entityState) {
      errors.entityState = 'Entity state is required';
    }
    if (!business.startYear) {
      errors.startYear = 'Start year is required';
    } else if (business.startYear < 1900 || business.startYear > new Date().getFullYear()) {
      errors.startYear = 'Start year must be between 1900 and current year';
    }
    if (business.owners.length > 0) {
      const ownerErrors: { [key: string]: string } = {};
      business.owners.forEach((owner, index) => {
        if (!owner.name?.trim()) {
          ownerErrors[owner.id] = 'Owner name is required';
        }
        if (owner.ownershipPercentage < 0 || owner.ownershipPercentage > 100) {
          ownerErrors[owner.id] = 'Ownership must be between 0% and 100%';
        }
      });
      if (Object.keys(ownerErrors).length > 0) {
        errors.owners = ownerErrors;
      }
    }
    return errors;
  };

  const handleControlledGroupChange = (checked: boolean) => {
    setBusinesses(businesses.map(business =>
      business.id === selectedBusinessId
        ? { ...business, isControlledGroup: checked, isControlGroupLeader: checked ? business.isControlGroupLeader : false }
        : business
    ));
  };

  const handleControlGroupLeaderChange = (checked: boolean) => {
    setBusinesses(businesses.map(business =>
      business.id === selectedBusinessId
        ? { ...business, isControlGroupLeader: checked }
        : business
    ));
  };

  const handleNext = () => {
    setShowApprovalPrompt(true);
  };
  const handleApproveTab = () => {
    const tabKeys: TabKey[] = ['basicInfo', 'ownership', 'financial'];
    const tabKey = tabKeys[activeTab];
    const now = new Date().toISOString();
    const ipAddress = '127.0.0.1'; // In production, this would be the actual IP

    setBusinesses(businesses.map(business => {
      if (business.id === selectedBusinessId) {
        return {
          ...business,
          tabApprovals: {
            ...business.tabApprovals,
            [tabKey]: {
              isApproved: true,
              approvedAt: now,
              approvedBy: ipAddress
            }
          }
        };
      }
      return business;
    }));

    const updated = [...approvedTabs];
    updated[activeTab] = true;
    setApprovedTabs(updated);
    setTabReadOnly((prev) => {
      const copy = [...prev];
      copy[activeTab] = true;
      return copy;
    });
    setShowApprovalPrompt(false);
    setShowToast(true);
    setToastMsg(`${tabLabels[activeTab]} complete! Great job!`);
    if (activeTab < 2) setActiveTab(activeTab + 1);
  };
  const handleEditTab = (tabIdx: number) => {
    const tabKeys: TabKey[] = ['basicInfo', 'ownership', 'financial'];
    const tabKey = tabKeys[tabIdx];
    
    setBusinesses(businesses.map(business => {
      if (business.id === selectedBusinessId) {
        return {
          ...business,
          tabApprovals: {
            ...business.tabApprovals,
            [tabKey]: {
              isApproved: false,
              approvedAt: '',
              approvedBy: ''
            }
          }
        };
      }
      return business;
    }));

    setTabReadOnly((prev) => {
      const copy = [...prev];
      copy[tabIdx] = false;
      return copy;
    });
    setApprovedTabs((prev) => {
      const copy = [...prev];
      copy[tabIdx] = false;
      return copy;
    });
    setActiveTab(tabIdx);
  };

  const tabLabels = [
    'Basic Info',
    'Ownership Details',
    'Financial History',
  ];

  const renderTabLabel = (label: string, idx: number) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <span>{label}</span>
      {approvedTabs[idx] && <AnimatedCheck />}
    </Box>
  );

  const renderBasicInfo = () => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness) return null;
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Business Name"
            name="businessName"
            value={selectedBusiness.businessName}
            onChange={handleTextChange}
            required
            error={!!validationErrors.businessName}
            helperText={validationErrors.businessName}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="DBA Name"
            name="dbaName"
            value={selectedBusiness.dbaName}
            onChange={handleTextChange}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="EIN"
            name="ein"
            value={selectedBusiness.ein}
            onChange={handleTextChange}
            required
            error={!!validationErrors.ein}
            helperText={validationErrors.ein}
            placeholder="XX-XXXXXXX"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!validationErrors.entityType}>
            <InputLabel>Entity Type</InputLabel>
            <Select
              name="entityType"
              value={selectedBusiness.entityType}
              onChange={handleSelectChange}
              label="Entity Type"
            >
              <MenuItem value="C-Corporation">C-Corporation</MenuItem>
              <MenuItem value="S-Corporation">S-Corporation</MenuItem>
              <MenuItem value="LLC">LLC</MenuItem>
              <MenuItem value="Partnership">Partnership</MenuItem>
            </Select>
            {validationErrors.entityType && (
              <FormHelperText>{validationErrors.entityType}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!validationErrors.entityState}>
            <InputLabel>Entity State</InputLabel>
            <Select
              name="entityState"
              value={selectedBusiness.entityState}
              onChange={handleSelectChange}
              label="Entity State"
            >
              <MenuItem value="CA">California</MenuItem>
              <MenuItem value="NY">New York</MenuItem>
              <MenuItem value="TX">Texas</MenuItem>
              <MenuItem value="FL">Florida</MenuItem>
            </Select>
            {validationErrors.entityState && (
              <FormHelperText>{validationErrors.entityState}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Start Year"
            value={selectedBusiness.startYear || ''}
            onChange={(e) => handleStartYearChange(parseInt(e.target.value) || null)}
            inputProps={{ min: 1900, max: new Date().getFullYear() }}
            required
            error={!!validationErrors.startYear}
            helperText={validationErrors.startYear}
          />
        </Grid>
        {businesses.length > 1 && (
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!selectedBusiness.isControlledGroup}
                  onChange={(_, checked) => handleControlledGroupChange(checked)}
                  color="primary"
                />
              }
              label="Is this business part of a controlled group?"
            />
          </Grid>
        )}
        {businesses.length > 1 && selectedBusiness.isControlledGroup && (
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!selectedBusiness.isControlGroupLeader}
                  onChange={(_, checked) => handleControlGroupLeaderChange(checked)}
                  color="primary"
                />
              }
              label="Is this the control group leader?"
            />
          </Grid>
        )}
      </Grid>
    );
  };

  const renderOwnershipDetails = () => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness) return null;
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Ownership Details</Typography>
            <Tooltip title="Add Owner">
              <Fab
                size="small"
                color="primary"
                onClick={addOwner}
              >
                <PersonAddIcon />
              </Fab>
            </Tooltip>
          </Box>
          {ownershipError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {ownershipError}
            </Alert>
          )}
        </Grid>
        {selectedBusiness.owners.map((owner) => (
          <Grid item xs={12} key={owner.id}>
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Owner Name"
                      value={owner.name}
                      onChange={(e) => handleOwnerChange(owner.id, 'name', e.target.value)}
                      required
                      error={!!validationErrors.owners?.[owner.id]}
                      helperText={validationErrors.owners?.[owner.id]}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Ownership %"
                      value={owner.ownershipPercentage}
                      onChange={(e) => {
                        let value = parseFloat(e.target.value);
                        if (isNaN(value)) value = 0;
                        value = Math.max(0, Math.min(100, Math.round(value * 100) / 100));
                        handleOwnerChange(owner.id, 'ownershipPercentage', value);
                        validateOwnership(selectedBusiness.owners.map(o =>
                          o.id === owner.id ? { ...o, ownershipPercentage: value } : o
                        ));
                      }}
                      required
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                      error={!!validationErrors.owners?.[owner.id]}
                      helperText={validationErrors.owners?.[owner.id]}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Research Leader</InputLabel>
                      <Select
                        value={owner.isResearchLeader.toString()}
                        onChange={(e) => handleOwnerChange(owner.id, 'isResearchLeader', e.target.value === 'true')}
                        label="Research Leader"
                      >
                        <MenuItem value="true">Yes</MenuItem>
                        <MenuItem value="false">No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Tooltip title="Remove Owner">
                      <IconButton
                        color="error"
                        onClick={() => removeOwner(owner.id)}
                        sx={{ mt: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderFinancialHistory = () => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness) return null;
    const years = getFinancialYears(selectedBusiness.startYear);
    const financialHistory = selectedBusiness.financialHistory || [];
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Financial History
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter gross receipts and QREs for each year. Data is required for the current year and up to 7 years prior, or up to the business start date, whichever comes first.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell align="right">Gross Receipts</TableCell>
                  <TableCell align="right">QRE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {years.map((year) => {
                  const yearData = financialHistory.find(y => y.year === year) || {
                    year,
                    grossReceipts: 0,
                    qre: 0,
                  };
                  return (
                    <TableRow key={year}>
                      <TableCell component="th" scope="row">
                        {year}
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          value={formatCurrency(yearData.grossReceipts)}
                          onChange={(e) => handleFinancialDataChange(year, 'grossReceipts', e.target.value)}
                          inputProps={{ min: 0 }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          value={formatCurrency(yearData.qre)}
                          onChange={(e) => handleFinancialDataChange(year, 'qre', e.target.value)}
                          inputProps={{ min: 0 }}
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    );
  };

  const AnimatedCheck = () => (
    <CheckCircleIcon sx={{ color: green[500], fontSize: 20, transition: 'transform 0.3s', transform: 'scale(1.2)' }} />
  );

  const renderSummaryCard = (tabIdx: number) => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness) return null;
    const tabKeys: TabKey[] = ['basicInfo', 'ownership', 'financial'];
    const tabKey = tabKeys[tabIdx];
    const approval = selectedBusiness.tabApprovals[tabKey];

    const renderApprovalDetails = () => (
      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="caption" color="text.secondary">
          Approved on: {new Date(approval.approvedAt).toLocaleString()}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Approved by: {approval.approvedBy}
        </Typography>
      </Box>
    );

    if (tabIdx === 0) {
      return (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: green[50] }}>
          <CardHeader title="Basic Info Summary" />
          <Box sx={{ p: 2 }}>
            <div><b>Business Name:</b> {selectedBusiness.businessName}</div>
            <div><b>DBA Name:</b> {selectedBusiness.dbaName}</div>
            <div><b>EIN:</b> {selectedBusiness.ein}</div>
            <div><b>Entity Type:</b> {selectedBusiness.entityType}</div>
            <div><b>Entity State:</b> {selectedBusiness.entityState}</div>
            <div><b>Start Year:</b> {selectedBusiness.startYear}</div>
            {approval.isApproved && renderApprovalDetails()}
          </Box>
          <CardActions>
            <Tooltip title="Edit">
              <Fab size="small" color="primary" onClick={() => handleEditTab(tabIdx)}><EditIcon /></Fab>
            </Tooltip>
          </CardActions>
        </Card>
      );
    }
    if (tabIdx === 1) {
      return (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: green[50] }}>
          <CardHeader title="Ownership Details Summary" />
          <Box sx={{ p: 2 }}>
            {selectedBusiness.owners.map(owner => (
              <div key={owner.id}>
                <b>{owner.name}</b>: {owner.ownershipPercentage}% {owner.isResearchLeader ? '(Research Leader)' : ''}
              </div>
            ))}
            {approval.isApproved && renderApprovalDetails()}
          </Box>
          <CardActions>
            <Tooltip title="Edit">
              <Fab size="small" color="primary" onClick={() => handleEditTab(tabIdx)}><EditIcon /></Fab>
            </Tooltip>
          </CardActions>
        </Card>
      );
    }
    if (tabIdx === 2) {
      return (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: green[50] }}>
          <CardHeader title="Financial History Summary" />
          <Box sx={{ p: 2 }}>
            {selectedBusiness.financialHistory.map(year => (
              <div key={year.year}><b>{year.year}:</b> Gross Receipts: ${year.grossReceipts}, QRE: ${year.qre}</div>
            ))}
            {approval.isApproved && renderApprovalDetails()}
          </Box>
          <CardActions>
            <Tooltip title="Edit">
              <Fab size="small" color="primary" onClick={() => handleEditTab(tabIdx)}><EditIcon /></Fab>
            </Tooltip>
          </CardActions>
        </Card>
      );
    }
    return null;
  };

  const progress = (approvedTabs.filter(Boolean).length / approvedTabs.length) * 100;

  useEffect(() => {
    setSaveIndicator(true);
    const timeout = setTimeout(() => setSaveIndicator(false), 1200);
    return () => clearTimeout(timeout);
  }, [businesses, selectedBusinessId]);

  useEffect(() => {
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (selectedBusiness && selectedBusiness.tabApprovals) {
      setApprovedTabs([
        !!selectedBusiness.tabApprovals.basicInfo.isApproved,
        !!selectedBusiness.tabApprovals.ownership.isApproved,
        !!selectedBusiness.tabApprovals.financial.isApproved,
      ]);
      setTabReadOnly([
        !!selectedBusiness.tabApprovals.basicInfo.isApproved,
        !!selectedBusiness.tabApprovals.ownership.isApproved,
        !!selectedBusiness.tabApprovals.financial.isApproved,
      ]);
    }
  }, [businesses, selectedBusinessId]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box sx={{ mb: 2 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, bgcolor: '#e3f2fd', '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' } }} />
        <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 600, mt: 1, display: 'block', textAlign: 'right' }}>{Math.round(progress)}% Complete</Typography>
      </Box>
      {saveIndicator && (
        <Box sx={{ mb: 1, textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: green[600], fontWeight: 500 }}>All changes saved</Typography>
        </Box>
      )}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 700 }}>
          {approvedTabs.filter(Boolean).length === 0 && "Let's get started!"}
          {approvedTabs.filter(Boolean).length === 1 && "You're making great progress!"}
          {approvedTabs.filter(Boolean).length === 2 && "Almost there! Just one more step!"}
          {approvedTabs.filter(Boolean).length === 3 && 'All done! 🎉'}
        </Typography>
      </Box>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Business Information
          </Typography>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            TabIndicatorProps={{ style: { background: '#1976d2' } }}
          >
            {tabLabels.map((label, idx) => (
              <Tab
                key={label}
                label={renderTabLabel(label, idx)}
                sx={approvedTabs[idx] ? { bgcolor: green[50], color: green[700], borderRadius: 2, fontWeight: 700 } : {}}
                iconPosition="end"
                icon={tabReadOnly[idx] ? (
                  <EditIcon
                    sx={{ color: grey[600], fontSize: 18, ml: 1, cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); handleEditTab(idx); }}
                  />
                ) : undefined}
              />
            ))}
          </Tabs>
          <TabPanel value={activeTab} index={0}>
            {tabReadOnly[0] ? renderSummaryCard(0) : renderBasicInfo()}
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            {tabReadOnly[1] ? renderSummaryCard(1) : renderOwnershipDetails()}
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            {tabReadOnly[2] ? renderSummaryCard(2) : renderFinancialHistory()}
          </TabPanel>
          {!tabReadOnly[activeTab] && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              {!showApprovalPrompt ? (
                <Tooltip title={activeTab < 2 ? 'Next Section' : 'Finish'}>
                  <Fab
                    color="secondary"
                    onClick={handleNext}
                    sx={{ bgcolor: '#ff9800', color: '#fff', '&:hover': { bgcolor: '#ffa726' } }}
                  >
                    {activeTab < 2 ? 'Next' : 'Finish'}
                  </Fab>
                </Tooltip>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" sx={{ color: '#1976d2' }}>Everything look correct?</Typography>
                  <Tooltip title="Approve">
                    <Fab color="success" onClick={handleApproveTab} sx={{ mr: 1 }}>
                      <CheckCircleIcon />
                    </Fab>
                  </Tooltip>
                  <Tooltip title="Go Back">
                    <Fab color="error" onClick={() => setShowApprovalPrompt(false)}>
                      <EditIcon />
                    </Fab>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
      <Snackbar
        open={showToast}
        autoHideDuration={2000}
        onClose={() => setShowToast(false)}
        message={toastMsg}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        ContentProps={{ sx: { bgcolor: '#ff9800', color: '#fff', fontWeight: 600 } }}
      />
    </Box>
  );
};

export default BusinessInfo; 