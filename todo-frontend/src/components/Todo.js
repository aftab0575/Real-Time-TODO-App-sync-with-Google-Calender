import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Checkbox, 
  IconButton, 
  Box,
  Chip,
  Tooltip, 
  Link,
  Paper,
  Badge,
  Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SyncIcon from '@mui/icons-material/Sync';
import FlagIcon from '@mui/icons-material/Flag';
import LabelIcon from '@mui/icons-material/Label';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import format from 'date-fns/format';
import isToday from 'date-fns/isToday';
import isTomorrow from 'date-fns/isTomorrow';
import isPast from 'date-fns/isPast';
import FileUpload from './FileUpload';
import { useCategories } from '../context/CategoryContext';

const Todo = ({ 
    todo, 
    onToggle, 
    onDelete, 
    onEdit, 
    onFileUpload, 
    onFileDelete,
    uploading,
    uploadError,
    fileInputRef
}) => {
    const { categories } = useCategories();
    const category = categories.find(cat => cat._id === todo.category);
    const categoryColor = category?.color || '#1976d2';

    // Format the due date and time
    const formatDueDate = () => {
        if (!todo.dueDate) return null;
        
        const dueDate = new Date(todo.dueDate);
        
        if (isToday(dueDate)) {
            return 'Today';
        } else if (isTomorrow(dueDate)) {
            return 'Tomorrow';
        } else {
            return format(dueDate, 'MMM d');
        }
    };

    // Get color for due date display
    const getDueDateColor = () => {
        if (!todo.dueDate) return 'default';
        
        const dueDate = new Date(todo.dueDate);
        const now = new Date();
        
        if (isPast(dueDate) && !todo.completed) {
            return 'error';
        } else if (isToday(dueDate)) {
            return 'warning';
        } else {
            return 'default';
        }
    };

    // Get color and icon for priority
    const getPriorityInfo = () => {
        switch (todo.priority) {
            case 'High':
                return { color: 'error', label: 'High', bgcolor: 'rgba(211, 47, 47, 0.1)' };
            case 'Medium':
                return { color: 'warning', label: 'Medium', bgcolor: 'rgba(237, 108, 2, 0.1)' };
            case 'Low':
                return { color: 'success', label: 'Low', bgcolor: 'rgba(46, 125, 50, 0.1)' };
            default:
                return { color: 'default', label: 'Normal', bgcolor: 'rgba(97, 97, 97, 0.1)' };
        }
    };

    // Get calendar sync status information
    const getCalendarSyncInfo = () => {
        if (!todo.calendarEvent) return null;
        
        if (todo.calendarEvent.synced) {
            return {
                color: 'success',
                label: 'Synced',
                tooltip: 'Task is synced with Google Calendar',
                link: null
            };
        } else if (todo.calendarEvent.lastSyncStatus === 'pending') {
            return {
                color: 'info',
                label: 'Syncing',
                tooltip: 'Syncing with Google Calendar...',
                link: null
            };
        } else if (todo.calendarEvent.lastSyncStatus === 'failed') {
            return {
                color: 'error',
                label: 'Sync Failed',
                tooltip: todo.calendarEvent.syncError || 'Failed to sync with Google Calendar',
                link: null
            };
        }
        
        return null;
    };

    const priorityInfo = getPriorityInfo();
    const formattedDueDate = formatDueDate();
    const calendarSyncInfo = getCalendarSyncInfo();
    
    // Get due date status (overdue, today, upcoming)
    const getDueDateStatus = () => {
        if (!todo.dueDate || todo.completed) return null;
        
        const dueDate = new Date(todo.dueDate);
        const now = new Date();
        
        if (isPast(dueDate)) {
            return { label: 'Overdue', color: '#e53935' };
        } else if (isToday(dueDate)) {
            return { label: 'Due Today', color: '#fb8c00' };
        } else if (isTomorrow(dueDate)) {
            return { label: 'Due Tomorrow', color: '#43a047' };
        }
        
        return null;
    };
    
    const dueDateStatus = getDueDateStatus();

    return (
        <Card 
          elevation={2} 
          sx={{ 
            mb: 3, 
            display: 'flex',
            borderRadius: 2,
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
            },
            overflow: 'visible'
          }}
        >
          {/* Priority indicator */}
          {!todo.completed && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                left: -4,
                px: 1,
                py: 0.5,
                borderRadius: '0 4px 4px 0',
                backgroundColor: priorityInfo.color === 'error' ? '#e53935' : 
                                priorityInfo.color === 'warning' ? '#fb8c00' : 
                                priorityInfo.color === 'success' ? '#43a047' : '#757575',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                zIndex: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {priorityInfo.label}
            </Box>
          )}
          
          {/* Status indicator for overdue/today */}
          {dueDateStatus && (
            <Box
              sx={{
                position: 'absolute',
                top: -10,
                right: 16,
                px: 1.5,
                py: 0.5,
                borderRadius: 4,
                backgroundColor: 'white',
                color: dueDateStatus.color,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                zIndex: 1,
                border: `1px solid ${dueDateStatus.color}`,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <ScheduleIcon sx={{ fontSize: 14 }} />
              {dueDateStatus.label}
            </Box>
          )}
        
          {/* Category color bar */}
          <Box
            sx={{
              width: 8,
              borderRadius: '8px 0 0 8px',
              background: categoryColor,
              minHeight: '100%',
            }}
          />
          
          {/* Completion checkbox */}
          <Box 
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              pt: 2.5,
              pl: 1.5,
              pr: 0.5
            }}
          >
            <Checkbox
              checked={todo.completed}
              onChange={() => onToggle(todo._id)}
              sx={{
                '&.Mui-checked': {
                  color: categoryColor,
                },
                padding: 1
              }}
              icon={<Avatar sx={{ width: 22, height: 22, bgcolor: 'transparent', border: '2px solid', borderColor: 'action.disabled' }} />}
              checkedIcon={<CheckCircleIcon sx={{ color: categoryColor, fontSize: 26 }} />}
            />
          </Box>
          
          {/* Main content */}
          <CardContent sx={{ flex: 1, py: 2, px: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? 'text.secondary' : 'text.primary',
                    fontWeight: todo.completed ? 'normal' : 'medium',
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    mb: 0.5
                  }}
                >
                  {todo.title}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.8, 
                  flexWrap: 'wrap',
                  opacity: todo.completed ? 0.7 : 1
                }}>
                  {formattedDueDate && (
                    <Tooltip title={`Due: ${format(new Date(todo.dueDate), 'PPP')}${todo.dueTime ? ` at ${todo.dueTime}` : ''}`}>
                      <Chip 
                        size="small"
                        icon={<CalendarTodayIcon fontSize="small" />}
                        label={formattedDueDate}
                        color={getDueDateColor()}
                        variant="outlined"
                        sx={{ 
                          height: 24,
                          borderRadius: 1,
                          '& .MuiChip-icon': {
                            fontSize: '0.9rem',
                          }
                        }}
                      />
                    </Tooltip>
                  )}
                  
                  {todo.dueTime && (
                    <Chip 
                      size="small"
                      icon={<AccessTimeIcon fontSize="small" />}
                      label={todo.dueTime}
                      variant="outlined"
                      sx={{ 
                        height: 24,
                        borderRadius: 1,
                        '& .MuiChip-icon': {
                          fontSize: '0.9rem',
                        }
                      }}
                    />
                  )}
                  
                  {category && (
                    <Chip 
                      size="small"
                      icon={<LabelIcon style={{ color: categoryColor }} fontSize="small" />}
                      label={category.name}
                      sx={{ 
                        backgroundColor: `${categoryColor}15`,
                        color: categoryColor,
                        border: `1px solid ${categoryColor}30`,
                        height: 24,
                        borderRadius: 1,
                        '& .MuiChip-icon': {
                          fontSize: '0.9rem',
                        }
                      }}
                    />
                  )}
                  
                  {calendarSyncInfo && (
                    <Tooltip title={calendarSyncInfo.tooltip}>
                      <Chip 
                        size="small"
                        icon={<SyncIcon fontSize="small" />}
                        label={calendarSyncInfo.label}
                        color={calendarSyncInfo.color}
                        variant="outlined"
                        sx={{ 
                          height: 24,
                          borderRadius: 1,
                          '& .MuiChip-icon': {
                            fontSize: '0.9rem',
                          }
                        }}
                        component={calendarSyncInfo.link ? Link : undefined}
                        href={calendarSyncInfo.link}
                        target={calendarSyncInfo.link ? "_blank" : undefined}
                        clickable={!!calendarSyncInfo.link}
                      />
                    </Tooltip>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', ml: 1 }}>
                <Tooltip title="Edit Task">
                  <IconButton 
                    onClick={() => onEdit(todo)} 
                    size="small" 
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Task">
                  <IconButton 
                    onClick={() => onDelete(todo._id)}
                    size="small"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'error.main',
                        backgroundColor: 'rgba(211, 47, 47, 0.08)'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <FileUpload
              todoId={todo._id}
              attachments={todo.attachments}
              onFileUpload={onFileUpload}
              onFileDelete={onFileDelete}
              uploading={uploading}
              uploadError={uploadError}
              fileInputRef={fileInputRef}
            />
          </CardContent>
        </Card>
    );
};

export default Todo; 