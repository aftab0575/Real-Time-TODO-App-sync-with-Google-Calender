import User from '../models/User.js';
import {
  generateAuthUrl,
  getTokensFromCode,
  getGoogleUserInfo
} from '../services/googleService.js';

// Generate Auth URL for frontend to redirect user to Google
export const getGoogleAuthUrl = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const authUrl = generateAuthUrl(userId);
    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Failed to generate Google auth URL' });
  }
};

// Handle Google OAuth callback
export const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'No authorization code provided' });
    }
    
    // State should contain the user ID
    const userId = state;
    if (!userId) {
      return res.status(400).json({ message: 'Invalid state parameter' });
    }
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);
    
    // Get Google user info
    const googleUserInfo = await getGoogleUserInfo(tokens);
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user with Google info
    user.googleId = googleUserInfo.id;
    user.googleAuth = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.tokenExpiry,
      calendarId: 'primary' // Default to primary calendar
    };
    user.calendarIntegration.enabled = true;
    
    await user.save();
    
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/calendar-auth-success`);
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/calendar-auth-error?error=${encodeURIComponent(error.message)}`);
  }
};

// Disconnect Google Calendar integration
export const disconnectGoogle = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Clear Google auth data
    user.googleAuth = undefined;
    user.calendarIntegration.enabled = false;
    user.calendarIntegration.syncEvents = false;
    
    await user.save();
    
    res.status(200).json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ message: 'Failed to disconnect Google Calendar' });
  }
};

// Update calendar integration settings
export const updateCalendarSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { syncEvents, defaultReminderMinutes, calendarId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has Google auth
    if (!user.googleAuth || !user.googleAuth.accessToken) {
      return res.status(400).json({ message: 'User not connected to Google Calendar' });
    }
    
    // Update settings
    if (syncEvents !== undefined) {
      user.calendarIntegration.syncEvents = syncEvents;
    }
    
    if (defaultReminderMinutes !== undefined) {
      user.calendarIntegration.defaultReminderMinutes = defaultReminderMinutes;
    }
    
    if (calendarId) {
      user.googleAuth.calendarId = calendarId;
    }
    
    await user.save();
    
    res.status(200).json({ 
      message: 'Calendar settings updated successfully',
      settings: user.calendarIntegration
    });
  } catch (error) {
    console.error('Error updating calendar settings:', error);
    res.status(500).json({ message: 'Failed to update calendar settings' });
  }
};

// Get user's calendar integration status
export const getCalendarStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isConnected = user.hasValidGoogleAuth();
    
    res.status(200).json({
      connected: isConnected,
      settings: isConnected ? user.calendarIntegration : null
    });
  } catch (error) {
    console.error('Error getting calendar status:', error);
    res.status(500).json({ message: 'Failed to get calendar status' });
  }
}; 