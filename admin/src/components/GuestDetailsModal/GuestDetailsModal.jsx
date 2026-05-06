import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Typography,
  Chip,
  Paper,
  IconButton,
  useTheme,
  Box,
  Tooltip,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Close, Person, CalendarToday, Hotel, Payment } from '@mui/icons-material';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SecurityIcon from '@mui/icons-material/Security';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import ImageIcon from '@mui/icons-material/Image';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import { getGuestById, resetGuest } from '../../redux/features/GuestSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { styled } from '@mui/material/styles';
import CheckoutModal from '../CheckoutModal/CheckoutModal';
import UpdateIcon from '@mui/icons-material/Update';
import GuestEntryModal from '../GuestEntryModal/GuestEntryModal';
import AadharDisplay from '../AadharDisplay/AadharDisplay';
import PrintComponent from '../PrintComponent/PrintComponent';
import { useReactToPrint } from 'react-to-print';
import { canModifyRecords } from '../../utils/permissions';

const CheckoutButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.warning.light,
  '&:hover': {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.common.white,
  },
}));

const DetailItem = ({ label, value, status }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={1} sx={{ mb: 2 }}>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Grid>
      <Grid item xs={6}>
        {status ? (
          <Chip
            label={value}
            size="small"
            sx={{
              backgroundColor: theme.palette[status].light,
              color: theme.palette[status].dark,
              fontWeight: 500,
            }}
          />
        ) : (
          <Typography variant="body1" fontWeight="500">
            {value}
          </Typography>
        )}
      </Grid>
    </Grid>
  );
};

const SectionHeader = ({ icon, title }) => (
  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
    {icon}
    {title}
  </Typography>
);

