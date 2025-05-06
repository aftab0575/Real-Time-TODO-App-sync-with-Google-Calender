import React from "react";
import { useSelector } from "react-redux";
import Logout from "../../components/Logout.js";
import Todos from "../Todos/Todos"; 
import { Link as RouterLink } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Divider,
  Avatar,
  Fade
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WavingHandIcon from '@mui/icons-material/WavingHand';

const Home = () => {
  const user = useSelector((state) => state.auth?.user);

  // Get current time of day to customize greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Container maxWidth="lg" sx={{ animation: 'fadeIn 0.5s ease-in' }}>
      {user ? (
        <>
          {/* Header with welcome message */}
          <Box 
            sx={{ 
              py: { xs: 3, sm: 4 },
              mb: { xs: 1, sm: 2 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <Box
              component="span"
              sx={{
                position: 'absolute',
                top: { xs: 10, sm: 20 },
                right: { xs: 10, sm: '20%' },
                fontSize: { xs: '2rem', sm: '2.5rem' },
                opacity: 0.9,
                animation: 'wave 1.5s infinite',
                transformOrigin: '70% 70%',
                display: { xs: 'none', sm: 'block' },
                '@keyframes wave': {
                  '0%': { transform: 'rotate(0deg)' },
                  '10%': { transform: 'rotate(14deg)' },
                  '20%': { transform: 'rotate(-8deg)' },
                  '30%': { transform: 'rotate(14deg)' },
                  '40%': { transform: 'rotate(-4deg)' },
                  '50%': { transform: 'rotate(10deg)' },
                  '60%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(0deg)' },
                }
              }}
            >
            
            </Box>
            
            <Typography 
              variant="h6" 
              color="primary.main"
              sx={{ 
                fontWeight: 500,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <WavingHandIcon fontSize="small" />
              {getTimeOfDay()}
            </Typography>
            
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.8rem', sm: '2.5rem' },
                mb: 2,
                background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}
            >
              Welcome, {user.name}
            </Typography>
            
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ maxWidth: '600px', mb: 1 }}
            >
              Here's your personal task management dashboard. Stay organized and boost your productivity!
            </Typography>
          </Box>
          
          {/* Main content */}
          <Fade in={true} timeout={800}>
            <Box>
              <Todos />
            </Box>
          </Fade>
          
          {/* Footer with logout */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 5,
            mb: 6,
            gap: 3
          }}>
            <Divider sx={{ width: '60%', mb: 2 }} />
            
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Thank you for using our task management app
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Made with ❤️ by Developer Aftab Bashir - Raigoneer
              </Typography>
            </Box>
            
            <Logout />
          </Box>
        </>
      ) : (
        <Fade in={true} timeout={800}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '85vh',
              py: 4
            }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 3, sm: 5 }, 
                maxWidth: 560, 
                width: '100%', 
                textAlign: 'center',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  background: 'linear-gradient(90deg, #1976d2, #64b5f6, #1976d2)',
                  backgroundSize: '200% 100%',
                  animation: 'gradientMove 3s linear infinite',
                  '@keyframes gradientMove': {
                    '0%': { backgroundPosition: '0% 0%' },
                    '100%': { backgroundPosition: '200% 0%' }
                  }
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'primary.light',
                    boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)'
                  }}
                >
                  <TaskAltIcon sx={{ fontSize: 34 }} />
                </Avatar>
              </Box>
              
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  mb: 2,
                  color: 'primary.main'
                }}
              >
                Welcome to Your Task Manager
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ mb: 4, maxWidth: '440px', mx: 'auto', lineHeight: 1.6 }}
              >
                Organize your tasks, set priorities, and boost your productivity with our intuitive todo application.
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mb: 4 }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    px: 2, 
                    py: 1.5, 
                    borderRadius: 2, 
                    textAlign: 'center', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  <EmojiEventsIcon color="primary" fontSize="small" />
                  <Typography variant="body2">Track Your Progress</Typography>
                </Paper>
                
                <Paper 
                  elevation={0}
                  sx={{ 
                    px: 2, 
                    py: 1.5, 
                    borderRadius: 2, 
                    textAlign: 'center', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  <TaskAltIcon color="primary" fontSize="small" />
                  <Typography variant="body2">Stay Organized</Typography>
                </Paper>
              </Box>
              
              <Button 
                component={RouterLink} 
                to="/auth" 
                variant="contained" 
                size="large"
                startIcon={<PersonIcon />}
                sx={{ 
                  py: 1.5, 
                  px: 5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #104c90, #1565c0)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Sign In / Sign Up
              </Button>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
                By signing in, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </Paper>
          </Box>
        </Fade>
      )}
    </Container>
  );
};

export default Home;
