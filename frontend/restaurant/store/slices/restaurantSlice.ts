import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Restaurant, MenuItem } from '../../types/restaurant';
import { RestaurantService } from '../../services/restaurant';

interface RestaurantState {
  profile: Restaurant | null;
  menu: MenuItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RestaurantState = {
  profile: null,
  menu: [],
  isLoading: false,
  error: null,
};

export const fetchRestaurantProfile = createAsyncThunk(
  'restaurant/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await RestaurantService.getProfile();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const fetchMenu = createAsyncThunk(
  'restaurant/fetchMenu',
  async (_, { rejectWithValue }) => {
    try {
      return await RestaurantService.getMenu();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu');
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurantProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRestaurantProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchRestaurantProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMenu.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menu = action.payload;
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default restaurantSlice.reducer;
