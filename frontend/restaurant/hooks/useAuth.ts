import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectIsAuthenticated, selectAuthLoading, selectAuthError } from '../store/selectors/authSelectors';
import { login, logout, setCredentials } from '../store/slices/authSlice';
import { Storage } from '../utils/storage';
import { AppDispatch } from '../store';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  useEffect(() => {
    const loadUser = async () => {
      const token = await Storage.getItem('token');
      const savedUser = await Storage.getItem('user');
      if (token && savedUser) {
        dispatch(setCredentials({ user: savedUser, token }));
      }
    };
    loadUser();
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: (credentials: any) => dispatch(login(credentials)),
    logout: () => dispatch(logout()),
  };
};
