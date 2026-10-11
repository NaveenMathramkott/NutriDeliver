import type { User } from "@/types";
import type { AuthState } from "./slices/authSlice";
import type { UIState } from "./slices/uiSlice";

const AUTH_KEY = "nutrideliver_admin_auth";
const UI_KEY = "nutrideliver_admin_ui";

/** Only the fields needed to render the shell before `/auth/me` returns. */
type PersistedAuth = Pick<AuthState, "user" | "isAuthenticated">;
type PersistedUi = UIState;

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Corrupted storage should never block the app from booting.
    return null;
  }
}

export function loadAuthState(): Partial<AuthState> | undefined {
  // localStorage is unavailable during SSR/prerender.
  if (typeof localStorage === "undefined") return undefined;

  const token = localStorage.getItem("admin_token");
  const persisted = readJSON<PersistedAuth>(AUTH_KEY);

  // Only trust a cached user when a token is still present to authenticate with.
  if (!token || !persisted?.user) return undefined;

  return {
    user: persisted.user as User,
    isAuthenticated: true,
    // Still validating against /auth/me; the cached user renders meanwhile.
    isLoading: true,
    error: null,
  };
}

export function loadUiState(): UIState | undefined {
  if (typeof localStorage === "undefined") return undefined;

  const persisted = readJSON<PersistedUi>(UI_KEY);
  if (!persisted) return undefined;

  return {
    sidebarCollapsed: persisted.sidebarCollapsed ?? false,
    sidebarOpen: persisted.sidebarOpen ?? false,
    theme: persisted.theme ?? "light",
  };
}

export function persistAuth(state: AuthState) {
  try {
    const payload: PersistedAuth = {
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private-mode errors are non-fatal.
  }
}

export function persistUi(state: UIState) {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify(state));
  } catch {
    // Quota or private-mode errors are non-fatal.
  }
}

export function clearPersistedAuth() {
  localStorage.removeItem(AUTH_KEY);
}
