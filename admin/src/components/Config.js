import axios from 'axios';

const configuredBaseURL = process.env.REACT_APP_BACKEND_URL?.trim();
const isBrowser = typeof window !== 'undefined';
const isLocalHost =
  isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const shouldUseConfiguredBaseURL =
  configuredBaseURL && (!configuredBaseURL.includes('localhost') || isLocalHost);
const backendBaseURL = shouldUseConfiguredBaseURL
  ? configuredBaseURL
  : isBrowser
    ? `${window.location.origin}/api/v1`
    : configuredBaseURL;

console.log('Backend URL:', backendBaseURL);
const apiClient = axios.create({
  baseURL: backendBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (!isBrowser) {
    return config;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
