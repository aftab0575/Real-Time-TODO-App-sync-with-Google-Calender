import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const CalendarAuthSuccess = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect back to settings/todos page after a short delay
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh' 
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          maxWidth: 500, 
          textAlign: 'center',
          borderRadius: 2
        }}
      >
        <CheckCircleIcon 
          sx={{ 
            fontSize: 60, 
            color: 'success.main',
            mb: 2
          }} 
        />
        
        <Typography variant="h5" gutterBottom>
          Google Calendar Connected Successfully
        </Typography>
        
        <Typography variant="body1" paragraph>
          Your Google Calendar has been connected to your account.
          You can now sync tasks between your Todo app and Google Calendar.
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Redirecting back to app...
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CalendarAuthSuccess; 