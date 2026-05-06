import React, { useEffect } from 'react';
import './Home.css';
import { Container, Typography, Button, Box, Stack } from '@mui/material';
import salonHomeBg from '../../assets/images/backgrounds/salon-home-bg.jpg';

import { useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

import { CheckAuthentication } from 'src/redux/features/AuthSlice';

import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c4dff',
    },
    secondary: {
      main: '#ff4081',
    },
    background: {
      default: '#0a1929',
      paper: '#001e3c',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAuthentication = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        await dispatch(CheckAuthentication());
      } else {
        console.log('User not authenticated.');
      }
    };

    checkUserAuthentication();
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Poppins',
          backgroundImage: `url(${salonHomeBg})`,
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 25, 41, 0.7)',
            zIndex: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Container
          maxWidth="xl"
          sx={{
            flex: 1,
            px: { xs: 2, sm: 4, lg: 6 },
            mt: { xs: 8, md: 8 },
            maxWidth: 1200,
            mx: 'auto',
            mb: 12,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              py: { xs: 8, md: 12 },
              px: { xs: 2, md: 6 },
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(124,77,255,0.15), rgba(255,64,129,0.12))',
              border: '1px solid rgba(255,255,255,0.15)',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: 'linear-gradient(45deg, #7c4dff 30%, #ff4081 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Poppins',
                fontSize: { xs: '2rem', md: '3.5rem' },
              }}
            >
              Likeme Salon
            </Typography>

            <Typography
              variant="h6"
              sx={{
                mb: 5,
                maxWidth: 760,
                mx: 'auto',
                fontFamily: 'Poppins',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              Everything your salon needs — manage services, track staff, control access by role,
              and get powerful reports, all from a single platform.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/auth/login')}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  textTransform: 'none',
                  fontFamily: 'Poppins',
                }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  textTransform: 'none',
                  fontFamily: 'Poppins',
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.6)',
                  '&:hover': {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                Dashboard
              </Button>
            </Stack>
          </Box>
        </Container>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
};

export default Home;
