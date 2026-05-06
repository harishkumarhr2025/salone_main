import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Email, Phone, Person, Message } from '@mui/icons-material';

const EnquiryForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    services: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const servicesList = ['Room Booking', 'Event Planning', 'Catering', 'Special Offers', 'Other'];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.phone.match(/^\d{10}$/)) newErrors.phone = 'Invalid phone number';
    if (formData.message.length < 20)
      newErrors.message = 'Message should be at least 20 characters';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '', services: [] });
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleServiceChange = (service) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const inputBoxStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      '& fieldset': {
        borderColor: '#9e9e9e',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: '#7c4dff',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#7c4dff',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#9e9e9e',
      transform: 'translate(14px, 16px) scale(1)',
      '&.Mui-focused': {
        color: '#7c4dff',
        transform: 'translate(14px, -9px) scale(0.75)',
      },
      '&.MuiFormLabel-filled': {
        transform: 'translate(14px, -9px) scale(0.75)',
      },
    },
    '& .MuiInputBase-input': {
      color: '#000000',
    },
  };
  return (
    <Container maxWidth="md" sx={{ my: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              mb: 4,
              fontWeight: 700,
              background: 'linear-gradient(45deg, #7c4dff 30%, #ff4081 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Enquire Now
          </Typography>

          {submitSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Thank you! Your enquiry has been submitted successfully.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {/* <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#9e9e9e' }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputBoxStyle}
              /> */}
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                variant="outlined"
                InputProps={{
                  sx: { borderRadius: 1 },
                }}
                sx={inputBoxStyle}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                sx={inputBoxStyle}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                variant="outlined"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                sx={inputBoxStyle}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Your Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                error={!!errors.message}
                helperText={errors.message}
                multiline
                rows={4}
                sx={inputBoxStyle}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  px: 6,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #7c4dff 30%, #ff4081 90%)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 5px 15px rgba(124, 77, 255, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Submit Enquiry'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </motion.div>
    </Container>
  );
};

export default EnquiryForm;
