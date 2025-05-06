import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useCategories } from "../../context/CategoryContext";
import {
  fetchTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  clearError,
  setSocketConnected
} from "../../redux/todoSlice";
import axios from "axios";
import { FaFilePdf } from 'react-icons/fa';
import { 
  Container, 
  Typography, 
  Box, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Alert,
  Chip,
  Paper,
  CircularProgress,
  keyframes
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import Todo from '../../components/Todo';
import TodoForm from '../../components/TodoForm';
import CalendarIntegration from '../../components/CalendarIntegration';
import { deleteAttachment } from '../../services/todoService';
import { 
  connectSocket, 
  isSocketConnected, 
  disconnectSocket 
} from '../../services/socketService';

// Define the pulse animation
const pulseAnimation = keyframes`
  0% {
    opacity: 0.6;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.4);
  }
  70% {
    opacity: 1;
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(46, 125, 50, 0);
  }
  100% {
    opacity: 0.6;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(46, 125, 50, 0);
  }
`;

const Todos = () => {
  const dispatch = useDispatch();
  const { items: todos, loading, error, socketConnected } = useSelector((state) => state.todos);
  const { token, user } = useSelector((state) => state.auth);
  const { categories, loading: categoriesLoading } = useCategories();

  // Debug: Log fetched todos
  console.log("Fetched todos:", todos);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingTodo, setEditingTodo] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef();

  // Initialize socket connection when component mounts
  useEffect(() => {
    // Only connect if the user is authenticated
    if (token) {
      console.log('Initializing socket connection with token');
      connectSocket(token);
      
      // Check socket connection status periodically
      const checkSocketInterval = setInterval(() => {
        const connected = isSocketConnected();
        console.log('Socket connection status:', connected);
        dispatch(setSocketConnected(connected));
      }, 3000);
      
      // Set initial connection status
      const initialStatus = isSocketConnected();
      console.log('Initial socket connection status:', initialStatus);
      dispatch(setSocketConnected(initialStatus));
      
      // Clean up on unmount
      return () => {
        console.log('Cleaning up socket connection');
        clearInterval(checkSocketInterval);
        disconnectSocket();
      };
    } else {
      console.warn('No token available for socket authentication');
    }
  }, [token, dispatch]);

  // Fetch todos when component mounts
  useEffect(() => {
    if (token) {
      dispatch(fetchTodos());
    }
  }, [dispatch, token]);

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const defaultCategory = categories.find(cat => cat.isDefault) || categories[0];
      setSelectedCategory(defaultCategory._id);
    }
  }, [categories, selectedCategory]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleCreate = async (formData) => {
    try {
      const result = await dispatch(addTodo({ 
        title: formData.title, 
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        priority: formData.priority,
        notificationSettings: formData.notificationSettings,
        category: selectedCategory 
      })).unwrap();
      
      // Note: tracking moved to todoSlice for better consistency
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleUpdate = async (formData) => {
    if (editingTodo) {
      try {
        const result = await dispatch(updateTodo({ 
          id: editingTodo._id, 
          title: formData.title, 
          dueDate: formData.dueDate,
          dueTime: formData.dueTime,
          priority: formData.priority,
          notificationSettings: formData.notificationSettings,
          category: selectedCategory 
        })).unwrap();
        
        // Note: tracking moved to todoSlice for better consistency
        
        setEditingTodo(null);
      } catch (error) {
        console.error('Failed to update todo:', error);
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      const result = await dispatch(toggleTodo(id)).unwrap();
      
      // Note: tracking moved to todoSlice for better consistency
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteTodo(id)).unwrap();
      
      // Note: tracking moved to todoSlice for better consistency
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  // File upload handler
  const handleFileUpload = async (todoId, file) => {
    try {
      setUploadingId(todoId);
      setUploadError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Get auth token from Redux store
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // Upload using axios directly
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_BASE_URL}/api/todos/${todoId}/attachments`,
        formData,
        config
      );
      
      // Update todos in Redux
      dispatch(updateTodo({ id: todoId, data: response.data }));
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploadingId(null);
    }
  };

  // File deletion handler
  const handleFileDelete = async (todoId, attachmentId) => {
    try {
      await deleteAttachment(todoId, attachmentId);
      // Re-fetch todos to update the UI with the current state
      dispatch(fetchTodos());
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  // Filter todos by category
  const filteredTodos = filterCategory === 'all' 
    ? todos 
    : todos.filter(todo => todo.category === filterCategory);

  if (loading || categoriesLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1.5, 
            px: 3, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 2,
            width: { xs: '100%', sm: '60%', md: '40%' },
            bgcolor: socketConnected ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.08)',
            border: 1,
            borderColor: socketConnected ? 'success.light' : 'error.light'
          }}
        >
          <Box sx={{ 
            width: 10, 
            height: 10, 
            borderRadius: '50%', 
            bgcolor: socketConnected ? 'success.main' : 'error.main',
            mr: 1.5,
            boxShadow: '0 0 8px currentColor',
            animation: socketConnected ? `${pulseAnimation} 1.5s infinite` : 'none'
          }} />
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 'medium',
              color: socketConnected ? 'success.dark' : 'error.dark',
              '& span': {
                fontWeight: 'bold'
              }
            }}
          >
            Real-time Status: <span>{socketConnected ? "Connected" : "Disconnected"}</span>
          </Typography>
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message || "An error occurred"}
        </Alert>
      )}

      {/* Hidden file input for attachments */}
      <input
        type="file"
        accept=".pdf,image/jpeg,image/png,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files.length > 0) {
            const file = e.target.files[0];
            // The handleFileUpload function will be called from the Todo component
          }
        }}
      />

      {/* Todo form for creating/editing */}
      <TodoForm
        onSubmit={editingTodo ? handleUpdate : handleCreate}
        initialValues={editingTodo ? {
          title: editingTodo.title,
          dueDate: editingTodo.dueDate ? new Date(editingTodo.dueDate).toISOString().split('T')[0] : '',
          dueTime: editingTodo.dueTime || '',
          priority: editingTodo.priority || 'Medium',
          notificationSettings: editingTodo.notificationSettings || {
            enableNotifications: true,
            reminderTime: 30
          }
        } : { 
          title: '',
          dueDate: '',
          dueTime: '',
          priority: 'Medium',
          notificationSettings: {
            enableNotifications: true,
            reminderTime: 30
          }
        }}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        loading={loading}
        editing={!!editingTodo}
        onCancel={editingTodo ? () => setEditingTodo(null) : undefined}
        onCategoryChange={setSelectedCategory}
      />

      {/* Google Calendar Integration */}
      <CalendarIntegration />

      {/* Filter by Category - Beautifully styled */}
      <Paper variant="outlined" sx={{ mt: 4, mb: 4, p: 2, borderRadius: 2, bgcolor: '#f9f9f9' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CategoryIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              Filter Tasks by Category
            </Typography>
          </Box>
          
          <FormControl 
            sx={{ 
              minWidth: { xs: '100%', sm: 220 },
              '& .MuiInputBase-root': { 
                borderRadius: 1.5,
                bgcolor: 'white'
              }
            }}
            size="small"
          >
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (selected === 'all') return 'All Categories';
                const category = categories.find(c => c._id === selected);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: category?.color || '#1976d2'
                      }} 
                    />
                    {category?.name || 'All Categories'}
                  </Box>
                );
              }}
              startAdornment={<FilterAltIcon sx={{ mr: 1, color: 'action.active', fontSize: 20 }} />}
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#757575' }} />
                  All Categories
                </Box>
              </MenuItem>
              {categories.map(category => (
                <MenuItem key={category._id} value={category._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: category.color || '#1976d2'
                      }} 
                    />
                    {category.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Todo list */}
      {filteredTodos.map(todo => (
         
        <Todo
          key={todo._id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={() => setEditingTodo(todo)}
          onFileUpload={(file) => {
            // Handle file upload
            handleFileUpload(todo._id, file);
          }}
          onFileDelete={(attachmentId) => {
            // Handle file deletion
            handleFileDelete(todo._id, attachmentId);
          }}
          uploading={uploadingId === todo._id}
          uploadError={uploadingId === todo._id ? uploadError : null}
          fileInputRef={fileInputRef}
        />
      ))}
    </Container>
  );
};

export default Todos; 