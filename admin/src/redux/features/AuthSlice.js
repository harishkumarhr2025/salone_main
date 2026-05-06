import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Config from '../../components/Config';

const extractErrorMessage = (error, fallbackMessage) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message === 'Network Error') {
    return 'Cannot reach the server. Check the backend URL and server status.';
  }

  return error.message || fallbackMessage;
};

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  data: null,
  isError: null,
  isSuccess: null,
  role: null,
  user: null,
};

export const CheckAuthentication = createAsyncThunk(
  'Auth/CheckAuthentication',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return rejectWithValue('No token found');

      const response = await Config.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.user;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(extractErrorMessage(error, 'Not authenticated'));
    }
  },
);

export const register = createAsyncThunk(
  'Auth/register',
  async (registerCredential, { rejectWithValue }) => {
    try {
      const response = await Config.post('/register', registerCredential);

      return response.data;
    } catch (error) {
      console.log('Error:', error);
      return rejectWithValue({ message: extractErrorMessage(error, 'Registration failed') });
    }
  },
);

export const login = createAsyncThunk(
  'Auth/login',
  async (loginCredential, { rejectWithValue }) => {
    try {
      const response = await Config.post('/login', loginCredential);

      return response.data;
    } catch (error) {
      console.log('Error:', error);
      return rejectWithValue({ message: extractErrorMessage(error, 'Login failed') });
    }
  },
);

export const loggedInUser = createAsyncThunk(
  'Auth/LoggedInUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      let BearerToken = `Bearer ${token}`;
      const response = await Config.get('/auth/user', {
        headers: {
          Authorization: BearerToken,
        },
      });
      return response.data;
    } catch (error) {
      console.log('Error:', error);
      return rejectWithValue({ message: extractErrorMessage(error, 'Failed to load user') });
    }
  },
);

export const logout = createAsyncThunk('Auth/logout', async (_, { rejectWithValue }) => {
  try {
    localStorage.removeItem('token');
    return true;
  } catch (error) {
    return rejectWithValue('Logout failed');
  }
});

const AuthSlice = createSlice({
  name: 'Auth',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(CheckAuthentication.pending, (state, action) => {
      state.isLoading = true;
      state.isError = null; // Reset error state on new request
    });
    builder.addCase(CheckAuthentication.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isAuthenticated = true;
      state.user = action.payload;
    });
    builder.addCase(CheckAuthentication.rejected, (state, action) => {
      state.isLoading = false; // Crucial: Always stop loading
      state.isSuccess = false;
      state.isError = action.payload || action.error.message;
      state.user = null;
      state.isAuthenticated = false;
    });

    builder.addCase(register.pending, (state, action) => {
      state.isLoading = true;
      state.isError = false; // Reset error state on new request
      state.isSuccess = false;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.data = action.payload;

      if (action.payload?.token) {
        localStorage.setItem('token', action.payload.token);
      } else {
        console.warn('No token received in login response');
      }
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false; // Crucial: Always stop loading
      state.isSuccess = false;
      state.isError = action.payload?.message || action.error.message;
      state.data = null;
    });

    builder.addCase(login.pending, (state, action) => {
      state.isLoading = true;
      state.isError = false; // Reset error state on new request
      state.isSuccess = false;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.data = action.payload;

      if (action.payload?.token) {
        localStorage.setItem('token', action.payload.token);
      } else {
        console.warn('No token received in login response');
      }
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false; // Crucial: Always stop loading
      state.isSuccess = false;
      state.isError = action.payload?.message || action.error.message;
      state.data = null;
    });

    builder.addCase(loggedInUser.pending, (state, action) => {
      state.isLoading = true;
      state.isError = false; // Reset error state on new request
      state.isSuccess = false;
    });
    builder.addCase(loggedInUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.data = action.payload;
    });
    builder.addCase(loggedInUser.rejected, (state, action) => {
      state.isLoading = false; // Crucial: Always stop loading
      state.isSuccess = false;
      state.isError = action.payload?.message || action.error.message;
      state.data = null;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export default AuthSlice.reducer;
