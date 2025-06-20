import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip, Snackbar, Alert, CircularProgress, Card } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface Subcomponent {
  id: string;
  title: string;
  step: string;
  hint: string;
  frequencyPercent: number;
  timePercent: number;
  description?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  selectedMonths?: string[];
  selectedRoles?: string[];
}

interface SubcomponentOrgChartProps {
  subcomponents: Subcomponent[];
  onUpdate: (subcomponents: Subcomponent[]) => void;
  onEdit: (sub: Subcomponent) => void;
}

const nodeWidth = 240;
const nodeHeight = 120;

const SubcomponentCard = ({ sub, color, onEdit, isConnecting, onConnect, isSelected, onCardPositionUpdate, connectionSource, isTargetAllowed }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (cardRef.current && onCardPositionUpdate) {
      const resizeObserver = new ResizeObserver(() => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) {
          onCardPositionUpdate(sub.id, rect);
        }
      });
      
      resizeObserver.observe(cardRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [sub.id, onCardPositionUpdate]);

  const highlight = isConnecting && (connectionSource === sub.id || (isTargetAllowed && isHovered));

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isConnecting && isTargetAllowed) {
      // Add visual feedback for valid connection target
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', sub.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      draggable={!isConnecting}
      tabIndex={0}
      aria-label={`Subcomponent ${sub.title}`}
      sx={{
        minWidth: 160,
        minHeight: 60,
        maxWidth: 180,
        maxHeight: 80,
        borderRadius: 1,
        boxShadow: isSelected || highlight ? 4 : 2,
        border: `2px solid ${highlight ? '#1976d2' : isSelected ? '#1976d2' : color}`,
        fontFamily: 'Roboto, Arial, sans-serif',
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 1.5,
        background: highlight 
          ? 'linear-gradient(135deg, #e3f2fd 60%, #fff 100%)' 
          : isSelected 
            ? 'linear-gradient(135deg, #e3f2fd 60%, #fff 100%)' 
            : '#fff',
        m: 1,
        transition: 'all 0.2s ease-in-out',
        outline: highlight ? '2px solid #1976d2' : 'none',
        cursor: isConnecting && isTargetAllowed ? 'pointer' : 'default',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        '&:hover': {
          boxShadow: highlight ? 6 : 4,
          transform: 'translateY(-2px)',
        },
        '&:focus': {
          outline: '2px solid #1976d2',
          outlineOffset: 2,
        },
      }}
      onClick={() => isConnecting && isTargetAllowed && onConnect(sub.id)}
    >
      {/* Anchor points */}
      <Box sx={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, bgcolor: '#1976d2', borderRadius: '50%', opacity: isHovered || highlight ? 1 : 0.5 }} />
      <Box sx={{ position: 'absolute', top: '50%', right: -6, transform: 'translateY(-50%)', width: 12, height: 12, bgcolor: '#1976d2', borderRadius: '50%', opacity: isHovered || highlight ? 1 : 0.5 }} />
      <Box sx={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateY(-50%)', width: 12, height: 12, bgcolor: '#1976d2', borderRadius: '50%', opacity: isHovered || highlight ? 1 : 0.5 }} />
      <Box sx={{ position: 'absolute', top: '50%', left: -6, transform: 'translateY(-50%)', width: 12, height: 12, bgcolor: '#1976d2', borderRadius: '50%', opacity: isHovered || highlight ? 1 : 0.5 }} />
      
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 700, 
          lineHeight: 1.2, 
          fontFamily: 'Roboto, Arial, sans-serif', 
          textAlign: 'center',
          color: highlight ? '#1976d2' : 'inherit',
        }}
      >
        {sub.title}
      </Typography>
      
      <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
        <Tooltip title="Edit details">
          <IconButton 
            size="small" 
            onClick={e => { 
              e.stopPropagation(); 
              onEdit(sub); 
            }}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isConnecting && (
          <Tooltip title="Connect to this subcomponent">
            <IconButton 
              size="small" 
              onClick={() => isTargetAllowed && onConnect(sub.id)} 
              color="primary" 
              aria-label="Connect"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
};

const SortableStepBox = ({ id, sub, onEdit, isConnecting, onConnect, isSelected, onCardPositionUpdate, connectionSource, isTargetAllowed }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, data: { type: 'step' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
    zIndex: isDragging ? 1 : 0,
    boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        userSelect: 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        },
      }}
    >
      <SubcomponentCard
        sub={sub}
        color="#1976d2"
        onEdit={onEdit}
        isConnecting={isConnecting}
        onConnect={onConnect}
        isSelected={isSelected}
        onCardPositionUpdate={onCardPositionUpdate}
        connectionSource={connectionSource}
        isTargetAllowed={isTargetAllowed}
      />
    </Box>
  );
};

