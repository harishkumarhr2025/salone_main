import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Config from '../../components/Config';

const initialState = {
  isLoading: true,
  rooms: [],
  beds: [],
  guests: [],
  roomHistory: [],
  isError: null,
  errorText: null,
};

export const AddNewRoom = createAsyncThunk(
  'Room/AddNewRoom',
  async (roomDetails, { rejectWithValue }) => {
    try {
      const response = await Config.post('/addRoom', roomDetails);
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

export const fetchAllRoom = createAsyncThunk(
  'Room/fetchAllRoom',
  async (_, { rejectWithValue }) => {
    try {
      const response = await Config.get('/get-all-room');
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const fetchAvailableBed = createAsyncThunk(
  'Room/fetchAvailableBed',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await Config.get(`/${roomId}/available-beds`);
      console.log('Bed Response:', response);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const getRoomGuests = createAsyncThunk(
  'Room/getRoomGuests',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await Config.get(`/rooms/${roomId}/guests`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const fetchRoomHistory = createAsyncThunk(
  'Room/fetchRoomHistory',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await Config.get(`/rooms/${roomId}/room-history`);
      return response.data;
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({ message: 'Network Error - Unable to connect to server' });
      }
      return rejectWithValue(error.response?.data || { message: 'An unexpected error occurred' });
    }
  },
);

export const deleteRoom = createAsyncThunk(
  'Room/deleteRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await Config.delete(`/rooms/${roomId}/delete-room`);
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

export const editRoom = createAsyncThunk('Room/editRoom', async (room, { rejectWithValue }) => {
  try {
    const response = await Config.patch(`/rooms/${room._id}/edit-room`, room);
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
});

const RoomSlice = createSlice({
  name: 'Room',
  initialState,
  extraReducers: (builder) => {
    builder.addCase(AddNewRoom.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(AddNewRoom.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.rooms = [action.payload.room];
    });
    builder.addCase(AddNewRoom.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(fetchAllRoom.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(fetchAllRoom.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.rooms = action.payload;
    });
    builder.addCase(fetchAllRoom.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(fetchAvailableBed.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(fetchAvailableBed.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.beds = action.payload.bed;
    });
    builder.addCase(fetchAvailableBed.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(getRoomGuests.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(getRoomGuests.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.guests = action.payload;
    });
    builder.addCase(getRoomGuests.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(fetchRoomHistory.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(fetchRoomHistory.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.roomHistory = action.payload;
    });
    builder.addCase(fetchRoomHistory.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });

    builder.addCase(deleteRoom.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
    });
    builder.addCase(deleteRoom.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.rooms = [action.payload.room];
    });
    builder.addCase(deleteRoom.rejected, (state, action) => {
      state.isLoading = true;
      state.isError = true;
      state.errorText = action.payload;
    });
  },
});

export default RoomSlice.reducer;
