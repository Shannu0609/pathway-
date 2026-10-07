import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('placement-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const log = error.response && error.response.status < 500 ? console.warn : console.error;
    log('[api] Request failed', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      code: error.code,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback = 'The request could not be completed.') => {
  if (!error?.isAxiosError) {
    return error?.message || fallback;
  }

  const response = error?.response;
  const responseMessage = typeof response?.data?.message === 'string'
    ? response.data.message
    : typeof response?.data === 'string'
      ? response.data
      : '';

  if (!response || error.code === 'ERR_NETWORK' || /ECONNREFUSED|proxy error/i.test(responseMessage)) {
    return 'Backend server unavailable. Check that the API server is running and its database is connected.';
  }
  if (response.status === 409) {
    return responseMessage || 'Email already registered. Sign in or use another email address.';
  }
  if (response.status === 503) {
    return responseMessage || 'Database connection failed. Please try again in a moment.';
  }
  if (response.status === 400 || response.status === 422) {
    return responseMessage || 'Check the information you entered and try again.';
  }
  if (response.status >= 500) {
    return responseMessage || 'Internal server error. Please try again.';
  }
  return responseMessage || fallback;
};

export default api;
