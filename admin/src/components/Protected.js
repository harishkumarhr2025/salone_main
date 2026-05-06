import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';
import { CheckAuthentication } from 'src/redux/features/AuthSlice';
import { canAccessDashboard, hasRole } from '../utils/permissions';

const Protected = ({ Component, allowedRoles = [] }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.Auth);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/');
        return;
      }

      try {
        await dispatch(CheckAuthentication()).unwrap();
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [dispatch, navigate]);

  if (isVerifying) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const hasRequiredRole =
    Array.isArray(allowedRoles) && allowedRoles.length > 0
      ? allowedRoles.some((role) => hasRole(user, role))
      : canAccessDashboard(user);

  return isAuthenticated && hasRequiredRole ? <Component /> : <Navigate to="/" replace />;
};

export default Protected;
