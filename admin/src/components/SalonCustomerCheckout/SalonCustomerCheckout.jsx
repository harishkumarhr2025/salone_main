import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Chip,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  LinearProgress,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import { useSelector, useDispatch } from 'react-redux';
import { getAllServices } from 'src/redux/features/Salon/SalonServicesSlice';
import { processCheckout } from '../../redux/features/Salon/SalonCustomerSlice';
import { fetchAllEmployee } from '../../redux/features/EMS/EmployeeSlice';
import MobileFriendlyIcon from '@mui/icons-material/MobileFriendly';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';

const SalonCustomerCheckout = ({ open, customer, visit, onClose, onCheckoutSuccess }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [localServices, setLocalServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({ method: 'cash', amount: '' });
  const [paymentError, setPaymentError] = useState('');
  const [discountType, setDiscountType] = useState('Discount type');
  const [discountValue, setDiscountValue] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);

  const dispatch = useDispatch();
  const { services } = useSelector((state) => state.SalonServices);
  const { employee } = useSelector((state) => state.Employee.employees);

  useEffect(() => {
    dispatch(getAllServices());
    if (visit?.bookings) {
      setLocalServices(visit.bookings);
    }
  }, [dispatch, visit]);

  const serviceStructure = services?.reduce(
    (acc, category) => ({
      ...acc,
      [category.category]: category.services.reduce(
        (catAcc, service) => ({
          ...catAcc,
          [service.name]: {
            prices: service.prices,
            duration: service.duration,
          },
        }),
        {},
      ),
    }),
    {},
  );

  useEffect(() => {
    dispatch(fetchAllEmployee());
  }, [dispatch]);

  const handleAddService = () => {
    if (selectedCategory && selectedService && selectedPrice && selectedStaff) {
      const serviceDetails = serviceStructure[selectedCategory]?.[selectedService];
      const newService = {
        _id: `${selectedCategory}-${selectedService}-${Date.now()}`,
        name: selectedService,
        price: selectedPrice.value,
        duration: serviceDetails.duration,
        mainCategory: selectedCategory,
        subCategory: selectedPrice.key,
        staff: selectedStaff,
        tip: 0,
      };
      setLocalServices([...localServices, newService]);
      setSelectedCategory('');
      setSelectedService('');
      setSelectedPrice(null);
      setSelectedStaff(null);
    }
  };

  const handleRemoveService = (id) => {
    setLocalServices(localServices.filter((service) => service._id !== id));
  };

  const handleServiceTipChange = (serviceId, amount) => {
    setLocalServices((services) =>
      services.map((service) =>
        service._id === serviceId ? { ...service, tip: Number(amount) || 0 } : service,
      ),
    );
  };

  const getPriceOptions = () => {
    if (!selectedCategory || !selectedService) return [];
    return Object.entries(serviceStructure[selectedCategory]?.[selectedService]?.prices || {});
  };

  const handleCheckOut = async () => {
    if (remainingAmount > 0) {
      setPaymentError(`Total payments must equal grand total. Remaining: ₹${remainingAmount}`);
      return;
    }
    setSubmitting(true);
    try {
      const checkoutPayload = {
        visitId: visit._id,
        customerId: customer._id,
        services: localServices.map((service) => ({
          service: service._id,
          category: service.mainCategory,
          serviceName: service.name,
          variant: service.subCategory,
          price: service.price,
          duration: service.duration,
          staff: service.staff._id,
          tipAmount: service.tip,
        })),
        paymentMethods: paymentMethods.map((pm) => ({
          method: pm.method,
          amount: pm.amount,
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique transaction ID
          timestamp: new Date().toISOString(),
        })),
        totalPayment: grandTotal,
        paymentStatus: paymentMethods.length > 1 ? 'split' : 'full',
        status: 'completed',
        // Conditionally add discount only when checkbox is active
        ...(showDiscount && {
          discount: {
            type: discountType,
            value: discountValue,
            amount: discountAmount,
            code: discountCode,
          },
        }),
        breakdown: {
          servicesTotal: totalServicesAmount,
          tipsTotal: totalTipsAmount,
          // Only show discount in breakdown when applied
          ...(showDiscount && { discountAmount: discountAmount }),
          grandTotal: grandTotal,
        },
      };
      await dispatch(processCheckout(checkoutPayload));
      onCheckoutSuccess();
      onClose();
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalServicesAmount = localServices.reduce((sum, service) => sum + service.price, 0);
  const totalTipsAmount = localServices.reduce((sum, service) => sum + service.tip, 0);
  const paidAmount = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  const totalAmountAfterDiscount = totalServicesAmount - discountAmount;
  const originalGrandTotal = totalServicesAmount + totalTipsAmount;
  const grandTotal = totalAmountAfterDiscount + totalTipsAmount;
  const remainingAmount = grandTotal - paidAmount;

  console.log('remainingAmount:', remainingAmount);
  console.log('totalAmountAfterDiscount:', totalAmountAfterDiscount);
  console.log('paidAmount:', paidAmount);

  const handleAddPayment = () => {
    if (!currentPayment.method || !currentPayment.amount || currentPayment.amount <= 0) {
      setPaymentError('Please select a valid payment method and amount');
      return;
    }

    if (currentPayment.amount > remainingAmount) {
      setPaymentError(`Amount cannot exceed remaining ₹${remainingAmount}`);
      return;
    }

    setPaymentMethods([...paymentMethods, currentPayment]);
    setCurrentPayment({ method: 'cash', amount: '' });
    setPaymentError('');
  };

  const handleRemovePayment = (index) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'common.white', py: 2, px: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          🧖♀️ Checkout Session
        </Typography>
        <Typography variant="subtitle1">
          {customer?.customerName} • {visit?.serviceNumber}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: 'background.paper' }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ color: 'primary.main' }}>✂️</span>
            Add Services
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedService('');
                    setSelectedPrice(null);
                  }}
                  label="Category"
                >
                  {serviceStructure &&
                    Object.keys(serviceStructure).map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth disabled={!selectedCategory}>
                <InputLabel>Service</InputLabel>
                <Select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  label="Service"
                >
                  {selectedCategory &&
                    Object.keys(serviceStructure[selectedCategory]).map((service) => (
                      <MenuItem key={service} value={service}>
                        {service}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {selectedService && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Price Variant</InputLabel>
                  <Select
                    value={selectedPrice || ''}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    label="Price Variant"
                    renderValue={(value) =>
                      value ? `${value.key} - ₹${value.value}` : <em>Select price</em>
                    }
                  >
                    {getPriceOptions().map(([key, value]) => (
                      <MenuItem key={key} value={{ key, value }}>
                        {key} - ₹{value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={3}>
              <FormControl fullWidth disabled={!selectedPrice}>
                <InputLabel>Assign Staff</InputLabel>
                <Select
                  value={selectedStaff || ''}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  label="Assign Staff"
                  renderValue={(value) =>
                    value ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar src={value.avatar} sx={{ width: 24, height: 24 }} />
                        <Typography>{value.employeeName}</Typography>
                      </Box>
                    ) : (
                      <em>Select staff</em>
                    )
                  }
                >
                  {employee?.map(
                    (staff) =>
                      staff?.otherInfo.workplace === 'Salon' && (
                        <MenuItem key={staff.employeeName} value={staff}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar src={staff.avatar} sx={{ width: 24, height: 24 }} />
                            <Typography>{staff.employeeName}</Typography>
                          </Box>
                        </MenuItem>
                      ),
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleAddService}
                disabled={!selectedPrice || !selectedStaff}
                fullWidth
              >
                Add Service
              </Button>
            </Grid>
          </Grid>

          <Typography
            variant="h6"
            sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <span style={{ color: 'primary.main' }}>📋</span>
            Selected Services
          </Typography>

          <Grid container spacing={2}>
            {localServices.map((service) => (
              <Grid item xs={12} sm={6} key={service._id}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ position: 'relative' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveService(service._id)}
                      sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="subtitle2">
                      {service.mainCategory} - {service.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Variant: {service.subCategory}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Chip
                        label={`₹${service.price}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        Duration: {service.duration} mins
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={service.staff?.avatar} sx={{ width: 24, height: 24 }} />
                      <Typography variant="caption">{service.staff?.employeeName}</Typography>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        size="small"
                        label="Tip for Staff"
                        value={service.tip}
                        onChange={(e) => handleServiceTipChange(service._id, e.target.value)}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                        }}
                        sx={{ width: 120 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        for {service.staff?.employeeName}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(to bottom right, #f8f9ff 0%, #f6f7ff 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
            mb: 3,
          }}
        >
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.light',
                  width: 40,
                  height: 40,
                  color: 'primary.main',
                }}
              >
                ₹
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                Payment Summary
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Services Total
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="h4" fontWeight={700}>
                      ₹{totalServicesAmount}
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        px: 1,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {localServices.length} services
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderColor: 'success.main',
                    position: 'relative',
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Staff Tips
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      + ₹{totalTipsAmount}
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: 'success.light',
                        color: 'success.main',
                        px: 1,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {localServices.filter((s) => s.tip > 0).length} tipped
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderColor: 'secondary.main',
                    bgcolor: 'background.paper',
                    position: 'relative',
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Grand Total
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="h3" fontWeight={800} color="primary">
                      ₹{grandTotal}
                    </Typography>
                    {discountAmount > 0 ? (
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        sx={{
                          textDecoration: discountAmount ? 'line-through' : 'none',
                          opacity: 0.7,
                        }}
                      >
                        ₹{originalGrandTotal}
                      </Typography>
                    ) : null}
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 16,
                      bottom: 16,
                      opacity: 0.1,
                      '& svg': { fontSize: 64 },
                    }}
                  ></Box>
                </Paper>
              </Grid>
            </Grid>
            {totalServicesAmount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                <Checkbox
                  checked={showDiscount}
                  onChange={(e) => {
                    setShowDiscount(e.target.checked);
                    if (!e.target.checked) {
                      // Reset discount values when unchecked
                      setDiscountAmount(0);
                      setDiscountValue('');
                      setDiscountCode('');
                    }
                  }}
                  color="primary"
                />
                <Typography variant="body1">Apply Discount</Typography>
              </Box>
            )}
            {totalServicesAmount && showDiscount ? (
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <div>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Discount (Only on services)
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="warning.main">
                        - ₹{discountAmount}
                      </Typography>
                    </div>

                    <IconButton
                      size="small"
                      onClick={() => setDiscountAmount(0)}
                      disabled={discountAmount === 0}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box mt={2} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      size="small"
                      sx={{ width: 120 }}
                      displayEmpty
                      renderValue={(value) =>
                        value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Discount type'
                      }
                    >
                      <MenuItem value="" disabled>
                        Discount type
                      </MenuItem>
                      <MenuItem value="fixed">Fixed</MenuItem>
                      <MenuItem value="percentage">Percentage</MenuItem>
                    </Select>

                    <TextField
                      size="small"
                      placeholder={
                        discountType
                          ? discountType === 'fixed'
                            ? 'Amount'
                            : '%'
                          : 'Select type first'
                      }
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      sx={{ width: 100 }}
                      disabled={!discountType}
                    />

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (discountType === 'fixed') {
                          setDiscountAmount(Math.min(Number(discountValue), totalServicesAmount));
                        } else {
                          const amount = (totalServicesAmount * Number(discountValue)) / 100;
                          setDiscountAmount(Math.min(amount, totalServicesAmount));
                        }
                      }}
                      disabled={!discountType || !discountValue}
                    >
                      Apply
                    </Button>
                  </Box>
                  {/* <TextField
                    fullWidth
                    size="small"
                    placeholder="Discount code (optional)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    sx={{ mt: 1 }}
                  /> */}
                </Paper>
              </Grid>
            ) : null}
          </Paper>

          {/* Keep your existing Payment Processing section below */}
          <Box mt={4}>
            {/* Your existing payment processing code remains untouched */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography
                variant="h6"
                sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}
              >
                <span style={{ color: 'success.main' }}>💳</span>
                Payment Processing
              </Typography>

              <Grid container spacing={3}>
                {/* Payment Progress */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Paid: ₹{paidAmount} / ₹{grandTotal}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(paidAmount / grandTotal) * 100}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Grid>

                {/* Payment Methods Breakdown */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Payment Breakdown
                    </Typography>

                    {paymentMethods.map((pm, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor:
                                pm.method === 'cash'
                                  ? '#4caf50'
                                  : pm.method === 'card'
                                  ? '#2196f3'
                                  : '#9c27b0',
                            }}
                          >
                            {pm.method === 'cash' && <PaymentsIcon />}
                            {pm.method === 'card' && <CreditCardIcon />}
                            {pm.method === 'upi' && <MobileFriendlyIcon />}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {pm.method.toUpperCase()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date().toLocaleTimeString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={500}>
                            ₹{pm.amount}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePayment(index)}
                            color="error"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}

                    {paymentMethods.length === 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          p: 3,
                          textAlign: 'center',
                        }}
                      >
                        <PaymentsIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No payments added yet
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Payment Input */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Add Payment
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          select
                          label="Payment Method"
                          value={currentPayment.method}
                          onChange={(e) =>
                            setCurrentPayment({ ...currentPayment, method: e.target.value })
                          }
                          variant="outlined"
                          size="small"
                        >
                          <MenuItem value="cash">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <PaymentsIcon fontSize="small" /> Cash
                            </Box>
                          </MenuItem>
                          <MenuItem value="upi">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <MobileFriendlyIcon fontSize="small" /> UPI
                            </Box>
                          </MenuItem>
                          <MenuItem value="card">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <CreditCardIcon fontSize="small" /> Credit Card
                            </Box>
                          </MenuItem>
                        </TextField>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Amount"
                          type="number"
                          value={currentPayment.amount}
                          onChange={(e) => {
                            const value = Math.min(Number(e.target.value), remainingAmount);
                            setCurrentPayment({ ...currentPayment, amount: value });
                          }}
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                            endAdornment: (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  setCurrentPayment({ ...currentPayment, amount: remainingAmount })
                                }
                                sx={{
                                  fontSize: '0.8rem',
                                  padding: '2px 6px',
                                  minHeight: '24px',
                                  lineHeight: 1,
                                  mr: -1,
                                }}
                              >
                                Full Amount
                              </Button>
                            ),
                          }}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>

                      {paymentError && (
                        <Grid item xs={12}>
                          <Typography
                            color="error"
                            variant="body2"
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                          >
                            <ErrorOutline fontSize="small" /> {paymentError}
                          </Typography>
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={handleAddPayment}
                          disabled={remainingAmount <= 0 || !currentPayment.amount}
                          startIcon={<AddIcon />}
                          sx={{ height: 40 }}
                        >
                          Add Payment
                        </Button>
                      </Grid>

                      {remainingAmount > 0 && (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 1,
                              bgcolor: 'error.light',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2" color="error.main">
                              ₹{remainingAmount} remaining to complete payment
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
        <Button onClick={onClose} variant="text" sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckOut}
          disabled={submitting || localServices.length === 0}
          sx={{ px: 4, py: 1, borderRadius: 2, fontWeight: 600 }}
        >
          {submitting ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography>Processing...</Typography>
            </Stack>
          ) : (
            `Bill • ₹${grandTotal}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalonCustomerCheckout;
