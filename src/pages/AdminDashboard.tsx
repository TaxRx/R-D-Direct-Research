import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  Fab,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ListItemButton,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  ExitToApp as ExitIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  Launch as LaunchIcon,
  AddBusiness as AddBusinessIcon
} from '@mui/icons-material';
import { Client, CreateClientData, UpdateClientData, ClientWithBusinesses, BusinessSummary } from '../types/User';
import { Business } from '../types/Business';
import { SupabaseClientService } from '../services/supabaseClientService';
import { SupabaseBusinessService } from '../services/supabaseBusinessService';

interface AdminDashboardProps {
  businesses: Business[];
  onExitAdmin: () => void;
  onSelectBusiness: (businessId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ businesses, onExitAdmin, onSelectBusiness }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [businessesState, setBusinessesState] = useState<Business[]>(businesses);
  const [clientBusinesses, setClientBusinesses] = useState<{ [clientId: string]: Business[] }>({});
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  
  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const [selectedClientForBusiness, setSelectedClientForBusiness] = useState<string | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  
  // System stats state
  const [systemStats, setSystemStats] = useState<any>(null);
  
  // Form states
  const [clientFormData, setClientFormData] = useState<CreateClientData>({
    name: '',
    email: '',
    role: 'client',
    businessIds: [],
    notes: ''
  });

  const [businessFormData, setBusinessFormData] = useState({
    businessName: '',
    entityType: 'LLC',
    entityState: '',
    startYear: new Date().getFullYear(),
    description: ''
  });

  // Load clients on component mount
  useEffect(() => {
    loadClients();
    loadBusinesses();
  }, []);

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      const clients = await SupabaseClientService.getClients();
      setClients(clients);
      
