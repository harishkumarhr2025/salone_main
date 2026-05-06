import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Config from '../../../components/Config';

const initialState = {
  isLoading: true,
  data: {
    customers: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalDocuments: 0,
      limit: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    counts: {
      totalActiveCustomer: 0,
      totalInactiveCustomer: 0,
      totalVisits: 0,
    },
  },
  filters: {
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: 'active', // 'active', 'inactive', 'all'
  },
  selectedCustomer: null,
  bookings: [],
  isCreating: false,
  isError: null,
  errorText: null,
  customerByMobileNumber: null,
};

export const createNewCustomer = createAsyncThunk(
  'Salon/createNewCustomer',
  async (customerDetails, { rejectWithValue }) => {
    console.log('customerDetails:', customerDetails);
    try {
      const response = await Config.post('/addNewCustomer', customerDetails);

      if (!response.data.success) {
        return rejectWithValue(response.data);
      }
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const getAllCustomers = createAsyncThunk(
  'Salon/getAllCustomers',
  async (_, { getState, rejectWithValue, signal }) => {
    try {
      const { filters, data } = getState().Salon;

      const params = {
        page: data.pagination.currentPage,
        limit: data.pagination.limit,
        search: filters.search,
        status: filters.status, // Remove duplicate
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      const response = await Config.get('/getAllCustomers', { params, signal });
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const getCustomerDetails = createAsyncThunk(
  'Salon/getCustomerDetails',
  async (customerId, { rejectWithValue }) => {
    console.log('Customer ID:', customerId);
    try {
      const response = await Config.get(`/customers/${customerId}`);
      console.log('response.data', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const processCheckout = createAsyncThunk(
  'Salon/processCheckout',
  async (checkoutData, { rejectWithValue }) => {
    console.log('checkoutData', checkoutData);
    try {
      const response = await Config.post('/checkout', checkoutData);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const getBookingDetails = createAsyncThunk(
  'salonBookings/getBookingDetails',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await Config.post(`/bookings`, { ids: bookingId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

export const getCustomerByMobile = createAsyncThunk(
  'salonBookings/getCustomerByMobile',
  async (mobileNumber, { rejectWithValue }) => {
    try {
      const response = await Config.get(`/customer/detail?mobileNumber=${mobileNumber}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

const SalonCustomerSlice = createSlice({
  name: 'Salon',
  initialState,
  reducers: {
    resetCustomer: (state) => {
      state.selectedCustomer = null;
    },
    updateFilters: (state, action) => {
      // Only update if values actually changed
      {
        state.filters = { ...state.filters, ...action.payload };
        state.data.pagination.currentPage = 1;
      }
    },
    setPage: (state, action) => {
      state.data.pagination.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createNewCustomer.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
      state.isCreating = true;
    });
    builder.addCase(createNewCustomer.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isCreating = false;
    });
    builder.addCase(createNewCustomer.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.isCreating = false;
      state.errorText = action.payload;
    });

    builder.addCase(getAllCustomers.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(getAllCustomers.fulfilled, (state, action) => {
      state.isLoading = false;

      // Update all data from server response
      state.data.customers = action.payload.data.customers;
      state.data.pagination = {
        ...state.data.pagination,
        ...action.payload.data.pagination,
      };
      state.data.counts = action.payload.data.counts;
    });
    builder.addCase(getAllCustomers.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(processCheckout.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(processCheckout.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.checkOutCustomer = action.payload;
    });
    builder.addCase(processCheckout.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(getCustomerDetails.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
      state.selectedCustomer = null;
    });

    builder.addCase(getCustomerDetails.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedCustomer = action.payload;
    });

    builder.addCase(getCustomerDetails.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = true;
      state.errorText = action.payload;
      state.selectedCustomer = null;
    });

    builder.addCase(getBookingDetails.pending, (state) => {
      state.isLoading = true;
      state.isError = null;
    });
    builder.addCase(getBookingDetails.fulfilled, (state, action) => {
      state.isLoading = false;
      state.bookings = action.payload;
    });
    builder.addCase(getBookingDetails.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload?.message || 'Failed to fetch booking details';
    });

    builder.addCase(getCustomerByMobile.pending, (state) => {
      state.isLoading = true;
      state.isError = null;
    });
    builder.addCase(getCustomerByMobile.fulfilled, (state, action) => {
      state.isLoading = false;
      state.customerByMobileNumber = action.payload;
    });
    builder.addCase(getCustomerByMobile.rejected, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload?.message || 'Failed to fetch booking details';
    });
  },
});

export const { resetCustomer, updateFilters, setPage } = SalonCustomerSlice.actions;

export default SalonCustomerSlice.reducer;
