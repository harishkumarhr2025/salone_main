import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Stack,
  Avatar,
  Paper,
  useTheme,
  Button,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close,
  Person,
  Phone,
  Schedule,
  ConfirmationNumber,
  CheckCircle,
  Cancel,
  Payment,
  History,
  Loyalty,
} from '@mui/icons-material';
// import CreditCardIcon from '@mui/icons-material/CreditCard';
// or
import PaymentIcon from '@mui/icons-material/Payment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { format } from 'date-fns';
import SalonCustomerCheckout from '../SalonCustomerCheckout/SalonCustomerCheckout';
import { useSelector, useDispatch } from 'react-redux';
import { getCustomerDetails } from '../../redux/features/Salon/SalonCustomerSlice';
import { fetchEmployeeByID } from '../../redux/features/EMS/EmployeeSlice';
import Config from '../Config';
import { canModifyRecords } from '../../utils/permissions';

const SalonCustomerDetails = ({ customerId, onClose, onEdit, onDelete }) => {
  const theme = useTheme();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const dispatch = useDispatch();
  const customerDetails = useSelector((state) => state.Salon.selectedCustomer);
  const { employee } = useSelector((state) => state.Employee.employees);
  const currentUser = useSelector((state) => state.Auth.user);
  const allowModify = canModifyRecords(currentUser);

  const getStaffName = (staffId) => {
    const staff = employee.find((emp) => emp._id === staffId);
    return staff?.otherInfo?.workplace === 'Salon' ? staff.employeeName : 'Staff not available';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (customerDetails?.success) {
        try {
          const allBookingIds = customerDetails.customerDetails.customer.visits
            .flatMap((visit) => visit.bookings)
            .filter(Boolean);

          if (allBookingIds.length > 0) {
            const { data } = await Config.post('/bookings', { ids: allBookingIds });
            setBookings(data.bookings);

            console.log('Bookings data:', data.bookings);

            const staffIds = [
              ...new Set(
                data.bookings.flatMap((booking) =>
                  booking.services.map((service) => service.staff),
                ),
              ),
            ].filter(Boolean);

            staffIds.forEach((staffId) => {
              if (!employee.some((emp) => emp._id === staffId)) {
                dispatch(fetchEmployeeByID(staffId));
              }
            });
          }
        } catch (error) {
          console.error('Error fetching bookings:', error);
          setBookings([]);
        }
      }
    };
    fetchBookings();
  }, [customerDetails, dispatch, employee]);

  const handleCheckoutClick = (visit) => {
    if (!allowModify) {
      return;
    }
    setActiveVisit(visit);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    dispatch(getCustomerDetails(customerId));
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        await dispatch(getCustomerDetails(customerId));
      } catch (err) {
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    if (customerId) fetchCustomer();
  }, [customerId]);

  if (isLoading || !customerDetails?.success) return <LinearProgress />;

  const { customer } = customerDetails.customerDetails;
  const lastVisit = customerDetails.customerDetails.lastVisit;

  // const filteredVisits =
  //   customer?.visits?.filter((visit) => (activeTab === 0 ? visit.isActive : !visit.isActive)) || [];

  const filteredVisits =
    customer?.visits
      ?.filter((visit) => (activeTab === 0 ? visit.isActive : !visit.isActive))
      ?.sort((a, b) => {
        // For history tab (activeTab === 1), sort by inTime descending
        if (activeTab === 1) {
          return new Date(b.inTime) - new Date(a.inTime);
        }
        // For active visits, keep original order
        return 0;
      }) || [];

  const formatCurrency = (amount) =>
    amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0';

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'common.white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          px: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Customer Profile
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'secondary.main',
                fontSize: '2rem',
              }}
            >
              {customer.customerName[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {customer.customerName}
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" /> {customer.mobileNumber}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
            <Chip
              icon={<History />}
              label={`Total Visits: ${customerDetails.customerDetails.totalVisits}`}
              sx={{
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderColor: '#a5d6a7',
                '& .MuiChip-icon': { color: '#43a047' },
                px: 1,
                py: 1.5,
              }}
              variant="outlined"
            />
            <Chip
              icon={<Schedule />}
              label={`Last Visit: ${lastVisit}`}
              sx={{
                backgroundColor: '#e3f2fd',
                color: '#1565c0',
                borderColor: '#90caf9',
                '& .MuiChip-icon': { color: '#1976d2' },
                px: 1,
                py: 1.5,
              }}
              variant="outlined"
            />
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                mb: 3,
                '& .MuiTabs-indicator': {
                  height: 4,
                  borderRadius: '2px 2px 0 0',
                },
              }}
            >
              <Tab
                label="Active Visits"
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  color: activeTab === 0 ? 'primary.main' : 'text.secondary',
                }}
              />
              <Tab
                label="History"
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  color: activeTab === 1 ? 'primary.main' : 'text.secondary',
                }}
              />
            </Tabs>

            {filteredVisits.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No {activeTab === 0 ? 'active' : 'past'} visits found
                </Typography>
              </Paper>
            ) : (
              filteredVisits.map((visit) => (
                <Paper
                  key={visit._id}
                  elevation={2}
                  sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        <ConfirmationNumber sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Service Number: {visit.serviceNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <Schedule sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        In time: {format(new Date(visit.inTime), 'dd MMM yyyy, hh:mm a')}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {allowModify && visit.isActive && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<Payment fontSize="small" />}
                          onClick={() => handleCheckoutClick(visit)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': { boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
                          }}
                        >
                          Checkout
                        </Button>
                      )}
                      <Chip
                        icon={visit.isActive ? <CheckCircle /> : null}
                        label={visit.isActive ? 'Active' : 'Completed'}
                        color={visit.isActive ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>

                  {bookings.filter((b) => b.visit.toString() === visit._id.toString()).length >
                  0 ? (
                    <Box sx={{ mt: 2, pl: 4 }}>
                      {bookings
                        .filter((booking) => booking.visit.toString() === visit._id.toString())
                        .map((booking) => (
                          <Box key={booking._id} sx={{ mb: 4 }}>
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                Service Time: {format(new Date(booking.createdAt), 'hh:mm a')}
                              </Typography>
                            </Box>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                              {booking.services.map((service) => (
                                <Grid item xs={12} sm={6} key={service._id}>
                                  <Paper
                                    variant="outlined"
                                    sx={{
                                      p: 2,
                                      height: '100%',
                                      borderRadius: 3,
                                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                                      boxShadow: theme.shadows[1],
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: theme.shadows[3],
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        fontWeight="600"
                                        sx={{
                                          color: theme.palette.primary.dark,
                                          fontSize: '1.1rem',
                                          mb: 0.5,
                                          minHeight: '3em',
                                        }}
                                      >
                                        {service.category} - {service.serviceName}
                                      </Typography>
                                      <Chip
                                        icon={<History />}
                                        label={service.variant}
                                        sx={{
                                          backgroundColor: '#e8f5e9',
                                          color: '#2e7d32',
                                          borderColor: '#a5d6a7',
                                          '& .MuiChip-icon': { color: '#43a047' },
                                          px: 1,
                                          py: 1.5,
                                          mb: 1,
                                        }}
                                      />

                                      <Divider sx={{ borderColor: theme.palette.divider }} />

                                      <Stack spacing={1} mt={1}>
                                        <Stack
                                          direction="row"
                                          justifyContent="space-between"
                                          alignItems="center"
                                          spacing={1}
                                        >
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <CurrencyRupeeIcon
                                              fontSize="small"
                                              sx={{ color: theme.palette.success.main }}
                                            />
                                            <Typography variant="body2">Service Charge:</Typography>
                                          </Stack>
                                          <Typography variant="body1" fontWeight="500">
                                            {formatCurrency(service.price)}
                                          </Typography>
                                        </Stack>

                                        {service.staff && (
                                          <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            spacing={1}
                                          >
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                              <Person
                                                fontSize="small"
                                                sx={{ color: theme.palette.secondary.main }}
                                              />
                                              <Typography variant="body2">Service By:</Typography>
                                            </Stack>
                                            <Chip
                                              label={getStaffName(service.staff)}
                                              size="small"
                                              sx={{
                                                backgroundColor: theme.palette.grey[100],
                                                border: `1px solid ${theme.palette.divider}`,
                                                fontWeight: 500,
                                              }}
                                            />
                                          </Stack>
                                        )}

                                        {service.tipAmount > 0 && (
                                          <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            spacing={1}
                                          >
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                              <Loyalty
                                                fontSize="small"
                                                sx={{ color: theme.palette.warning.main }}
                                              />
                                              <Typography variant="body2">Tip Amount:</Typography>
                                            </Stack>
                                            <Typography
                                              variant="body1"
                                              sx={{
                                                color: theme.palette.warning.dark,
                                                fontWeight: 500,
                                              }}
                                            >
                                              {formatCurrency(service.tipAmount)}
                                            </Typography>
                                          </Stack>
                                        )}
                                      </Stack>
                                    </Box>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>

                            {/* Update the Grid container and add discount section */}
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                              {/* Service Charges - Show original and discounted amount */}
                              <Grid item xs={12} md={booking.discount?.amount ? 3 : 4}>
                                <Paper
                                  sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    bgcolor: theme.palette.success.light,
                                    position: 'relative',
                                  }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    Service Charges
                                  </Typography>
                                  {booking.discount?.amount ? (
                                    <Box>
                                      <Typography
                                        variant="h6"
                                        color="success.dark"
                                        sx={{ textDecoration: 'line-through', opacity: 0.7 }}
                                      >
                                        {formatCurrency(booking.originalTotal)}
                                      </Typography>
                                      <Typography variant="h6" color="success.dark">
                                        {formatCurrency(booking.totalAmount)}
                                      </Typography>
                                    </Box>
                                  ) : (
                                    <Typography variant="h6" color="success.dark">
                                      {formatCurrency(booking.totalAmount)}
                                    </Typography>
                                  )}
                                </Paper>
                              </Grid>

                              {/* Discount Section - Only show if discount exists */}
                              {booking.discount?.amount > 0 && (
                                <Grid item xs={12} md={3}>
                                  <Paper
                                    sx={{
                                      p: 2,
                                      textAlign: 'center',
                                      bgcolor: theme.palette.error.light,
                                      border: `2px dashed ${theme.palette.error.main}`,
                                    }}
                                  >
                                    <Typography variant="body2" color="text.secondary">
                                      Discount Applied
                                    </Typography>
                                    <Typography variant="h6" color="error.dark">
                                      -{formatCurrency(booking.discount.amount)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      (
                                      {booking.discount.type === 'percentage'
                                        ? `${booking.discount.value}% off`
                                        : 'Flat discount'}
                                      )
                                    </Typography>
                                    {booking.discount.code && (
                                      <Typography
                                        variant="caption"
                                        display="block"
                                        color="text.secondary"
                                      >
                                        Code: {booking.discount.code}
                                      </Typography>
                                    )}
                                  </Paper>
                                </Grid>
                              )}

                              {/* Total Tips - Adjusted column width */}
                              <Grid item xs={12} md={booking.discount?.amount ? 3 : 4}>
                                <Paper
                                  sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    bgcolor: theme.palette.warning.light,
                                  }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    Total Tips
                                  </Typography>
                                  <Typography variant="h6" color="warning.dark">
                                    {formatCurrency(booking.totalTips)}
                                  </Typography>
                                </Paper>
                              </Grid>

                              {/* Grand Total - Adjusted column width */}
                              <Grid item xs={12} md={booking.discount?.amount ? 3 : 4}>
                                <Paper
                                  sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    bgcolor: theme.palette.primary.light,
                                    border: `2px solid ${theme.palette.primary.main}`,
                                  }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    Grand Total
                                  </Typography>
                                  {/* <Typography variant="h6" color="primary.dark">
                                    {formatCurrency(booking.totalPayment) ||
                                      formatCurrency(booking.totalAmount + booking.totalTips)}
                                  </Typography> */}
                                  <Typography variant="h6" color="primary.dark">
                                    {booking.totalPayment
                                      ? formatCurrency(booking.totalPayment)
                                      : formatCurrency(
                                          (booking.totalAmount || 0) + (booking.totalTips || 0),
                                        )}
                                  </Typography>
                                  {booking.discount?.amount ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      (Original:{' '}
                                      {formatCurrency(booking.originalTotal + booking.totalTips)})
                                    </Typography>
                                  ) : null}
                                </Paper>
                              </Grid>
                            </Grid>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontStyle: 'italic',
                                display: 'block',
                                textAlign: 'right',
                                mt: 1,
                              }}
                            >
                              Payment Method:{' '}
                              {booking?.paymentStatus === 'full' ? (
                                <strong>
                                  {booking.paymentMethod?.toUpperCase()} - ₹
                                  {booking.totalAmount + booking.totalTips}{' '}
                                </strong>
                              ) : (
                                booking?.paymentMethods.map((payment, index) => (
                                  <span
                                    key={index}
                                    style={{ display: 'inline-block', marginLeft: 6 }}
                                  >
                                    <strong>₹{payment.amount}</strong> -{' '}
                                    {payment.method.toUpperCase()}
                                    {index !== booking.paymentMethods.length - 1 && <span> •</span>}
                                  </span>
                                ))
                              )}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, pl: 4 }}>
                      No services booked in this visit
                    </Typography>
                  )}
                </Paper>
              ))
            )}
          </Box>
        </Box>
      </DialogContent>

      <SalonCustomerCheckout
        open={allowModify && showCheckout}
        onClose={() => setShowCheckout(false)}
        visit={activeVisit}
        customer={customer}
        onCheckoutSuccess={handleCheckoutSuccess}
      />
    </Dialog>
  );
};

export default SalonCustomerDetails;
