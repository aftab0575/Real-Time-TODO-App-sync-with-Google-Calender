import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import Navlogo from '../assets/nav-logo.png';
import NotificationCenter from './NotificationCenter';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  useTheme,
  styled,
  useMediaQuery,
  IconButton,
  Tooltip
} from '@mui/material';
import TaskIcon from '@mui/icons-material/Task';
import FolderIcon from '@mui/icons-material/Folder';

// Styled components
const NavbarBrand = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: '#ffffff',
  fontWeight: 'bold',
  '& img': {
    height: 32,
    marginRight: 12,
    transition: 'transform 0.3s ease',
  },
  '&:hover img': {
    transform: 'scale(1.05)',
  },
}));

const NavLink = styled(RouterLink)(({ theme, active }) => ({
  color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
  textDecoration: 'none',
  padding: '6px 16px',
  borderRadius: 8,
  margin: '0 4px',
  fontSize: '0.95rem',
  fontWeight: active ? 600 : 500,
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
  },
  '&::after': active ? {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '70%',
    height: 3,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  } : {}
}));

const Navbar = () => {
  const isAuthenticated = localStorage.getItem('token');
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar 
      position="sticky" 
      color="default" 
      elevation={0} 
      sx={{ 
        backgroundColor: '#001F3F', // Navy blue color
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      <Toolbar 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          minHeight: '68px',
          px: { xs: 2, sm: 3 }
        }}
      >
        {/* Logo and App Name */}
        <NavbarBrand 
          component={RouterLink} 
          to="/" 
        >
          <img src={Navlogo} alt="To Do List" />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: '#ffffff'
            }}
          >
            Todo App
          </Typography>
        </NavbarBrand>
        
        {isAuthenticated && (
          <>
            {/* Navigation Links - center for desktop, hidden for mobile */}
            <Box 
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                gap: 2
              }}
            >
              <NavLink
                to="/"
                active={location.pathname === '/' ? 1 : 0}
              >
                <TaskIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                Tasks
              </NavLink>
              <NavLink
                to="/categories"
                active={location.pathname === '/categories' ? 1 : 0}
              >
                <FolderIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
                Categories
              </NavLink>
            </Box>
            
            {/* Mobile Navigation */}
            {isMobile && (
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center', 
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#001F3F',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 0',
                zIndex: 1100,
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.15)'
              }}>
                <Tooltip title="Tasks">
                  <IconButton 
                    component={RouterLink} 
                    to="/"
                    sx={{ 
                      color: location.pathname === '/' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      mx: 2
                    }}
                  >
                    <TaskIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Categories">
                  <IconButton 
                    component={RouterLink} 
                    to="/categories"
                    sx={{ 
                      color: location.pathname === '/categories' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      mx: 2
                    }}
                  >
                    <FolderIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            
            {/* Notifications */}
            <Box>
              <NotificationCenter />
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

