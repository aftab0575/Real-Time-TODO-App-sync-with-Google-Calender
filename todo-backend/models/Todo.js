import { Schema, model } from 'mongoose';

const todoSchema = new Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  dueDate: { 
    type: Date 
  },
  dueTime: {
    type: String // Store time in "HH:MM" format
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  notificationSettings: {
    enableNotifications: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: Number, // Minutes before due date to send reminder (e.g., 30 = 30 minutes before)
      default: 30
    }
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Done'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  // Google Calendar integration fields
  calendarEvent: {
    id: { type: String },
    syncedAt: { type: Date },
    synced: { type: Boolean, default: false },
    // The status of the last sync attempt
    lastSyncStatus: { 
      type: String,
      enum: ['success', 'failed', 'pending', null],
      default: null
    },
    // If sync failed, store the error message
    syncError: { type: String }
  },
  attachments: [{
    filename: {
      type: String,
      required: false
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: false
    },
    cloudinaryUrl: {
      type: String,
      required: false
    },
    cloudinaryPublicId: {
      type: String,
      required: false
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Index for better query performance
todoSchema.index({ user: 1, category: 1 });
todoSchema.index({ user: 1, status: 1 });
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ dueDate: 1, reminderSent: 1 }); // For querying upcoming due tasks
todoSchema.index({ 'calendarEvent.id': 1 }); // For calendar event lookups

export default model('Todo', todoSchema);
