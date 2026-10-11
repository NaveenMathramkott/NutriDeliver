import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "@/services/api/auth";
import { clearToken, getToken, setToken } from "@/services/tokenStorage";
import { clearPersistedAuth } from "@/store/persistence";
import type { User } from "@/types";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

/**
 * Restores the session on app boot by validating the stored token against
 * `/auth/me`. The cached user is kept until this resolves, so the UI does not
 * flash. On failure the session is cleared.
 */
export const refreshUser = createAsyncThunk("auth/refreshUser", async () => {
  if (!getToken()) {
    return null;
  }

  try {
    const response = await authApi.getMe();
    if (!response.success || !response.data) {
      clearToken();
      clearPersistedAuth();
      return null;
    }
    // The endpoint nests the user under `data.user`.
    return (response.data.user ?? response.data) as User;
  } catch {
    // A network failure shouldn't log the admin out; the token stays valid
    // and the next reload will retry.
    return null;
  }
});

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authApi.login(
        credentials.email,
        credentials.password,
      );
      if (response.success && response.data?.token) {
        setToken(response.data.token);
        return response.data.user as User;
      }
      return rejectWithValue(response.message || "Login failed");
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Login failed",
      );
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } catch {
    // Best effort; the local session is cleared regardless.
  }
  clearToken();
  clearPersistedAuth();
  return null;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    /** Wipes the in-memory session, e.g. after a 401 on any request. */
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Keep the cached user when /auth/me fails due to connectivity.
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else if (!getToken()) {
          state.user = null;
          state.isAuthenticated = false;
        }
        state.error = null;
      })
      .addCase(refreshUser.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { clearError, setUser, clearSession } = authSlice.actions;
export default authSlice.reducer;
