import React, { useEffect, useState } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  Stack,
  Alert,
  Modal,
  Fade,
  Backdrop,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import Toast from 'react-hot-toast';
import { guestCheckout } from 'src/redux/features/GuestSlice';

const CheckoutModal = ({ open, handleClose, opacityValue, guest, handleCategorySubmit }) => {
  const [guestDetails, setGuestDetails] = useState({
    Checkout_date: '',
    Checkout_time: '',
  });
  const [error, setError] = useState('');
  const [daysStayed, setDaysStayed] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [GSTRate, setGSTRate] = useState(12);
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    setGuestDetails({ Checkout_date: dayjs(), Checkout_time: dayjs() });
  }, [open, guest]);

  useEffect(() => {
    if (guest) {
      setGuestDetails({
        Checkout_date: dayjs(),
        Checkout_time: dayjs(),
      });

      // Calculate initial days stayed
      if (guest.Arrival_date) {
        const checkInDate = dayjs(guest.Arrival_date);
        const days = Math.max(1, dayjs().diff(checkInDate, 'day'));
        setDaysStayed(days);
        if (guest.Room_tariff) {
          setTotalAmount(days * guest.Room_tariff);
        }
      }
    }
  }, [open, guest]);

  useEffect(() => {
    if (guestDetails.Checkout_date && guest?.Arrival_date) {
      const checkInDate = dayjs(guest.Arrival_date);
      const checkoutDate = dayjs(guestDetails.Checkout_date);
      const diffDays = checkoutDate.diff(checkInDate, 'day');
      const calculatedDays = Math.max(1, diffDays);
      setDaysStayed(calculatedDays);

      if (guest?.Room_tariff) {
        setTotalAmount(calculatedDays * guest.Room_tariff);
      }
    }
  }, [guestDetails.Checkout_date, guest?.Checkout_date, guest?.Room_tariff]);

  const handleCheckout = async (guest) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const total = Number(totalAmount) || 0;
      const gstAmount = (total * GSTRate) / 100;
      const grandTotal = total + gstAmount;

      const checkout_data = {
        guestId: guest?._id,
        Checkout_date: guestDetails.Checkout_date,
        Checkout_time: guestDetails.Checkout_time,
        rent: total,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        remark,
      };

      const checkoutResponse = await dispatch(guestCheckout(checkout_data)).unwrap();
      console.log('checkoutResponse:', checkoutResponse);
      if (checkoutResponse?.success) {
        Toast.success(checkoutResponse?.message || 'Guest Checked out');
      } else {
        Toast.error(checkoutResponse?.message || 'Guest Checked out Failed');
      }
      handleClose();
    } catch (error) {
      console.error('Checkout failed:', error);
      setError(error.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      setIsSubmitting(false); // Reset on unmount/close
    };
  }, []);

  const formattedGrandTotal = (totalAmount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 1,
    }).format(totalAmount * (1 + GSTRate / 100));
  };

  useEffect(() => {
    if (error) {
      const timeOut = setTimeout(() => {
        setError('');
      }, 4000);
      return () => clearInterval(timeOut);
    }
  }, [error]);

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open}
      onClose={handleClose}
      keepMounted
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          style: { backgroundColor: `rgba(0, 0, 0, ${opacityValue})` },
          timeout: 400,
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700,
            bgcolor: 'white',
            boxShadow: 4,
            maxHeight: '90vh',
            overflowY: 'auto',
            p: 4,
          }}
        >
          <Typography id="transition-modal-title" variant="h6" align="center" mb={2} component="h2">
            Guest Checkout
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #eee' }}>
            <Typography variant="subtitle1" mb={2} gutterBottom fontWeight="bold">
              Guest Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Guest Name"
                  value={guest?.Guest_name || 'N/A'}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Room Rate"
                  value={guest?.Room_tariff ? `₹${guest.Room_tariff.toLocaleString()}` : 'N/A'}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Check-in Date"
                  value={
                    guest?.Arrival_date ? dayjs(guest.Arrival_date).format('DD/MM/YYYY') : 'N/A'
                  }
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Days Stayed" value={daysStayed} disabled />
              </Grid>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, mt: 1, pt: 1, border: '1px solid #eee' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Checkout Details
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <DatePicker
                          label="Checkout Date"
                          value={guestDetails.Checkout_date}
                          onChange={(newValue) =>
                            setGuestDetails({ ...guestDetails, Checkout_date: newValue })
                          }
                          inputFormat="DD/MM/YYYY"
                          minDate={dayjs()}
                          renderInput={(params) => (
                            <TextField {...params} fullWidth sx={{ mt: 1 }} />
                          )}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TimePicker
                          label="Checkout Time"
                          value={guestDetails.Checkout_time}
                          onChange={(newValue) =>
                            setGuestDetails({ ...guestDetails, Checkout_time: newValue })
                          }
                          renderInput={(params) => (
                            <TextField {...params} fullWidth sx={{ mt: 1 }} />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </LocalizationProvider>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    mt: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                    Payment Breakdown
                  </Typography>

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Room Charges:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="body2">
                        ₹{(guest?.Room_tariff * daysStayed).toLocaleString()}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          (₹{guest?.Room_tariff?.toLocaleString()} x {daysStayed} days)
                        </Typography>
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="body2">Tax ({GSTRate}% GST):</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="body2">
                        ₹{(totalAmount * 0.12).toLocaleString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 1, pt: 1, borderTop: '1px solid #eeeeee' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" fontWeight="bold">
                          Grand Total:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formattedGrandTotal(totalAmount)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} mt={2}>
                    <TextField
                      fullWidth
                      label="Total Amount"
                      value={formattedGrandTotal(totalAmount)}
                      disabled
                      sx={{
                        '& .MuiInputBase-input': {
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                        },
                      }}
                    />
                  </Grid>
                </Box>
              </Grid>
            </Grid>
            <Box mt={3}>
              <TextField
                name="Remark"
                id="outlined-basic"
                label="Remark"
                variant="outlined"
                multiline
                rows={3}
                fullWidth
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Box>
          </Paper>

          <Box sx={{ marginTop: '20px' }}>
            <Button variant="outlined" sx={{ width: '20%', padding: '8px' }} onClick={handleClose}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={() => handleCheckout(guest)}
              sx={{ width: '78%', padding: '8px', marginLeft: '10px' }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
              ) : (
                <>Confirm Checkout ({`₹${(totalAmount * 1.12).toLocaleString()}`})</>
              )}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default CheckoutModal;
