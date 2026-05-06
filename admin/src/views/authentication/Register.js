import React, { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff } from '@tabler/icons';
import PageContainer from 'src/components/container/PageContainer';
import { useDispatch } from 'react-redux';
import Toast from 'react-hot-toast';

import { register } from '../../redux/features/AuthSlice';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Email:', email);
    console.log('Password:', password);
    try {
      const registerCredential = {
        name,
        email,
        password,
        role,
      };
      const response = await dispatch(register(registerCredential));
      console.log('response:', response);
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

  return (
    <PageContainer title="Register" description="Simple registration page">
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
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
            <Typography variant="h5" fontWeight={500}>
              Create Account
            </Typography>
          </Box>

          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />

            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

            <FormControl fullWidth>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="semi_admin">Semi Admin</MenuItem>
              </Select>
            </FormControl>

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
              Create Account
            </Button>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
              Already have an account?{' '}
              <Link
                to="/auth/login"
                style={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default Register;
