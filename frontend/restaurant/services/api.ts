import axios from 'axios';
import { Config } from '../constants/Config';
import { Storage } from '../utils/storage';

const api = axios.create({
  baseURL: Config.API_URL,
  timeout: Config.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await Storage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors like 401 Unauthorized here
    return Promise.reject(error);
  }
);

export default api;
