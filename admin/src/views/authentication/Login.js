import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff } from '@tabler/icons';
import PageContainer from 'src/components/container/PageContainer';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';
import { login } from '../../redux/features/AuthSlice';
import Toast from 'react-hot-toast';
import YearlyBreakup from '../dashboard/components/YearlyBreakup';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loginCredential = {
        email,
        password,
      };
      const response = await dispatch(login(loginCredential));

      if (response?.meta?.requestStatus === 'rejected') {
        Toast.error(response?.payload?.message || 'Invalid credential');
      }
      if (response?.meta?.requestStatus === 'fulfilled') {
        Toast.success(response?.payload?.message || 'Logged in');
        navigate('/dashboard');
      }
    } catch (error) {
      console.log('Error:', error);
      Toast.error('Something went wrong. Please try again later.');
    }
  };

  useEffect(() => {
    if (errorText) {
      const timeOut = setTimeout(() => {
        setErrorText('');
      }, 4000);
      return () => clearTimeout(timeOut);
    }
  }, [errorText]);

  return (
    <PageContainer title="Login" description="Simple login page">
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa', // Soft background color
        }}
      >
        <Card
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
            borderRadius: 3,
            border: '1px solid rgba(0, 0, 0, 0.05)',
            backgroundColor: 'background.paper',
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography
              sx={{
                background: 'linear-gradient(45deg, #7c4dff 30%, #ff4081 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Poppins',
                fontSize: '2.3rem',
                fontWeight: 600,
                lineHeight: 2,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              Likeme Salon
            </Typography>

            <Typography variant="body2" color="text.secondary" mt={1}>
              Please sign in to continue
            </Typography>
          </Box>

          <Stack sx={{ width: '100%', marginBottom: '2rem' }} spacing={2}>
            {errorText && (
              <Alert
                severity="error"
                variant="outlined"
                sx={{
                  borderRadius: '8px',
                  borderColor: 'error.light',
                  backgroundColor: '#FF6A6A',
                  backdropFilter: 'blur(2px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  '& .MuiAlert-icon': {
                    color: 'error.main',
                    alignItems: 'center',
                  },
                }}
                action={
                  <IconButton
                    aria-label="close"
                    color="error"
                    size="small"
                    onClick={() => setErrorText('')}
                    sx={{ color: '#fff', fontSize: '1.3rem' }}
                  >
                    <Close fontSize="inherit" />
                  </IconButton>
                }
              >
                <Typography sx={{ color: '#fff', fontSize: '1rem', fontFamily: 'Poppins' }}>
                  {errorText}
                </Typography>
              </Alert>
            )}
          </Stack>

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                sx: { borderRadius: 1 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 1,
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '1rem',
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Sign In
            </Button>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
              Don't have an account?{' '}
              <Link
                to="/auth/register"
                style={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Create account
              </Link>
            </Typography>
          </Stack>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default Login;
