import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Grid,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  useTheme,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  PhoneIphone as PhoneIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomerByMobile } from '../../redux/features/Salon/SalonCustomerSlice';
import toast from 'react-hot-toast';

const ServiceCustomerForm = ({ onSubmit, initialData, onCancel, submitting }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { customerByMobileNumber, isLoading, isError } = useSelector((state) => state.Salon);

  console.log('selectedCustomer', customerByMobileNumber?.customer?.customerName);
  console.log('selectedCustomer', customerByMobileNumber);

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    inTime: dayjs(),
    services: [],
    ...initialData,
  });

  const [errors, setErrors] = useState({
    mobileNumber: false,
    customerName: false,
  });

  // Debounce function to prevent multiple API calls
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Handle mobile number input changes
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Allow only numbers
    setFormData({ ...formData, mobileNumber: value });

    if (value.length === 10) {
      debouncedCheckCustomer(value);
    } else {
      setFormData((prev) => ({ ...prev, customerName: '' }));
    }
  };

  // Debounced customer check
  const debouncedCheckCustomer = debounce((number) => {
    dispatch(getCustomerByMobile(number));
  }, 500);

  // Update form when customer data is found
  useEffect(() => {
    if (
      customerByMobileNumber &&
      customerByMobileNumber?.customer?.mobileNumber === formData.mobileNumber
    ) {
      setFormData((prev) => ({
        ...prev,
        customerName: customerByMobileNumber?.customer?.customerName,
      }));
    }
  }, [customerByMobileNumber]);

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        inTime: dayjs(initialData.inTime),
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {
      mobileNumber: !/^\d{10}$/.test(formData.mobileNumber),
      customerName: formData.customerName.trim().length < 2,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        inTime: formData.inTime.toDate(),
      });
    }
  };

  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: 600,
        margin: 'auto',
        boxShadow: theme.shadows[10],
        borderRadius: 4,
        borderTop: `4px solid ${theme.palette.primary.main}`,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            {initialData ? 'Update Customer' : 'New Customer Entry'}
          </Typography>
          <IconButton onClick={onCancel} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </div>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Please fill in customer details
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Mobile Number"
                value={formData.mobileNumber}
                onChange={handleMobileChange}
                error={errors.mobileNumber}
                helperText={errors.mobileNumber && 'Please enter a valid 10-digit number'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                error={errors.customerName}
                helperText={errors.customerName && 'Name must be at least 2 characters'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Button
                type="submit"
                fullWidth
                disabled={submitting || isLoading}
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CheckIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: 16,
                  bgcolor: initialData ? theme.palette.secondary.main : undefined,
                  '&:hover': {
                    boxShadow: theme.shadows[2],
                  },
                }}
              >
                {initialData ? (
                  submitting ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography>Updating Details...</Typography>
                      <CircularProgress size={18} color="inherit" />
                    </Stack>
                  ) : (
                    'Update Details'
                  )
                ) : submitting ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>Adding Customer...</Typography>
                    <CircularProgress size={18} color="inherit" />
                  </Stack>
                ) : (
                  'Create-Customer'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceCustomerForm;
