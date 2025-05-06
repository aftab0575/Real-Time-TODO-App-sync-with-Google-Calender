import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, // New field
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  todoCount: { type: Number, default: 0 }, // New field
  
  // Google Calendar integration fields
  googleId: { type: String },
  googleAuth: {
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiry: { type: Date },
    calendarId: { type: String, default: 'primary' }
  },
  calendarIntegration: {
    enabled: { type: Boolean, default: false },
    syncEvents: { type: Boolean, default: false },
    defaultReminderMinutes: { type: Number, default: 30 }
  }
}, {
  timestamps: true
});

// Method to check if user has valid Google auth
userSchema.methods.hasValidGoogleAuth = function() {
  return (
    this.googleAuth && 
    this.googleAuth.accessToken && 
    this.googleAuth.refreshToken && 
    (
      !this.googleAuth.tokenExpiry || 
      new Date(this.googleAuth.tokenExpiry) > new Date()
    )
  );
};

const User = mongoose.model('User', userSchema);
export default User;
