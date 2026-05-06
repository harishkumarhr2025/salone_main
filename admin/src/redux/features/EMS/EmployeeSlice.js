import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Config from '../../../components/Config';

const initialState = {
  isLoading: true,
  employees: [],
  selectedEmployee: null,
  isError: null,
  errorText: null,
};

export const AddEmployee = createAsyncThunk(
  'Employee/AddEmployee',
  async (empDetails, { rejectWithValue }) => {
    console.log('Employee Details:', empDetails);
    try {
      const response = await Config.post('/addEmployee', empDetails);
      if (!response.data.success) {
        return rejectWithValue(response.data);
      }
      console.log('response:', response);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const fetchAllEmployee = createAsyncThunk(
  'Employee/fetchAllEmployee',
  async (_, { rejectWithValue }) => {
    try {
      const response = await Config.get('/getAllEmployees');
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

export const fetchEmployeeByID = createAsyncThunk(
  'Employee/fetchEmployeeByID',
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await Config.get(`/getEmployeeById/${employeeId}`);
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

export const updateEmployee = createAsyncThunk(
  'Employee/updateEmployee',
  async (employeeDetails, { rejectWithValue }) => {
    try {
      const response = await Config.patch(
        `/updateEmployee/${employeeDetails._id}`,
        employeeDetails,
      );

      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const deleteEmployee = createAsyncThunk(
  'Employee/deleteEmployee',
  async (employee, { rejectWithValue }) => {
    try {
      const response = await Config.delete(`/deleteEmployee/${employee?.employee?._id}`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

const EmployeeSlice = createSlice({
  name: 'Employee',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(AddEmployee.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(AddEmployee.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
    });
    builder.addCase(AddEmployee.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(fetchAllEmployee.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(fetchAllEmployee.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.employees = action.payload;
    });
    builder.addCase(fetchAllEmployee.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(fetchEmployeeByID.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(fetchEmployeeByID.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.selectedEmployee = action.payload;
    });
    builder.addCase(fetchEmployeeByID.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(updateEmployee.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(updateEmployee.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
    });
    builder.addCase(updateEmployee.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(deleteEmployee.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(deleteEmployee.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
    });
    builder.addCase(deleteEmployee.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });
  },
});

export default EmployeeSlice.reducer;
