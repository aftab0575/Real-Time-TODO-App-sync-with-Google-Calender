import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemText, 
  Typography, 
  Divider,
  Button,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { markAsSeen, markAllAsSeen, clearNotifications, addNotification, logNotificationState, setCurrentUserId } from '../redux/notificationSlice';
import { requestNotificationPermission, syncUserId } from '../services/socketService';
import format from 'date-fns/format';

// CSS for animation
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); background-color: #f44336; }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

const NotificationCenter = () => {
  const dispatch = useDispatch();
  
  // Get data directly from Redux state
  const notifications = useSelector(state => state.notifications.items);
  const unseenCount = useSelector(state => state.notifications.unseenCount);
  const notificationUserId = useSelector(state => state.notifications.currentUserId);
  const { user } = useSelector(state => state.auth);
  const socketConnected = useSelector(state => state.todos.socketConnected);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [debugMode] = useState(false);
  
  // Synchronize user ID with Redux state on component mount and when user changes
  useEffect(() => {
    if (user && user._id) {
      console.log('Setting Redux notification userId from auth state:', user._id);
      dispatch(setCurrentUserId(user._id));
      syncUserId(user._id);
    }
  }, [user, dispatch]);
  
  // Debug notifications state when it changes
  useEffect(() => {
    if (debugMode) {
      console.log('NotificationCenter - Current notifications:', notifications);
      console.log('NotificationCenter - Unseen count:', unseenCount);
      console.log('NotificationCenter - User ID:', notificationUserId);
    }
  }, [notifications, unseenCount, notificationUserId, debugMode]);
  
  // Filter notifications to ensure they belong to the current user
  const filteredNotifications = useCallback(() => {
    if (!notificationUserId) return notifications;
    
    return notifications.filter(notification => 
      !notification.userId || notification.userId === notificationUserId
    );
  }, [notifications, notificationUserId]);
  
  // Add a notification counter effect
  useEffect(() => {
    // Flash notification icon when new notifications arrive
    if (unseenCount > 0) {
      const notificationIcon = document.querySelector('.MuiBadge-badge');
      if (notificationIcon) {
        notificationIcon.style.animation = 'pulse 1s infinite';
        setTimeout(() => {
          if (notificationIcon) {
            notificationIcon.style.animation = '';
          }
        }, 3000);
      }
      
      // Log notification status for debugging
      if (debugMode) {
        console.log(`NotificationCenter has ${unseenCount} unseen notifications`);
        notifications.forEach((notification, index) => {
          console.log(`Notification ${index + 1}:`, notification);
        });
      }
    }
  }, [unseenCount, notifications, debugMode]);
  
  // TEST: Function to create a test notification
  const createTestNotification = () => {
    const userId = user?._id || user?.id;
    
    if (!userId) {
      console.error('Cannot create test notification: No user ID available');
      setAlertMessage('Cannot create test notification: No user ID available');
      setAlertOpen(true);
      return;
    }
    
    const testNotification = {
      type: 'DUE_SOON',
      todoId: 'test-todo-id-' + Date.now(),
      userId: userId, // Add userId to match current user
      title: 'Test Todo',
      message: 'This is a test notification for user: ' + userId.substring(0, 6),
      timeRemaining: 15,
      timestamp: new Date().toISOString()
    };
    console.log('Creating test notification for user:', userId);
    dispatch(addNotification(testNotification));
    
    // Show alert that notification was created
    setAlertMessage(`Created test notification for user ${userId.substring(0, 6)}`);
    setAlertOpen(true);
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    
    // Log notification state when menu opens
    dispatch(logNotificationState());
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationClick = (notification) => {
    dispatch(markAsSeen(notification.id));
    
    // Navigate to the todo if needed
    if (notification.todoId) {
      // Navigation logic would go here
      console.log('Navigate to todo:', notification.todoId);
    }
    
    handleMenuClose();
  };
  
  const handleMarkAllRead = () => {
    dispatch(markAllAsSeen());
  };
  
  const handleClearAll = () => {
    dispatch(clearNotifications());
    handleMenuClose();
  };
  
  // Format notification time using absolute date rather than relative
  const formatNotificationTime = (notification) => {
    if (!notification.timestamp) return '';
    
    try {
      const date = new Date(notification.timestamp);
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      console.error('Error formatting notification time:', error);
      return '';
    }
  };
  
  const getNotificationContent = (notification) => {
    switch (notification.type) {
      case 'DUE_SOON':
        return (
          <>
            <Typography variant="subtitle1" color="primary">
              Task Due Soon
            </Typography>
            <Typography variant="body2">
              {notification.message}
            </Typography>
            {notification.timeRemaining !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {notification.timeRemaining <= 0
                  ? 'Due now!'
                  : `Due in ${notification.timeRemaining} minutes`}
              </Typography>
            )}
          </>
        );
        
      case 'OVERDUE':
        return (
          <>
            <Typography variant="subtitle1" color="error">
              Task Overdue
            </Typography>
            <Typography variant="body2">
              {notification.message}
            </Typography>
          </>
        );
        
      default:
        return (
          <Typography variant="body2">
            {notification.message}
          </Typography>
        );
    }
  };
  
  // Get the notifications to display - ensure they belong to current user
  const displayNotifications = filteredNotifications();
  
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton 
          color="inherit" 
          onClick={handleMenuOpen}
          size="large"
          aria-label="show notifications"
          sx={{ 
            color: '#ffffff', // Set icon color to white
            position: 'relative'
          }}
        >
          <Badge 
            badgeContent={unseenCount} 
            color="error"
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 18,
                minWidth: 18,
                padding: '0 4px'
              }
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: '350px',
          },
        }}
      >
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            {displayNotifications.length > 0 && (
              <>
                <Button size="small" onClick={handleMarkAllRead}>
                  Mark All Read
                </Button>
                <Button size="small" onClick={handleClearAll}>
                  Clear All
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        <Divider />
        
        {displayNotifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="No notifications" />
          </MenuItem>
        ) : (
          <>
            {/* Simple notification list as requested */}
            <ul style={{ margin: 0, padding: '0 16px' }}>
              {displayNotifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    borderLeft: notification.seen ? 'none' : '4px solid #1976d2',
                    opacity: notification.seen ? 0.7 : 1,
                    py: 1,
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    {getNotificationContent(notification)}
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {formatNotificationTime(notification)}
                      {debugMode && ` (${notification.userId ? notification.userId.substring(0,6) : 'no-user'})`}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </ul>
          </>
        )}
        
        {debugMode && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Typography variant="caption" sx={{ display: 'block' }}>
                User: {user?._id ? user._id.substring(0,8) : 'unknown'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Notification User ID: {notificationUserId ? notificationUserId.substring(0,8) : 'null'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Socket: {socketConnected ? 'Connected' : 'Disconnected'}
              </Typography>
              <Button 
                size="small" 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 1 }}
                onClick={createTestNotification}
              >
                Create Test Notification
              </Button>
              <Button 
                size="small" 
                fullWidth 
                variant="outlined" 
                color="secondary"
                sx={{ mt: 1 }}
                onClick={() => dispatch(logNotificationState())}
              >
                Log Notification State
              </Button>
            </Box>
          </>
        )}
      </Menu>
      
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlertOpen(false)}
          severity="info"
          action={
            Notification.permission === 'default' ? (
              <Button color="inherit" size="small" onClick={requestNotificationPermission}>
                Enable
              </Button>
            ) : (
              <Button color="inherit" size="small" onClick={createTestNotification}>
                Test Notification
              </Button>
            )
          }
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationCenter; 