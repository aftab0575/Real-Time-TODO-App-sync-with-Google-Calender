import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { setCurrentUserId } from '../../redux/notificationSlice';
import { connectSocket, getLastUserId } from '../../services/socketService';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  Paper, 
  Alert,
  Link
} from '@mui/material';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin ? { email, password } : { name, email, password };
      const res = await API.post(endpoint, payload);

      dispatch(setUser({
        user: res.data.user,
        token: res.data.token
      }));

      const userId = res.data.user._id;
      const lastUserId = getLastUserId();
      
      console.log(`User logged in: ${userId}, last user: ${lastUserId}`);
      
      dispatch(setCurrentUserId(userId));
      
      connectSocket(res.data.token);

      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 3 }}
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {!isLogin && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!isLogin}
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={isLogin}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 2, 
                mb: 2, 
                py: 1.5, 
                fontSize: '1rem',
                backgroundColor: '#130485',
                '&:hover': {
                  backgroundColor: '#0c0361'
                }
              }}
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </Button>
          </Box>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => setIsLogin(!isLogin)}
              sx={{ 
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Auth;
