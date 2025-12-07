import { RootState } from '../index';

export const selectRestaurantProfile = (state: RootState) => state.restaurant.profile;
export const selectMenu = (state: RootState) => state.restaurant.menu;
export const selectRestaurantLoading = (state: RootState) => state.restaurant.isLoading;
