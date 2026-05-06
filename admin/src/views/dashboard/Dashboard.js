import React from 'react';
import { Grid, Card, Box, Container, Typography, Button, Fade } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import { useNavigate } from 'react-router';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HotelIcon from '@mui/icons-material/Hotel';
import BedIcon from '@mui/icons-material/Bed';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
// components
import SalesOverview from './components/SalesOverview';
import YearlyBreakup from './components/YearlyBreakup';
import RecentTransactions from './components/RecentTransactions';
import ProductPerformance from './components/ProductPerformance';
import Blog from './components/Blog';
import MonthlyEarnings from './components/MonthlyEarnings';
import { useDispatch, useSelector } from 'react-redux';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.Auth);

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(25,118,210,0.1) 0%, rgba(255,255,255,1) 100%)',
          minHeight: '80vh',
          py: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background elements */}

        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(25,118,210,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <Container maxWidth="lg">
          {/* Hero Section */}
          <Fade in timeout={1000}>
            <Box
              sx={{
                textAlign: 'center',
                // py: 10,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <HotelIcon
                sx={{
                  fontSize: 80,
                  color: 'primary.main',
                  mb: 2,
                  transform: 'rotate(-10deg)',
                }}
              />

              <Typography
                variant="h2"
                fontWeight="bold"
                gutterBottom
                sx={{
                  background: 'linear-gradient(45deg, #1976d2 30%, #4dabf5 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                  mb: 2,
                }}
              >
                Welcome to Mantri In
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
                sx={{
                  mb: 4,
                  fontStyle: 'italic',
                  fontWeight: 300,
                }}
              >
                Where Luxury Meets Homely Comfort
              </Typography>

              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 6,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 5,
                  boxShadow: 4,
                  transform: 'scale(1)',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 6,
                  },
                }}
                onClick={() => navigate('/salon-management')}
              >
                Open Salon Management
              </Button>

              {/* Stats Grid */}
              <Grid container spacing={4} sx={{ mt: 8 }}>
                {[
                  { icon: <BedIcon fontSize="large" />, label: 'Luxury Rooms', value: '50+' },
                  { icon: <StarIcon fontSize="large" />, label: '5-Star Rating', value: '4.9/5' },
                  { icon: <GroupsIcon fontSize="large" />, label: 'Happy Guests', value: '10K+' },
                  {
                    icon: <LocalOfferIcon fontSize="large" />,
                    label: 'Special Offers',
                    value: '20% Off',
                  },
                ].map((item, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        boxShadow: 3,
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                        },
                      }}
                    >
                      <Box sx={{ color: 'primary.main', mb: 2 }}>{item.icon}</Box>
                      <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {item.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {item.label}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        </Container>

        {/* Floating Animation Elements */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(25,118,210,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s infinite',
          }}
        />
      </Box>

      {/* <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <SalesOverview />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <YearlyBreakup />
              </Grid>
              <Grid item xs={12}>
                <MonthlyEarnings />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} lg={4}>
            <RecentTransactions />
          </Grid>
          <Grid item xs={12} lg={8}>
            <ProductPerformance />
          </Grid>
          <Grid item xs={12}>
            <Blog />
          </Grid>
        </Grid>
      </Box> */}
    </PageContainer>
  );
};

export default Dashboard;
