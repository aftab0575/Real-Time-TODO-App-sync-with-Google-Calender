import { io, userSockets } from '../server.js';

/**
 * Emit a todo event to a specific user
 * @param {string} userId - User ID
 * @param {string} eventName - Event name
 * @param {object} data - Data to emit
 */
export const emitToUser = (userId, eventName, data) => {
  try {
    // Ensure userId is a string
    const userIdStr = userId ? userId.toString() : null;
    
    if (!userIdStr) {
      console.error(`Invalid userId: ${userId}`);
      return;
    }
    
    const socketId = userSockets.get(userIdStr);
    if (socketId) {
      io.to(socketId).emit(eventName, data);
      console.log(`Event ${eventName} emitted to user ${userIdStr}`);
    } else {
      console.log(`User ${userIdStr} not connected, couldn't emit ${eventName}`);
    }
  } catch (error) {
    console.error(`Error emitting ${eventName} to user ${userId}:`, error);
  }
};

/**
 * Helper functions for common todo events
 */
export const todoEvents = {
  /**
   * Emit todo added event
   * @param {string} userId - User ID
   * @param {object} todo - Todo object
   */
  todoAdded: (userId, todo) => {
    emitToUser(userId, 'todoAdded', todo);
  },
  
  /**
   * Emit todo updated event
   * @param {string} userId - User ID
   * @param {object} todo - Todo object
   */
  todoUpdated: (userId, todo) => {
    emitToUser(userId, 'todoUpdated', todo);
  },
  
  /**
   * Emit todo deleted event
   * @param {string} userId - User ID
   * @param {string} todoId - Todo ID
   */
  todoDeleted: (userId, todoId) => {
    emitToUser(userId, 'todoDeleted', todoId);
  },
  
  /**
   * Emit todo toggled event
   * @param {string} userId - User ID
   * @param {object} todo - Todo object
   */
  todoToggled: (userId, todo) => {
    emitToUser(userId, 'todoUpdated', todo);
  }
}; 