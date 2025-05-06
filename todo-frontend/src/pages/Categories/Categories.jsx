import React from 'react';
import CategoryList from '../../components/CategoryList';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

const Categories = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ 
        py: { xs: 3, md: 5 },
        px: { xs: 1, sm: 2 }
      }}>
        {/* Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
            <FolderSpecialIcon 
              sx={{ 
                fontSize: { xs: 28, sm: 32 }, 
                mr: 2, 
                color: 'primary.main',
                transform: 'rotate(-5deg)'
              }} 
            />
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
                  lineHeight: 1.2,
                  background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Categories
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'text.secondary',
                  mt: 0.5,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Organize your tasks with custom categories
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main content */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: 3, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CategoryIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="medium">
                Manage Categories
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
              Create, edit, and delete categories to organize your tasks efficiently. Each category can have a custom name and color.
            </Typography>
          </Box>
          
          <CategoryList />
        </Paper>
      </Box>
    </Container>
  );
};

export default Categories; 