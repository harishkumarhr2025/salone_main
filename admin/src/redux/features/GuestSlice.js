import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Config from '../../components/Config';

const toErrorMessage = (payload, fallback) => {
  if (typeof payload === 'string') return payload;
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  return fallback;
};

const initialState = {
  allGuests: [], // Always array of guest objects
  completeGuests: [],
  guest: null, // Single guest object or null
  data: null, // General purpose data
  isLoading: false,
  isError: false,
  successMessage: null,
  errorMessage: null,
  checkoutStatus: 'idle', // 'pending', 'succeeded', 'failed'
  checkoutError: null,
  searchQuery: '',
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0, // Add this if missing
  },
  filters: {
    guestType: 'all',
  },
  counts: {
    total: 0,
    daily: 0,
    monthly: 0,
  },
};

export const addNewGuest = createAsyncThunk(
  'Guest/addNewGuest',
  async (guestData, { rejectWithValue }) => {
    console.log('guestData slice:', guestData);
    const {
      _id,
      totalRoomRent,
      GSTAmount,
      GRC_No,
      status,
      Checkout_date,
      Checkout_time,
      remark,
      ...finalGuestData
    } = guestData;
    console.log('finalGuestData:', finalGuestData);
    try {
      const response = await Config.post('/create-new-guest', finalGuestData);
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

export const fetchAllGuest = createAsyncThunk(
  'Guest/fetchAllGuest',
  async (params, { rejectWithValue }) => {
    try {
      const response = await Config.get('/get-all-guest', {
        params: {
          ...params,
          // Clean undefined values
          guestType: params.guestType === 'all' ? undefined : params.guestType,
        },
      });

      return {
        guests: response.data.guests,
        pagination: response.data.pagination,
      };
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const getGuestById = createAsyncThunk(
  'Guest/getGuestById',
  async (guestId, { rejectWithValue }) => {
    try {
      const response = await Config.get(`/fetch-guest-by-id/${guestId}`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const updateGuest = createAsyncThunk(
  'Guest/updateGuest',
  async (guestData, { rejectWithValue }) => {
    const { _id, ...restGuestData } = guestData;
    try {
      const response = await Config.patch(`/update-guest/${_id}`, restGuestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data?.guest || response.data;
    } catch (error) {
      console.error('Error updating guest:', error);
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const guestCheckout = createAsyncThunk(
  'Guest/guestCheckout',
  async (checkout_data, { rejectWithValue }) => {
    const { guestId, ...restCheckoutData } = checkout_data;

    try {
      const response = await Config.patch(`/guests/${guestId}/checkout`, restCheckoutData);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const checkExistingGuest = createAsyncThunk(
  'Guest/checkExistingGuest',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await Config.get(`/guest/${phone}`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

const GuestSlice = createSlice({
  name: 'Guest',
  initialState,
  reducers: {
    resetGuestState: (state) => {
      state.isLoading = false;
      // state.data = null;
      state.successMessage = null;
      state.errorMessage = null;
      state.isError = false;
    },
    resetGuest: (state) => {
      state.guest = null;
    },
    clearCheckoutStatus: (state) => {
      state.checkoutStatus = 'idle';
      state.checkoutError = null;
    },
    setCurrentPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters.guestType = action.payload;
    },
    updateGuestsOptimistically: (state, action) => {
      state.allGuests = action.payload;
      state.completeGuests = action.payload;
      // Add counts calculation
      state.counts = {
        total: action.payload.length,
        daily: action.payload.filter((g) => g.guestType === 'Daily').length,
        monthly: action.payload.filter((g) => g.guestType === 'Monthly').length,
      };
    },
    setIsUpdating: (state, action) => {
      state.isUpdating = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(addNewGuest.pending, (state) => {
      state.isLoading = true;
      state.successMessage = null;
      state.errorMessage = null;
      state.isError = false;
    });
    builder.addCase(addNewGuest.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
      state.successMessage = 'Guest added successfully!';
      state.isError = false;
      if (action.payload?.guest) {
        state.allGuests = [action.payload.guest, ...state.allGuests].slice(0, state.pagination.limit);
        state.completeGuests = [action.payload.guest, ...state.completeGuests];
        state.counts.total = state.completeGuests.length;
      }
    });
    builder.addCase(addNewGuest.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = toErrorMessage(action.payload, 'Failed to add guest');
      state.isError = true;
    });

    builder.addCase(fetchAllGuest.pending, (state) => {
      state.isLoading = true;
      state.successMessage = null;
      state.errorMessage = null;
      state.isError = false;
    });

    builder.addCase(fetchAllGuest.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.meta.arg?.limit > 1000) {
        state.completeGuests = action.payload.guests;
        // Add counts update for complete list
        state.counts = {
          total: action.payload.guests.length,
          // daily: action.payload.guests.filter((g) => g.guestType === 'Daily').length,
          // monthly: action.payload.guests.filter((g) => g.guestType === 'Monthly').length,
        };
      } else {
        state.allGuests = action.payload.guests;
        state.pagination = {
          page: action.payload.pagination.currentPage,
          limit: action.payload.pagination.limit,
          totalPages: action.payload.pagination.totalPages,
          totalItems: action.payload.pagination.total,
        };
      }
    });
    builder.addCase(fetchAllGuest.rejected, (state, action) => {
      state.isLoading = false;
      state.allGuests = [];
      state.errorMessage = toErrorMessage(action.payload, 'Failed to fetch guests');
      state.isError = true;
    });

    builder.addCase(getGuestById.pending, (state) => {
      state.isLoading = true;
      state.successMessage = null;
      state.errorMessage = null;
      state.isError = false;
    });
    builder.addCase(getGuestById.fulfilled, (state, action) => {
      state.guest = action.payload.guest || action.payload; // Handle nested response
      state.isLoading = false;
      state.successMessage = 'Guest details loaded!';
      state.isError = false;
    });
    builder.addCase(getGuestById.rejected, (state, action) => {
      state.isLoading = false;
      state.guest = [];
      state.errorMessage = toErrorMessage(action.payload, 'Failed to fetch guest details');
      state.isError = true;
    });

    builder.addCase(updateGuest.pending, (state) => {
      state.isLoading = true;
      state.successMessage = null;
      state.errorMessage = null;
      state.isError = false;
    });
    builder.addCase(updateGuest.fulfilled, (state, action) => {
      const updatedGuest = action.payload.guest || action.payload; // Handle nested response

      // Update both guest lists
      state.allGuests = state.allGuests.map((g) => (g._id === updatedGuest._id ? updatedGuest : g));
      state.completeGuests = state.completeGuests.map((g) =>
        g._id === updatedGuest._id ? updatedGuest : g,
      );

      // Update counts if guest type changed
      if (updatedGuest.guestType !== state.guest?.guestType) {
        state.counts = {
          total: state.counts.total,
          daily:
            updatedGuest.guestType === 'Daily' ? state.counts.daily + 1 : state.counts.daily - 1,
          monthly:
            updatedGuest.guestType === 'Monthly'
              ? state.counts.monthly + 1
              : state.counts.monthly - 1,
        };
      }
      if (Array.isArray(state.allGuests)) {
        state.allGuests = state.allGuests.map((guest) =>
          guest._id === updatedGuest._id ? updatedGuest : guest,
        );
      }
      // Update single guest details if viewing that guest
      if (state.guest?._id === updatedGuest._id) {
        state.guest = updatedGuest;
      }
      state.isLoading = false;
      state.successMessage = 'Guest updated successfully!';
      state.isError = false;
    });
    builder.addCase(updateGuest.rejected, (state, action) => {
      state.isLoading = false;
      state.guest = null;
      state.errorMessage = toErrorMessage(action.payload, 'Failed to update guest.');
      state.isError = true;
    });
    builder.addCase(guestCheckout.pending, (state) => {
      state.checkoutStatus = 'pending';
      state.checkoutError = null;
      state.isLoading = true;
    });

    builder.addCase(guestCheckout.fulfilled, (state, action) => {
      const updatedGuest = action.payload;
      state.allGuests = state.allGuests.map((guest) =>
        guest._id === updatedGuest._id ? updatedGuest : guest,
      );
      if (state.guest?._id === updatedGuest._id) {
        state.guest = updatedGuest;
      } // Store the checkout response
      state.successMessage = 'Guest checked out successfully';
      state.checkoutStatus = 'succeeded';
      state.isLoading = false;
      // Update completeGuests
      state.completeGuests = state.completeGuests.map((guest) =>
        guest._id === updatedGuest._id ? updatedGuest : guest,
      );
    });

    builder.addCase(guestCheckout.rejected, (state, action) => {
      state.checkoutStatus = 'failed';
      state.checkoutError = {
        message: action.payload?.message,
        code: action.payload?.code,
        status: action.payload?.status,
        validationErrors: action.payload?.errors,
      };
    });

    builder.addCase(checkExistingGuest.pending, (state) => {
      state.isLoading = true;
      state.successMessage = null;
      state.errorMessage = null;
      state.isError = false;
      state.guest = null; // Clear previous guest data
    });
    builder.addCase(checkExistingGuest.fulfilled, (state, action) => {
      state.isLoading = false;

      if (action.payload.exists) {
        state.guest = action.payload.guestDetails;
        state.successMessage = 'Existing guest found!';
        // Add to completeGuests if not already present
        if (!state.completeGuests.some((g) => g._id === action.payload.guestDetails._id)) {
          state.completeGuests = [action.payload.guestDetails, ...state.completeGuests];
        }
      } else {
        state.guest = null;
        state.successMessage = 'New guest - please fill all details';
      }

      state.isError = false;
    });
    builder.addCase(checkExistingGuest.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage = toErrorMessage(action.payload, 'Failed to check guest existence');
      state.isError = true;
      state.guest = null;
    });
  },
});

export const {
  resetGuestState,
  resetGuest,
  setCurrentPage,
  setFilters,
  setSearchQuery,
  setLimit,
  updateGuestsOptimistically,
} = GuestSlice.actions;

export default GuestSlice.reducer;
