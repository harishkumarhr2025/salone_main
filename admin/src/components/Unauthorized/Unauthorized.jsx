import React from 'react';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/LockOutlined';
import HomeIcon from '@mui/icons-material/Home';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container
      maxWidth="md"
      sx={{
        // height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        // alignItems: 'center',
        textAlign: 'center',
        // border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          borderRadius: 4,
          background: 'linear-gradient(45deg, #fff5f5 30%, #f8f9fa 90%)',
          width: '100%',
          maxWidth: '600px',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            // top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background:
              'linear-gradient(45deg, transparent 48%, rgba(255, 0, 0, 0.1) 50%, transparent 52%)',
            animation: 'animateGlitch 4s infinite linear',
          },
          '@keyframes animateGlitch': {
            '0%': { transform: 'rotate(0deg) translate(0, 0)' },
            '100%': { transform: 'rotate(360deg) translate(-50%, -50%)' },
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <LockIcon
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 3,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />

          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Un Authorized Access
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mb: 4,
              color: 'text.secondary',
              maxWidth: '500px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            You are now allowed to access this page.
            <br />
            Please contact your admin.
          </Typography>

          {/* <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{
                px: 5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 3,
                '&:hover': { boxShadow: 6 },
              }}
            >
              Return Home
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
              sx={{
                px: 5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                borderWidth: 2,
                '&:hover': { borderWidth: 2 },
              }}
            >
              Go Back
            </Button>
          </Box> */}
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;
