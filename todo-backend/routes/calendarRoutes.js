import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  disconnectGoogle,
  updateCalendarSettings,
  getCalendarStatus
} from '../controllers/googleAuthController.js';
import {
  syncTodoToCalendar,
  unsyncTodoFromCalendar,
  getUserCalendarEvents,
  syncAllTodos,
  importCalendarEvents
} from '../controllers/calendarController.js';

const router = Router();

// Google Authentication routes
router.get('/auth/google/url', authMiddleware, getGoogleAuthUrl);
router.get('/auth/google/callback', handleGoogleCallback);
router.post('/auth/google/disconnect', authMiddleware, disconnectGoogle);
router.get('/auth/google/status', authMiddleware, getCalendarStatus);
router.put('/auth/google/settings', authMiddleware, updateCalendarSettings);

// Calendar integration routes
router.post('/todos/:todoId/sync', authMiddleware, syncTodoToCalendar);
router.delete('/todos/:todoId/sync', authMiddleware, unsyncTodoFromCalendar);
router.get('/events', authMiddleware, getUserCalendarEvents);
router.post('/sync/all', authMiddleware, syncAllTodos);
router.post('/import', authMiddleware, importCalendarEvents);

export default router; 