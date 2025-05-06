import Todo from '../models/Todo.js';

// We'll inject the io and userSockets at runtime instead of importing them
let io;
let userSockets;

// Track which reminders have been sent to prevent duplicates
// Map of todoId -> { timestamp, userId }
const sentReminders = new Map();

// Clean up old sent reminders after 24 hours
const cleanupSentReminders = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [todoId, data] of sentReminders.entries()) {
    // Remove entries older than 24 hours
    if (now - data.timestamp > 24 * 60 * 60 * 1000) {
      sentReminders.delete(todoId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} old reminder records`);
  }
};

// Run cleanup every hour
setInterval(cleanupSentReminders, 60 * 60 * 1000);

/**
 * Initialize the notification service with dependencies
 * @param {Object} socketIo - Socket.IO instance
 * @param {Map} sockets - User sockets map
 */
export function initNotificationService(socketIo, sockets) {
  io = socketIo;
  userSockets = sockets;
  console.log('Notification service initialized with socket dependencies');
}

/**
 * Check if a reminder has already been sent for a specific todo
 * @param {string} todoId - Todo ID
 * @param {string} userId - User ID
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {boolean} True if already sent
 */
const hasReminderBeenSent = (todoId, userId, maxAge = 15 * 60 * 1000) => {
  if (!sentReminders.has(todoId)) return false;
  
  const reminderData = sentReminders.get(todoId);
  const timeSinceSent = Date.now() - reminderData.timestamp;
  
  // Check if sent and still within maxAge window
  return timeSinceSent < maxAge;
};

/**
 * Record that a reminder has been sent for a todo
 * @param {string} todoId - Todo ID
 * @param {string} userId - User ID
 */
const recordReminderSent = (todoId, userId) => {
  sentReminders.set(todoId, { 
    timestamp: Date.now(),
    userId
  });
};

/**
 * Check for todos that are due soon and send notifications
 * @returns {Promise<object>} Result of the check operation
 */
export async function checkDueTodos() {
  try {
    const now = new Date();
    console.log(`Running notification check at ${now.toISOString()}`);
    
    const results = {
      checked: 0,
      notified: 0,
      skipped: 0,
      todos: []
    };

    // Find todos that are:
    // 1. Not completed
    // 2. Have due dates and times
    // 3. Have notifications enabled
    // 4. Haven't had reminders sent yet
    const todos = await Todo.find({
      completed: false,
      dueDate: { $exists: true },
      'notificationSettings.enableNotifications': true,
      reminderSent: false
    }).populate('user', 'name email');

    results.checked = todos.length;
    console.log(`Found ${todos.length} todos that might need notifications`);

    for (const todo of todos) {
      const dueDate = new Date(todo.dueDate);
      
      // If there's a time set, combine it with the date
      if (todo.dueTime) {
        const [hours, minutes] = todo.dueTime.split(':').map(Number);
        dueDate.setHours(hours, minutes);
      }
      
      // Calculate time difference in minutes
      const timeUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60);
      const reminderTime = todo.notificationSettings.reminderTime || 30;
      
      console.log(`Todo "${todo.title}" is due in ${Math.round(timeUntilDue)} minutes, reminder set for ${reminderTime} minutes before`);
      
      // Get the user's ID
      const userId = todo.user._id.toString();
      const todoId = todo._id.toString();
      
      // If it's time to send the reminder (within the reminder window)
      if (timeUntilDue > 0 && timeUntilDue <= reminderTime) {
        // Only continue if we have the socket utilities initialized
        if (!io || !userSockets) {
          console.error('Socket utilities not initialized in notification service');
          return { error: 'Socket utilities not initialized' };
        }
        
        // Check if we already sent a reminder for this todo recently
        if (hasReminderBeenSent(todoId, userId)) {
          console.log(`Already sent reminder for todo "${todo.title}" (ID: ${todoId}), skipping`);
          results.skipped++;
          continue;
        }
        
        // Get the user's socket ID
        const socketId = userSockets.get(userId);
        
        results.todos.push({
          id: todo._id,
          title: todo.title,
          timeUntilDue: Math.round(timeUntilDue),
          reminderTime
        });
        
        // Create notification object with a unique ID
        const notification = {
          id: `${todoId}-${Date.now()}`, // Add unique ID for frontend deduplication
          type: 'DUE_SOON',
          todoId: todoId,
          userId: userId, // Add userId to identify the recipient
          title: todo.title,
          message: `Task "${todo.title}" is due soon`,
          timeRemaining: Math.round(timeUntilDue),
          timestamp: new Date()
        };
        
        // If user is online, send via socket
        if (socketId) {
          console.log(`Sending notification for "${todo.title}" to user ${userId} via socket ${socketId}`);
          io.to(socketId).emit('notification', notification);
          
          // Record that we sent this reminder
          recordReminderSent(todoId, userId);
        } else {
          console.log(`User ${userId} not connected, notification for "${todo.title}" not delivered`);
        }
        
        // Mark reminder as sent to avoid repeated notifications
        todo.reminderSent = true;
        await todo.save();
        
        results.notified++;
      }
      
      // If the task is overdue and hasn't had a reminder
      else if (timeUntilDue < 0 && !todo.reminderSent) {
        // Only continue if we have the socket utilities initialized
        if (!io || !userSockets) {
          console.error('Socket utilities not initialized in notification service');
          return { error: 'Socket utilities not initialized' };
        }
        
        // Check if we already sent a reminder for this todo recently
        if (hasReminderBeenSent(todoId, userId)) {
          console.log(`Already sent overdue reminder for todo "${todo.title}" (ID: ${todoId}), skipping`);
          results.skipped++;
          continue;
        }
        
        // Handle overdue notification similar to above
        const socketId = userSockets.get(userId);
        
        console.log(`Todo "${todo.title}" is overdue by ${Math.abs(Math.round(timeUntilDue))} minutes`);
        
        const notification = {
          id: `${todoId}-overdue-${Date.now()}`, // Add unique ID for frontend deduplication
          type: 'OVERDUE',
          todoId: todoId,
          userId: userId, // Add userId to identify the recipient
          title: todo.title,
          message: `Task "${todo.title}" is overdue!`,
          timestamp: new Date()
        };
        
        if (socketId) {
          console.log(`Sending overdue notification for "${todo.title}" to user ${userId}`);
          io.to(socketId).emit('notification', notification);
          
          // Record that we sent this reminder
          recordReminderSent(todoId, userId);
        } else {
          console.log(`User ${userId} not connected, overdue notification for "${todo.title}" not delivered`);
        }
        
        todo.reminderSent = true;
        await todo.save();
        
        results.notified++;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error checking due todos:', error);
    return { error: error.message };
  }
}

/**
 * Reset the reminder flag for a todo when its due date is updated
 * @param {string} todoId - The ID of the todo to reset
 * @returns {Promise<boolean>} Success status
 */
export async function resetReminderFlag(todoId) {
  try {
    const result = await Todo.findByIdAndUpdate(todoId, { reminderSent: false });
    console.log(`Reset reminder flag for todo ${todoId}`);
    
    // Also clear from the sent reminders tracking
    if (sentReminders.has(todoId)) {
      sentReminders.delete(todoId);
      console.log(`Cleared sent reminder tracking for todo ${todoId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting reminder flag:', error);
    return false;
  }
} 