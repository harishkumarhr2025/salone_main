import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Container,
  Button,
  IconButton,
  useMediaQuery,
  Box,
  Typography,
  Skeleton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { ClickAwayListener } from '@mui/material';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { CheckAuthentication, logout } from 'src/redux/features/AuthSlice';

const Header = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const [menuOpen, setMenuOpen] = React.useState(false);

  const dispatch = useDispatch();

  const { isAuthenticated, user, isLoading } = useSelector((state) => state.Auth);

  const normalizeRole = (role) =>
    String(role || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');

  console.log('Header isAuthenticated:', isAuthenticated);
  console.log('Header user:', user);

  useEffect(() => {
    dispatch(CheckAuthentication());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    navigate('/');
  };

  // Determine actual authentication status
  const isReallyAuthenticated = isAuthenticated && !!user;
  const allowedDashboardRoles = ['admin', 'semiadmin', 'semi_admin', 'user'];
  const canShowDashboard = allowedDashboardRoles.includes(normalizeRole(user?.role));

  const navItems = [
    ...(isReallyAuthenticated
      ? [
          ...(canShowDashboard
            ? [{ name: 'Dashboard', path: '/dashboard' }]
            : []),
          { name: 'Logout', action: handleLogout },
        ]
      : [
          { name: 'Login', path: '/auth/login' },
          { name: 'Register', path: '/auth/register' },
        ]),
  ];

  const buttonStyles = {
    color: 'text.primary',
    textTransform: 'none',
    fontFamily: 'Poppins',
    fontSize: 16,
    position: 'relative',
    '&:hover': {
      color: 'primary.main',
      '&::after': {
        width: '100%',
      },
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -4,
      left: 0,
      width: 0,
      height: 2,
      backgroundColor: 'primary.main',
      transition: 'width 0.3s ease',
    },
  };

  const headingStyles = {
    background: 'linear-gradient(45deg, #7c4dff 30%, #ff4081 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontFamily: 'Poppins',
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 2,
    paddingRight: 5,
    display: 'inline-block',
    maxWidth: '400px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  if (isLoading) {
    return <Skeleton variant="text" width={100} height={40} />;
  }

  return (
    <ClickAwayListener onClickAway={() => setMenuOpen(false)}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#393B3D',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          fontFamily: 'Poppins',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Typography
                variant="h5"
                component={Link}
                to="/"
                sx={{
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: 'linear-gradient(45deg, #7c4dff, #ff4081)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontFamily: 'Poppins',
                }}
              >
                Likeme Salon
              </Typography>
            </motion.div>

            {!isMobile ? (
              <Box sx={{ display: 'flex', gap: 3, fontFamily: 'Poppins' }}>
                {isReallyAuthenticated ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={headingStyles}>Welcome, {user?.name || 'Guest'}</Typography>

                    {canShowDashboard && (
                      <Button
                        onClick={() => navigate('/dashboard')}
                        sx={buttonStyles}
                        disabled={!user}
                      >
                        Dashboard
                      </Button>
                    )}
                    <Button sx={buttonStyles} onClick={handleLogout}>
                      Logout
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Button onClick={() => navigate('/auth/login')} sx={buttonStyles}>
                      Login
                    </Button>
                    <Button onClick={() => navigate('/auth/register')} sx={buttonStyles}>
                      Register
                    </Button>
                  </>
                )}
              </Box>
            ) : (
              <IconButton
                color="inherit"
                aria-label="Toggle navigation menu"
                onClick={() => setMenuOpen(!menuOpen)}
                sx={{ color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>

          {/* Mobile Menu */}
          {isMobile && menuOpen && (
            <Box
              sx={{
                pb: 2,
                pl: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                fontFamily: 'Poppins',
                backgroundColor: '#393B3D',
                position: 'absolute',
                width: '100%',
                zIndex: 1,
                left: 0,
              }}
            >
              {isReallyAuthenticated ? (
                <Typography sx={headingStyles}>Welcome, {user?.name || 'Guest'}</Typography>
              ) : null}
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  fullWidth
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                    } else if (item.action) {
                      item.action();
                    }
                    setMenuOpen(false);
                  }}
                  sx={{
                    color: 'text.primary',
                    justifyContent: 'flex-start',
                    fontFamily: 'Poppins',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    },
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
          )}
        </Container>
      </AppBar>
    </ClickAwayListener>
  );
};

export default Header;
