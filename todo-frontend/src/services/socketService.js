import { io } from 'socket.io-client';
import store from '../redux/store';
import { updateTodoViaSocket, addTodoViaSocket, deleteTodoViaSocket, setSocketConnected } from '../redux/todoSlice';
import { addNotification, setCurrentUserId, logNotificationState } from '../redux/notificationSlice';

// Get the backend URL from environment, with fallback
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_BASE_URL || 'http://localhost:5000';

console.log('Socket connecting to:', BACKEND_URL);

// Create socket instance with reconnection options
const socket = io(BACKEND_URL, {
  reconnectionDelayMax: 10000,
  reconnectionAttempts: 10,
  timeout: 20000,
  autoConnect: false, // Don't connect automatically, we'll do it manually
});

let isConnected = false;
let authenticatedUserId = null;
let lastUserId = null; // Store last authenticated user ID for notification persistence

// Synchronize user ID from any source
export const syncUserId = (userId) => {
  if (userId && userId !== authenticatedUserId) {
    console.log(`Manually synchronizing user ID: ${userId} (was: ${authenticatedUserId})`);
    authenticatedUserId = userId;
    lastUserId = userId; // Also store as last user ID
    store.dispatch(setCurrentUserId(userId));
    
    // Log the current notification state
    setTimeout(() => {
      store.dispatch(logNotificationState());
    }, 500);
  }
};

