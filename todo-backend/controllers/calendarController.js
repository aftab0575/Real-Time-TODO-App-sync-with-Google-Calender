import Todo from '../models/Todo.js';
import User from '../models/User.js';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  getCalendarEvent
} from '../services/googleService.js';

// Sync a todo with Google Calendar
export const syncTodoToCalendar = async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user._id;
    
    // Find the todo
    const todo = await Todo.findOne({ _id: todoId, user: userId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Check if user has valid Google auth
    const user = await User.findById(userId);
    if (!user || !user.hasValidGoogleAuth()) {
      return res.status(400).json({ message: 'User not connected to Google Calendar' });
    }
    
    // Check if todo has due date (required for calendar event)
    if (!todo.dueDate) {
      return res.status(400).json({ message: 'Todo must have a due date to sync with calendar' });
    }
    
    // Set calendar sync status to pending
    todo.calendarEvent = {
      ...todo.calendarEvent,
      lastSyncStatus: 'pending'
    };
    await todo.save();
    
    // Create or update calendar event
    let result;
    if (todo.calendarEvent && todo.calendarEvent.id) {
      // Update existing event
      result = await updateCalendarEvent(userId, todo);
    } else {
      // Create new event
      result = await createCalendarEvent(userId, todo);
    }
    
    // Update todo with calendar event info
    if (result.status === 'success') {
      todo.calendarEvent = {
        id: result.id,
        syncedAt: new Date(),
        synced: true,
        lastSyncStatus: 'success'
      };
    } else {
      todo.calendarEvent = {
        ...todo.calendarEvent,
        lastSyncStatus: 'failed',
        syncError: result.error
      };
    }
    
    await todo.save();
    
    res.status(200).json({
      message: result.status === 'success' ? 'Todo synced to calendar' : 'Failed to sync todo',
      calendarEvent: todo.calendarEvent,
      eventLink: result.htmlLink
    });
  } catch (error) {
    console.error('Error syncing todo to calendar:', error);
    res.status(500).json({ message: 'Failed to sync todo to calendar' });
  }
};

// Unsync (remove) a todo from Google Calendar
export const unsyncTodoFromCalendar = async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user._id;
    
    // Find the todo
    const todo = await Todo.findOne({ _id: todoId, user: userId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Check if todo has calendar event ID
    if (!todo.calendarEvent || !todo.calendarEvent.id) {
      return res.status(400).json({ message: 'Todo is not synced with calendar' });
    }
    
    // Delete from calendar
    const result = await deleteCalendarEvent(userId, todo.calendarEvent.id);
    
    // Update todo regardless of deletion result
    // (If calendar event doesn't exist, we still want to remove it from our db)
    todo.calendarEvent = {
      synced: false,
      lastSyncStatus: result.status
    };
    
    await todo.save();
    
    res.status(200).json({
      message: 'Todo unsynced from calendar',
      status: result.status
    });
  } catch (error) {
    console.error('Error unsyncing todo from calendar:', error);
    res.status(500).json({ message: 'Failed to unsync todo from calendar' });
  }
};

// Get user's calendar events
export const getUserCalendarEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeMin, timeMax, todoEventsOnly } = req.query;
    
    // Check if user has valid Google auth
    const user = await User.findById(userId);
    if (!user || !user.hasValidGoogleAuth()) {
      return res.status(400).json({ message: 'User not connected to Google Calendar' });
    }
    
    const events = await getCalendarEvents(userId, {
      timeMin: timeMin || new Date(),
      timeMax: timeMax || undefined,
      todoEventsOnly: todoEventsOnly === 'true'
    });
    
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({ message: 'Failed to get calendar events' });
  }
};

// Sync all todos with calendar
export const syncAllTodos = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if user has valid Google auth
    const user = await User.findById(userId);
    if (!user || !user.hasValidGoogleAuth()) {
      return res.status(400).json({ message: 'User not connected to Google Calendar' });
    }
    
    // Get all todos with due dates that aren't completed
    const todos = await Todo.find({
      user: userId,
      dueDate: { $exists: true },
      completed: false
    });
    
    const results = {
      total: todos.length,
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    // Process todos
    for (const todo of todos) {
      if (!todo.dueDate) {
        results.skipped++;
        continue;
      }
      
      let result;
      if (todo.calendarEvent && todo.calendarEvent.id) {
        result = await updateCalendarEvent(userId, todo);
      } else {
        result = await createCalendarEvent(userId, todo);
      }
      
      if (result.status === 'success') {
        todo.calendarEvent = {
          id: result.id,
          syncedAt: new Date(),
          synced: true,
          lastSyncStatus: 'success'
        };
        results.success++;
      } else {
        todo.calendarEvent = {
          ...todo.calendarEvent,
          lastSyncStatus: 'failed',
          syncError: result.error
        };
        results.failed++;
      }
      
      await todo.save();
    }
    
    res.status(200).json({
      message: 'Sync completed',
      results
    });
  } catch (error) {
    console.error('Error syncing all todos:', error);
    res.status(500).json({ message: 'Failed to sync all todos' });
  }
};

// Import calendar events as todos
export const importCalendarEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeMin, timeMax, defaultCategoryId } = req.body;
    
    // Check if user has valid Google auth
    const user = await User.findById(userId);
    if (!user || !user.hasValidGoogleAuth()) {
      return res.status(400).json({ message: 'User not connected to Google Calendar' });
    }
    
    // We need a category to assign to the imported todos
    if (!defaultCategoryId) {
      return res.status(400).json({ message: 'Default category ID is required' });
    }
    
    // Get events from calendar
    const events = await getCalendarEvents(userId, {
      timeMin: timeMin || new Date(),
      timeMax: timeMax || undefined,
      todoEventsOnly: false // We want all events, not just the ones created by our app
    });
    
    const results = {
      total: events.length,
      imported: 0,
      skipped: 0 // Already exists or created by our app
    };
    
    for (const event of events) {
      // Skip events that were created by our app
      const eventProps = event.extendedProperties?.private || {};
      if (eventProps.todoApp === 'true') {
        results.skipped++;
        continue;
      }
      
      // Check if we already have a todo with this event ID
      const existingTodo = await Todo.findOne({
        'calendarEvent.id': event.id,
        user: userId
      });
      
      if (existingTodo) {
        results.skipped++;
        continue;
      }
      
      // Determine start date/time
      let dueDate = null;
      let dueTime = null;
      
      if (event.start.dateTime) {
        // Event has a specific time
        const startDateTime = new Date(event.start.dateTime);
        dueDate = startDateTime;
        dueTime = `${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`;
      } else if (event.start.date) {
        // All-day event
        dueDate = new Date(event.start.date);
      }
      
      // Create new todo
      const newTodo = new Todo({
        title: event.summary || 'Imported event',
        description: event.description || '',
        dueDate,
        dueTime,
        category: defaultCategoryId,
        user: userId,
        priority: 'Medium',
        status: 'Pending',
        calendarEvent: {
          id: event.id,
          synced: true,
          syncedAt: new Date(),
          lastSyncStatus: 'success'
        }
      });
      
      await newTodo.save();
      results.imported++;
    }
    
    res.status(200).json({
      message: 'Import completed',
      results
    });
  } catch (error) {
    console.error('Error importing calendar events:', error);
    res.status(500).json({ message: 'Failed to import calendar events' });
  }
}; 