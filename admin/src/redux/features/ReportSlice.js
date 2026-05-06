import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import Config from '../../components/Config';

const initialState = {
  guestReport: {
    isLoading: false,
    data: null,
    error: null,
  },
  salonReport: {
    isLoading: false,
    data: null,
    filters: {
      fromDate: null,
      toDate: null,
      staffId: 'all',
      serviceType: 'all',
    },
    error: null,
  },
};

export const generateReport = createAsyncThunk(
  'Report/GenerateReport',
  async (printReport, { rejectWithValue }) => {
    console.log('Slice printReport:', printReport);
    try {
      const response = await Config.post('/reports/daily', printReport);
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

export const generateSalonReport = createAsyncThunk(
  'Report/GenerateSalonReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await Config.post('/reports/salon', reportData);
      if (!response.data.success) {
        return rejectWithValue(response.data);
      }
      console.log('Slice response:', response.data);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const generateMonthlySalonReport = createAsyncThunk(
  'Report/GenerateMonthlySalonReport',
  async (reportData, { rejectWithValue }) => {
    console.log('reportData monthly report', reportData);
    try {
      const response = await Config.get('/salon-monthly-report', {
        params: reportData, // Send as query parameters
      });
      if (!response.data.success) {
        return rejectWithValue(response.data);
      }
      console.log('Slice response:', response.data);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const resetSalonReport = createAction('report/resetSalonReport');

const ReportSlice = createSlice({
  name: 'Report',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(generateReport.pending, (state) => {
      state.guestReport.isLoading = true;
      state.guestReport.error = null;
    });
    builder.addCase(generateReport.fulfilled, (state, action) => {
      state.guestReport.isLoading = false;
      state.guestReport.data = action.payload;
    });
    builder.addCase(generateReport.rejected, (state, action) => {
      state.guestReport.isLoading = false;
      state.guestReport.error =
        action.payload?.message || action.payload?.error || 'Failed to generate guest report';
    });

    builder.addCase(generateSalonReport.pending, (state) => {
      state.salonReport.isLoading = true;
      state.salonReport.error = null;
    });
    builder.addCase(generateSalonReport.fulfilled, (state, action) => {
      state.salonReport.isLoading = false;
      state.salonReport.data = action.payload.report;
      state.salonReport.filters = action.payload.filters;
    });
    builder.addCase(generateSalonReport.rejected, (state, action) => {
      state.salonReport.isLoading = false;
      state.salonReport.error =
        action.payload?.message || action.payload?.error || 'Failed to generate salon report';
    });
    builder.addCase(resetSalonReport, (state) => {
      state.salonReport = {
        data: null,
        filters: null,
        isLoading: false,
        error: null,
      };
    });

    builder.addCase(generateMonthlySalonReport.pending, (state) => {
      state.salonReport.isLoading = true;
      state.salonReport.error = null;
    });
    builder.addCase(generateMonthlySalonReport.fulfilled, (state, action) => {
      state.salonReport.isLoading = false;
      state.salonReport.data = action.payload.report;
      state.salonReport.filters = action.payload.filters;
    });
    builder.addCase(generateMonthlySalonReport.rejected, (state, action) => {
      state.salonReport.isLoading = false;
      state.salonReport.error =
        action.payload?.message || action.payload?.error || 'Failed to generate salon report';
    });
  },
});

export default ReportSlice.reducer;
