import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const backendBaseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

const API = axios.create({
  baseURL: backendBaseUrl,
});

// Add token to headers
const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// Track recently added todos with timestamps to prevent duplicates
const recentlyAddedTodos = new Map();

// Function to check and track added todos
const addToRecentlyAdded = (todoId) => {
  recentlyAddedTodos.set(todoId, Date.now());
  
  // Clean up old entries after 10 seconds
  setTimeout(() => {
    const now = Date.now();
    for (const [id, timestamp] of recentlyAddedTodos.entries()) {
      if (now - timestamp > 10000) { // 10 seconds
        recentlyAddedTodos.delete(id);
      }
    }
  }, 10000);
};

// Check if a todo was recently added
const wasRecentlyAdded = (todoId) => {
  return recentlyAddedTodos.has(todoId);
};

// Thunks
export const fetchTodos = createAsyncThunk('todos/fetchTodos', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const res = await API.get('/api/todos', getAuthHeaders(token));
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || error.message);
  }
});

export const addTodo = createAsyncThunk('todos/addTodo', async ({ 
  title, 
  description, 
  dueDate, 
  dueTime, 
  priority, 
  notificationSettings, 
  category 
}, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const res = await API.post('/api/todos', { 
      title, 
      description, 
      dueDate, 
      dueTime, 
      priority, 
      notificationSettings, 
      category 
    }, getAuthHeaders(token));
    
    // Mark this todo as recently added to prevent duplicates from socket events
    if (res.data && res.data._id) {
      addToRecentlyAdded(res.data._id);
    }
    
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || error.message);
  }
});

export const updateTodo = createAsyncThunk('todos/updateTodo', async ({ 
  id, 
  title, 
  description, 
  dueDate, 
  dueTime, 
  priority, 
  notificationSettings, 
  category 
}, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const res = await API.put(`/api/todos/${id}`, { 
      title, 
      description, 
      dueDate, 
      dueTime, 
      priority, 
      notificationSettings, 
      category 
    }, getAuthHeaders(token));
    
    if (res.data && res.data._id) {
      addToRecentlyAdded(res.data._id);
    }
    
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || error.message);
  }
});

export const toggleTodo = createAsyncThunk('todos/toggleTodo', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    const res = await API.patch(`/api/todos/toggle/${id}`, {}, getAuthHeaders(token));
    
    if (res.data && res.data._id) {
      addToRecentlyAdded(res.data._id);
    }
    
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || error.message);
  }
});

export const deleteTodo = createAsyncThunk('todos/deleteTodo', async (id, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.token;
    await API.delete(`/api/todos/${id}`, getAuthHeaders(token));
    
    // Mark as recently processed
    addToRecentlyAdded(id);
    
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || error.message);
  }
});

// Slice
const todoSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    loading: false,
    error: null,
    socketConnected: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    // Socket event reducers
    addTodoViaSocket: (state, action) => {
      const todoId = action.payload._id;
      
      // First, check if this is a todo we recently added ourselves
      if (wasRecentlyAdded(todoId)) {
        console.log('Ignoring addTodoViaSocket for recently added todo:', todoId);
        return;
      }
      
      // Then check if it already exists in state (double check)
      const existingIndex = state.items.findIndex(todo => todo._id === todoId);
      if (existingIndex === -1) {
        console.log('Adding todo via socket:', todoId);
        state.items.unshift(action.payload);
      } else {
        console.log('Todo already exists in state, ignoring socket update:', todoId);
      }
    },
    
    updateTodoViaSocket: (state, action) => {
      const todoId = action.payload._id;
      
      // Skip update if we recently processed this todo locally
      if (wasRecentlyAdded(todoId)) {
        console.log('Ignoring updateTodoViaSocket for recently updated todo:', todoId);
        return;
      }
      
      const index = state.items.findIndex(todo => todo._id === todoId);
      if (index !== -1) {
        console.log('Updating todo via socket:', todoId);
        state.items[index] = action.payload;
      }
    },
    
    deleteTodoViaSocket: (state, action) => {
      const todoId = action.payload;
      
      // Skip delete if we recently processed this todo locally
      if (wasRecentlyAdded(todoId)) {
        console.log('Ignoring deleteTodoViaSocket for recently deleted todo:', todoId);
        return;
      }
      
      console.log('Deleting todo via socket:', todoId);
      state.items = state.items.filter(todo => todo._id !== todoId);
    },
    
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Todos
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Todo
      .addCase(addTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTodo.fulfilled, (state, action) => {
        state.loading = false;
        console.log('Todo added via API:', action.payload._id);
        
        // Make sure we're not adding duplicates
        const existingIndex = state.items.findIndex(todo => todo._id === action.payload._id);
        if (existingIndex === -1) {
          state.items.unshift(action.payload);
        } else {
          console.log('Duplicate todo prevented in addTodo:', action.payload._id);
        }
      })
      .addCase(addTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Todo
      .addCase(updateTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(t => t._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle Todo
      .addCase(toggleTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleTodo.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(t => t._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(toggleTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Todo
      .addCase(deleteTodo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(t => t._id !== action.payload);
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  addTodoViaSocket, 
  updateTodoViaSocket, 
  deleteTodoViaSocket,
  setSocketConnected 
} = todoSlice.actions;

export default todoSlice.reducer;
