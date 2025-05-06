import { google } from 'googleapis';
import User from '../models/User.js';

// Google OAuth client setup
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUrl: process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5000/api/auth/google/callback'
};

// Create OAuth2 client
const createOAuth2Client = (tokens = {}) => {
  const oAuth2Client = new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirectUrl
  );
  
  if (tokens.accessToken && tokens.refreshToken) {
    oAuth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.tokenExpiry ? new Date(tokens.tokenExpiry).getTime() : undefined
    });
  }
  
  return oAuth2Client;
};

// Generate auth URL for frontend to redirect user
export const generateAuthUrl = (userId) => {
  const oAuth2Client = createOAuth2Client();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'profile',
      'email'
    ],
    prompt: 'consent', // Force user to re-consent to ensure we get a refresh token
    state: userId // Pass user ID as state to retrieve in the callback
  });
  
  return authUrl;
};

// Exchange authorization code for tokens
export const getTokensFromCode = async (code) => {
  const oAuth2Client = createOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
  };
};

// Get user info from Google
export const getGoogleUserInfo = async (tokens) => {
  const oAuth2Client = createOAuth2Client({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenExpiry: tokens.tokenExpiry
  });
  
  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: 'v2'
  });
  
  const { data } = await oauth2.userinfo.get();
  return data;
};

// Create a calendar client with user's tokens
export const getCalendarClient = async (userId) => {
  try {
    // Find user and check for tokens
    const user = await User.findById(userId);
    if (!user || !user.hasValidGoogleAuth()) {
      throw new Error('User has no valid Google authentication');
    }
    
    // Create OAuth2 client with user's tokens
    const oAuth2Client = createOAuth2Client({
      accessToken: user.googleAuth.accessToken,
      refreshToken: user.googleAuth.refreshToken,
      tokenExpiry: user.googleAuth.tokenExpiry
    });
    
    // Handle token refresh if needed
    oAuth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        user.googleAuth.refreshToken = tokens.refresh_token;
      }
      if (tokens.access_token) {
        user.googleAuth.accessToken = tokens.access_token;
      }
      if (tokens.expiry_date) {
        user.googleAuth.tokenExpiry = new Date(tokens.expiry_date);
      }
      
      await user.save();
      console.log('Updated user tokens after refresh');
    });
    
    // Create and return calendar client
    return google.calendar({ version: 'v3', auth: oAuth2Client });
  } catch (error) {
    console.error('Error creating calendar client:', error);
    throw error;
  }
};

// Create a calendar event from todo
export const createCalendarEvent = async (userId, todo) => {
  try {
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId);
    
    if (!todo.dueDate) {
      throw new Error('Cannot create calendar event for todo without a due date');
    }
    
    // Format the date and time
    const dueDate = new Date(todo.dueDate);
    let startTime = dueDate;
    let endTime = new Date(dueDate);
    
    // If there's a specific time, set it
    if (todo.dueTime) {
      const [hours, minutes] = todo.dueTime.split(':').map(Number);
      startTime.setHours(hours, minutes, 0);
      endTime.setHours(hours, minutes + 30, 0); // Default to 30 min event
    } else {
      // If no specific time, make it an all-day event
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(startTime);
      endTime.setDate(endTime.getDate() + 1); // End is exclusive in Google Calendar
    }
    
    // Create event object
    const event = {
      summary: `[Todo] ${todo.title}`,
      description: todo.description || '',
      start: {
        dateTime: todo.dueTime ? startTime.toISOString() : undefined,
        date: !todo.dueTime ? startTime.toISOString().split('T')[0] : undefined
      },
      end: {
        dateTime: todo.dueTime ? endTime.toISOString() : undefined,
        date: !todo.dueTime ? endTime.toISOString().split('T')[0] : undefined
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: todo.notificationSettings?.reminderTime || user.calendarIntegration.defaultReminderMinutes }
        ]
      },
      // Add metadata to identify this as a todo event
      extendedProperties: {
        private: {
          todoId: todo._id.toString(),
          todoApp: 'true',
          todoPriority: todo.priority
        }
      }
    };
    
    // Insert event to calendar
    const response = await calendar.events.insert({
      calendarId: user.googleAuth.calendarId || 'primary',
      resource: event
    });
    
    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      status: 'success'
    };
  } catch (error) {
    console.error('Error creating calendar event:', error.message);
    return {
      status: 'failed',
      error: error.message
    };
  }
};

