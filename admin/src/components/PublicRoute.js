import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { CheckAuthentication } from 'src/redux/features/AuthSlice';
import { Box, CircularProgress } from '@mui/material';

const PublicRoute = ({ Component }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.Auth);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsVerifying(false);
        return;
      }

      try {
        await dispatch(CheckAuthentication()).unwrap();
      } catch (error) {
        localStorage.removeItem('token');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [dispatch]);

  if (isVerifying) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Component />;
};

export default PublicRoute;
