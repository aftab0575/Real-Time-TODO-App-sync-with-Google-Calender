import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  FormHelperText,
  Stack,
  Paper,
  Alert,
  Collapse
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FlagIcon from '@mui/icons-material/Flag';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const TodoForm = ({ 
  onSubmit, 
  initialValues, 
  categories, 
  selectedCategory, 
  onCategoryChange,
  loading,
  editing,
  onCancel
}) => {
    const [formData, setFormData] = useState({
        title: '',
        dueDate: '',
        dueTime: '',
        priority: 'Medium',
        notificationSettings: {
          enableNotifications: true,
          reminderTime: 30 // minutes before due date
        },
        syncWithCalendar: false
    });
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (initialValues) {
            setFormData({
                title: initialValues.title || '',
                dueDate: initialValues.dueDate ? new Date(initialValues.dueDate).toISOString().split('T')[0] : '',
                dueTime: initialValues.dueTime || '',
                priority: initialValues.priority || 'Medium',
                notificationSettings: initialValues.notificationSettings || {
                  enableNotifications: true,
                  reminderTime: 30
                },
                syncWithCalendar: initialValues.syncWithCalendar || false
            });
            if (initialValues.category) {
                onCategoryChange(initialValues.category);
            }
            setExpanded(true);
        }
    }, [initialValues, onCategoryChange]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSwitchChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleNotificationChange = (e) => {
        const { name, value, checked } = e.target;
        const isSwitch = e.target.type === 'checkbox';
        
        setFormData(prev => ({
            ...prev,
            notificationSettings: {
                ...prev.notificationSettings,
                [name]: isSwitch ? checked : value
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        if (!editing) {
            // Reset form if adding new todo (not editing)
            setFormData({ 
                title: '',
                dueDate: '',
                dueTime: '',
                priority: 'Medium',
                notificationSettings: {
                    enableNotifications: true,
                    reminderTime: 30
                },
                syncWithCalendar: false
            });
            onCategoryChange('');
            setExpanded(false);
        }
    };

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                mb: 4, 
                borderRadius: 3, 
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: expanded ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)'
            }}
        >
            <Button
                fullWidth
                onClick={toggleExpanded}
                sx={{
                    py: 1.5,
                    display: 'flex',
                    justifyContent: 'flex-start',
                    borderRadius: expanded ? '16px 16px 0 0' : 3,
                    backgroundColor: expanded ? 'primary.main' : 'primary.light',
                    color: expanded ? 'white' : 'primary.dark',
                    '&:hover': {
                        backgroundColor: expanded ? 'primary.dark' : 'primary.main',
                    },
                    transition: 'all 0.3s ease',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 2 }}>
                    {!expanded && <AddIcon sx={{ mr: 1 }} />}
                    <Typography 
                        variant="h6" 
                        fontWeight="medium"
                        sx={{ flexGrow: 1, textAlign: 'left' }}
                    >
                        {editing ? 'Edit Task' : 'Add New Task'}
                    </Typography>
                    <KeyboardArrowDownIcon 
                        sx={{ 
                            color: expanded ? 'white' : 'primary.main',
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                        }}
                    />
                </Box>
            </Button>

            <Collapse in={expanded}>
                <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                    <TextField
                        fullWidth
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        margin="normal"
                        disabled={loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                            mb: 3
                        }}
                    />
                    
                    {/* Form fields in a horizontal layout */}
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, backgroundColor: '#f9f9f9', mb: 4 }}>
                        <Stack 
                            direction={{ xs: 'column', sm: 'row' }} 
                            spacing={2.5} 
                            sx={{ 
                                width: '100%', 
                                alignItems: 'flex-start'
                            }}
                        >
                            {/* Due Date */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                    Due Date
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />
                                    }}
                                    disabled={loading}
                                    sx={{ 
                                        '& .MuiInputBase-root': { 
                                            borderRadius: 1.5,
                                            backgroundColor: 'white',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        } 
                                    }}
                                />
                            </Box>

                            {/* Due Time */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                    Due Time
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="time"
                                    name="dueTime"
                                    value={formData.dueTime}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />
                                    }}
                                    disabled={loading}
                                    sx={{ 
                                        '& .MuiInputBase-root': { 
                                            borderRadius: 1.5,
                                            backgroundColor: 'white',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        } 
                                    }}
                                />
                            </Box>

                            {/* Priority */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                    Priority
                                </Typography>
                                <FormControl 
                                    fullWidth 
                                    size="small"
                                    sx={{ 
                                        '& .MuiInputBase-root': { 
                                            borderRadius: 1.5,
                                            backgroundColor: 'white',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        } 
                                    }}
                                >
                                    <Select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        disabled={loading}
                                        startAdornment={<FlagIcon sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />}
                                    >
                                        <MenuItem value="Low">Low</MenuItem>
                                        <MenuItem value="Medium">Medium</MenuItem>
                                        <MenuItem value="High">High</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Category */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                                    Category
                                </Typography>
                                <FormControl 
                                    fullWidth 
                                    size="small"
                                    sx={{ 
                                        '& .MuiInputBase-root': { 
                                            borderRadius: 1.5,
                                            backgroundColor: 'white',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        } 
                                    }}
                                >
                                    <Select
                                        value={selectedCategory}
                                        onChange={(e) => onCategoryChange(e.target.value)}
                                        disabled={loading}
                                        startAdornment={<CategoryIcon sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />}
                                    >
                                        {categories.map(category => (
                                            <MenuItem key={category._id} value={category._id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Stack>
                    </Paper>
                    
                    {/* Notification Settings Section */}
                    <Paper 
                        elevation={0}
                        variant="outlined" 
                        sx={{ 
                            mb: 4, 
                            p: { xs: 2, sm: 3 }, 
                            borderRadius: 2, 
                            bgcolor: 'rgba(25, 118, 210, 0.04)',
                            borderColor: 'primary.light',
                            transition: 'box-shadow 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.1)'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                            <NotificationsActiveIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 22 }} />
                            <Typography variant="subtitle1" fontWeight="medium" color="primary.dark">
                                Notification Settings
                            </Typography>
                        </Box>

                        <Grid container spacing={3} alignItems="flex-start">
                            <Grid xs={12} sm={6}>
                                <Box 
                                    sx={{ 
                                        p: 2, 
                                        bgcolor: 'background.paper', 
                                        borderRadius: 1.5,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                name="enableNotifications"
                                                checked={formData.notificationSettings.enableNotifications}
                                                onChange={handleNotificationChange}
                                                color="primary"
                                                disabled={loading}
                                                sx={{ 
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: 'primary.main',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                        },
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                        backgroundColor: 'primary.main',
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="body1" fontWeight="medium">
                                                    Enable Notifications
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    Get reminders before your task is due
                                                </Typography>
                                            </Box>
                                        }
                                        sx={{ ml: 0, alignItems: 'flex-start' }}
                                    />
                                </Box>
                            </Grid>

                            <Grid xs={12} sm={6}>
                                <Box 
                                    sx={{ 
                                        p: 2, 
                                        bgcolor: 'background.paper', 
                                        borderRadius: 1.5,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        opacity: formData.notificationSettings.enableNotifications ? 1 : 0.6,
                                        transition: 'opacity 0.3s ease',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                                        Reminder Time
                                    </Typography>
                                    <TextField
                                        type="number"
                                        name="reminderTime"
                                        value={formData.notificationSettings.reminderTime}
                                        onChange={handleNotificationChange}
                                        disabled={!formData.notificationSettings.enableNotifications || loading}
                                        inputProps={{ min: 1, max: 10080 }}
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                    minutes
                                                </Typography>
                                            ),
                                        }}
                                        sx={{ 
                                            mt: 1,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1.5,
                                            }
                                        }}
                                    />
                                    <FormHelperText sx={{ mt: 1 }}>
                                        {formData.notificationSettings.enableNotifications 
                                            ? `You'll be notified ${formData.notificationSettings.reminderTime} minutes before the due time`
                                            : 'Enable notifications to set reminder time'}
                                    </FormHelperText>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                    
                    {/* Google Calendar Integration */}
                    <Paper 
                        elevation={0}
                        variant="outlined" 
                        sx={{ 
                            mb: 4, 
                            p: { xs: 2, sm: 3 }, 
                            borderRadius: 2, 
                            bgcolor: 'rgba(76, 175, 80, 0.04)',
                            borderColor: 'success.light',
                            transition: 'box-shadow 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                            <CalendarTodayIcon sx={{ color: 'success.main', mr: 1.5, fontSize: 22 }} />
                            <Typography variant="subtitle1" fontWeight="medium" color="success.dark">
                                Calendar Integration
                            </Typography>
                        </Box>

                        <Box 
                            sx={{ 
                                p: 2.5, 
                                bgcolor: 'background.paper', 
                                borderRadius: 1.5,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                justifyContent: 'space-between',
                                gap: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            name="syncWithCalendar"
                                            checked={formData.syncWithCalendar}
                                            onChange={handleSwitchChange}
                                            color="success"
                                            disabled={loading || !formData.dueDate}
                                            sx={{ 
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: 'success.main',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                                    },
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: 'success.main',
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Box>
                                            <Typography variant="body1" fontWeight="medium">
                                                Sync with Google Calendar
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                Create event in your Google Calendar automatically
                                            </Typography>
                                        </Box>
                                    }
                                    sx={{ ml: 0, alignItems: 'flex-start' }}
                                />
                                {!formData.dueDate && (
                                    <Alert 
                                        severity="info" 
                                        icon={<CalendarTodayIcon fontSize="inherit" />}
                                        sx={{ 
                                            mt: 2, 
                                            py: 0.5, 
                                            bgcolor: 'rgba(76, 175, 80, 0.08)',
                                            '& .MuiAlert-icon': {
                                                color: 'success.main'
                                            }
                                        }}
                                    >
                                        A due date is required for calendar sync
                                    </Alert>
                                )}
                            </Box>
                            
                            <Box 
                                sx={{ 
                                    p: 1.5, 
                                    borderRadius: 1.5, 
                                    border: '1px dashed',
                                    borderColor: 'success.light',
                                    alignSelf: { xs: 'stretch', sm: 'center' },
                                    minWidth: { sm: '180px' },
                                    bgcolor: 'rgba(76, 175, 80, 0.03)',
                                    opacity: formData.syncWithCalendar && formData.dueDate ? 1 : 0.6,
                                    transition: 'opacity 0.3s ease'
                                }}
                            >
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ display: 'block', fontWeight: 'medium', mb: 0.5 }}
                                >
                                    Calendar Event Details
                                </Typography>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Box 
                                        component="span" 
                                        sx={{ 
                                            width: 8, 
                                            height: 8, 
                                            borderRadius: '50%', 
                                            bgcolor: 'success.main', 
                                            display: 'inline-block',
                                            mr: 1 
                                        }}
                                    />
                                    {formData.title || 'Task title'}
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ 
                                        fontSize: '0.75rem', 
                                        ml: 2.3, 
                                        mt: -0.3, 
                                        mb: formData.dueDate ? 0.5 : 0 
                                    }}
                                >
                                    {formData.dueDate 
                                        ? `${formData.dueDate}${formData.dueTime ? ` at ${formData.dueTime}` : ''}`
                                        : 'No date selected'}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                    
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: onCancel ? 'space-between' : 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                        {onCancel ? (
                            <>
                                <Button 
                                    variant="outlined" 
                                    color="secondary" 
                                    onClick={onCancel}
                                    disabled={loading}
                                    sx={{ 
                                        width: { xs: '100%', sm: '48%' },
                                        py: { xs: 1.2, sm: 1.5 },
                                        order: { xs: 2, sm: 1 },
                                        borderRadius: 2,
                                        borderWidth: '2px',
                                        '&:hover': {
                                            borderWidth: '2px'
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    color="primary"
                                    disabled={loading}
                                    sx={{ 
                                        width: { xs: '100%', sm: '48%' },
                                        py: { xs: 1.2, sm: 1.5 },
                                        backgroundImage: 'linear-gradient(to right, #130485, #2563eb)',
                                        '&:hover': {
                                            backgroundImage: 'linear-gradient(to right, #0c0361, #1e50c8)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
                                        },
                                        transition: 'all 0.3s ease',
                                        order: { xs: 1, sm: 2 },
                                        borderRadius: 2
                                    }}
                                >
                                    {editing ? 'Update Task' : 'Add Task'}
                                </Button>
                            </>
                        ) : (
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary"
                                disabled={loading}
                                sx={{ 
                                    width: '100%',
                                    py: { xs: 1.2, sm: 1.5 },
                                    fontSize: { xs: '0.95rem', sm: '1rem' },
                                    backgroundImage: 'linear-gradient(to right, #130485, #2563eb)',
                                    '&:hover': {
                                        backgroundImage: 'linear-gradient(to right, #0c0361, #1e50c8)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
                                    },
                                    transition: 'all 0.3s ease',
                                    borderRadius: 2
                                }}
                            >
                                {editing ? 'Update Task' : 'Add Task'}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Collapse>
        </Paper>
    );
};

export default TodoForm; 