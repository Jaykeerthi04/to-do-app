import axios, { AxiosError } from 'axios';
import { API_URL } from '../config';

// Free hosting (Render) sleeps when idle and can take ~50s to wake, hence the long timeout.
export const client = axios.create({ baseURL: API_URL, timeout: 60000 });

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

// Attach the JWT to every request.
client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

// If the token expired or became invalid while logged in, log the user out.
client.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && authToken) onUnauthorized?.();
    return Promise.reject(error);
  },
);

/** Turns any thrown value into a message that is safe to show to the user. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.code === 'ECONNABORTED') return 'The server is taking too long to respond. Try again.';
    if (!error.response) return 'Cannot reach the server. Check your internet connection.';
  }
  return 'Something went wrong. Please try again.';
}
