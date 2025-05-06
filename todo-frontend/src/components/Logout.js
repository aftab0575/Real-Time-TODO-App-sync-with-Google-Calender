import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import { disconnectSocket } from '../services/socketService';
import { Button, styled } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

// Custom styled Button using MUI's styled API
const LogoutButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#130485',
  color: '#fff',
  fontWeight: 'bold',
  borderRadius: '6px',
  padding: '0.5rem 1.2rem',
  transition: 'background-color 0.3s, transform 0.2s',
  '&:hover': {
    backgroundColor: '#d6050f',
    transform: 'scale(1.05)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1.05rem',
    textAlign: 'center',
    display: 'block',
    marginTop: '1rem',
  },
}));

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Disconnect socket before logout to save notification state
    disconnectSocket();
    // Then dispatch logout action
    dispatch(logout());
    navigate('/auth');
  };

  return (
    <LogoutButton 
      variant="contained" 
      onClick={handleLogout}
      startIcon={<LogoutIcon />}
    >
      Logout
    </LogoutButton>
  );
};

export default Logout;
