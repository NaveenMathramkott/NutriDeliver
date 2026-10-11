import { authApi } from "./api/auth";
import { usersApi } from "./api/users";
import { restaurantsApi } from "./api/restaurants";
import { foodApi } from "./api/food";
import { categoriesApi } from "./api/categories";
import { ordersApi } from "./api/orders";
import { paymentsApi } from "./api/payments";
import { offersApi } from "./api/offers";
import { notificationsApi } from "./api/notifications";
import { ridersApi } from "./api/riders";
import { adminsApi } from "./api/admins";
import { analyticsApi } from "./api/analytics";
import { settingsApi } from "./api/settings";

export const api = {
  // Auth
  login: authApi.login,
  getMe: authApi.getMe,
  logout: authApi.logout,
  refreshToken: authApi.refreshToken,
  register: authApi.register,
  forgotPassword: authApi.forgotPassword,
  verifyResetOtp: authApi.verifyResetOtp,
  resetPassword: authApi.resetPassword,
  verifyEmail: authApi.verifyEmail,
  resendVerification: authApi.resendVerification,

  // Users
  getUsers: usersApi.getUsers,
  getUser: usersApi.getUser,
  updateUserStatus: usersApi.updateUserStatus,
  deleteUser: usersApi.deleteUser,
  getProfile: usersApi.getProfile,
  updateProfile: usersApi.updateProfile,
  updatePreferences: usersApi.updatePreferences,
  getAddresses: usersApi.getAddresses,
  addAddress: usersApi.addAddress,
  updateAddress: usersApi.updateAddress,
  deleteAddress: usersApi.deleteAddress,
  getUserOrders: usersApi.getOrders,
  getUserOrder: usersApi.getOrder,
  uploadAvatar: usersApi.uploadAvatar,

  // Restaurants
  getRestaurants: restaurantsApi.getAllAdmin,
  getRestaurant: restaurantsApi.getByIdAdmin,
  verifyRestaurant: restaurantsApi.verify,
  updateRestaurantStatus: restaurantsApi.updateStatus,

  // Categories
  getCategories: categoriesApi.getAll,
  createCategory: categoriesApi.create,
  updateCategory: categoriesApi.update,
  deleteCategory: categoriesApi.delete,

  // Foods
  getFoods: foodApi.getAllAdmin,
  getFood: foodApi.getById,
  createFood: foodApi.create,
  updateFood: foodApi.update,
  deleteFood: foodApi.delete,
  toggleFoodAvailability: foodApi.toggleAvailability,
  uploadFoodImages: foodApi.uploadImages,

  // Orders
  getOrders: ordersApi.getAll,
  getOrder: ordersApi.getByIdAdmin,
  updateOrder: ordersApi.update,

  // Payments
  getPayments: paymentsApi.getAll,
  refundPayment: paymentsApi.refund,

  // Offers
  getOffers: offersApi.getAll,
  getOffer: offersApi.getById,
  createOffer: offersApi.create,
  updateOffer: offersApi.update,
  deleteOffer: offersApi.delete,

  // Notifications
  getNotifications: notificationsApi.getAll,
  markAsRead: notificationsApi.markAsRead,
  markAllAsRead: notificationsApi.markAllAsRead,
  deleteNotification: notificationsApi.delete,

  // Riders
  getRiders: ridersApi.getAll,
  getRider: ridersApi.getById,
  verifyRider: ridersApi.verify,
  updateRiderStatus: ridersApi.updateStatus,

  // Admins
  getAdmins: adminsApi.getAll,
  getAdmin: adminsApi.getById,
  createAdmin: adminsApi.create,
  updateAdmin: adminsApi.update,
  deleteAdmin: adminsApi.delete,

  // Analytics
  getPlatformAnalytics: analyticsApi.getPlatform,
  getSalesAnalytics: analyticsApi.getSales,
  getUserAnalytics: analyticsApi.getUsers,

  // Settings
  getSettings: settingsApi.get,
  updateSettings: settingsApi.update,
};
