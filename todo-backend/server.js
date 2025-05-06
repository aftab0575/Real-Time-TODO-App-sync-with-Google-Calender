import express, { json } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import connectDB from './config/db.js';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { checkDueTodos, initNotificationService } from './services/notificationService.js';

import authRoutes from './routes/authRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';

// Initialize Express and HTTP server
config();
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Store user socket IDs
const userSockets = new Map();

// Export io instance to be used in controllers
export { io, userSockets };

// Initialize notification service with socket dependencies
initNotificationService(io, userSockets);

//MongoDB connection
connectDB();

// Configure CORS for Express
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));
app.use(json());

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

//routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/', (req, res) => {
    res.send('Welcome, API is running...');
});
  
// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Authenticate user and store socket ID
  socket.on('authenticate', (token) => {
    try {
      // Use JWT secret from environment variables
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret);
      
      // Extract userId correctly - in auth controller it's stored as 'id'
      const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
      
      if (!userId) {
        console.error('No user ID found in token:', decoded);
        socket.emit('error', { message: 'Invalid token format' });
        return;
      }
      
      // Store the user's socket ID
      userSockets.set(userId.toString(), socket.id);
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
      
      // Send confirmation to client
      socket.emit('authenticated', { userId });
      
      // Check for notifications that might have been pending
      checkDueTodos().then(result => {
        console.log('Ran notification check after authentication:', result);
      }).catch(err => {
        console.error('Error checking notifications after auth:', err);
      });
    } catch (error) {
      console.error('Authentication failed:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    // Remove user's socket ID on disconnect
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected (socket ${socket.id})`);
        break;
      }
    }
  });

  // Handle socket errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Run a notification check immediately when the server starts
setTimeout(() => {
  checkDueTodos().then(result => {
    console.log('Initial notification check result:', result);
  }).catch(err => {
    console.error('Error in initial notification check:', err);
  });
}, 5000); // Wait 5 seconds after startup

// Set up notification scheduler - check more frequently for better notification accuracy
const notificationInterval = setInterval(async () => {
  try {
    const result = await checkDueTodos();
    console.log('Notification check result:', result);
  } catch (error) {
    console.error('Error running notification check:', error);
  }
}, 30000); // Run every 30 seconds instead of every minute for better timing

// Clean up on server shutdown
process.on('SIGINT', () => {
  clearInterval(notificationInterval);
  console.log('Notification scheduler stopped');
  process.exit();
});

//App listening port for local development
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