const SubcomponentOrgChart = ({ subcomponents, onUpdate, onEdit }: SubcomponentOrgChartProps) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeSteps, setActiveSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const cardPositions = useRef<Record<string, DOMRect>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);

  const handleCardPositionUpdate = useCallback((id: string, rect: DOMRect) => {
    cardPositions.current[id] = rect;
  }, []);

  const validateConnection = useCallback((sourceId: string, targetId: string): boolean => {
    // Prevent self-connections
    if (sourceId === targetId) {
      setError('Cannot connect a subcomponent to itself');
      return false;
    }

    // Check for circular connections
    const visited = new Set<string>();
    const stack = [targetId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === sourceId) {
        setError('Circular connections are not allowed');
        return false;
      }
      if (!visited.has(current)) {
        visited.add(current);
        connections
          .filter(conn => conn.source === current)
          .forEach(conn => stack.push(conn.target));
      }
    }

    // Check if connection already exists
    if (connections.some(conn => conn.source === sourceId && conn.target === targetId)) {
      setError('This connection already exists');
      return false;
    }

    return true;
  }, [connections]);

  const handleConnect = useCallback((targetId: string) => {
    if (!connectionSource) {
      setConnectionSource(targetId);
      setIsConnecting(true);
      return;
    }

    if (validateConnection(connectionSource, targetId)) {
      const newConnection: Connection = {
        source: connectionSource,
        target: targetId,
        id: `${connectionSource}-${targetId}`
      };
      setConnections(prev => [...prev, newConnection]);
      setError(null);
    }

    setConnectionSource(null);
    setIsConnecting(false);
  }, [connectionSource, validateConnection]);

  const handleDeleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = subcomponents.findIndex(item => item.id === active.id);
      const newIndex = subcomponents.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSubcomponents = [...subcomponents];
        const [movedItem] = newSubcomponents.splice(oldIndex, 1);
        newSubcomponents.splice(newIndex, 0, movedItem);
        
        onUpdate(newSubcomponents);
      }
    }
  }, [subcomponents, onUpdate]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setHoveredTarget(over.id as string);
    } else {
      setHoveredTarget(null);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setHoveredTarget(null);
  }, []);

  // Group subcomponents by step, but always include all steps
  const steps = useMemo(() => {
    const stepMap = new Map<string, Subcomponent[]>();
    subcomponents.forEach(sub => {
      if (!stepMap.has(sub.step)) stepMap.set(sub.step, []);
      stepMap.get(sub.step)!.push(sub);
    });
    return Array.from(stepMap.entries());
  }, [subcomponents]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={subcomponents.map(s => s.id)}>
          {subcomponents.map(sub => (
            <SortableStepBox
              key={sub.id}
              id={sub.id}
              sub={sub}
              onEdit={onEdit}
              isConnecting={isConnecting}
              onConnect={handleConnect}
              isSelected={editing === sub.id}
              onCardPositionUpdate={handleCardPositionUpdate}
              connectionSource={connectionSource}
              isTargetAllowed={!!connectionSource && connectionSource !== sub.id}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {hoveredTarget ? (
            <SubcomponentCard
              sub={subcomponents.find(s => s.id === hoveredTarget)}
              color="#1976d2"
              onEdit={onEdit}
              isConnecting={isConnecting}
              onConnect={handleConnect}
              isSelected={false}
              onCardPositionUpdate={handleCardPositionUpdate}
              connectionSource={connectionSource}
              isTargetAllowed={false}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Connection lines */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        {connections.map(connection => {
          const sourceRect = cardPositions.current[connection.source];
          const targetRect = cardPositions.current[connection.target];
          
          if (!sourceRect || !targetRect) return null;

          const sourceX = sourceRect.right;
          const sourceY = sourceRect.top + sourceRect.height / 2;
          const targetX = targetRect.left;
          const targetY = targetRect.top + targetRect.height / 2;

          return (
            <g key={connection.id}>
              <path
                d={`M ${sourceX} ${sourceY} C ${(sourceX + targetX) / 2} ${sourceY}, ${(sourceX + targetX) / 2} ${targetY}, ${targetX} ${targetY}`}
                stroke="#1976d2"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
              <circle
                cx={sourceX}
                cy={sourceY}
                r="4"
                fill="#1976d2"
              />
              <circle
                cx={targetX}
                cy={targetY}
                r="4"
                fill="#1976d2"
              />
            </g>
          );
        })}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#1976d2"
            />
          </marker>
        </defs>
      </svg>

      {/* Error message */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Loading indicator */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 2
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default SubcomponentOrgChart; 