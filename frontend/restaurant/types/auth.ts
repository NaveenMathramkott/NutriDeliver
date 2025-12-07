export interface User {
  id: string;
  email: string;
  name: string;
  role: 'restaurant_owner' | 'admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