const GuestDetailsModal = ({ open, handleClose, guestId, handleModalSubmit }) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [originalTitle] = useState(document.title);
  const currentUser = useSelector((state) => state.Auth.user);
  const allowModify = canModifyRecords(currentUser);

  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const dispatch = useDispatch();
  const { guest, isLoading, successMessage } = useSelector((state) => state.Guest);

  console.log('Guest:', guest);

  useEffect(() => {
    if (open && guestId) {
      // Immediate fetch when modal opens
      dispatch(getGuestById(guestId));

      // Add cleanup to reset guest on unmount
      return () => {
        dispatch(resetGuest()); // Add this action in your slice
      };
    }
  }, [open, guestId, dispatch, editOpen, checkoutOpen]);

  const handleEditOpen = () => {
    if (!allowModify) {
      return;
    }
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    if (successMessage?.includes('updated')) {
      // Check your success message
      setTimeout(() => {
        dispatch(getGuestById(guestId));
      }, 300); // Reduce delay
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: (theme) => theme.palette.grey[100],
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Person fontSize="medium" color="primary" />
          <Typography variant="h6">Guest Details</Typography>
        </Box>

        <Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: '70vh', maxHeight: '70vh', overflowY: 'auto' }}>
        {isLoading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}
          >
            <CircularProgress size={36} />
          </Box>
        ) : (
          <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid item xs={12} md={6}>
                <SectionHeader icon={<Person color="primary" />} title="Personal Information" />
                <DetailItem label="Name" value={guest?.Guest_name} />
                <DetailItem label="Email" value={guest?.Guest_email} />
                <DetailItem label="Contact" value={guest?.Contact_number} />
                <DetailItem label="Aadhar No." value={guest?.Guest_aadhar_No} />
                <DetailItem label="Address" value={guest?.Guest_address} />
                <DetailItem label="Guest Type" value={guest?.Guest_type} status="primary" />
                <DetailItem label="GRC No." value={guest?.GRC_No} />
              </Grid>

              {/* Stay Details */}
              <Grid item xs={12} md={6}>
                <SectionHeader icon={<CalendarToday color="secondary" />} title="Stay Details" />
                <DetailItem
                  label="Arrival Date"
                  value={moment(guest?.Arrival_date).format('Do MMMM YYYY')}
                />
                <DetailItem
                  label="Arrival Time"
                  value={moment(guest?.Arrival_time).format('hh:mm A')}
                />
                <DetailItem label="Adults" value={guest?.Adults} />
                <DetailItem label="Children" value={guest?.Children} />
                <DetailItem label="Purpose" value={guest?.Purpose_of_visit} />
                <DetailItem label="Financial Year" value={guest?.financialYear} />
              </Grid>

              {/* Room Information */}
              <Grid item xs={12} md={6}>
                <SectionHeader icon={<Hotel color="success" />} title="Room Information" />
                <DetailItem label="Room No." value={`${guest?.Room_no} (${guest?.bedNumber})`} />
                <DetailItem label="Room Type" value={guest?.Room_type} status="success" />
                <DetailItem label="Room Tariff" value={`₹${guest?.Room_tariff}`} />
                <DetailItem label="Booking Details" value={guest?.Booking_details} />
              </Grid>

              <Grid item xs={12} md={6}>
                <SectionHeader icon={<ReceiptIcon color="secondary" />} title="Financial Details" />
                <DetailItem label="Registration Fee" value={`₹${guest?.registration_fee || 0}`} />
                <DetailItem label="Advance Deposit" value={`₹${guest?.advance_deposit || 0}`} />
                {guest?.advance_deposit > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1,
                      backgroundColor: '#fff3e0',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <SecurityIcon color="warning" />
                    <Typography variant="body2" color="text.secondary">
                      Security deposit held: ₹{guest?.advance_deposit}
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionHeader icon={<LocalDiningIcon color="primary" />} title="Meal Plan" />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {guest?.meal_plan?.length > 0 ? (
                    guest.meal_plan.map((meal) => (
                      <Chip
                        key={meal}
                        label={meal.charAt(0).toUpperCase() + meal.slice(1)}
                        icon={
                          meal === 'breakfast' ? (
                            <FreeBreakfastIcon />
                          ) : meal === 'lunch' ? (
                            <LunchDiningIcon />
                          ) : (
                            <DinnerDiningIcon />
                          )
                        }
                        sx={{
                          backgroundColor: '#e8f5e9',
                          color: '#2e7d32',
                          border: '1px solid #81c784',
                          '& .MuiChip-icon': {
                            color: '#4caf50',
                          },
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No meal plan selected
                    </Typography>
                  )}
                </Box>
              </Grid>
              {/* Payment Details */}
              <Grid item xs={12} md={6}>
                <SectionHeader icon={<Payment color="warning" />} title="Payment Details" />
                <DetailItem label="Payment Type" value={guest?.Payment_type} status="warning" />
                <DetailItem label="Agent Commission" value={guest?.Agent_commission} />
                {guest?.Checkout_date && (
                  <>
                    <DetailItem label="Room Rent" value={guest?.totalRoomRent} />
                    <DetailItem label="GST Amount" value={guest?.GSTAmount} />
                    <DetailItem label="Grand Total" value={guest?.grand_total} />
                  </>
                )}
              </Grid>

              <Grid
                item
                xs={12}
                sx={{
                  borderRadius: 2,
                  padding: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  marginBottom: 2,
                }}
              >
                <SectionHeader icon={<ImageIcon color="success" />} title="ID Proof" />
                <AadharDisplay guestData={guest} />
              </Grid>

              {guest?.remark && (
                <Grid item xs={12} md={12} fullWidth>
                  <SectionHeader icon={<NewspaperIcon color="danger" />} title="Remark" />
                  <>
                    <Typography>{guest?.remark}</Typography>
                  </>
                </Grid>
              )}
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Guest ID: {guest?._id}
              </Typography>

              {allowModify && (
                <Tooltip
                  title={
                    guest?.Checkout_date ? 'Guest has checked out. Updates are not allowed.' : ''
                  }
                  arrow
                  placement="top"
                >
                  <span>
                    <Button
                      variant="contained"
                      disabled={!!guest?.Checkout_date}
                      onClick={handleEditOpen}
                      startIcon={<UpdateIcon />}
                      sx={{
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0' },
                      }}
                    >
                      Update Guest Details
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>

            <Box
              sx={{
                marginTop: '20px',
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {/* Left Side - Current Status (if not checked out) */}
                  {!guest?.Checkout_date ? (
                    <Typography variant="body2" color="text.secondary">
                      Current Status:{' '}
                      <span style={{ color: '#4CAF50', fontWeight: 600 }}>Active</span>
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Checked out on {moment(guest?.Checkout_date).format('Do MMMM YYYY')} at{' '}
                      {moment(guest?.Checkout_time).format('hh:mm A')}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="contained"
                  startIcon={<ImageIcon />}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': { backgroundColor: '#1565c0' },
                  }}
                  onClick={() => reactToPrintFn()}
                >
                  Print Details
                </Button>

                {allowModify && !guest?.Checkout_date && (
                  <Button
                    variant="contained"
                    startIcon={<ShoppingBasketIcon />}
                    onClick={() => setCheckoutOpen(true)}
                    sx={{
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' },
                      minWidth: 200,
                      borderRadius: 2,
                      textTransform: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      },
                      // Responsive styling
                      '@media (max-width: 600px)': {
                        width: '100%',
                        minWidth: 'auto',
                      },
                    }}
                  >
                    Process Checkout
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        )}
        <CheckoutModal
          open={checkoutOpen}
          handleClose={() => setCheckoutOpen(false)}
          guest={guest}
        />
        <GuestEntryModal
          open={editOpen}
          handleClose={handleEditClose}
          guest={guest}
          handleModalSubmit={handleModalSubmit}
        />
        <div style={{ display: 'none' }}>
          <PrintComponent ref={contentRef} guest={guest} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestDetailsModal;
