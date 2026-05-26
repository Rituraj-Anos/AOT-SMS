import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

/**
 * Centralised axios instance.
 *
 * In development: baseURL = '/api' (Vite proxy forwards to local Tomcat)
 * In production:  baseURL = VITE_API_BASE_URL + '/api' (e.g. https://aot-sms-backend.onrender.com/api)
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15_000,
});

let currentlyRedirecting = false;

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string; success?: boolean }>) => {
    const status = err.response?.status;
    const msg =
      err.response?.data?.message ||
      err.message ||
      'Request failed.';

    // Auth-required: clear store and bounce to /login
    if (status === 401 && !currentlyRedirecting && !location.pathname.endsWith('/login')) {
      currentlyRedirecting = true;
      // Defer import to avoid circular dep
      import('@/store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().clear();
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          location.href = '/login';
          currentlyRedirecting = false;
        }, 600);
      });
      return Promise.reject(err);
    }

    if (status === 403) toast.error('Access denied.');
    else if (status && status >= 500) toast.error(msg);

    return Promise.reject(err);
  },
);