// Update a calendar event from todo
export const updateCalendarEvent = async (userId, todo) => {
  try {
    if (!todo.calendarEvent || !todo.calendarEvent.id) {
      return await createCalendarEvent(userId, todo);
    }
    
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId);
    
    // Get existing event
    const eventId = todo.calendarEvent.id;
    
    // Format the date and time
    const dueDate = new Date(todo.dueDate);
    let startTime = dueDate;
    let endTime = new Date(dueDate);
    
    // If there's a specific time, set it
    if (todo.dueTime) {
      const [hours, minutes] = todo.dueTime.split(':').map(Number);
      startTime.setHours(hours, minutes, 0);
      endTime.setHours(hours, minutes + 30, 0); // Default to 30 min event
    } else {
      // If no specific time, make it an all-day event
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(startTime);
      endTime.setDate(endTime.getDate() + 1); // End is exclusive in Google Calendar
    }
    
    // Create event object
    const event = {
      summary: `[Todo] ${todo.title}`,
      description: todo.description || '',
      start: {
        dateTime: todo.dueTime ? startTime.toISOString() : undefined,
        date: !todo.dueTime ? startTime.toISOString().split('T')[0] : undefined
      },
      end: {
        dateTime: todo.dueTime ? endTime.toISOString() : undefined,
        date: !todo.dueTime ? endTime.toISOString().split('T')[0] : undefined
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: todo.notificationSettings?.reminderTime || user.calendarIntegration.defaultReminderMinutes }
        ]
      },
      // Add metadata to identify this as a todo event
      extendedProperties: {
        private: {
          todoId: todo._id.toString(),
          todoApp: 'true',
          todoPriority: todo.priority,
          todoStatus: todo.status,
          todoCompleted: todo.completed.toString()
        }
      }
    };
    
    // Update event in calendar
    const response = await calendar.events.update({
      calendarId: user.googleAuth.calendarId || 'primary',
      eventId: eventId,
      resource: event
    });
    
    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      status: 'success'
    };
  } catch (error) {
    console.error('Error updating calendar event:', error.message);
    return {
      status: 'failed',
      error: error.message
    };
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (userId, eventId) => {
  try {
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId);
    
    await calendar.events.delete({
      calendarId: user.googleAuth.calendarId || 'primary',
      eventId: eventId
    });
    
    return { status: 'success' };
  } catch (error) {
    console.error('Error deleting calendar event:', error.message);
    return {
      status: 'failed',
      error: error.message
    };
  }
};

// Get all calendar events for a user 
export const getCalendarEvents = async (userId, options = {}) => {
  try {
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId);
    
    const params = {
      calendarId: user.googleAuth.calendarId || 'primary',
      maxResults: options.maxResults || 100,
      singleEvents: true,
      orderBy: 'startTime'
    };
    
    // Add time bounds if provided
    if (options.timeMin) {
      params.timeMin = new Date(options.timeMin).toISOString();
    } else {
      // Default to events from now onwards
      params.timeMin = new Date().toISOString();
    }
    
    if (options.timeMax) {
      params.timeMax = new Date(options.timeMax).toISOString();
    }
    
    // If we only want events created by our app
    if (options.todoEventsOnly) {
      params.privateExtendedProperty = 'todoApp=true';
    }
    
    const response = await calendar.events.list(params);
    return response.data.items;
  } catch (error) {
    console.error('Error getting calendar events:', error.message);
    throw error;
  }
};

// Get a single calendar event
export const getCalendarEvent = async (userId, eventId) => {
  try {
    const calendar = await getCalendarClient(userId);
    const user = await User.findById(userId);
    
    const response = await calendar.events.get({
      calendarId: user.googleAuth.calendarId || 'primary',
      eventId: eventId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting calendar event:', error.message);
    throw error;
  }
}; 