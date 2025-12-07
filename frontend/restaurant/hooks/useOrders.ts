import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchOrders } from '../store/slices/ordersSlice';

export const useOrders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const orders = useSelector((state: RootState) => state.orders.list);
  const isLoading = useSelector((state: RootState) => state.orders.isLoading);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  return {
    orders,
    isLoading,
    refreshOrders: () => dispatch(fetchOrders()),
  };
};
