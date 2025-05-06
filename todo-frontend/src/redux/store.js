import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './todoSlice';
import authReducer from './authSlice'; // ✅ correct
import notificationReducer from './notificationSlice';

const store = configureStore({
  reducer: {
    todos: todoReducer,
    auth: authReducer,
    notifications: notificationReducer
  },
});

export default store;
