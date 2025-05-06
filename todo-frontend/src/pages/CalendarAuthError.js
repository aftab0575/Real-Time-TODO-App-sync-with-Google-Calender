import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

const CalendarAuthError = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    // Extract error message from URL if available
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      setErrorMessage(decodeURIComponent(error));
    }
  }, [location]);
  
  const handleRetry = () => {
    navigate('/');
  };
  
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
        <ErrorIcon 
          sx={{ 
            fontSize: 60, 
            color: 'error.main',
            mb: 2
          }} 
        />
        
        <Typography variant="h5" gutterBottom>
          Calendar Connection Failed
        </Typography>
        
        <Typography variant="body1" paragraph>
          We encountered an error while connecting to your Google Calendar.
        </Typography>
        
        {errorMessage && (
          <Typography 
            variant="body2" 
            sx={{ 
              bgcolor: 'error.light', 
              color: 'error.contrastText',
              p: 2,
              borderRadius: 1,
              mb: 3,
              wordBreak: 'break-word'
            }}
          >
            {errorMessage}
          </Typography>
        )}
        
        <Button
          variant="contained"
          onClick={handleRetry}
          sx={{ mt: 2 }}
        >
          Return to App
        </Button>
      </Paper>
    </Box>
  );
};

export default CalendarAuthError; 