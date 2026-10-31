import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    // Required by the backend CSRF check on state-changing requests (see api-client.ts)
    'X-Brightloop-Request': '1',
  },
});

export default api;

