import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Stack,
  Tooltip,
  Grid,
  useTheme
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SyncIcon from '@mui/icons-material/Sync';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SettingsIcon from '@mui/icons-material/Settings';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import GoogleIcon from '@mui/icons-material/Google';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FormHelperText from '@mui/material/FormHelperText';

import API from '../services/api';

const CalendarIntegration = () => {
  const { token } = useSelector(state => state.auth);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState({
    connected: false,
    settings: null
  });
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [categories, setCategories] = useState([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [reminderTime, setReminderTime] = useState(30);

  // Fetch calendar status and categories on component mount
  useEffect(() => {
    if (token) {
      fetchCalendarStatus();
      fetchCategories();
    }
  }, [token]);

  // Fetch calendar integration status
  const fetchCalendarStatus = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/calendar/auth/google/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalendarStatus(response.data);
      
      // Set reminder time from settings if available
      if (response.data.settings?.defaultReminderMinutes) {
        setReminderTime(response.data.settings.defaultReminderMinutes);
      }
    } catch (error) {
      console.error('Failed to fetch calendar status:', error);
      setAlert({
        open: true,
        message: 'Failed to fetch calendar status',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await API.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
      
      // Set default category to the first one
      if (response.data.length > 0 && !defaultCategoryId) {
        setDefaultCategoryId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Start Google auth flow
  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/calendar/auth/google/url', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Redirect to Google auth page
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      setAlert({
        open: true,
        message: 'Failed to initiate Google authorization',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectGoogle = async () => {
    try {
      setLoading(true);
      await API.post('/api/calendar/auth/google/disconnect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCalendarStatus({
        connected: false,
        settings: null
      });
      
      setAlert({
        open: true,
        message: 'Google Calendar disconnected successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      setAlert({
        open: true,
        message: 'Failed to disconnect Google Calendar',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle auto-sync setting
  const handleToggleSync = async (event) => {
    const syncEnabled = event.target.checked;
    
    try {
      await API.put('/api/calendar/auth/google/settings', {
        syncEvents: syncEnabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCalendarStatus(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          syncEvents: syncEnabled
        }
      }));
      
      setAlert({
        open: true,
        message: `Auto-sync ${syncEnabled ? 'enabled' : 'disabled'}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update sync settings:', error);
      setAlert({
        open: true,
        message: 'Failed to update sync settings',
        severity: 'error'
      });
    }
  };

  // Update reminder time
  const handleUpdateReminderTime = async () => {
    try {
      await API.put('/api/calendar/auth/google/settings', {
        defaultReminderMinutes: reminderTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCalendarStatus(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          defaultReminderMinutes: reminderTime
        }
      }));
      
      setAlert({
        open: true,
        message: 'Reminder time updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update reminder time:', error);
      setAlert({
        open: true,
        message: 'Failed to update reminder time',
        severity: 'error'
      });
    }
  };

  // Sync all todos to calendar
  const handleSyncAll = async () => {
    try {
      setSyncInProgress(true);
      const response = await API.post('/api/calendar/sync/all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlert({
        open: true,
        message: `Sync completed: ${response.data.results.success} tasks synced, ${response.data.results.failed} failed`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to sync all todos:', error);
      setAlert({
        open: true,
        message: 'Failed to sync all todos to calendar',
        severity: 'error'
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  // Import events from calendar
  const handleImportEvents = async () => {
    if (!defaultCategoryId) {
      setAlert({
        open: true,
        message: 'Please select a default category first',
        severity: 'warning'
      });
      return;
    }
    
    try {
      setImportInProgress(true);
      const response = await API.post('/api/calendar/import', {
        defaultCategoryId,
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlert({
        open: true,
        message: `Import completed: ${response.data.results.imported} events imported, ${response.data.results.skipped} skipped`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to import calendar events:', error);
      setAlert({
        open: true,
        message: 'Failed to import calendar events',
        severity: 'error'
      });
    } finally {
      setImportInProgress(false);
    }
  };

  // Render the disconnected state with improved styling
  const renderDisconnectedState = () => (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        textAlign: 'center', 
        borderRadius: 2,
        backgroundColor: theme.palette.grey[50],
        border: `1px dashed ${theme.palette.grey[300]}`,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <GoogleIcon sx={{ fontSize: 60, color: '#4285F4', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Connect to Google Calendar
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}>
          Sync your tasks with Google Calendar to keep track of deadlines and manage your schedule more effectively.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          color="primary"
          startIcon={<CalendarMonthIcon />}
          onClick={handleConnectGoogle}
          disabled={loading}
          sx={{ 
            borderRadius: 2,
            px: 3,
            backgroundColor: '#4285F4',
            '&:hover': {
              backgroundColor: '#3367D6'
            }
          }}
        >
          Connect with Google Calendar
        </Button>
        
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
          <InfoOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="caption">
            We only request access to your calendar with your permission
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  // Loading state component
  const renderLoadingState = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Connecting to Google Calendar...
      </Typography>
    </Box>
  );

  // Render the connected state with improved styling
  const renderConnectedState = () => (
    <>
      <Alert 
        icon={<CheckCircleIcon fontSize="inherit" />}
        severity="success" 
        variant="filled"
        sx={{ 
          mb: 3,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            color: 'white'
          }
        }}
      >
        Your account is connected to Google Calendar
      </Alert>
      
      {/* Settings Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.grey[200]}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
          <Typography variant="h6">Calendar Settings</Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={calendarStatus.settings?.syncEvents || false}
                  onChange={handleToggleSync}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>Automatically sync new tasks to calendar</Typography>
                  <Tooltip title="When enabled, new tasks with due dates will be automatically added to your Google Calendar">
                    <InfoOutlinedIcon sx={{ ml: 1, fontSize: 16, color: theme.palette.text.secondary }} />
                  </Tooltip>
                </Box>
              }
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField
                label="Default Reminder Time"
                type="number"
                value={reminderTime}
                onChange={(e) => setReminderTime(Number(e.target.value))}
                InputProps={{ 
                  endAdornment: <Typography variant="body2" color="text.secondary">minutes before</Typography>,
                  inputProps: { min: 0, max: 120 }
                }}
                fullWidth
                helperText="How early you want to be reminded before a task is due"
                sx={{ minWidth: 250 }}
                size="small"
              />
              <Button
                variant="outlined"
                onClick={handleUpdateReminderTime}
                startIcon={<NotificationsIcon />}
                sx={{ mt: 0.5 }}
              >
                Save
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Manual Actions */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.grey[200]}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SyncIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
          <Typography variant="h6">Manual Sync</Typography>
        </Box>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SyncIcon />}
            onClick={handleSyncAll}
            disabled={syncInProgress}
            sx={{ borderRadius: 2 }}
          >
            {syncInProgress ? 'Syncing...' : 'Sync All Tasks'}
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<LinkOffIcon />}
            onClick={handleDisconnectGoogle}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Disconnect Calendar
          </Button>
        </Stack>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Manually sync all your tasks with due dates to Google Calendar
        </Typography>
      </Paper>
      
      {/* Import Events */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.grey[200]}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ImportExportIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
          <Typography variant="h6">Import Calendar Events</Typography>
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-select-label">Default Category</InputLabel>
              <Select
                labelId="category-select-label"
                value={defaultCategoryId}
                onChange={(e) => setDefaultCategoryId(e.target.value)}
                label="Default Category"
              >
                {categories.map(category => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Category to assign to imported events
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ImportExportIcon />}
              onClick={handleImportEvents}
              disabled={importInProgress || !defaultCategoryId}
              sx={{ borderRadius: 2 }}
            >
              {importInProgress ? 'Importing...' : 'Import Events as Tasks'}
            </Button>
          </Grid>
        </Grid>
        
        <Typography variant="body2" color="info.main" sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <InfoOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Events from your calendar for the next 30 days will be imported as tasks
        </Typography>
      </Paper>
    </>
  );

  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 4, 
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.grey[200]}`,
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          p: 2.5, 
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText
        }}
      >
        <CalendarMonthIcon sx={{ mr: 1.5, fontSize: 28 }} />
        <Typography variant="h5" fontWeight="500">Google Calendar Integration</Typography>
      </Box>
      
      <CardContent sx={{ p: 3 }}>
        {loading ? (
          renderLoadingState()
        ) : calendarStatus.connected ? (
          renderConnectedState()
        ) : (
          renderDisconnectedState()
        )}
      </CardContent>
      
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlert(prev => ({ ...prev, open: false }))} 
          severity={alert.severity}
          variant="filled"
          sx={{ borderRadius: 2, minWidth: 300 }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default CalendarIntegration;