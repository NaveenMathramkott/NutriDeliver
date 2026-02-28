import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types/auth';
import { AuthService } from '../../services/auth';
import { RestaurantService } from '../../services/restaurant';
import { Storage } from '../../utils/storage';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
  hasRestaurant: false,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      const { user, token } = response.data;
      if (!token) {
        throw new Error('No token received from server');
      }

      await Storage.setItem('token', token);
      await Storage.setItem('user', user);
      
      // Check if restaurant exists
      let hasRestaurant = false;
      try {
        const restaurant = await RestaurantService.getProfile();
        hasRestaurant = !!restaurant && !!restaurant.id;
      } catch (e) {
        hasRestaurant = false;
      }
      
      await Storage.setItem('hasRestaurant', hasRestaurant);
      
      return { user, token, hasRestaurant };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const checkRestaurantStatus = createAsyncThunk(
  'auth/checkRestaurant',
  async (_, { rejectWithValue }) => {
    try {
      // We'll use a specific endpoint to check if the owner has a restaurant
      // Or just try to get the profile
      const response = await RestaurantService.getProfile(); 
      return !!response && !!response.id;
    } catch (error: any) {
      return false;
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AuthService.logout();
  await Storage.removeItem('token');
  await Storage.removeItem('user');
  await Storage.removeItem('hasRestaurant');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string; hasRestaurant: boolean }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.hasRestaurant = action.payload.hasRestaurant;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setRestaurantExists: (state, action: PayloadAction<boolean>) => {
      state.hasRestaurant = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.hasRestaurant = action.payload.hasRestaurant;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(checkRestaurantStatus.fulfilled, (state, action) => {
        state.hasRestaurant = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.hasRestaurant = false;
      });
  },
});

export const { setCredentials, setInitialized, setRestaurantExists } = authSlice.actions;
export default authSlice.reducer;
