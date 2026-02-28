import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading, 
  selectAuthError, 
  selectIsInitialized,
  selectHasRestaurant 
} from '../store/selectors/authSelectors';
import { login, logout, setCredentials, setInitialized } from '../store/slices/authSlice';
import { Storage } from '../utils/storage';
import { AppDispatch } from '../store';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isInitialized = useSelector(selectIsInitialized);
  const hasRestaurant = useSelector(selectHasRestaurant);

  useEffect(() => {
    const loadUser = async () => {
      if (isInitialized) return;

      try {
        const token = await Storage.getItem('token');
        const savedUser = await Storage.getItem('user');
        const hasRestaurant = await Storage.getItem('hasRestaurant');
        
        if (token && savedUser) {
          dispatch(setCredentials({ user: savedUser, token, hasRestaurant: !!hasRestaurant }));
        }
      } catch (err) {
        console.error('Failed to load user from storage', err);
      } finally {
        dispatch(setInitialized(true));
      }
    };

    loadUser();
  }, [dispatch, isInitialized]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    hasRestaurant,
    error,
    login: (credentials: any) => dispatch(login(credentials)),
    logout: () => dispatch(logout()),
  };
};
