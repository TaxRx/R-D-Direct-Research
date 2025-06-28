import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Tooltip, Chip, Card, CardHeader, CardContent, CardActions, Fab, IconButton, TextField, Switch, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Divider } from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Settings as SettingsIcon, Person as PersonIcon, Business as BusinessIcon, Close as CloseIcon, FileDownload as FileDownloadIcon, Assessment as AssessmentIcon, ExpandMore as ExpandMoreIcon, DragIndicator as DragIndicatorIcon, Undo as UndoIcon, Redo as RedoIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon2 } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import { green } from '@mui/material/colors';
import { RoleNode, Business } from '../../types/Business';
import { approvalsService, TabApproval, approvalStorageService } from '../../services/approvals';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { RolesService, RoleTree } from '../../services/rolesService';

declare global {
  interface Window {
    saveRolesTimeout?: ReturnType<typeof setTimeout>;
  }
}

// Helper function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface IdentifyRolesTabProps {
  selectedYear: number;
  selectedBusinessId: string;
  businesses: Business[];
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  tabReadOnly: boolean[];
  setTabReadOnly: React.Dispatch<React.SetStateAction<boolean[]>>;
  approvedTabs: boolean[];
  setApprovedTabs: React.Dispatch<React.SetStateAction<boolean[]>>;
  onEdit: () => void;
  onApprovalChange?: (isApproved: boolean, approvalData: TabApproval | null) => void;
}

// Color palette for roles
const ROLE_COLORS = [
  '#1976d2', // blue
  '#43a047', // green
  '#fbc02d', // yellow
  '#e64a19', // orange
  '#8e24aa', // purple
  '#00838f', // teal
  '#c62828', // red
  '#6d4c41', // brown
  '#3949ab', // indigo
  '#00acc1', // cyan
];

// Helper functions
const getNextRoleColor = (existingRoles: RoleNode[]): string => {
  const usedColors = new Set<string>();
  function collectColors(nodes: RoleNode[]) {
    nodes.forEach(node => {
      if (node.color) usedColors.add(node.color);
      if (node.children.length > 0) collectColors(node.children);
    });
  }
  collectColors(existingRoles);
  for (const color of ROLE_COLORS) {
    if (!usedColors.has(color)) return color;
  }
  return ROLE_COLORS[0]; // Fallback to first color
};

const reorder = (list: RoleNode[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const flattenAllRoles = (nodes: RoleNode[]): RoleNode[] => {
  if (!Array.isArray(nodes)) return [];
  let result: RoleNode[] = [];
  nodes.forEach(node => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenAllRoles(node.children));
    }
  });
  return result;
};

const getApprovalKey = (year: number) => `rolesTabApproval-${year}`;

// Helper function to convert RoleNode[] to RoleTree[]
const convertRoleNodesToRoleTrees = (nodes: RoleNode[]): RoleTree[] => {
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
    color: node.color || '#1976d2', // Provide default color if undefined
    participatesInRD: node.participatesInRD,
    children: convertRoleNodesToRoleTrees(node.children)
  }));
};

