import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer, { type AuthState } from "./slices/authSlice";
import uiReducer, { type UIState } from "./slices/uiSlice";
import {
  loadAuthState,
  loadUiState,
  persistAuth,
  persistUi,
  clearPersistedAuth,
} from "./persistence";

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
});

// Rehydrated synchronously so the very first render already has the user,
// avoiding a flash of the login screen or a blank header on refresh.
const rehydratedAuth = loadAuthState();
const rehydratedUi = loadUiState();

const preloadedState: Partial<{
  auth: AuthState;
  ui: UIState;
}> = {
  ...(rehydratedAuth ? { auth: rehydratedAuth as AuthState } : {}),
  ...(rehydratedUi ? { ui: rehydratedUi as UIState } : {}),
};

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Persist on every state change so a refresh restores the session.
let lastAuth: RootState["auth"] | undefined;
let lastUi: RootState["ui"] | undefined;

store.subscribe(() => {
  const state = store.getState();

  if (state.auth !== lastAuth) {
    lastAuth = state.auth;
    // Write while signed in; drop the cache as soon as the session ends so a
    // stale user can't be restored on the next load.
    if (state.auth.user) {
      persistAuth(state.auth);
    } else {
      clearPersistedAuth();
    }
  }

  if (state.ui !== lastUi) {
    lastUi = state.ui;
    persistUi(state.ui);
  }
});
