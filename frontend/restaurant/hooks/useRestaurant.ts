import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectRestaurantProfile, selectMenu, selectRestaurantLoading } from '../store/selectors/restaurantSelectors';
import { fetchRestaurantProfile, fetchMenu } from '../store/slices/restaurantSlice';
import { AppDispatch } from '../store';

export const useRestaurant = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector(selectRestaurantProfile);
  const menu = useSelector(selectMenu);
  const isLoading = useSelector(selectRestaurantLoading);

  useEffect(() => {
    dispatch(fetchRestaurantProfile());
    dispatch(fetchMenu());
  }, [dispatch]);

  return {
    profile,
    menu,
    isLoading,
    refreshProfile: () => dispatch(fetchRestaurantProfile()),
    refreshMenu: () => dispatch(fetchMenu()),
  };
};