const IdentifyRolesTab: React.FC<IdentifyRolesTabProps> = ({
  selectedYear,
  selectedBusinessId,
  businesses,
  setBusinesses,
  tabReadOnly,
  setTabReadOnly,
  approvedTabs,
  setApprovedTabs,
  onEdit,
  onApprovalChange
}) => {
  const theme = useTheme();
  const [assignToAllYears, setAssignToAllYears] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalData, setApprovalData] = useState<TabApproval | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [rolesCorrupted, setRolesCorrupted] = useState(false);
  const [showRepairDialog, setShowRepairDialog] = useState(false);

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
  const roles: RoleNode[] = Array.isArray(selectedBusiness?.rolesByYear?.[selectedYear]) ? selectedBusiness.rolesByYear[selectedYear] : [];
  const allRoles: RoleNode[] = flattenAllRoles(roles);

  // Utility to clear all roles-related localStorage
  const clearAllRolesLocalStorage = () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('roles-')) localStorage.removeItem(k);
    });
  };

  // Only check for corruption after roles have been loaded and we're not in loading state
  useEffect(() => {
    if (isLoadingRoles) return; // Don't check during loading
    
    if (!selectedBusinessId || !selectedYear) {
      setRolesCorrupted(false); // Not corrupted, just not ready
      setShowRepairDialog(false);
      return;
    }
    
    const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusiness) {
      console.warn('Selected business not found');
      setRolesCorrupted(false); // Not corrupted, just not found
      setShowRepairDialog(false);
      return;
    }
    
    const rolesData = selectedBusiness?.rolesByYear?.[selectedYear];
    
    // Only consider it corrupted if it's explicitly not an array (null, object, etc.)
    // Empty array is fine, undefined is fine (will be loaded from DB)
    if (rolesData !== undefined && !Array.isArray(rolesData)) {
      console.warn('Roles data is corrupted for year', selectedYear, 'Data:', rolesData);
      setRolesCorrupted(true);
      setShowRepairDialog(true);
    } else {
      setRolesCorrupted(false);
      setShowRepairDialog(false);
    }
  }, [selectedYear, selectedBusinessId, businesses, isLoadingRoles, roles.length]);

  const handleRepairRoles = () => {
    clearAllRolesLocalStorage();
    setBusinesses(bs => bs.map(b => {
      if (b.id === selectedBusinessId) {
        return {
          ...b,
          rolesByYear: {
            ...b.rolesByYear,
            [selectedYear]: []
          }
        };
      }
      return b;
    }));
    setRolesCorrupted(false);
    setShowRepairDialog(false);
  };

  const loadRoles = async () => {
    if (!selectedBusinessId || !selectedBusinessId.trim() || !selectedYear) {
      console.log('Cannot load roles: missing businessId or year', { selectedBusinessId, selectedYear });
      return;
    }
    
    setIsLoadingRoles(true);
    try {
      console.log('Loading roles from database:', { businessId: selectedBusinessId, year: selectedYear });
      // Load roles from Supabase using RolesService
      const rolesFromDb = await RolesService.loadRoles(selectedBusinessId, selectedYear);
      
      if (rolesFromDb && Array.isArray(rolesFromDb)) {
        console.log('Loaded roles from database:', rolesFromDb);
        setBusinesses(bs => bs.map(b => {
          if (b.id === selectedBusinessId) {
            return {
              ...b,
              rolesByYear: {
                ...b.rolesByYear,
                [selectedYear]: rolesFromDb
              }
            };
          }
          return b;
        }));
      } else {
        console.log('No roles found in database, using empty array');
        setBusinesses(bs => bs.map(b => {
          if (b.id === selectedBusinessId) {
            return {
              ...b,
              rolesByYear: {
                ...b.rolesByYear,
                [selectedYear]: []
              }
            };
          }
          return b;
        }));
      }
    } catch (error) {
      console.error('Error loading roles from database:', error);
      // Fallback to localStorage if database fails
      const storedRoles = localStorage.getItem(`roles-${selectedBusinessId}-${selectedYear}`);
      if (storedRoles) {
        try {
          const rolesToLoad = JSON.parse(storedRoles);
          if (Array.isArray(rolesToLoad)) {
            console.log('Loaded roles from localStorage fallback:', rolesToLoad);
            setBusinesses(bs => bs.map(b => {
              if (b.id === selectedBusinessId) {
                return {
                  ...b,
                  rolesByYear: {
                    ...b.rolesByYear,
                    [selectedYear]: rolesToLoad
                  }
                };
              }
              return b;
            }));
          }
        } catch (parseError) {
          console.warn('Corrupted localStorage roles data, clearing');
          localStorage.removeItem(`roles-${selectedBusinessId}-${selectedYear}`);
        }
      }
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [selectedYear, selectedBusinessId]);

  // Create default Research Leader role if no roles exist
  useEffect(() => {
    // Only proceed if we have valid business/year and we're not loading
    if (!selectedBusinessId || !selectedBusinessId.trim() || !selectedYear || isLoadingRoles) {
      return;
    }
    
    if (roles.length === 0) {
      const researchLeader: RoleNode = {
        id: 'research-leader',
        name: 'Research Leader',
        color: ROLE_COLORS[0],
        children: [],
        participatesInRD: true
      };
      updateRoles([researchLeader]);
    } else if (!roles.some(r => r.id === 'research-leader')) {
      const researchLeader: RoleNode = {
        id: 'research-leader',
        name: 'Research Leader',
        color: ROLE_COLORS[0],
        children: [],
        participatesInRD: true
      };
      updateRoles([researchLeader, ...roles]);
    }
  }, [selectedYear, selectedBusinessId, roles.length, isLoadingRoles]);

  // Load approval state from storage on mount
  useEffect(() => {
    const stored = approvalsService.getApprovalData('roles', selectedYear);
    if (stored) {
      setIsApproved(stored.isApproved);
      setApprovalData(stored.approvalData);
    } else {
      setIsApproved(false);
      setApprovalData(null);
    }
  }, [selectedYear]);

  // Helper to update roles in business data
  const updateRoles = async (newRoles: RoleNode[]) => {
    if (!selectedBusinessId || !selectedBusinessId.trim()) {
      console.error('Cannot save roles: selectedBusinessId is empty or undefined');
      setRolesCorrupted(true);
      setShowRepairDialog(true);
      return;
    }
    if (!selectedYear) {
      console.error('Cannot save roles: selectedYear is undefined');
      setRolesCorrupted(true);
      setShowRepairDialog(true);
      return;
    }

    console.log('Updating roles in state:', { businessId: selectedBusinessId, year: selectedYear, rolesCount: newRoles.length });

    // Update local state immediately for responsive UI
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
    
    // Debounce database save to prevent multiple rapid calls
    if (window.saveRolesTimeout) {
      clearTimeout(window.saveRolesTimeout);
    }
    
    window.saveRolesTimeout = setTimeout(async () => {
      try {
        console.log('Saving roles to database:', { businessId: selectedBusinessId, year: selectedYear, rolesCount: newRoles.length });
        const roleTrees = convertRoleNodesToRoleTrees(newRoles);
        const success = await RolesService.saveRoles(selectedBusinessId, selectedYear, roleTrees);
        if (!success) {
          console.error('Failed to save roles to database');
        } else {
          console.log('Successfully saved roles to database');
        }
      } catch (error) {
        console.error('Error saving roles to database:', error);
      }
    }, 500); // 500ms debounce
    
    // Also save to localStorage as backup
    localStorage.setItem(`roles-${selectedBusinessId}-${selectedYear}`, JSON.stringify(newRoles));
  };

  // Save roles to localStorage when business or year changes
  useEffect(() => {
    if (selectedBusinessId && selectedYear && roles.length > 0) {
      localStorage.setItem(`roles-${selectedBusinessId}-${selectedYear}`, JSON.stringify(roles));
    }
  }, [selectedBusinessId, selectedYear, roles]);

  // Copy roles to all years
  const copyRolesToAllYears = async (roles: RoleNode[]) => {
    if (!selectedBusinessId || !selectedBusinessId.trim()) {
      console.error('Cannot copy roles: selectedBusinessId is empty or undefined');
      return;
    }

    setBusinesses(bs => bs.map(b => {
      if (b.id === selectedBusinessId) {
        const years = Object.keys(b.rolesByYear || {}).map(Number);
        const newRolesByYear = { ...b.rolesByYear };
        years.forEach(y => {
          if (JSON.stringify(b.rolesByYear[y]) !== JSON.stringify(roles)) {
            newRolesByYear[y] = JSON.parse(JSON.stringify(roles));
            // Save to database for each year
            const roleTrees = convertRoleNodesToRoleTrees(roles);
            RolesService.saveRoles(selectedBusinessId, y, roleTrees).catch(error => {
              console.error(`Error saving roles to database for year ${y}:`, error);
            });
            // Also save to localStorage as backup
            localStorage.setItem(`roles-${selectedBusinessId}-${y}`, JSON.stringify(roles));
          }
        });
        return { ...b, rolesByYear: newRolesByYear };
      }
      return b;
    }));
  };

  // Role management handlers
  const handleAddRole = (parentId?: string) => {
    const color = getNextRoleColor(roles);
    const newRole: RoleNode = {
      id: generateUUID(),
      name: 'New Role',
      color,
      children: [],
      participatesInRD: true
    };

    // Special case: add to Research Leader's children
    if (parentId === 'research-leader') {
      const updatedRoles = roles.map(role => {
        if (role.name === 'Research Leader') {
          return { ...role, children: [...role.children, newRole] };
        }
        return role;
      });
      updateRoles(updatedRoles);
      if (assignToAllYears) {
        copyRolesToAllYears(updatedRoles);
      }
      return;
    }

    const addRoleRecursive = (nodes: RoleNode[]): RoleNode[] =>
      nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...node.children, newRole] };
        }
        return { ...node, children: addRoleRecursive(node.children) };
      });

    let updatedRoles;
    if (!parentId) {
      updatedRoles = [...roles, newRole];
    } else {
      updatedRoles = addRoleRecursive(roles);
      setExpandedIds(ids => [...ids, parentId]);
    }

    updateRoles(updatedRoles);
    if (assignToAllYears) {
      copyRolesToAllYears(updatedRoles);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    const deleteRecursive = (nodes: RoleNode[]): RoleNode[] =>
      nodes.filter(node => node.id !== roleId).map(node => ({ ...node, children: deleteRecursive(node.children) }));
    updateRoles(deleteRecursive(roles));
    resetApproval();
  };

  const handleRenameRole = (roleId: string, name: string) => {
    const renameRecursive = (nodes: RoleNode[]): RoleNode[] =>
      nodes.map(node => node.id === roleId ? { ...node, name } : { ...node, children: renameRecursive(node.children) });
    updateRoles(renameRecursive(roles));
    resetApproval();
  };

  const handleToggleParticipatesInRD = (roleId: string) => {
    const toggleRecursive = (nodes: RoleNode[]): RoleNode[] =>
      nodes.map(node => {
        if (node.id === roleId) {
          return { ...node, participatesInRD: !node.participatesInRD };
        }
        return { ...node, children: toggleRecursive(node.children) };
      });
    updateRoles(toggleRecursive(roles));
    resetApproval();
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reorderTree = (nodes: RoleNode[]): RoleNode[] => {
      if (
        nodes.length > 0 &&
        result.destination &&
        result.source.droppableId === (nodes[0]?.parentId || 'root') &&
        result.destination.droppableId === (nodes[0]?.parentId || 'root')
      ) {
        return reorder(nodes, result.source.index, result.destination.index);
      }
      return nodes.map(node => ({ ...node, children: reorderTree(node.children) }));
    };
    updateRoles(reorderTree(roles));
  };

  const resetApproval = () => {
    setApprovedTabs(prev => {
      const copy = [...prev];
      copy[0] = false;
      return copy;
    });
    setTabReadOnly(prev => {
      const copy = [...prev];
      copy[0] = false;
      return copy;
    });
    setBusinesses(bs => bs.map(b => {
      if (b.id === selectedBusinessId) {
        const approvalByYear = { ...(b.approvalByYear || {}) };
        approvalByYear[selectedYear] = {
          ...(approvalByYear[selectedYear] || {}),
          approvedTabs: approvedTabs.map((a, i) => i === 0 ? false : a),
          tabReadOnly: tabReadOnly.map((r, i) => i === 0 ? false : r),
          approvalIp: undefined,
          approvalTime: undefined,
        };
        return { ...b, approvalByYear };
      }
      return b;
    }));
  };

  // Inline edit handlers
  const startEditing = (id: string, current: string) => {
    setEditingId(id);
    setEditingValue(current);
  };
  const finishEditing = (id: string) => {
    if (editingValue.trim()) handleRenameRole(id, editingValue.trim());
    setEditingId(null);
    setEditingValue('');
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
        data: roles
      };
      
      approvalsService.recordApproval('roles', approval, selectedYear);
      setApprovalData(approval);
      setIsApproved(true);
    } catch (error) {
      console.error('Error getting IP address:', error);
    }
  };

  // Handle unapproval
  const handleUnapprove = () => {
    approvalsService.removeApproval('roles', selectedYear);
    setApprovalData(null);
    setIsApproved(false);
  };

  // Recursive tree rendering with drag-and-drop for siblings
  const renderRoleTree = (nodes: RoleNode[], parentId?: string, isSummary = false) => {
    return (
      <Droppable droppableId={parentId || 'root'} type={parentId || 'root'}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {nodes.map((node, idx) => (
              <Draggable key={node.id} draggableId={node.id} index={idx} isDragDisabled={isSummary || node.name === 'Research Leader'}>
                {(dragProvided) => (
                  <Box
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    sx={{ ml: parentId ? 4 : 0, mb: 1, borderLeft: parentId ? '2px solid #eee' : 'none', pl: parentId ? 2 : 0 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {node.name !== 'Research Leader' && !isSummary && (
                        <span {...dragProvided.dragHandleProps} style={{ cursor: 'grab' }}>⠿</span>
                      )}
                      {editingId === node.id ? (
                        <TextField
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onBlur={() => finishEditing(node.id)}
                          onKeyDown={e => { if (e.key === 'Enter') finishEditing(node.id); }}
                          size="small"
                          autoFocus
                          sx={{ minWidth: 120 }}
                        />
                      ) : (
                        <Chip
                          label={node.name}
                          sx={{
                            bgcolor: node.color + '22',
                            color: '#222',
                            border: `2px solid ${node.color}`,
                            fontWeight: 600
                          }}
                          onClick={() => !isSummary && node.name !== 'Research Leader' && startEditing(node.id, node.name)}
                          onDelete={undefined}
                        />
                      )}
                      {!isSummary && (
                        <Tooltip title="Add Subordinate">
                          <IconButton size="small" onClick={() => handleAddRole(node.id)}>
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!isSummary && node.name !== 'Research Leader' && (
                        <>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDeleteRole(node.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Participates in R&D">
                            <Switch
                              size="small"
                              checked={node.participatesInRD}
                              onChange={(e) => handleToggleParticipatesInRD(node.id)}
                            />
                          </Tooltip>
                        </>
                      )}
                    </Box>
                    {node.children.length > 0 && renderRoleTree(node.children, node.id, isSummary)}
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    );
  };

  const renderRolesSummaryCard = () => {
    const approvalInfo = selectedBusiness?.approvalByYear?.[selectedYear];
    return (
      <Card variant="outlined" sx={{ mb: 2, bgcolor: green[50] }}>
        <CardHeader title="Roles Hierarchy Summary" />
        <CardContent>
          {renderRoleTree(roles, undefined, true)}
          {approvalInfo?.approvalIp && approvalInfo?.approvalTime && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Approved by {approvalInfo.approvalIp || 'Unknown'} at {new Date(approvalInfo.approvalTime || Date.now()).toLocaleString()}
              </Typography>
            </Box>
          )}
        </CardContent>
        <CardActions>
          <Tooltip title="Edit">
            <Fab size="small" color="primary" onClick={onEdit}>
              <EditIcon />
            </Fab>
          </Tooltip>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      <Dialog open={showRepairDialog}>
        <DialogTitle>Corrupted Roles Data</DialogTitle>
        <DialogContent>
          <Typography color="error">
            The roles data for {selectedYear} is corrupted or invalid. This can happen if a template was malformed or pasted incorrectly. Would you like to reset the roles for this year?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRepairRoles} color="error" variant="contained">Reset</Button>
        </DialogActions>
      </Dialog>
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
              Roles
              {isApproved && (
                <CheckCircleIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
              )}
            </Typography>
            {isApproved && approvalData && (
              <Box sx={{ ml: 3, fontSize: 14 }}>
                Approved: {new Date(approvalData.timestamp).toLocaleString()} (IP: {approvalData.ipAddress})
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleAddRole()}
        >
          Add Peer Role
        </Button>
      </Box>
      {/* Role tree in a card */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Role Hierarchy
              </Typography>
              <Chip 
                label={flattenAllRoles(roles).length} 
                size="small" 
                color="success" 
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
        <Box sx={{ p: 2, opacity: isApproved ? 0.7 : 1, pointerEvents: isApproved ? 'none' : 'auto' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            {renderRoleTree(roles)}
          </DragDropContext>
        </Box>
      </Card>
    </Box>
  );
};

export default IdentifyRolesTab; 