// Get decodedToken from JWT if possible
const getTokenUserId = (token) => {
  try {
    if (!token) return null;
    
    // Simple JWT parsing (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Parse the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Return the user ID from token
    return payload.id || payload.userId || payload._id || payload.sub;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

/**
 * Initialize Socket.IO connection and set up event handlers
 * @param {string} token - JWT token for authentication
 */
export const connectSocket = (token) => {
  if (!token) {
    console.error('No token provided for socket authentication');
    return;
  }

  console.log('Setting up socket connection with token');
  
  // Pre-set authenticatedUserId for immediate use
  const tokenUserId = getTokenUserId(token);
  if (tokenUserId) {
    console.log('Pre-setting user ID from token:', tokenUserId);
    authenticatedUserId = tokenUserId;
    lastUserId = tokenUserId; // Also store as last user ID
    store.dispatch(setCurrentUserId(tokenUserId));
  }

  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    isConnected = true;
    store.dispatch(setSocketConnected(true));
    
    // Authenticate on connect/reconnect
    socket.emit('authenticate', token);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    isConnected = false;
    store.dispatch(setSocketConnected(false));
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    isConnected = false;
    store.dispatch(setSocketConnected(false));
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempts`);
    isConnected = true;
    store.dispatch(setSocketConnected(true));
    
    // Re-authenticate after reconnect
    socket.emit('authenticate', token);
  });

  socket.on('authenticated', (data) => {
    console.log('Socket authenticated for user:', data.userId);
    authenticatedUserId = data.userId;
    lastUserId = data.userId; // Also store as last user ID
    
    // Set the current user ID for notification filtering
    store.dispatch(setCurrentUserId(data.userId));
    
    isConnected = true;
    store.dispatch(setSocketConnected(true));
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    store.dispatch(setSocketConnected(false));
  });

  // Todo-specific events
  socket.on('todoAdded', (todo) => {
    console.log('New todo received via socket:', todo);
    store.dispatch(addTodoViaSocket(todo));
  });

  socket.on('todoUpdated', (todo) => {
    console.log('Todo update received via socket:', todo);
    store.dispatch(updateTodoViaSocket(todo));
  });

  socket.on('todoDeleted', (todoId) => {
    console.log('Todo deletion received via socket:', todoId);
    store.dispatch(deleteTodoViaSocket(todoId));
  });

  // Notification event
  socket.on('notification', (notification) => {
    console.log('🔔 Notification received via socket:', notification);
    
    // Update current user ID from auth store if needed
    if (!authenticatedUserId) {
      const state = store.getState();
      if (state.auth?.user?._id) {
        const newUserId = state.auth.user._id;
        console.log('Setting missing authenticatedUserId from Redux state:', newUserId);
        authenticatedUserId = newUserId;
        store.dispatch(setCurrentUserId(newUserId));
      }
    }
    
    // Ensure the notification has a timestamp and required fields
    if (!notification.timestamp) {
      notification.timestamp = new Date().toISOString();
    }
    
    // Ensure notification has a userId
    if (!notification.userId && authenticatedUserId) {
      console.log('Adding missing userId to notification:', authenticatedUserId);
      notification.userId = authenticatedUserId;
    }
    
    // Only process the notification if it's for the current user
    const notificationUserId = notification.userId;
    if (notificationUserId && authenticatedUserId && notificationUserId !== authenticatedUserId) {
      console.log(`Ignoring notification for different user: ${notificationUserId} (current: ${authenticatedUserId})`);
      return;
    }
    
    // Make a local copy to avoid modification issues
    const notificationCopy = { ...notification };
    
    // Dispatch to Redux store
    try {
      console.log('Dispatching notification to Redux for user:', authenticatedUserId);
      store.dispatch(addNotification(notificationCopy));
      
      // Double-check that notification was added
      setTimeout(() => {
        const notificationsState = store.getState().notifications;
        console.log('Redux notifications after dispatch:', notificationsState.items.length);
        store.dispatch(logNotificationState());
      }, 500);
    } catch (error) {
      console.error('Error dispatching notification to Redux:', error);
    }
    
    // Play sound if available (browser only)
    if (typeof window !== 'undefined' && window.Audio) {
      try {
        console.log('Attempting to play notification sound');
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.9; // Slightly lower volume
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing notification sound:', error);
          });
        }
      } catch (error) {
        console.error('Error creating notification sound:', error);
      }
    }
    
    // Show browser notification if available and permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      console.log('Browser notification permission:', Notification.permission);
      if (Notification.permission === 'granted') {
        try {
          console.log('Creating browser notification');
          // Include more details in the notification
          const options = {
            body: notification.timeRemaining !== undefined 
              ? `Due in ${notification.timeRemaining} minutes` 
              : 'Task reminder',
            icon: '/todo-icon.png',
            badge: '/todo-badge.png',
            requireInteraction: true, // Make the notification persist until user interacts with it
            vibrate: [200, 100, 200] // Vibration pattern (mobile devices)
          };
          
          const browserNotification = new Notification(notification.message, options);
          
          // Add click handler
          browserNotification.onclick = function() {
            console.log('Browser notification clicked');
            window.focus(); // Focus the window
            browserNotification.close();
          };
          
        } catch (error) {
          console.error('Error showing browser notification:', error);
        }
      } else if (Notification.permission === 'default') {
        // We'll request permission when the user interacts with the app
        console.log('Browser notification permission not granted yet');
      }
    }
  });

  // Connect if not already connected
  if (!socket.connected) {
    console.log('Connecting socket...');
    socket.connect();
  } else {
    console.log('Socket already connected, authenticating...');
    socket.emit('authenticate', token);
  }
};

/**
 * Request notification permissions (should be called from a user interaction)
 */
export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'error';
      }
    }
    return Notification.permission;
  }
  return 'unavailable';
};

/**
 * Check if socket is currently connected and authenticated
 * @returns {boolean} Connection status
 */
export const isSocketConnected = () => {
  return isConnected && socket.connected && authenticatedUserId !== null;
};

/**
 * Manually disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    // Store the current user ID before disconnecting
    if (authenticatedUserId) {
      lastUserId = authenticatedUserId;
      console.log(`Saving user ID ${lastUserId} before disconnecting`);
    }
    
    socket.disconnect();
    isConnected = false;
    
    // We don't clear authenticatedUserId here so notifications can remain associated
    // with the user. Instead, we'll set currentUserId to null in the state.
    store.dispatch(setCurrentUserId(null));
    store.dispatch(setSocketConnected(false));
    console.log('Socket manually disconnected, saved user ID:', lastUserId);
  }
};

/**
 * Get the last authenticated user ID (for persistence)
 */
export const getLastUserId = () => {
  return lastUserId;
};

export default socket; 