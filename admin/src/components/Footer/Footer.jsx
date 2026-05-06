import React from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, IconButton } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn, Email, Phone } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#393B3D',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        mt: 12,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{ py: 8, maxWidth: 1000, mx: 'auto', borderRadius: 4, overflow: 'hidden' }}
      >
        <Grid container spacing={6}>
          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                fontWeight: 800,
                textDecoration: 'none',
                background: 'linear-gradient(45deg, #7c4dff, #ff4081)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <MuiLink
                href="mailto:contact@likemesalon.com"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#ffffff',
                  fontSize: '1rem',
                }}
              >
                <Email fontSize="small" sx={{ color: '#ffffff' }} />
                contact@likemesalon.com
              </MuiLink>
              <MuiLink
                href="tel:+919449550851"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#ffffff',
                  fontSize: '1rem',
                }}
              >
                <Phone fontSize="small" />
                9449550851
              </MuiLink>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                background: 'linear-gradient(45deg, #7c4dff, #ff4081)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <MuiLink sx={{ color: '#ffffff', fontSize: '1rem' }}>About Us</MuiLink>
              <MuiLink sx={{ color: '#ffffff', fontSize: '1rem' }}>FAQ</MuiLink>
              <MuiLink sx={{ color: '#ffffff', fontSize: '1rem' }}>Privacy Policy</MuiLink>
              <MuiLink sx={{ color: '#ffffff', fontSize: '1rem' }}>Terms and condition</MuiLink>
            </Box>
          </Grid>

          {/* Social Media */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                background: 'linear-gradient(45deg, #7c4dff, #ff4081)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Follow Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton sx={{ color: 'text.primary' }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: 'text.primary' }}>
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: 'text.primary' }}>
                <Instagram />
              </IconButton>
              <IconButton sx={{ color: 'text.primary' }}>
                <LinkedIn />
              </IconButton>
            </Box>
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                mt: 3,
                fontWeight: 600,
                background: 'linear-gradient(45deg, #7c4dff, #ff4081)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Developed By
            </Typography>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Typography
          variant="body2"
          sx={{ mt: 6, textAlign: 'center', opacity: 0.8, color: '#ffffff', fontSize: '1rem' }}
        >
          © {new Date().getFullYear()} Likeme Salon. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
