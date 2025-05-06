import { createSlice } from '@reduxjs/toolkit';

// Remove the standalone setCurrentUserId function - we'll use the reducer instead
// let currentUserId = null;

// export const setCurrentUserId = (userId) => {
//   console.log('Setting current user ID for notifications:', userId);
//   currentUserId = userId;
// };

// // For debugging
// export const getCurrentNotificationState = () => {
//   console.log('Current user ID for notifications:', currentUserId);
//   return { currentUserId };
// };

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unseenCount: 0,
    currentUserId: null,
    lastProcessedNotification: null,
    // Add a map to store notifications by user ID
    notificationsByUser: {}
  },
  reducers: {
    // Set the current user ID
    setCurrentUserId: (state, action) => {
      const previousUserId = state.currentUserId;
      const newUserId = action.payload;
      
      console.log('Setting currentUserId in notification state:', newUserId);
      
      // If we have a previous user, store their notifications
      if (previousUserId && previousUserId !== newUserId) {
        console.log(`Storing ${state.items.length} notifications for user ${previousUserId}`);
        // Save current notifications for the previous user
        state.notificationsByUser[previousUserId] = [...state.items];
      }
      
      // Set new user ID
      state.currentUserId = newUserId;
      
      // If we have a new user ID, restore their notifications
      if (newUserId) {
        // Restore notifications for the new user if we have any stored
        if (state.notificationsByUser[newUserId]) {
          console.log(`Restoring ${state.notificationsByUser[newUserId].length} stored notifications for user ${newUserId}`);
          state.items = [...state.notificationsByUser[newUserId]];
          state.unseenCount = state.items.filter(item => !item.seen).length;
        } else {
          // Filter existing notifications to only keep those for the current user
          const oldCount = state.items.length;
          
          // Keep only notifications for this user or with no userId
          state.items = state.items.filter(notification => 
            !notification.userId || notification.userId === newUserId
          );
          
          // Update unseenCount after filtering
          state.unseenCount = state.items.filter(item => !item.seen).length;
          
          const newCount = state.items.length;
          if (oldCount !== newCount) {
            console.log(`Filtered out ${oldCount - newCount} notifications not belonging to user ${newUserId}`);
          }
        }
      } else {
        // If we logged out (newUserId is null), clear the current notifications
        // but don't lose the stored ones
        state.items = [];
        state.unseenCount = 0;
      }
    },
    
    addNotification: (state, action) => {
      const notification = action.payload;
      const currentUserId = state.currentUserId;
      
      console.log('Processing notification in slice:', notification);
      console.log('Current user ID in slice:', currentUserId);
      
      // Ensure notification has required fields
      const notificationWithMetadata = { 
        ...notification, 
        id: notification.id || Date.now(),
        seen: false,
        userId: notification.userId || currentUserId || 'unknown',
        receivedAt: new Date().toISOString()
      };
      
      // Store the last processed notification for debugging
      state.lastProcessedNotification = { 
        ...notificationWithMetadata, 
        processedAt: new Date().toISOString() 
      };
      
      // Skip processing if this is for a different user
      if (currentUserId && notificationWithMetadata.userId !== currentUserId) {
        console.log(`Ignoring notification for different user: ${notificationWithMetadata.userId}`);
        return;
      }
      
      // More thorough duplicate check - check multiple fields for better matching
      const isDuplicate = state.items.some(item => {
        // If we have todoId, check that plus type for a match
        if (notification.todoId && item.todoId === notification.todoId) {
          // For todos, consider it duplicate if same todo and type
          if (item.type === notification.type) {
            return true;
          }
          
          // Or if it's the same todo and was received within 1 minute
          if (item.receivedAt) {
            const timeDiff = new Date() - new Date(item.receivedAt);
            if (timeDiff < 60000) { // 1 minute in milliseconds
              return true;
            }
          }
        }
        
        // If it's a test notification, avoid duplicates within 3 seconds
        if (notification.todoId && notification.todoId.startsWith('test-todo-id-') && item.todoId && item.todoId.startsWith('test-todo-id-')) {
          if (item.receivedAt) {
            const timeDiff = new Date() - new Date(item.receivedAt);
            if (timeDiff < 3000) { // 3 seconds in milliseconds
              return true;
            }
          }
        }
        
        return false;
      });
      
      if (isDuplicate) {
        console.log('Ignoring duplicate notification:', notification.todoId);
      } else {
        console.log('Adding new notification:', notificationWithMetadata);
        state.items.unshift(notificationWithMetadata);
        state.unseenCount++;
        console.log('Current notifications after add:', state.items.length);
        
        // Also update the stored notifications for this user
        const userId = notificationWithMetadata.userId;
        if (userId && userId !== 'unknown') {
          // Initialize if needed
          if (!state.notificationsByUser[userId]) {
            state.notificationsByUser[userId] = [];
          }
          // Update the stored notifications
          state.notificationsByUser[userId] = [...state.items.filter(
            item => item.userId === userId || !item.userId
          )];
        }
      }
    },
    
    markAsSeen: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload);
      if (index !== -1 && !state.items[index].seen) {
        state.items[index].seen = true;
        state.unseenCount = Math.max(0, state.unseenCount - 1);
        
        // Also update in the stored notifications
        const userId = state.items[index].userId;
        if (userId && state.notificationsByUser[userId]) {
          const storedIndex = state.notificationsByUser[userId].findIndex(
            item => item.id === action.payload
          );
          if (storedIndex !== -1) {
            state.notificationsByUser[userId][storedIndex].seen = true;
          }
        }
      }
    },
    
    markAllAsSeen: (state) => {
      state.items.forEach(item => {
        item.seen = true;
      });
      state.unseenCount = 0;
      
      // Also update stored notifications
      const userId = state.currentUserId;
      if (userId && state.notificationsByUser[userId]) {
        state.notificationsByUser[userId].forEach(item => {
          item.seen = true;
        });
      }
    },
    
    clearNotifications: (state) => {
      state.items = [];
      state.unseenCount = 0;
      
      // Also clear stored notifications for current user
      const userId = state.currentUserId;
      if (userId) {
        state.notificationsByUser[userId] = [];
      }
    },
    
    // For debugging
    logNotificationState: (state) => {
      console.log('Current notifications state:', {
        items: state.items.length,
        unseenCount: state.unseenCount,
        currentUserId: state.currentUserId,
        lastProcessed: state.lastProcessedNotification,
        storedUserCount: Object.keys(state.notificationsByUser).length
      });
      return state;
    }
  }
});

export const { 
  addNotification, 
  markAsSeen, 
  markAllAsSeen, 
  clearNotifications,
  logNotificationState,
  setCurrentUserId
} = notificationSlice.actions;

export default notificationSlice.reducer; 