      // Load businesses for each client
      const clientBusinessMap: { [clientId: string]: Business[] } = {};
      for (const client of clients) {
        const clientBusinesses = await SupabaseBusinessService.getBusinessesByUser(client.id);
        clientBusinessMap[client.id] = clientBusinesses;
      }
      setClientBusinesses(clientBusinessMap);
    } catch (error) {
      console.error('Error loading clients:', error);
      setNotification({ type: 'error', message: 'Failed to load clients' });
    }
  };

  // Load system stats from Supabase
  const loadSystemStats = async () => {
    try {
      const stats = await SupabaseClientService.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  // Load businesses from Supabase
  const loadBusinesses = async () => {
    try {
      const businesses = await SupabaseBusinessService.getBusinesses();
      setBusinessesState(businesses);
    } catch (error) {
      console.error('Error loading businesses:', error);
      setNotification({ type: 'error', message: 'Failed to load businesses' });
    }
  };

  const handleCreateClient = async () => {
    try {
      const newClient = await SupabaseClientService.createClient(clientFormData);
      if (newClient) {
        setClients(prev => [newClient, ...prev]);
        setNotification({ type: 'success', message: 'Client created successfully' });
        setClientDialogOpen(false);
        setClientFormData({
          name: '',
          email: '',
          role: 'client',
          businessIds: [],
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      setNotification({ type: 'error', message: 'Failed to create client' });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientFormData({
      name: client.name,
      email: client.email,
      role: client.role,
      businessIds: client.businessIds,
      notes: client.notes || ''
    });
    setClientDialogOpen(true);
  };

  const handleUpdateClient = async (clientId: string, updateData: UpdateClientData) => {
    try {
      const updatedClient = await SupabaseClientService.updateClient(clientId, updateData);
      if (updatedClient) {
        setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
        setNotification({ type: 'success', message: 'Client updated successfully' });
        setClientDialogOpen(false);
        setEditingClient(null);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setNotification({ type: 'error', message: 'Failed to update client' });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await SupabaseClientService.deleteClient(clientId);
        setClients(prev => prev.filter(c => c.id !== clientId));
        setNotification({ type: 'success', message: 'Client deleted successfully' });
      } catch (error) {
        console.error('Error deleting client:', error);
        setNotification({ type: 'error', message: 'Failed to delete client' });
      }
    }
  };

  const handleCreateBusiness = async () => {
    if (!selectedClientForBusiness) return;
    
    try {
      const newBusiness = await SupabaseBusinessService.createBusiness({
        ...businessFormData
      }, selectedClientForBusiness);
      
      if (newBusiness) {
        setBusinessesState(prev => [newBusiness, ...prev]);
        
        // Refresh the client businesses for the selected client
        const updatedClientBusinesses = await SupabaseBusinessService.getBusinessesByUser(selectedClientForBusiness);
        setClientBusinesses(prev => ({
          ...prev,
          [selectedClientForBusiness]: updatedClientBusinesses
        }));
        
        // Update the client's businessIds array
        setClients(prev => prev.map(client => {
          if (client.id === selectedClientForBusiness) {
            return {
              ...client,
              businessIds: [...client.businessIds, newBusiness.id]
            };
          }
          return client;
        }));
        
        setNotification({ type: 'success', message: 'Business created successfully' });
        setBusinessDialogOpen(false);
        setSelectedClientForBusiness(null);
        setBusinessFormData({
          businessName: '',
          entityType: 'LLC',
          entityState: '',
          startYear: new Date().getFullYear(),
          description: ''
        });
      }
    } catch (error) {
      console.error('Error creating business:', error);
      setNotification({ type: 'error', message: 'Failed to create business' });
    }
  };

  const handleLaunchBusiness = (businessId: string) => {
    console.log('handleLaunchBusiness called with businessId:', businessId);
    console.log('Calling onSelectBusiness with businessId:', businessId);
    onSelectBusiness(businessId);
  };

  const handleSaveClient = async () => {
    if (editingClient) {
      await handleUpdateClient(editingClient.id, clientFormData);
    } else {
      await handleCreateClient();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleExpandClient = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const handleAddBusiness = (clientId: string) => {
    setSelectedClientForBusiness(clientId);
    setBusinessDialogOpen(true);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AdminIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Admin Dashboard
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ExitIcon />}
          onClick={onExitAdmin}
        >
          Exit Admin Mode
        </Button>
      </Box>

      {/* System Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Clients
              </Typography>
              <Typography variant="h4" color="primary">
                {clients.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered clients
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Businesses
              </Typography>
              <Typography variant="h4" color="primary">
                {businessesState.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active businesses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Clients
              </Typography>
              <Typography variant="h4" color="success.main">
                {clients.filter(c => c.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Admin Users
              </Typography>
              <Typography variant="h4" color="error.main">
                {clients.filter(c => c.role === 'admin').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System administrators
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Unified Client Management */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              Client Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setClientDialogOpen(true);
                setEditingClient(null);
                setClientFormData({
                  name: '',
                  email: '',
                  role: 'client',
                  businessIds: [],
                  notes: ''
                });
              }}
            >
              Add Client
            </Button>
          </Box>

          {/* Client List with Expandable Business Details */}
          <Box>
            {clients.map((client) => {
              const clientBusinessList = clientBusinesses[client.id] || [];
              const isExpanded = expandedClient === client.id;
              
              return (
                <Accordion 
                  key={client.id} 
                  expanded={isExpanded}
                  onChange={() => handleExpandClient(client.id)}
                  sx={{ mb: 2 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <PersonIcon color="primary" />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{client.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {client.email} • {clientBusinessList.length} businesses
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={client.role}
                          color={client.role === 'admin' ? 'error' : 'default'}
                          size="small"
                        />
                        <Chip
                          label={client.isActive ? 'Active' : 'Inactive'}
                          color={client.isActive ? 'success' : 'default'}
                          size="small"
                        />
                        <Tooltip title="Edit Client">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClient(client);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {client.role !== 'admin' && (
                          <Tooltip title="Delete Client">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Box sx={{ width: '100%' }}>
                      {/* Business List */}
                      {clientBusinessList.length > 0 ? (
                        <List>
                          {clientBusinessList.map((business) => (
                            <ListItem key={business.id} disablePadding>
                              <ListItemButton
                                onClick={() => handleLaunchBusiness(business.id)}
                                sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  p: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  mb: 1
                                }}
                              >
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {business.businessName}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {business.entityType} • {business.entityState} • Est. {business.startYear}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label="Launch R&D Manager"
                                    color="primary"
                                    size="small"
                                    icon={<LaunchIcon />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLaunchBusiness(business.id);
                                    }}
                                    sx={{ cursor: 'pointer' }}
                                  />
                                </Box>
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Box sx={{ p: 2, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            No businesses assigned to this client
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Add Business Button */}
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          startIcon={<AddBusinessIcon />}
                          onClick={() => handleAddBusiness(client.id)}
                          size="small"
                        >
                          Add Business
                        </Button>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Client Dialog */}
      <Dialog open={clientDialogOpen} onClose={() => setClientDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClient ? 'Edit Client' : 'Create New Client'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={clientFormData.role}
                    onChange={(e) => setClientFormData({ ...clientFormData, role: e.target.value as 'admin' | 'client' })}
                    label="Role"
                  >
                    <MenuItem value="client">Client</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={clientFormData.notes}
                  onChange={(e) => setClientFormData({ ...clientFormData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveClient} variant="contained">
            {editingClient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Business Creation Dialog */}
      <Dialog open={businessDialogOpen} onClose={() => setBusinessDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Business
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Business Name"
                  value={businessFormData.businessName}
                  onChange={(e) => setBusinessFormData({ ...businessFormData, businessName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={businessFormData.entityType}
                    onChange={(e) => setBusinessFormData({ ...businessFormData, entityType: e.target.value })}
                    label="Entity Type"
                  >
                    <MenuItem value="C-Corporation">C-Corporation</MenuItem>
                    <MenuItem value="S-Corporation">S-Corporation</MenuItem>
                    <MenuItem value="LLC">LLC</MenuItem>
                    <MenuItem value="Partnership">Partnership</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select
                    value={businessFormData.entityState}
                    onChange={(e) => setBusinessFormData({ ...businessFormData, entityState: e.target.value })}
                    label="State"
                  >
                    <MenuItem value="CA">California</MenuItem>
                    <MenuItem value="NY">New York</MenuItem>
                    <MenuItem value="TX">Texas</MenuItem>
                    <MenuItem value="FL">Florida</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Year"
                  type="number"
                  value={businessFormData.startYear}
                  onChange={(e) => setBusinessFormData({ ...businessFormData, startYear: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={businessFormData.description}
                  onChange={(e) => setBusinessFormData({ ...businessFormData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBusinessDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBusiness} variant="contained">
            Create Business
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      {notification && (
        <Alert 
          severity={notification.type} 
          sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}
    </Box>
  );
};

export default AdminDashboard; 