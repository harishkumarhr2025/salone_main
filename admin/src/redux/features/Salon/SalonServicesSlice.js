import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Config from '../../../components/Config';

const initialState = {
  isLoading: true,
  services: [],
  deleteService: null,
  isCreating: false,
  isError: null,
  errorText: null,
};

export const createNewService = createAsyncThunk(
  'Salon/createNewService',
  async (serviceDetails, { rejectWithValue }) => {
    try {
      const response = await Config.post('/create-services', serviceDetails);
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

export const getAllServices = createAsyncThunk(
  'Salon/getAllServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await Config.get('/get-services');
      return response.data.services;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const updateServices = createAsyncThunk(
  'Salon/updateServices',
  async (servicesData, { rejectWithValue }) => {
    console.log('servicesData', servicesData);
    try {
      const response = await Config.patch(`/services/${servicesData._id}`, servicesData);
      console.log('service response', response);
      return response.data.services;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const deleteServices = createAsyncThunk(
  'Salon/deleteServices',
  async (servicesData, { rejectWithValue }) => {
    try {
      const response = await Config.delete(`/services/${servicesData._id}`);

      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

const SalonServiceSlice = createSlice({
  name: 'Salon',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(createNewService.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
      state.isCreating = true;
    });
    builder.addCase(createNewService.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isCreating = false;
    });
    builder.addCase(createNewService.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.isCreating = false;
      state.errorText = action.payload;
    });

    builder.addCase(getAllServices.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(getAllServices.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.services = action.payload;
    });
    builder.addCase(getAllServices.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(updateServices.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(updateServices.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
    });
    builder.addCase(updateServices.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(deleteServices.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(deleteServices.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.deleteService = state.payload;
    });
    builder.addCase(deleteServices.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });
  },
});

export default SalonServiceSlice.reducer;
